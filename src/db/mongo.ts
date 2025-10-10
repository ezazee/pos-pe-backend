import { MongoClient, Db } from 'mongodb';
import { ENV } from '../config/env';

let client: MongoClient;
let db: Db;

export async function connectMongo() {
  client = new MongoClient(ENV.MONGO_URL);
  await client.connect();
  db = client.db(ENV.DB_NAME);
  return db;
}

export function getDb(): Db {
  if (!db) throw new Error('Mongo not initialized. Call connectMongo() first.');
  return db;
}

export async function closeMongo() {
  if (client) await client.close();
}
