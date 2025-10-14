import 'dotenv/config';
import { MongoClient } from 'mongodb';
import { seedAll } from '../src/seed/seed.js';
import process from 'node:process';

const { MONGO_URL, DB_NAME } = process.env as Record<string, string>;

async function main() {
  const args = process.argv.slice(2);
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  const db = client.db(DB_NAME);

  if (args.includes('--purge')) {
    console.log('🧹 Purging collections...');
    for (const name of ['sales', 'products', 'users', 'audits']) {
      await db.collection(name).deleteMany({});
    }
    console.log('✅ Purge done.');
  }

  if (args.includes('--seed')) {
    console.log('🌱 Seeding...');
    await seedAll(db);
    console.log('✅ Seed done.');
  }

  await client.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
