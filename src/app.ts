import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import { ENV } from "./config/env.js";
import api from "./routes/index.js";
import { dbReady } from './middleware/dbReady.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin: ENV.CORS_ORIGINS.includes("*") ? true : ENV.CORS_ORIGINS,
    credentials: true,
  })
);
app.use(morgan("dev"));

// normalize // double slash (kadang reverse proxy bikin //)
app.use((req, _res, next) => {
  if (req.url.includes("//")) req.url = req.url.replace(/\/{2,}/g, "/");
  next();
});

// STATIC (optional)
app.use(
  "/uploads",
  express.static(path.resolve(__dirname, "..", "..", ENV.UPLOAD_DIR))
);

// HEALTH
app.get("/", (_req, res) => res.send("OK"));
app.get("/kaithheathcheck", (_req, res) => res.send("OK"));
app.get("/api/healthz", (_req, res) => res.json({ ok: true }));

// API
app.use("/api", dbReady, api);

// 404
app.use((req, res) =>
  res.status(404).json({ message: "Not Found", path: req.url })
);
