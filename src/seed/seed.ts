// src/seed/index.ts
import { Db } from "mongodb";
import bcrypt from "bcryptjs";
import { uuid } from "../utils/uuid.js";
import { Product } from "../types/models.js";

type Role = "admin" | "cashier" | "finance";

async function ensureIndexes(db: Db) {
  const users = db.collection("users");
  await users.createIndex({ email: 1 }, { unique: true }).catch(() => {});
  await users
    .createIndex({ id: 1 }, { unique: true, sparse: true })
    .catch(() => {});

  const products = db.collection<Product>("products");
  await products.createIndex({ sku: 1 }, { unique: true }).catch(() => {});
  await products
    .createIndex({ name: "text", sku: "text", barcode: "text" })
    .catch(() => {});
}

export async function seedUsers(db: Db) {
  await ensureIndexes(db);

  const users = db.collection("users");
  const nowISO = new Date().toISOString();
  const RESET_PASSWORDS =
    String(process.env.SEED_RESET_PASSWORDS || "").toLowerCase() === "true";

  const base = (name: string, email: string, role: Role, pwd: string) => {
    // Hash tiap user di awal supaya bisa dipakai di $setOnInsert / $set sesuai opsi
    const password_hash = bcrypt.hashSync(pwd, 10);
    return { name, email, role, password_hash };
  };

  const seeds = [
    base("Admin", "admin@peskinpro.id", "admin", "Admin#123"),
    base("Cashier", "kasir@peskinpro.id", "cashier", "Cashier#123"),
    base("Finance", "finance@peskinpro.id", "finance", "Finance#123"),
    base("Windi", "windi@peskinpro.id", "cashier", "Windi#123"),
    base("Calista", "calista@peskinpro.id", "cashier", "Calista#123"),
    base("Sinta", "sinta@peskinpro.id", "cashier", "Sinta#123"),
  ];

  const ops = seeds.map((u) => {
    // Field yang selalu diupdate:
    const setDoc: any = {
      name: u.name,
      role: u.role,
      active: true,
      updated_at: nowISO,
    };

    // Reset password jika diminta via env:
    if (RESET_PASSWORDS) {
      setDoc.password_hash = u.password_hash;
    }

    return {
      updateOne: {
        filter: { email: u.email },
        update: {
          $set: setDoc,
          $setOnInsert: {
            id: uuid(),
            email: u.email,
            password_hash: u.password_hash,
            created_at: nowISO,
          },
        },
        upsert: true,
      },
    };
  });

  const result = await users.bulkWrite(ops, { ordered: false });

  const inserted = result.upsertedCount || 0;
  const modified = (result.modifiedCount || 0) + (RESET_PASSWORDS ? 0 : 0);
  console.log(
    `✅ Seeded users (idempotent). Inserted: ${inserted}, Updated: ${modified}${
      RESET_PASSWORDS ? " (passwords reset)" : ""
    }`
  );
}

/**
 * Seed Products — dibuat idempotent juga (bonus):
 * - Upsert by sku
 * - Tidak tergantung countDocuments()
 * - Boleh di-run berkali-kali
 */
export async function seedProducts(db: Db) {
  await ensureIndexes(db);

  const products = db.collection<Product>("products");
  const nowISO = new Date().toISOString();

  const now = new Date();

  // ✅ 1. UPDATE THE HELPER FUNCTION 'P'
  // Add 'original_price' parameter after 'price'
  const P = (
    sku: string,
    name: string,
    category: string,
    price: number, // Sale price (e.g., 144,000)
    original_price: number | null, // Original/strikethrough price (e.g., 160,000)
    stock: number,
    barcode: string
  ): Product => ({
    id: uuid(),
    sku,
    name,
    category,
    price,
    original_price, // Add the new field to the object
    tax_code: null,
    barcode,
    is_active: true,
    stock_qty: stock,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    image_url: null,
    images: [],
  });

  // ✅ 2. UPDATE THE PRODUCT DATA
  // Pass the sale price (144000) first, then the original price (160000)
  await products.insertMany([
    P(
      "T128",
      "CICA-B5 Refreshing Toner - 100ML",
      "Facial Care",
      144000,
      160000,
      200,
      "8990000000001"
    ),
    P(
      "CF311",
      "Vit C Tone-Up Daycream SPF 50 - 25ML",
      "Facial Care",
      144000,
      160000,
      200,
      "8990000000002"
    ),
    P(
      "GF115",
      "Honey Cleansing Gel - 100ML",
      "Facial Care",
      144000,
      160000,
      200,
      "8990000000003"
    ),
    P(
      "GF116",
      "PE Prebiotic Pore-EX Facial Pad - 30ML",
      "Facial Care",
      144000,
      160000,
      200,
      "8990000000004"
    ),
    P(
      "CF298",
      "Hydro Restorative Cream - 60ML",
      "Facial Care",
      144000,
      160000,
      200,
      "8990000000005"
    ),
    P(
      "SF318",
      "Skin Awakening Glow Serum - 15ML",
      "Facial Care",
      144000,
      160000,
      200,
      "8990000000006"
    ),
    P(
      "FB403",
      "Intimate Feminine Mousse Cleanser - 100ML",
      "Body Care",
      144000,
      160000,
      200,
      "8990000000007"
    ),
  ]);

  await products.createIndex?.({ sku: 1 }, { unique: true }).catch(() => {});
  await products
    .createIndex?.({ name: "text", sku: "text", barcode: "text" })
    .catch(() => {});
  console.log("Seeded products (7 items)");
}

export async function seedAll(db: Db) {
  await seedUsers(db);
  await seedProducts(db);
}
