import { Sequelize } from "sequelize";
import initModels from "../models/index.js";

const isProd = process.env.NODE_ENV === "production";
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: false,
  dialectOptions: isProd
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : {},
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});


let models;
export function getModels() {
  if (!models) {
    models = initModels(sequelize);
  }
  return models;
}

export async function initDatabase() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected");
    await sequelize.sync();
    console.log("✅ Database synced");
  } catch (err) {
    console.error("❌ Database initialization error:", err);
  }
}

export { sequelize };
