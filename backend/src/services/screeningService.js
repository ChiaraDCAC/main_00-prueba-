const axios = require('axios');
const { Client, ScreeningResult, BeneficialOwner, Signatory, Attorney, Authority, Alert } = require('../models');

const screeningService = {
  // Realizar screening completo de un cliente
  async performScreening(clientId, screeningType) {
    const client = await Client.findByPk(clientId, {
      include: [
        { model: BeneficialOwner, as: 'beneficialOwners', where: { isActive: true }, required: false },
        { model: Signatory, as: 'signatories', where: { isActive: true }, required: false },
        { model: Attorney, as: 'attorneys', where: { isActive: true }, required: false },
        { model: Authority, as: 'authorities', where: { isActive: true }, required: false },
      ],
    });

    if (!client) throw new Error('Cliente no encontrado');

    const results = [];

    // Screening del cliente principal
    const clientName = client.clientType === 'persona_humana'
      ? `${client.firstName} ${client.lastName}`
      : client.legalName;

    const clientResults = await this.screenPerson(clientId, clientName, client.cuit, screeningType);
    results.push(...clientResults);

    // Screening de beneficiarios finales
    for (const bo of client.beneficialOwners || []) {
      const boResults = await this.screenPerson(
        clientId,
        `${bo.firstName} ${bo.lastName}`,
        bo.cuit || bo.dni,
        screeningType,
        'beneficiario_final'
      );
      results.push(...boResults);
    }

    // Screening de firmantes
    for (const sig of client.signatories || []) {
      const sigResults = await this.screenPerson(
        clientId,
        `${sig.firstName} ${sig.lastName}`,
        sig.cuit || sig.dni,
        screeningType,
        'firmante'
      );
      results.push(...sigResults);
    }

    // Screening de apoderados
    for (const att of client.attorneys || []) {
      const attResults = await this.screenPerson(
        clientId,
        `${att.firstName} ${att.lastName}`,
        att.cuit || att.dni,
        screeningType,
        'apoderado'
      );
      results.push(...attResults);
    }

    // Screening de autoridades
    for (const auth of client.authorities || []) {
      const authResults = await this.screenPerson(
        clientId,
        `${auth.firstName} ${auth.lastName}`,
        auth.cuit || auth.dni,
        screeningType,
        'autoridad'
      );
      results.push(...authResults);
    }

    // Generar alertas para matches encontrados
    const matches = results.filter(r => r.hasMatch);
    for (const match of matches) {
      await Alert.create({
        clientId,
        alertType: 'screening',
        severity: match.matchScore >= 90 ? 'critica' : match.matchScore >= 70 ? 'alta' : 'media',
        status: 'pendiente',
        title: `Match en ${match.listType}`,
        description: `Se encontró coincidencia para "${match.searchTerm}" en lista ${match.listType}`,
        triggerValue: match.searchTerm,
      });
    }

    return results;
  },

  // Screening de una persona individual
  async screenPerson(clientId, name, identifier, screeningType, personType = 'titular') {
    const lists = ['PEP', 'RePET', 'OFAC', 'ONU', 'UE', 'GAFI'];
    const results = [];

    for (const listType of lists) {
      const result = await this.checkList(name, identifier, listType);

      const screening = await ScreeningResult.create({
        clientId,
        screeningType,
        listType,
        searchTerm: name,
        hasMatch: result.hasMatch,
        matchDetails: result.matchDetails,
        matchScore: result.matchScore,
        status: result.hasMatch ? 'pendiente' : 'descartado',
        provider: result.provider || 'internal',
        providerReference: result.reference,
      });

      results.push(screening);
    }

    return results;
  },

  // Verificar contra una lista específica
  async checkList(name, identifier, listType) {
    // Simulación de verificación - En producción, integrar con API real
    // Ejemplo de integración con proveedor externo:
    /*
    if (process.env.SCREENING_API_URL) {
      try {
        const response = await axios.post(process.env.SCREENING_API_URL, {
          name,
          identifier,
          listType,
        }, {
          headers: {
            'Authorization': `Bearer ${process.env.SCREENING_API_KEY}`,
          },
        });
        return response.data;
      } catch (error) {
        console.error('Error en screening externo:', error);
      }
    }
    */

    // Verificación local básica (para demostración)
    const localPepList = [
      // Agregar nombres de prueba aquí
    ];

    const normalizedName = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    for (const pep of localPepList) {
      const normalizedPep = pep.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (normalizedName.includes(normalizedPep) || normalizedPep.includes(normalizedName)) {
        return {
          hasMatch: true,
          matchDetails: { matchedName: pep, list: listType },
          matchScore: 85,
          provider: 'internal',
          reference: `LOCAL-${Date.now()}`,
        };
      }
    }

    return {
      hasMatch: false,
      matchDetails: null,
      matchScore: 0,
      provider: 'internal',
      reference: `LOCAL-${Date.now()}`,
    };
  },

  // Screening periódico de todos los clientes activos
  async performPeriodicScreening() {
    const clients = await Client.findAll({
      where: { status: 'aprobado' },
    });

    const results = [];
    for (const client of clients) {
      try {
        const screeningResults = await this.performScreening(client.id, 'periodico');
        results.push({ clientId: client.id, success: true, matches: screeningResults.filter(r => r.hasMatch).length });
      } catch (error) {
        results.push({ clientId: client.id, success: false, error: error.message });
      }
    }

    return results;
  },

  // Obtener historial de screening de un cliente
  async getScreeningHistory(clientId) {
    return ScreeningResult.findAll({
      where: { clientId },
      order: [['createdAt', 'DESC']],
    });
  },
};

module.exports = screeningService;
