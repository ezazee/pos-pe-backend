import { MongoClient, Db } from "mongodb";
import { ENV } from "../config/env.js";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectMongo(abortSignal?: AbortSignal) {
  if (db) return db;
  if (!ENV.MONGO_URL) throw new Error("MONGO_URL not set");

  client = new MongoClient(ENV.MONGO_URL, {
    serverSelectionTimeoutMS: 5000,
  });

  if (abortSignal) {
    abortSignal.addEventListener("abort", () => {
      try {
        client?.close().catch(() => {});
      } catch {}
    });
  }

  await client.connect();
  db = client.db(ENV.DB_NAME);
  return db;
}

export function getDb(): Db {
  if (!db) throw new Error("Mongo not connected");
  return db;
}

export function isDbReady() {
  return !!db;
}

/** pastikan DB siap; kalau belum, coba konek sekali lagi */
export async function ensureDb() {
  if (db) return db;
  return connectMongo();
}

export async function closeMongo() {
  if (client) {
    await client.close().catch(() => {});
    client = null;
    db = null;
  }
}
