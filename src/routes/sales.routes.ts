// src/routes/sales.routes.ts
import { Router } from "express";
import { getDb } from "../db/mongo.js";
import { AuthedRequest, auth } from "../middleware/auth.js";
import { Product, Sale, SaleItem } from "../types/models.js";
import {
  fmtDateJakarta, fmtTimeJakarta, nowJakartaDate,
  roundToNearest100, yearMonth,
} from "../utils/time.js";
import { uuid } from "../utils/uuid.js";
import { calcBulkTotal, allocateGroupTotals } from "../utils/pricing.js";

const router = Router();

/** POST /api/sales */
router.post("/sales", auth, async (req: AuthedRequest, res) => {
  const currentUser = req.user!;
  if (!["admin", "cashier"].includes(currentUser.role)) {
    return res.status(403).json({ message: "Permission denied" });
  }

  const body = req.body as {
    items: { product_id: string; qty: number }[];
    discount_amount?: number;
    payment_method: string;
    customer_name?: string;
    qris_acquirer?: string; qris_rrn?: string;
    edc_issuer?: string; edc_approval_code?: string;
  };

  const db = getDb();
  const rawItems = body.items || [];
  const discount_amount = body.discount_amount ?? 0;
  const productsColl = db.collection<Product>("products");

  // fetch & validate
const prodMap = new Map<string, Product>();
for (const it of rawItems) {
  const prod = await productsColl.findOne({ id: it.product_id }, { projection: { _id: 0 } });
  if (!prod) return res.status(404).json({ message: `Product ${it.product_id} not found` });
  if (prod.stock_qty < it.qty) {
    return res.status(400).json({ message: `Insufficient stock for ${prod.name}` });
  }
  prodMap.set(it.product_id, prod);
}

type Row = { input: { product_id: string; qty: number }, prod: Product };
const rows: Row[] = rawItems.map(i => ({ input: i, prod: prodMap.get(i.product_id)! }));


const groups = new Map<string, Row[]>();
for (const r of rows) {
  const code = r.prod.bundle_code || `__single_${r.prod.id}`;
  if (!groups.has(code)) groups.set(code, []);
  groups.get(code)!.push(r);
}


const saleItems: SaleItem[] = [];
for (const [code, list] of groups) {
  // kalau ini group 'single_*' atau tidak ada bulk_pricing sama sekali -> hitung biasa per item
  const hasBulk = list[0].prod.bundle_code && list[0].prod.bulk_pricing?.length;
  if (!hasBulk) {
    for (const { input, prod } of list) {
      saleItems.push({
        product_id: prod.id,
        qty: input.qty,
        name: prod.name,
        sku: prod.sku,
        price: prod.price,
        original_price: prod.original_price,
        line_total: prod.price * input.qty,
      });
    }
    continue;
  }

  // pastikan semua harga per pcs sama untuk group promo ini
  const unitPrice = list[0].prod.price;
  const same = list.every(r => r.prod.price === unitPrice);
  if (!same) {
    // fallback: treat as normal (atau kamu bisa bikin error kalau mau strict)
    for (const { input, prod } of list) {
      saleItems.push({
        product_id: prod.id,
        qty: input.qty,
        name: prod.name,
        sku: prod.sku,
        price: prod.price,
        original_price: prod.original_price,
        line_total: prod.price * input.qty,
      });
    }
    continue;
  }

  // hitung total group dengan DP, lalu bagi ke item2
  const totalQty = list.reduce((a, r) => a + r.input.qty, 0);
  const groupTotal = calcBulkTotal(totalQty, list[0].prod.bulk_pricing, unitPrice);
  const allocations = allocateGroupTotals(list.map(r => ({ qty: r.input.qty })), groupTotal);


  list.forEach((r, idx) => {
    const { prod, input } = r;
    saleItems.push({
      product_id: prod.id,
      qty: input.qty,
      name: prod.name,
      sku: prod.sku,
      price: prod.price,
      original_price: prod.original_price,
      line_total: allocations[idx],
    });
  });
}

// subtotal / total seperti biasa
const subtotal = saleItems.reduce((a, it) => a + it.line_total, 0);
if (discount_amount > subtotal) {
  return res.status(400).json({ message: "Discount cannot exceed subtotal" });
}
const tax_amount = 0;
const grand_total = roundToNearest100(subtotal - discount_amount + tax_amount)

  const nowJkt = nowJakartaDate();
  const yymm = yearMonth(nowJkt);
  const prefix = `JKT-01-${yymm}-`;

  const salesColl = db.collection<Sale>("sales");
  const count = (await salesColl.countDocuments({ invoice_no: { $regex: `^${prefix}` } })) + 1;
  const invoice_no = `${prefix}${String(count).padStart(6, "0")}`;

  const sale: Sale = {
    id: uuid(),
    invoice_no,
    date: fmtDateJakarta(nowJkt),
    time: fmtTimeJakarta(nowJkt),
    branch_id: "JKT-01",
    cashier_id: currentUser.id,
    cashier_name: currentUser.name,
    customer_name: body.customer_name,
    items: saleItems,
    subtotal,
    discount_amount,
    tax_amount,
    total: grand_total,
    payment_method: body.payment_method,
    qris_acquirer: body.qris_acquirer,
    qris_rrn: body.qris_rrn,
    edc_issuer: body.edc_issuer,
    edc_approval_code: body.edc_approval_code,
    status: "PAID",
    created_at: new Date().toISOString(),
  };

  await salesColl.insertOne({ ...sale });
  // reduce stock
  for (const it of saleItems) {
    await productsColl.updateOne({ id: it.product_id }, { $inc: { stock_qty: -it.qty } });
  }
  await db.collection("audits").insertOne({
    id: uuid(), user_id: currentUser.id, action: "create_sale",
    entity: "sale", entity_id: sale.id, meta: { invoice_no, total: grand_total },
    created_at: new Date().toISOString(),
  });

  return res.json(sale);
});

