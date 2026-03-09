const API_URL = '/api/contracts';

const contractService = {
  /**
   * Get contract for a client
   */
  async getClientContract(clientId) {
    const response = await fetch(`${API_URL}/client/${clientId}`);
    if (!response.ok) {
      throw new Error('Error al obtener contrato');
    }
    return response.json();
  },

  /**
   * Create contract for a client
   */
  async createContract(clientId, data) {
    const response = await fetch(`${API_URL}/client/${clientId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear contrato');
    }
    return response.json();
  },

  /**
   * Upload contract document
   */
  async uploadContract(contractId, file) {
    const formData = new FormData();
    formData.append('contract', file);

    const response = await fetch(`${API_URL}/${contractId}/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      throw new Error('Error al subir contrato');
    }
    return response.json();
  },

  /**
   * Get signature status
   */
  async getSignatureStatus(contractId) {
    const response = await fetch(`${API_URL}/${contractId}/signatures`);
    if (!response.ok) {
      throw new Error('Error al obtener estado de firmas');
    }
    return response.json();
  },

  /**
   * Sign contract
   */
  async signContract(contractId, signatureId, signatureData) {
    const response = await fetch(
      `${API_URL}/${contractId}/sign/${signatureId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signatureData),
      }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al firmar contrato');
    }
    return response.json();
  },

  /**
   * Add signer to contract
   */
  async addSigner(contractId, signerData) {
    const response = await fetch(`${API_URL}/${contractId}/signers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signerData),
    });
    if (!response.ok) {
      throw new Error('Error al agregar firmante');
    }
    return response.json();
  },

  /**
   * Remove signer from contract
   */
  async removeSigner(contractId, signatureId) {
    const response = await fetch(
      `${API_URL}/${contractId}/signers/${signatureId}`,
      {
        method: 'DELETE',
      }
    );
    if (!response.ok) {
      throw new Error('Error al eliminar firmante');
    }
    return response.json();
  },
};

export default contractService;
