// api/index.ts
import serverless from "serverless-http";
import { app } from "../src/app.js";
import { connectMongo } from "../src/db/mongo.js";

let once: Promise<void> | null = null;
async function ensureReady() {
  if (!once) {
    once = connectMongo().then(() => undefined);
  }
  await once;
}

export default async function handler(req: any, res: any) {
  try {
    await ensureReady();
    const wrapped = serverless(app);
    return wrapped(req, res);
  } catch (err) {
    console.error("Serverless handler error:", err);
    res.statusCode = 500;
    res.end("Internal Error");
  }
}
