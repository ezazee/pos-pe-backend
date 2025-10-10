// src/seed/index.ts
import { Db } from 'mongodb';
import bcrypt from 'bcryptjs';
import { uuid } from '../utils/uuid';
import { Product } from '../types/models';

type Role = 'admin' | 'cashier' | 'finance';

export async function seedUsers(db: Db) {
  const users = db.collection('users');
  const now = new Date().toISOString();
  const gen = (name: string, email: string, role: Role, pwd: string) => ({
    id: uuid(),
    name, email, role,
    password_hash: bcrypt.hashSync(pwd, 10),
    active: true,
    created_at: now,
    updated_at: now,
  });

  if (await users.countDocuments({}) === 0) {
    await users.insertMany([
      gen('Admin',  'admin@peskinpro.id',  'admin',   'Admin#123'),
      gen('Ayu',    'ayu@peskinpro.id',    'cashier', 'Cashier#123'),
      gen('Bima',   'bima@peskinpro.id',   'finance', 'Finance#123'),
    ]);
    console.log('Seeded users');
  }
}

export async function seedProducts(db: Db) {
  const products = db.collection<Product>('products');
  if (await products.countDocuments({}) > 0) return;

  const now = new Date().toISOString();
  const P = (sku: string, name: string, category: string, price: number, stock: number, barcode: string) => ({
    id: uuid(),
    sku, name, category, price,
    tax_code: null, barcode,
    is_active: true, stock_qty: stock,
    created_at: now, updated_at: now,
    image_url: null, images: [],
  });

  await products.insertMany([
    P('FAC-TONER-CB5-100','CICA-B5 Refreshing Toner - 100ML','Facial Care',144000,983,'8990000000001'),
    P('FAC-DAYC-VCSPF-25','Vit C Tone-Up Daycream SPF 50 - 25ML','Facial Care',144000,977,'8990000000002'),
    P('FAC-CLEANS-HNY-100','Honey Cleansing Gel - 100ML','Facial Care',144000,952,'8990000000003'),
    P('FAC-PREBIO-PAD-30','PE Prebiotic Pore-EX Facial Pad - 30ML','Facial Care',144000,945,'8990000000004'),
    P('FAC-HYDRO-CRM-60','Hydro Restorative Cream - 60ML','Facial Care',144000,988,'8990000000005'),
    P('FAC-GLOW-SER-15','Skin Awakening Glow Serum - 15ML','Facial Care',144000,986,'8990000000006'),
    P('BDY-INT-FEM-CLS-100','Intimate Feminine Mousse Cleanser - 100ML','Body Care',144000,978,'8990000000007'),
  ]);

  await products.createIndex?.({ sku: 1 }, { unique: true }).catch(() => {});
  await products.createIndex?.({ name: 'text', sku: 'text', barcode: 'text' }).catch(() => {});
  console.log('Seeded products (7 items)');
}

export async function seedAll(db: Db) {
  await seedUsers(db);
  await seedProducts(db);
}
