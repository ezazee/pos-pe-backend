import { Router } from "express";
import { getDb } from "../db/mongo";
import { Product } from "../types/models";
import { AuthedRequest, auth } from "../middleware/auth";
import { allowRoles } from "../middleware/allowRoles";
import { uploadProductImage } from "../middleware/upload";
import { uuid } from "../utils/uuid";
import { ENV } from "../config/env";

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

router.post(
  "/products",
  auth,
  allowRoles("admin"), // hanya admin boleh tambah produk
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

    // Cek sku unik (opsional)
    const exists = await db
      .collection<Product>("products")
      .findOne({ sku }, { projection: { _id: 0 } });
    if (exists) {
      return res.status(409).json({ message: "SKU already exists" });
    }

    // Build image_url jika ada file
    let image_url: string | null = null;
    if (req.file) {
      // file disimpan di /uploads/products/<filename>
      image_url = `${ENV.BASE_URL}/uploads/products/${req.file.filename}`;
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
      image_url, // NEW
      images: image_url ? [image_url] : [], // optional multi
    };

    await db.collection<Product>("products").insertOne({ ...product });
    return res.status(201).json(product);
  }
);

// ====== EDIT PRODUCT (PATCH /api/products/:id) ======
router.patch(
  "/products/:id",
  auth,
  allowRoles("admin"),
  uploadProductImage.single("image"), // optional
  async (req: AuthedRequest, res) => {
    const db = getDb();
    const coll = db.collection<Product>("products");
    const id = req.params.id;

    // produk harus ada
    const existed = await coll.findOne({ id }, { projection: { _id: 0 } });
    if (!existed) return res.status(404).json({ message: "Product not found" });

    const b = req.body as any;
    const $set: Partial<Product> = {
      updated_at: new Date().toISOString(),
    } as any;

    // set hanya field yang dikirim
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

    // gambar baru (opsional)
    if (req.file) {
      const newUrl = `${ENV.BASE_URL}/uploads/products/${req.file.filename}`;
      // ganti thumbnail utama
      ($set as any).image_url = newUrl;

      // update array images (append unik)
      const images = Array.isArray(existed.images)
        ? existed.images.slice()
        : [];
      if (!images.includes(newUrl)) images.push(newUrl);
      ($set as any).images = images;
    }

    // validasi ringan
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

// ====== DELETE PRODUCT (DELETE /api/products/:id) ======
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

    // hapus dokumen
    await coll.deleteOne({ id });

    // (opsional) coba hapus file lokal jika image_url menunjuk ke /uploads/products
    try {
      const urls = [
        ...(Array.isArray(existed.images) ? existed.images : []),
        ...(existed.image_url ? [existed.image_url] : []),
      ];
      const localPaths = urls
        .filter(
          (u) => typeof u === "string" && u.includes("/uploads/products/")
        )
        .map((u) => u.split("/uploads/products/")[1])
        .filter(Boolean);

      // gunakan fs tanpa memblok; abaikan error bila file tak ada
      const fs = await import("fs");
      const path = await import("path");
      for (const fname of localPaths) {
        const p = path.join(
          process.cwd(),
          "uploads",
          "products",
          fname as string
        );
        fs.promises.unlink(p).catch(() => {});
      }
    } catch (_) {
      /* ignore */
    }

    return res.json({ ok: true });
  }
);

export default router;
