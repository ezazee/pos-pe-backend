// src/app.ts
import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";

import api from "./routes/index.js";
import adminRouter from "./routes/admin.js";
import { ENV } from "./config/env.js";

export const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin: ENV.CORS_ORIGINS.includes("*") ? true : ENV.CORS_ORIGINS,
    credentials: true,
  })
);
app.use(morgan("dev"));

// normalisasi // (kadang diperlukan saat lewat proxy)
app.use((req, _res, next) => {
  if (req.url.includes("//")) req.url = req.url.replace(/\/{2,}/g, "/");
  next();
});

// HANYA untuk lokal: serve uploads (Vercel serverless storage tidak persisten)
if (process.env.VERCEL !== "1") {
  app.use("/uploads", express.static(path.resolve(ENV.UPLOAD_DIR)));
}

// di Vercel, prefix /api sudah dipangkas, jadi mount di '/'
// di lokal, tetap '/api'
const BASE = process.env.VERCEL === "1" ? "/" : "/api";

app.use(BASE, api);
app.use(BASE, adminRouter);

// health check (mudah debug)
app.get(
  process.env.VERCEL === "1" ? "/healthz" : "/api/healthz",
  (_req, res) => {
    res.json({ ok: true, vercel: process.env.VERCEL === "1" });
  }
);
