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
