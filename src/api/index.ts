// api/index.ts
import serverless from "serverless-http";

import { app } from "../app";
import { connectMongo } from "../db/mongo";

// Cache koneksi Mongo untuk setiap cold start
let ready: Promise<void> | null = null;

async function ensureReady() {
  if (!ready) {
    ready = connectMongo().then(() => undefined);
  }
  await ready;
}

export default async function handler(req: any, res: any) {
  await ensureReady(); // pastikan Mongo sudah connect
  const wrapped = serverless(app);
  return wrapped(req, res);
}
