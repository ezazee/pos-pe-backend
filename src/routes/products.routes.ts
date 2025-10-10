import { Router } from "express";
import { getDb } from "../db/mongo.js";
import { Product } from "../types/models.js";
import { AuthedRequest, auth } from "../middleware/auth.js";
import { allowRoles } from "../middleware/allowRoles.js";
import { uploadProductImage } from "../middleware/upload.js";
import { uuid } from "../utils/uuid.js";
import crypto from "crypto";
import { uploadToVercelBlob } from "../utils/blob.js";

const router = Router();

/** GET /api/products?q=&page=&limit= */
router.get("/products", auth, async (req: AuthedRequest, res) => {
  const q = (req.query.q as string | undefined) || undefined;
  const page = Math.max(1, parseInt((req.query.page as string) || "1", 10));
  const limit = Math.max(
    1,
    Math.min(200, parseInt((req.query.limit as string) || "50", 10))
  );

  const filter: any = { is_active: true };
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { sku: { $regex: q, $options: "i" } },
      { barcode: { $regex: q, $options: "i" } },
    ];
  }

  const db = getDb();
  const coll = db.collection<Product>("products");
  const total = await coll.countDocuments(filter);
  const products = await coll
    .find(filter, { projection: { _id: 0 } })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();

  return res.json({ products, total });
});

/** POST /api/products  (create) */
router.post(
  "/products",
  auth,
  allowRoles("admin"),
  uploadProductImage.single("image"),
  async (req: AuthedRequest, res) => {
    const db = getDb();
    const body = req.body as any;

    // Validasi minimal
    const sku = String(body.sku || "").trim();
    const name = String(body.name || "").trim();
    const price = Number(body.price);
    const stock_qty = Number(body.stock_qty);

    if (
      !sku ||
      !name ||
      !Number.isFinite(price) ||
      !Number.isFinite(stock_qty)
    ) {
      return res
        .status(400)
        .json({ message: "sku, name, price, stock_qty wajib diisi" });
    }

    // SKU unik
    const exists = await db
      .collection<Product>("products")
      .findOne({ sku }, { projection: { _id: 0 } });
    if (exists) {
      return res.status(409).json({ message: "SKU already exists" });
    }

    // Upload ke Vercel Blob jika ada file
    let image_url: string | null = null;
    if (req.file?.buffer) {
      const safe = req.file.originalname.replace(/\s+/g, "_");
      const filename = `prod_${Date.now()}_${crypto.randomBytes(4).toString("hex")}_${safe}`;
      image_url = await uploadToVercelBlob(req.file.buffer, filename);
    }

    const now = new Date().toISOString();
    const product: Product = {
      id: uuid(),
      sku,
      name,
      category: body.category || null,
      price,
      tax_code: body.tax_code || null,
      barcode: body.barcode || null,
      is_active:
        body.is_active !== undefined
          ? String(body.is_active) !== "false"
          : true,
      stock_qty,
      created_at: now,
      updated_at: now,
      image_url,
      images: image_url ? [image_url] : [],
    };

    await db.collection<Product>("products").insertOne({ ...product });
    return res.status(201).json(product);
  }
);

/** PATCH /api/products/:id (edit) */
router.patch(
  "/products/:id",
  auth,
  allowRoles("admin"),
  uploadProductImage.single("image"), // memoryStorage
  async (req: AuthedRequest, res) => {
    const db = getDb();
    const coll = db.collection<Product>("products");
    const id = req.params.id;

    const existed = await coll.findOne({ id }, { projection: { _id: 0 } });
    if (!existed) return res.status(404).json({ message: "Product not found" });

    const b = req.body as any;
    const $set: Partial<Product> = {
      updated_at: new Date().toISOString(),
    } as any;

    if (typeof b.sku !== "undefined") $set.sku = String(b.sku || "").trim();
    if (typeof b.name !== "undefined") $set.name = String(b.name || "").trim();
    if (typeof b.category !== "undefined") $set.category = b.category || null;
    if (typeof b.tax_code !== "undefined") $set.tax_code = b.tax_code || null;
    if (typeof b.barcode !== "undefined") $set.barcode = b.barcode || null;
    if (typeof b.price !== "undefined") $set.price = Number(b.price);
    if (typeof b.stock_qty !== "undefined")
      $set.stock_qty = Number(b.stock_qty);
    if (typeof b.is_active !== "undefined") {
      $set.is_active = String(b.is_active).toLowerCase() !== "false";
    }

    // Upload gambar baru (optional)
    if (req.file?.buffer) {
      const safe = req.file.originalname.replace(/\s+/g, "_");
      const filename = `prod_${Date.now()}_${crypto.randomBytes(4).toString("hex")}_${safe}`;
      const newUrl = await uploadToVercelBlob(req.file.buffer, filename);

      ($set as any).image_url = newUrl;
      const images = Array.isArray(existed.images) ? existed.images.slice() : [];
      if (!images.includes(newUrl)) images.push(newUrl);
      ($set as any).images = images;
    }

    if (typeof $set.price !== "undefined" && !Number.isFinite($set.price)) {
      return res.status(400).json({ message: "price harus number" });
    }
    if (
      typeof $set.stock_qty !== "undefined" &&
      !Number.isFinite($set.stock_qty)
    ) {
      return res.status(400).json({ message: "stock_qty harus number" });
    }

    await coll.updateOne({ id }, { $set });
    const updated = await coll.findOne({ id }, { projection: { _id: 0 } });
    return res.json(updated);
  }
);

/** DELETE /api/products/:id */
router.delete(
  "/products/:id",
  auth,
  allowRoles("admin"),
  async (req: AuthedRequest, res) => {
    const db = getDb();
    const coll = db.collection<Product>("products");
    const id = req.params.id;

    const existed = await coll.findOne({ id }, { projection: { _id: 0 } });
    if (!existed) return res.status(404).json({ message: "Product not found" });

    // Hapus dokumen (blob tidak kita hapus – opsional)
    await coll.deleteOne({ id });

    return res.json({ ok: true });
  }
);

export default router;
