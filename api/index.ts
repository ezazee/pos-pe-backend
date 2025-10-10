// backend-express/api/index.ts
import serverless from "serverless-http";
import { connectMongo } from "../src/db/mongo.js";
import { app } from "../src/app.js";

let ready: Promise<void> | null = null;
async function ensureReady() {
  if (!ready) ready = connectMongo().then(() => undefined);
  await ready;
}

export default async function handler(req: any, res: any) {
  await ensureReady();
  const wrapped = serverless(app);
  return wrapped(req, res);
}
