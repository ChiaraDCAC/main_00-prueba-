const { Op } = require('sequelize');
const fs = require('fs').promises;
const path = require('path');
const { Client, Transaction, Alert, UnusualOperation, SuspiciousReport, Document, BeneficialOwner } = require('../models');

const reportService = {
  // Generar reporte Base Padrón en formato TXT
  // Formato 8 campos:
  // C1 = Tipo ID Tributaria (80=CUIT, 86=CUIL, 87=CDI)
  // C2 = Número ID Tributaria
  // C3 = Tipo ID Personal (96=DNI, 90=LC, 89=LE, 94=Pasaporte, 00=Sin informar)
  // C4 = Número ID Personal
  // C5 = Denominación
  // C6 = Condición PEP (S/N)
  // C7 = Código Postal
  // C8 = Tipo Movimiento (A=Alta, M=Modificación, B=Baja)
  async generateBasePadron(month, year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const clients = await Client.findAll({
      where: {
        status: { [Op.in]: ['aprobado', 'baja'] },
        [Op.or]: [
          { createdAt: { [Op.between]: [startDate, endDate] } },
          { updatedAt: { [Op.between]: [startDate, endDate] } },
        ],
      },
      include: [
        { model: BeneficialOwner, as: 'beneficialOwners', where: { isActive: true }, required: false },
      ],
    });

    const lines = [];

    for (const client of clients) {
      // Determinar tipo de movimiento
      let tipoMovimiento = 'A'; // Alta por defecto
      const createdInPeriod = client.createdAt >= startDate && client.createdAt <= endDate;
      const updatedInPeriod = client.updatedAt >= startDate && client.updatedAt <= endDate;

      if (client.status === 'baja') {
        tipoMovimiento = 'B'; // Baja
      } else if (!createdInPeriod && updatedInPeriod) {
        tipoMovimiento = 'M'; // Modificación
      }

      // Determinar tipo de ID tributaria
      const tipoIdTributaria = client.cuit?.startsWith('20') || client.cuit?.startsWith('23') || client.cuit?.startsWith('24') || client.cuit?.startsWith('27')
        ? '86' // CUIL
        : '80'; // CUIT

      // Determinar tipo de ID personal
      let tipoIdPersonal = '00'; // Sin informar por defecto
      if (client.dniType === 'DNI' || client.documentType === 'DNI') tipoIdPersonal = '96';
      else if (client.dniType === 'LC' || client.documentType === 'LC') tipoIdPersonal = '90';
      else if (client.dniType === 'LE' || client.documentType === 'LE') tipoIdPersonal = '89';
      else if (client.dniType === 'PASAPORTE' || client.documentType === 'PASAPORTE') tipoIdPersonal = '94';
      else if (client.dni) tipoIdPersonal = '96'; // Si tiene DNI, asumir tipo DNI

      // Denominación
      const denominacion = client.clientType === 'persona_humana'
        ? `${client.lastName || ''} ${client.firstName || ''}`.trim()
        : (client.legalName || '');

      // Formato de 8 campos separados por pipe
      const line = [
        tipoIdTributaria,                           // C1 - Tipo ID Tributaria
        client.cuit || '',                          // C2 - Número ID Tributaria
        tipoIdPersonal,                             // C3 - Tipo ID Personal
        client.dni || '',                           // C4 - Número ID Personal
        denominacion,                               // C5 - Denominación
        client.isPep ? 'S' : 'N',                   // C6 - Condición PEP
        client.postalCode || '',                    // C7 - Código Postal
        tipoMovimiento,                             // C8 - Tipo Movimiento
      ].join('|');

      lines.push(line);
    }

    const content = lines.join('\n');
    const fileName = `BASE_PADRON_${year}${String(month).padStart(2, '0')}.txt`;

    return { content, fileName };
  },

  // Generar reporte de Apartados en formato TXT
  // Formato por cliente (XX = número secuencial):
  // 10000XX;{saldo_cp};{cantidad_ctas_con_saldo};
  // 50000XX;;{cantidad_total_ctas};
  // 20000XX;{saldo_vista};;{CBU}
  // 30000XX;{saldo_fci};{cantidad_fci};
  // 40000XX;{saldo_por_fondo};;{CBU_fondo}
  // 60000XX;{saldo_liquidar};{cantidad_ctas_liquidar};
  async generateApartados(month, year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Obtener clientes con sus datos de cuentas
    const clients = await Client.findAll({
      where: {
        status: 'aprobado',
      },
    });

    const lines = [];
    let sequence = 1;

    for (const client of clients) {
      // Datos de ejemplo - estos deberían venir de la tabla de cuentas/transacciones
      const saldoCP = client.saldoCuentaPago || Math.floor(Math.random() * 100000);
      const cantidadCtasConSaldo = client.cantidadCtasConSaldo || Math.floor(Math.random() * 50000);
      const cantidadTotalCtas = client.cantidadTotalCtas || cantidadCtasConSaldo + Math.floor(Math.random() * 10000);
      const saldoVista = client.saldoVista || saldoCP;
      const cbuEntidad = client.cbu || '3220001805006687240046';
      const saldoFCI = client.saldoFCI || 0;
      const cantidadFCI = client.cantidadFCI || 0;
      const saldoPorFondo = client.saldoPorFondo || 0;
      const cbuFondo = client.cbuFondo || '';
      const saldoLiquidar = client.saldoLiquidar || 0;
      const cantidadCtasLiquidar = client.cantidadCtasLiquidar || 0;

      // Formato secuencial con padding de 2 dígitos
      const seq = String(sequence).padStart(2, '0').slice(-2);

      // a. Cuentas de Pago Clientes
      // 10000XX - Cantidad de ctas de pago clientes (con saldo) + Saldo
      lines.push(`10000${seq};${saldoCP};${cantidadCtasConSaldo};`);

      // 50000XX - Cantidad total de cuentas de pago (con y sin saldo)
      lines.push(`50000${seq};;${cantidadTotalCtas};`);

      // Apartado A - 20000XX - Saldos en cuenta a la vista x entidad + CBU
      lines.push(`20000${seq};${saldoVista};;${cbuEntidad}`);

      // b. Saldo Invertido en FCI
      // 30000XX - Sumatoria saldos invertidos en FCI + Cantidad
      lines.push(`30000${seq};${saldoFCI};${cantidadFCI};`);

      // 40000XX - Saldos invertidos por fondo común de dinero + CBU
      lines.push(`40000${seq};${saldoPorFondo};;${cbuFondo}`);

      // c. Saldos a liquidar
      // 60000XX - Saldo a liquidar + Cantidad ctas con saldo a liquidar
      lines.push(`60000${seq};${saldoLiquidar};${cantidadCtasLiquidar};`);

      sequence++;

      // Reiniciar secuencia si llega a 100
      if (sequence > 99) sequence = 1;
    }

    const content = lines.join('\n');
    const fileName = `APARTADOS_${year}${String(month).padStart(2, '0')}.txt`;

    return { content, fileName };
  },


  // Validar formato de reporte
  validateReport(content, reportType) {
    const lines = content.split('\n');
    const errors = [];

    if (lines.length === 0) {
      errors.push('El archivo está vacío');
      return { isValid: false, errors };
    }

    // Validar header
    const header = lines[0].split('|');
    if (!header[0] || !header[1]) {
      errors.push('Header inválido');
    }

    // Validar formato de cada línea
    for (let i = 1; i < lines.length; i++) {
      const fields = lines[i].split('|');

      // Validar CUIT (11 dígitos)
      if (fields[0] && fields[0].length !== 11 && fields[0] !== 'BF' && fields[0] !== 'OI' && fields[0] !== 'ROS') {
        errors.push(`Línea ${i + 1}: CUIT inválido`);
      }

      // Validar fechas
      const dateFields = fields.filter(f => /^\d{4}-\d{2}-\d{2}$/.test(f));
      for (const dateField of dateFields) {
        if (isNaN(Date.parse(dateField))) {
          errors.push(`Línea ${i + 1}: Fecha inválida`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      totalRecords: lines.length - 1,
    };
  },

  // Obtener resumen de reportes del período
  async getReportSummary(month, year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const [
      newClients,
      modifiedClients,
      deactivatedClients,
      unusualOps,
      rosCount,
      alertsCount,
    ] = await Promise.all([
      Client.count({
        where: { createdAt: { [Op.between]: [startDate, endDate] } },
      }),
      Client.count({
        where: {
          updatedAt: { [Op.between]: [startDate, endDate] },
          createdAt: { [Op.lt]: startDate },
        },
      }),
      Client.count({
        where: {
          status: 'baja',
          updatedAt: { [Op.between]: [startDate, endDate] },
        },
      }),
      UnusualOperation.count({
        where: { detectionDate: { [Op.between]: [startDate, endDate] } },
      }),
      SuspiciousReport.count({
        where: { reportDate: { [Op.between]: [startDate, endDate] } },
      }),
      Alert.count({
        where: { createdAt: { [Op.between]: [startDate, endDate] } },
      }),
    ]);

    return {
      period: `${year}-${String(month).padStart(2, '0')}`,
      newClients,
      modifiedClients,
      deactivatedClients,
      unusualOperations: unusualOps,
      suspiciousReports: rosCount,
      alerts: alertsCount,
    };
  },
};

module.exports = reportService;
