const { Sequelize } = require('sequelize');

const isProd = process.env.NODE_ENV === 'production';
const dbUrl = process.env.DATABASE_URL;

let sequelize;
if (dbUrl) {
  sequelize = new Sequelize(dbUrl, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: false,
    dialectOptions: {
      charset: 'utf8mb4',
      ssl: isProd ? { require: true, rejectUnauthorized: false } : false
    },
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    }
  });
} else {
  // fallback for local dev (optional: use SQLite if DATABASE_URL not set)
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'rrnagar.sqlite',
    logging: false,
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    }
  });
}

module.exports = sequelize;
