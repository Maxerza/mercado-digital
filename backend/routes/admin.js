const express = require("express");
const { get, all, run } = require("../database");

const router = express.Router();

async function requireAdmin(req, res) {
  const adminId = req.body ? req.body.adminId : null;
  if (!adminId) {
    res.status(403).json({ error: "Falta adminId" });
    return null;
  }
  const user = await get(
    "SELECT id, is_admin FROM users WHERE id = ?",
    [adminId]
  );
  if (!user || user.is_admin !== 1) {
    res.status(403).json({ error: "No autorizado" });
    return null;
  }
  return user;
}


router.post("/admin/credit", async (req, res) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const { cardCode, amount, note } = req.body;
    const value = parseInt(amount, 10);
    const cleanCard = String(cardCode || "")
      .trim()
      .toUpperCase()
      .replace(/-/g, "");
    if (!cleanCard || Number.isNaN(value) || value < 1) {
      return res.status(400).json({ error: "Datos inválidos" });
    }

    const user = await get(
      "SELECT id, nombre, monedas FROM users WHERE REPLACE(card_code, '-', '') = ?",
      [cleanCard]
    );
    if (!user) {
      return res.status(404).json({ error: "Tarjeta no encontrada" });
    }

    await run("UPDATE users SET monedas = monedas + ? WHERE id = ?", [value, user.id]);
    await run(
      "INSERT INTO credits (user_id, amount, note, created_at) VALUES (?, ?, ?, ?)",
      [user.id, value, note || "Recarga semanal", new Date().toISOString()]
    );

    const updated = await get(
      "SELECT id, nombre, curso, rol, contacto, monedas, card_code FROM users WHERE id = ?",
      [user.id]
    );
    res.json({ user: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error cargando saldo" });
  }
});


router.get("/admin/commissions", async (req, res) => {
  try {
    const adminId = req.query ? req.query.adminId : null;
    const admin = await requireAdmin({ body: { adminId } }, res);
    if (!admin) return;
    const row = await get("SELECT total_comisiones FROM admin WHERE id = 1");
    res.json({ total: row ? row.total_comisiones : 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error leyendo comisiones" });
  }
});


router.get("/admin/promoted", async (req, res) => {
  try {
    const adminId = req.query ? req.query.adminId : null;
    const admin = await requireAdmin({ body: { adminId } }, res);
    if (!admin) return;
    const now = new Date().toISOString();
    const rows = await all(
      `SELECT p.*, u.nombre as vendedor_nombre
       FROM products p
       JOIN users u ON u.id = p.seller_id
       WHERE p.promoted_until IS NOT NULL AND p.promoted_until >= ? AND p.is_active = 1
       ORDER BY p.promoted_until DESC`,
      [now]
    );
    res.json({ products: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error listando promocionados" });
  }
});


router.get("/admin/stats", async (req, res) => {
  try {
    const adminId = req.query ? req.query.adminId : null;
    const admin = await requireAdmin({ body: { adminId } }, res);
    if (!admin) return;

    const usersRow = await get("SELECT COUNT(*) as total FROM users");
    const adminsRow = await get(
      "SELECT COUNT(*) as total FROM users WHERE is_admin = 1"
    );

    res.json({
      users: usersRow ? usersRow.total : 0,
      admins: adminsRow ? adminsRow.total : 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error leyendo estadísticas" });
  }
});


router.get("/admin/invites", async (req, res) => {
  try {
    const adminId = req.query ? req.query.adminId : null;
    const admin = await requireAdmin({ body: { adminId } }, res);
    if (!admin) return;

    const rows = await all(
      "SELECT code FROM invite_codes WHERE used = 0 ORDER BY code ASC"
    );
    res.json({ codes: rows.map((r) => r.code) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error listando códigos" });
  }
});


router.post("/admin/invites/add", async (req, res) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const { count } = req.body;
    const total = parseInt(count, 10);
    if (Number.isNaN(total) || total < 1 || total > 500) {
      return res.status(400).json({ error: "Cantidad inválida" });
    }

    const codes = new Set();
    while (codes.size < total) {
      const part = Math.random().toString(36).toUpperCase().slice(2, 8);
      codes.add(`MD-${part}`);
    }
    for (const code of codes) {
      await run("INSERT INTO invite_codes (code, used) VALUES (?, 0)", [code]);
    }

    res.json({ added: total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error agregando códigos" });
  }
});


router.get("/admin/credits", async (req, res) => {
  try {
    const adminId = req.query ? req.query.adminId : null;
    const admin = await requireAdmin({ body: { adminId } }, res);
    if (!admin) return;

    const rows = await all(
      `SELECT c.id, c.user_id, c.amount, c.note, c.created_at, u.nombre as usuario
       FROM credits c
       JOIN users u ON u.id = c.user_id
       ORDER BY c.created_at DESC
       LIMIT 100`
    );
    res.json({ credits: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error leyendo recargas" });
  }
});


router.delete("/admin/credits/:id", async (req, res) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const { id } = req.params;
    await run("DELETE FROM credits WHERE id = ?", [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error eliminando recarga" });
  }
});


router.post("/admin/reset", async (req, res) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    await run("DELETE FROM purchases");
    await run("DELETE FROM credits");
    await run("DELETE FROM products");
    await run("DELETE FROM users");
    await run("UPDATE admin SET total_comisiones = 0 WHERE id = 1");

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error reiniciando" });
  }
});

module.exports = router;

