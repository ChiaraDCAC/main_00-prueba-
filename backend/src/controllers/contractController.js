const { Contract, ContractSignature, Client } = require('../models');
const { v4: uuidv4 } = require('uuid');

const contractController = {
  /**
   * Get contract for a client
   */
  async getClientContract(req, res) {
    try {
      const { clientId } = req.params;

      const contract = await Contract.findOne({
        where: { clientId },
        include: [
          {
            model: ContractSignature,
            as: 'signatures',
            order: [['createdAt', 'ASC']],
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      if (!contract) {
        return res.json({
          contract: null,
          status: 'no_contract',
          message: 'No hay contrato asociado a este cliente',
        });
      }

      res.json({ contract });
    } catch (error) {
      console.error('Error getting client contract:', error);
      res.status(500).json({ error: 'Error al obtener contrato' });
    }
  },

  /**
   * Create contract for a client (after documentation is approved)
   */
  async createContract(req, res) {
    try {
      const { clientId } = req.params;
      const { contractType, signers } = req.body;

      // Verify client exists and is approved
      const client = await Client.findByPk(clientId);
      if (!client) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }

      if (client.status !== 'aprobado') {
        return res.status(400).json({
          error: 'El cliente debe tener documentación aprobada para crear contrato',
        });
      }

      // Check if there's already an active contract
      const existingContract = await Contract.findOne({
        where: {
          clientId,
          status: ['pending_upload', 'pending_signatures', 'partially_signed'],
        },
      });

      if (existingContract) {
        return res.status(400).json({
          error: 'Ya existe un contrato activo para este cliente',
          contract: existingContract,
        });
      }

      // Create contract
      const contract = await Contract.create({
        clientId,
        contractType: contractType || 'onboarding',
        status: 'pending_upload',
        totalSignaturesRequired: signers?.length || 1,
        createdBy: req.user?.id,
      });

      // Create signature placeholders for each signer
      if (signers && signers.length > 0) {
        const signaturePromises = signers.map((signer) =>
          ContractSignature.create({
            contractId: contract.id,
            signerName: signer.name,
            signerEmail: signer.email,
            signerDni: signer.dni,
            signerRole: signer.role,
            signerId: signer.signerId,
            signerType: signer.signerType,
            status: 'pending',
          })
        );
        await Promise.all(signaturePromises);
      }

      // Fetch complete contract with signatures
      const completeContract = await Contract.findByPk(contract.id, {
        include: [{ model: ContractSignature, as: 'signatures' }],
      });

      res.status(201).json({
        message: 'Contrato creado exitosamente',
        contract: completeContract,
      });
    } catch (error) {
      console.error('Error creating contract:', error);
      res.status(500).json({ error: 'Error al crear contrato' });
    }
  },

  /**
   * Upload contract document
   */
  async uploadContract(req, res) {
    try {
      const { contractId } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'No se proporcionó archivo' });
      }

      const contract = await Contract.findByPk(contractId);
      if (!contract) {
        return res.status(404).json({ error: 'Contrato no encontrado' });
      }

      await contract.update({
        documentUrl: `/uploads/contracts/${file.filename}`,
        fileName: file.originalname,
        status: 'pending_signatures',
        uploadedAt: new Date(),
      });

      // TODO: Notify signers that contract is ready

      res.json({
        message: 'Contrato subido exitosamente',
        contract,
      });
    } catch (error) {
      console.error('Error uploading contract:', error);
      res.status(500).json({ error: 'Error al subir contrato' });
    }
  },

  /**
   * Sign contract
   */
  async signContract(req, res) {
    try {
      const { contractId, signatureId } = req.params;
      const { signatureData, signatureMethod } = req.body;

      const signature = await ContractSignature.findOne({
        where: { id: signatureId, contractId },
      });

      if (!signature) {
        return res.status(404).json({ error: 'Firma no encontrada' });
      }

      if (signature.status === 'signed') {
        return res.status(400).json({ error: 'Esta firma ya fue completada' });
      }

      // Update signature
      await signature.update({
        status: 'signed',
        signedAt: new Date(),
        signatureMethod: signatureMethod || 'electronic',
        signatureData,
        ipAddress: req.ip,
      });

      // Update contract completed signatures count
      const contract = await Contract.findByPk(contractId, {
        include: [{ model: ContractSignature, as: 'signatures' }],
      });

      const completedCount = contract.signatures.filter(
        (s) => s.status === 'signed'
      ).length;

      const newStatus =
        completedCount >= contract.totalSignaturesRequired
          ? 'completed'
          : 'partially_signed';

      await contract.update({
        completedSignatures: completedCount,
        status: newStatus,
        ...(newStatus === 'completed' && { completedAt: new Date() }),
      });

      res.json({
        message: 'Firma registrada exitosamente',
        signature,
        contractStatus: newStatus,
        completedSignatures: completedCount,
        totalRequired: contract.totalSignaturesRequired,
      });
    } catch (error) {
      console.error('Error signing contract:', error);
      res.status(500).json({ error: 'Error al firmar contrato' });
    }
  },

  /**
   * Get signature status for a contract
   */
  async getSignatureStatus(req, res) {
    try {
      const { contractId } = req.params;

      const contract = await Contract.findByPk(contractId, {
        include: [
          {
            model: ContractSignature,
            as: 'signatures',
            attributes: [
              'id',
              'signerName',
              'signerRole',
              'status',
              'signedAt',
              'signerEmail',
            ],
          },
        ],
      });

      if (!contract) {
        return res.status(404).json({ error: 'Contrato no encontrado' });
      }

      res.json({
        contractId: contract.id,
        status: contract.status,
        completedSignatures: contract.completedSignatures,
        totalSignaturesRequired: contract.totalSignaturesRequired,
        signatures: contract.signatures,
        isComplete: contract.status === 'completed',
      });
    } catch (error) {
      console.error('Error getting signature status:', error);
      res.status(500).json({ error: 'Error al obtener estado de firmas' });
    }
  },

  /**
   * Add signer to contract
   */
  async addSigner(req, res) {
    try {
      const { contractId } = req.params;
      const { name, email, dni, role, signerId, signerType } = req.body;

      const contract = await Contract.findByPk(contractId);
      if (!contract) {
        return res.status(404).json({ error: 'Contrato no encontrado' });
      }

      if (contract.status === 'completed') {
        return res.status(400).json({
          error: 'No se pueden agregar firmantes a un contrato completado',
        });
      }

      const signature = await ContractSignature.create({
        contractId,
        signerName: name,
        signerEmail: email,
        signerDni: dni,
        signerRole: role,
        signerId,
        signerType,
        status: 'pending',
      });

      await contract.update({
        totalSignaturesRequired: contract.totalSignaturesRequired + 1,
      });

      res.status(201).json({
        message: 'Firmante agregado exitosamente',
        signature,
      });
    } catch (error) {
      console.error('Error adding signer:', error);
      res.status(500).json({ error: 'Error al agregar firmante' });
    }
  },

  /**
   * Remove signer from contract
   */
  async removeSigner(req, res) {
    try {
      const { contractId, signatureId } = req.params;

      const signature = await ContractSignature.findOne({
        where: { id: signatureId, contractId },
      });

      if (!signature) {
        return res.status(404).json({ error: 'Firmante no encontrado' });
      }

      if (signature.status === 'signed') {
        return res.status(400).json({
          error: 'No se puede eliminar un firmante que ya firmó',
        });
      }

      await signature.destroy();

      const contract = await Contract.findByPk(contractId);
      await contract.update({
        totalSignaturesRequired: Math.max(1, contract.totalSignaturesRequired - 1),
      });

      res.json({ message: 'Firmante eliminado exitosamente' });
    } catch (error) {
      console.error('Error removing signer:', error);
      res.status(500).json({ error: 'Error al eliminar firmante' });
    }
  },
};

module.exports = contractController;
