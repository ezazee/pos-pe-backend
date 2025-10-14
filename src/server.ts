import { app } from "./app.js";
import { ENV } from "./config/env.js";
import { connectMongo, closeMongo } from "./db/mongo.js";
import { seedAll } from './seed/seed.js'; // aktifkan jika perlu

process.on("unhandledRejection", (e) =>
  console.error("UNHANDLED_REJECTION", e)
);
process.on("uncaughtException", (e) => console.error("UNCAUGHT_EXCEPTION", e));

async function start() {
  // 1) Start HTTP segera
  app.listen(ENV.PORT, ENV.HOST, () => {
    console.log(`API listening on http://${ENV.HOST}:${ENV.PORT}`);
  });

  // 2) DB connect di background (non-blocking)
  (async () => {
    if (!ENV.MONGO_URL) {
      console.warn("MONGO_URL not set, skip DB connect");
      return;
    }
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 7000); // 7s timeout
      await connectMongo(controller.signal);
      clearTimeout(t);
      console.log("Mongo connected");

      // Opsional: seed
      // await seedAll();
      // console.log('Seed done');
    } catch (err) {
      console.error("Mongo connect failed (server keeps running):", err);
    }
  })();

  // Graceful
  const shutdown = async () => {
    console.log("Shutting down...");
    await closeMongo().catch(() => {});
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start().catch((err) => {
  console.error("FATAL start error:", err);
  process.exit(1);
});
