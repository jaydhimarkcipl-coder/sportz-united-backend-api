const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 1433,
    dialect: 'mssql',
    dialectOptions: {
      options: {
        encrypt: process.env.DB_ENCRYPT === 'true', // Try setting DB_ENCRYPT=false in .env if login fails
        trustServerCertificate: true,
        enableArithAbort: true
      }
    },
    logging: (msg) => msg && console.log(msg)
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('MSSQL Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the MSSQL database:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
