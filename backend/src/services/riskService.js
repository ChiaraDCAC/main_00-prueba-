const { Client, RiskAssessment, RiskMatrix } = require('../models');

const riskService = {
  // Calcular riesgo de un cliente
  async calculateRisk(clientId, assessmentType, userId) {
    const client = await Client.findByPk(clientId);
    if (!client) throw new Error('Cliente no encontrado');

    // Obtener matriz de riesgo activa
    const riskFactors = await RiskMatrix.findAll({ where: { isActive: true } });
    const factorMap = {};
    riskFactors.forEach(f => {
      if (!factorMap[f.factor]) factorMap[f.factor] = {};
      factorMap[f.factor][f.value] = f.score;
    });

    // Calcular puntuación por factor
    const scores = {
      clientTypeScore: this.getClientTypeScore(client, factorMap),
      activityScore: this.getActivityScore(client, factorMap),
      geographicScore: this.getGeographicScore(client, factorMap),
      productScore: 5, // Default medio
      channelScore: 5, // Default medio
      pepScore: this.getPepScore(client),
      transactionScore: 5, // Se calcula con historial
    };

    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
    const riskLevel = this.getRiskLevel(totalScore);
    const dueDiligenceType = this.getDueDiligenceType(riskLevel);

    // Calcular próxima fecha de revisión según nivel de riesgo
    const nextReviewDate = new Date();
    switch (riskLevel) {
      case 'alto':
        nextReviewDate.setMonth(nextReviewDate.getMonth() + 6); // 6 meses
        break;
      case 'medio':
        nextReviewDate.setFullYear(nextReviewDate.getFullYear() + 1); // 1 año
        break;
      case 'bajo':
        nextReviewDate.setFullYear(nextReviewDate.getFullYear() + 2); // 2 años
        break;
    }

    // Crear evaluación de riesgo
    const assessment = await RiskAssessment.create({
      clientId,
      assessmentType,
      ...scores,
      totalScore,
      riskLevel,
      dueDiligenceType,
      assessedBy: userId,
      nextReviewDate,
    });

    // Actualizar cliente
    await client.update({
      riskLevel,
      riskScore: totalScore,
      dueDiligenceType,
      lastRiskAssessment: new Date(),
      nextRiskReview: nextReviewDate,
    });

    return assessment;
  },

  getClientTypeScore(client, factorMap) {
    const typeScores = factorMap.clientType || {};
    if (client.clientType === 'persona_juridica') {
      return typeScores['persona_juridica'] || 7;
    }
    return typeScores['persona_humana'] || 3;
  },

  getActivityScore(client, factorMap) {
    const activityScores = factorMap.activity || {};
    const highRiskActivities = [
      'casino', 'apuestas', 'cripto', 'cambio', 'inmobiliaria',
      'joyeria', 'arte', 'vehiculos', 'construccion'
    ];

    const activity = (client.mainActivity || '').toLowerCase();
    for (const risk of highRiskActivities) {
      if (activity.includes(risk)) {
        return activityScores['alto_riesgo'] || 10;
      }
    }
    return activityScores['normal'] || 3;
  },

  getGeographicScore(client, factorMap) {
    const geoScores = factorMap.geographic || {};
    const highRiskCountries = [
      'iran', 'corea del norte', 'siria', 'yemen', 'afganistan',
      'myanmar', 'venezuela', 'nicaragua', 'cuba'
    ];

    const country = (client.country || '').toLowerCase();
    const nationality = (client.nationality || '').toLowerCase();

    for (const risk of highRiskCountries) {
      if (country.includes(risk) || nationality.includes(risk)) {
        return geoScores['alto_riesgo'] || 10;
      }
    }

    if (country !== 'argentina') {
      return geoScores['extranjero'] || 5;
    }

    return geoScores['local'] || 1;
  },

  getPepScore(client) {
    if (client.isPep) return 10;
    return 0;
  },

  getRiskLevel(totalScore) {
    if (totalScore >= 35) return 'alto';
    if (totalScore >= 20) return 'medio';
    return 'bajo';
  },

  getDueDiligenceType(riskLevel) {
    switch (riskLevel) {
      case 'alto': return 'reforzada';
      case 'medio': return 'media';
      case 'bajo': return 'simplificada';
      default: return 'media';
    }
  },

  // Recalificación periódica
  async recalculateExpiredRisks() {
    const expiredClients = await Client.findAll({
      where: {
        nextRiskReview: {
          [require('sequelize').Op.lte]: new Date(),
        },
        status: 'aprobado',
      },
    });

    const results = [];
    for (const client of expiredClients) {
      try {
        const assessment = await this.calculateRisk(client.id, 'periodica', null);
        results.push({ clientId: client.id, success: true, assessment });
      } catch (error) {
        results.push({ clientId: client.id, success: false, error: error.message });
      }
    }

    return results;
  },

  // Obtener clientes por nivel de riesgo
  async getClientsByRiskLevel(riskLevel) {
    return Client.findAll({
      where: { riskLevel, status: 'aprobado' },
      order: [['riskScore', 'DESC']],
    });
  },
};

module.exports = riskService;
