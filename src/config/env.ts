import "dotenv/config";

export const ENV = {
  PORT: Number(process.env.PORT || 4000),
  HOST: process.env.HOST || "0.0.0.0",
  CORS_ORIGINS: (process.env.CORS_ORIGINS || "*")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  MONGO_URL: process.env.MONGO_URL || "",
  DB_NAME: process.env.DB_NAME || "peskinpro_pos",
  UPLOAD_DIR: process.env.UPLOAD_DIR || "uploads",
  JWT_SECRET_KEY: process.env.JWT_SECRET_KEY || 'pe-skinpro-secret-key-2025',
  BASE_URL: process.env.BASE_URL || '',
};
