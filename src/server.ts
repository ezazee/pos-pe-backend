import { app } from "./app.js";
import { connectMongo } from "./db/mongo.js";

process.on("unhandledRejection", (e) =>
  console.error("UNHANDLED REJECTION:", e)
);
process.on("uncaughtException", (e) => console.error("UNCAUGHT EXCEPTION:", e));

const PORT = Number(process.env.PORT || 4000);
const HOST = process.env.HOST || "0.0.0.0";

async function main() {
  console.log("Boot…", {
    PORT,
    HOST,
    HAS_MONGO_URL: !!process.env.MONGO_URL,
    DB_NAME: process.env.DB_NAME,
  });

  try {
    await connectMongo();
    console.log("Mongo connected");
  } catch (err) {
    console.error("Mongo connection FAILED:", err);
    // sementara biarkan server tetap hidup agar healthcheck jalan
  }

  app.listen(PORT, HOST, () => {
    console.log(`API listening at http://${HOST}:${PORT}`);
  });
}

main().catch((err) => console.error("FATAL bootstrap:", err));
