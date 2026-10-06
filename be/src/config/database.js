require('dotenv').config();

const baseConfig = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  dialect: process.env.DIALECT || 'postgres',

  dialectOptions: {
    ssl: process.env.DB_SSL === 'false' ? false : { require: true, rejectUnauthorized: false },
  },
};

module.exports = {
  development: {
    ...baseConfig,
  },

  test: {
    ...baseConfig,
  },

  production: {
    ...baseConfig,
  },
};
