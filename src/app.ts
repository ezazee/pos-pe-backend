// src/app.ts
import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";

import api from "./routes";
import adminRouter from "./routes/admin";
import { ENV } from "./config/env";

export const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin: ENV.CORS_ORIGINS.includes("*") ? true : ENV.CORS_ORIGINS,
    credentials: true,
  })
);
app.use(morgan("dev"));

// Normalisasi double slash
app.use((req, _res, next) => {
  if (req.url.includes("//")) req.url = req.url.replace(/\/{2,}/g, "/");
  next();
});

// Static file (CATATAN: di Vercel serverless, folder ini tidak persisten!)
app.use("/uploads", express.static(path.resolve(ENV.UPLOAD_DIR)));

// Routers
app.use("/api", api);
app.use("/api", adminRouter);
