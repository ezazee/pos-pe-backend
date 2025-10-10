import { Router } from "express";
import { getDb } from "../db/mongo";
import { auth, AuthedRequest } from "../middleware/auth";
import { allowRoles } from "../middleware/allowRoles";
import { seedAll } from "../seed/seed";

const router = Router();

/** POST /api/admin/purge
 * body: { confirm: "PURGE", reseed?: boolean }
 */
router.post(
  "/admin/purge",
  auth,
  allowRoles("admin"),
  async (req: AuthedRequest, res) => {
    const { confirm, reseed } = req.body || {};
    if (confirm !== "PURGE") {
      return res.status(400).json({ message: 'Ketik konfirmasi "PURGE"' });
    }

    const db = getDb();
    const colls = ["sales", "products", "users", "audits"]; // tambahkan koleksi lain bila ada
    for (const name of colls) {
      await db.collection(name).deleteMany({});
    }

    let seeded = false;
    if (reseed) {
      await seedAll(db);
      seeded = true;
    }

    return res.json({ ok: true, reseeded: seeded });
  }
);

export default router;
