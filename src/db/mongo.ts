// src/db/mongo.ts
import { MongoClient } from "mongodb";
import { ENV } from "../config/env.js";

let client: MongoClient | null = null;

export function getClient() {
  return client;
}

export async function connectMongo(abortSignal?: AbortSignal) {
  if (!ENV.MONGO_URL) throw new Error("MONGO_URL not set");
  if (client) return client;

  client = new MongoClient(ENV.MONGO_URL, { serverSelectionTimeoutMS: 5000 });

  if (abortSignal) {
    abortSignal.addEventListener("abort", () => {
      try {
        client?.close().catch(() => {});
      } catch {}
    });
  }

  await client.connect();
  return client;
}

export function getDb(name = ENV.DB_NAME) {
  if (!client) {
    throw new Error("MongoClient not connected. Call connectMongo() first.");
  }
  return client.db(name);
}

export async function closeMongo() {
  if (client) {
    await client.close().catch(() => {});
    client = null;
  }
}
