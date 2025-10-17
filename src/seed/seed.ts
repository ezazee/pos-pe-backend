// src/seed/index.ts
import { Db } from "mongodb";
import bcrypt from "bcryptjs";
import { uuid } from "../utils/uuid.js";
import { Product } from "../types/models.js";

type Role = "admin" | "cashier" | "finance";

export async function seedUsers(db: Db) {
  const users = db.collection("users");
  const now = new Date().toISOString();
  const gen = (name: string, email: string, role: Role, pwd: string) => ({
    id: uuid(),
    name,
    email,
    role,
    password_hash: bcrypt.hashSync(pwd, 10),
    active: true,
    created_at: now,
    updated_at: now,
  });

  if ((await users.countDocuments({})) === 0) {
    await users.insertMany([
      gen("Admin", "admin@peskinpro.id", "admin", "Admin#123"),
      gen("Cashier", "kasir@peskinpro.id", "cashier", "Cashier#123"),
      gen("Finance", "finance@peskinpro.id", "finance", "Finance#123"),
    ]);
    console.log("Seeded users");
  }
}

export async function seedProducts(db: Db) {
  const products = db.collection<Product>("products");
  if ((await products.countDocuments({})) > 0) return;

  const now = new Date();
  const P = (
  sku: string,
  name: string,
  category: string,
  price: number,
  original_price: number | null,
  stock: number,
  barcode: string,
  bulk_pricing?: { qty: number; total: number }[],
  bundle_code: string | null = null
): Product => ({
  id: uuid(),
  sku,
  name,
  category,
  price,
  original_price,
  tax_code: null,
  barcode,
  is_active: true,
  stock_qty: stock,
  created_at: now.toISOString(),
  updated_at: now.toISOString(),
  image_url: null,
  images: [],
  bulk_pricing,
  bundle_code,
});

// paket mix & match seperti gambar
const tiers = [
  { qty: 1, total: 125000 },
  { qty: 2, total: 240000 },
  { qty: 3, total: 330000 },
  { qty: 4, total: 420000 },
  { qty: 5, total: 500000 },
];
const MIX = "MIX125"; // 👉 semua produk promo dimasukkan ke group ini

await products.insertMany([
  P("T128","CICA-B5 Refreshing Toner - 100ML","Facial Care",125000,160000,200,"8990000000001",tiers,MIX),
  P("CF311","Vit C Tone-Up Daycream SPF 50 - 25ML","Facial Care",125000,160000,200,"8990000000002",tiers,MIX),
  P("GF115","Honey Cleansing Gel - 100ML","Facial Care",125000,160000,200,"8990000000003",tiers,MIX),
  P("GF116","PE Prebiotic Pore-EX Facial Pad - 30ML","Facial Care",125000,160000,200,"8990000000004",tiers,MIX),
  P("CF298","Hydro Restorative Cream - 60ML","Facial Care",125000,160000,200,"8990000000005",tiers,MIX),
  P("SF318","Skin Awakening Glow Serum - 15ML","Facial Care",125000,160000,200,"8990000000006",tiers,MIX),
  P("FB403","Intimate Feminine Mousse Cleanser - 100ML","Body Care",125000,160000,200,"8990000000007",tiers,MIX),
]);

  await products.createIndex?.({ sku: 1 }, { unique: true }).catch(() => {});
  await products.createIndex?.({ name: "text", sku: "text", barcode: "text" }).catch(() => {});
  console.log("Seeded products (7 items)");
}

export async function seedAll(db: Db) {
  await seedUsers(db);
  await seedProducts(db);
}