/** GET /api/sales */
router.get("/sales", auth, async (req: AuthedRequest, res) => {
  const currentUser = req.user!;
  let cashier = (req.query.cashier as string | undefined) || undefined;

  if (!["admin", "finance"].includes(currentUser.role)) {
    if (currentUser.role === "cashier") cashier = currentUser.id;
    else return res.status(403).json({ message: "Permission denied" });
  }

  const date_from = (req.query.date_from as string | undefined) || undefined;
  const date_to = (req.query.date_to as string | undefined) || undefined;
  const invoice = (req.query.invoice as string | undefined) || undefined;
  const method = (req.query.method as string | undefined) || undefined;
  const status_filter = (req.query.status_filter as string | undefined) || undefined;
  const page = Math.max(1, parseInt((req.query.page as string) || "1", 10));
  const limit = Math.max(1, Math.min(200, parseInt((req.query.limit as string) || "50", 10)));

  const filter: any = {};
  if (date_from) filter.date = { $gte: date_from };
  if (date_to) { if (!filter.date) filter.date = {}; filter.date.$lte = date_to; }
  if (cashier) filter.cashier_id = cashier;
  if (method) filter.payment_method = method;
  if (status_filter) filter.status = status_filter;
  if (invoice) {
    const safe = invoice.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.invoice_no = { $regex: safe, $options: "i" };
  }

  const db = getDb();
  const sales = await db.collection<Sale>("sales")
    .find(filter, { projection: { _id: 0 } })
    .sort({ created_at: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();

  return res.json(sales);
});

/** GET /api/sales/:id */
router.get("/sales/:id", auth, async (req: AuthedRequest, res) => {
  const db = getDb();
  const sale = await db.collection<Sale>("sales")
    .findOne({ id: req.params.id }, { projection: { _id: 0 } });
  if (!sale) return res.status(404).json({ message: "Sale not found" });
  return res.json(sale);
});

export default router;
