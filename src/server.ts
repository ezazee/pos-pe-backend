// src/server.ts

import { app } from "./app.js";
import { ENV } from "./config/env.js";
import { closeMongo, connectMongo } from "./db/mongo.js";
import { seedAll } from "./seed/seed.js";


async function bootstrap() {
  // Koneksi & seed hanya saat lokal (bukan Vercel)
  const db = await connectMongo();

  if (process.env.VERCEL !== "1") {
    await seedAll(db);
  }

  const server = app.listen(ENV.PORT, () => {
    console.log(`API listening on http://localhost:${ENV.PORT}`);
  });

  const shutdown = async () => {
    console.log("Shutting down...");
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
