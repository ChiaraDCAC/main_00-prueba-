require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User } = require('./models');

const debug = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    const user = await User.findOne({ where: { email: 'admin@compliance.com' } });
    if (user) {
      console.log('User found:');
      console.log('- ID:', user.id);
      console.log('- Email:', user.email);
      console.log('- Password hash:', user.password);
      console.log('- Password length:', user.password.length);

      const testPassword = 'admin123';
      const isValid = await bcrypt.compare(testPassword, user.password);
      console.log('- Password valid:', isValid);
    } else {
      console.log('User NOT found!');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

debug();
