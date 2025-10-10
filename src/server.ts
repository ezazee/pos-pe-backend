// src/server.ts (hanya untuk lokal—Vercel tidak pakai file ini)
import { app } from "./app.js";
import { ENV } from "./config/env.js";
import { connectMongo, closeMongo } from "./db/mongo.js";
// import { seedAll } from './seed/seed.js'; // kalau mau seed lokal

async function bootstrap() {
  await connectMongo();
  // await seedAll(db); // optional: hanya lokal

  const server = app.listen(ENV.PORT, () => {
    console.log(`API listening on http://localhost:${ENV.PORT}`);
  });

  const shutdown = async () => {
    server.close(async () => {
      await closeMongo();
      process.exit(0);
    });
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
