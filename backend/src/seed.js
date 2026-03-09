require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User, Client } = require('./models');

const seedDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    await sequelize.sync();
    console.log('Database synchronized');

    // Create admin user (delete and recreate to ensure correct password)
    await User.destroy({ where: { email: 'admin@compliance.com' } });
    const hashedPassword = await bcrypt.hash('admin123', 12);
    await User.create({
      email: 'admin@compliance.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'Sistema',
      role: 'admin',
      isActive: true,
    });
    console.log('Admin user created: admin@compliance.com / admin123');

    // Create test clients with different statuses
    const testClients = [
      {
        clientType: 'persona_juridica',
        legalForm: 'SA',
        legalName: 'Agropecuaria del Norte S.A.',
        cuit: '30-71234567-8',
        status: 'pendiente', // Sin aprobar
        riskLevel: 'medio',
      },
      {
        clientType: 'persona_juridica',
        legalForm: 'SRL',
        legalName: 'Granos del Sur S.R.L.',
        cuit: '30-71234568-9',
        status: 'pendiente', // Sin aprobar
        riskLevel: 'bajo',
      },
      {
        clientType: 'persona_juridica',
        legalForm: 'SH',
        legalName: 'Los Hermanos Campos',
        cuit: '30-71234569-0',
        status: 'pendiente', // Sin aprobar - Sociedad de Hecho
        riskLevel: 'medio',
      },
      {
        clientType: 'persona_humana',
        legalForm: 'MONOTRIBUTISTA',
        firstName: 'Juan Carlos',
        lastName: 'Pérez',
        legalName: 'Juan Carlos Pérez',
        cuit: '20-12345678-9',
        status: 'pendiente', // Sin aprobar
        riskLevel: 'bajo',
      },
      {
        clientType: 'persona_juridica',
        legalForm: 'SUCESION',
        legalName: 'Sucesión de María González',
        cuit: '30-71234570-1',
        status: 'pendiente', // Sin aprobar
        riskLevel: 'alto',
      },
      {
        clientType: 'persona_juridica',
        legalForm: 'SA',
        legalName: 'Cereales Premium S.A.',
        cuit: '30-71234571-2',
        status: 'aprobado', // Ya aprobado
        riskLevel: 'bajo',
      },
      {
        clientType: 'persona_juridica',
        legalForm: 'SRL',
        legalName: 'Transportes del Campo S.R.L.',
        cuit: '30-71234572-3',
        status: 'aprobado', // Ya aprobado
        riskLevel: 'medio',
      },
    ];

    for (const clientData of testClients) {
      const existing = await Client.findOne({ where: { cuit: clientData.cuit } });
      if (!existing) {
        await Client.create(clientData);
        console.log(`Client created: ${clientData.legalName || clientData.firstName + ' ' + clientData.lastName}`);
      }
    }

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedDatabase();
