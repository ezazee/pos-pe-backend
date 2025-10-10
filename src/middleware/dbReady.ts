// src/middleware/dbReady.ts
import { Request, Response, NextFunction } from "express";
import { ensureDb } from "../db/mongo.js";

export async function dbReady(req: Request, res: Response, next: NextFunction) {
  try {
    await ensureDb();
    next();
  } catch (e) {
    res
      .status(503)
      .json({ message: "Database not ready", error: (e as Error).message });
  }
}
