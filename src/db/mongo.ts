import { MongoClient, Db } from "mongodb";
import { ENV } from "../config/env.js";

let client: MongoClient | null = null;
let db: Db | null = null;

/**
 * Connect ke MongoDB dan cache koneksi agar tidak reconnect setiap invoke
 */
export async function connectMongo(): Promise<Db> {
  if (db) return db; // sudah connect, pakai cache

  // Cache global untuk serverless (agar survive antar invoke)
  const globalAny = globalThis as any;
  if (globalAny.__mongoDb) return globalAny.__mongoDb as Db;

  client = new MongoClient(ENV.MONGO_URL);
  await client.connect();
  db = client.db(ENV.DB_NAME);

  globalAny.__mongoClient = client;
  globalAny.__mongoDb = db;

  console.log("✅ MongoDB connected");
  return db;
}

/**
 * Ambil instance DB yang sudah connect
 */
export function getDb(): Db {
  if (!db) throw new Error("Mongo not connected");
  return db;
}

/**
 * Tutup koneksi (biasanya tidak dipakai di serverless)
 */
export async function closeMongo() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log("🧹 MongoDB closed");
  }
}
