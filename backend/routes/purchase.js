const express = require("express");
const { run, get, all } = require("../database");

const router = express.Router();


router.post("/purchase", async (req, res) => {
  try {
    const { productId, buyerId, quantity } = req.body;
    const qty = parseInt(quantity || 1, 10);

    if (!productId || !buyerId || qty < 1) {
      return res.status(400).json({ error: "Datos inválidos" });
    }

    const product = await get("SELECT * FROM products WHERE id = ?", [
      productId,
    ]);
    if (!product) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    if (product.stock < qty) {
      return res.status(400).json({ error: "Stock insuficiente" });
    }

    const buyer = await get("SELECT * FROM users WHERE id = ?", [buyerId]);
    if (!buyer) {
      return res.status(404).json({ error: "Comprador no encontrado" });
    }

    const price = parseInt(product.precio, 10);
    const total = price * qty;
    if (buyer.monedas < total) {
      return res.status(400).json({ error: "Monedas insuficientes" });
    }


    const newStock = product.stock - qty;
    if (newStock <= 0) {
      await run("UPDATE products SET stock = 0, is_active = 0 WHERE id = ?", [
        productId,
      ]);
    } else {
      await run("UPDATE products SET stock = ? WHERE id = ?", [
        newStock,
        productId,
      ]);
    }
    await run("UPDATE users SET monedas = monedas - ? WHERE id = ?", [
      total,
      buyerId,
    ]);


    await run(
      "UPDATE users SET monedas = monedas + ? - 1 WHERE id = ?",
      [total, product.seller_id]
    );
    await run("UPDATE admin SET total_comisiones = total_comisiones + 1 WHERE id = 1");

    await run(
      "INSERT INTO purchases (product_id, buyer_id, seller_id, quantity, total, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [productId, buyerId, product.seller_id, qty, total, new Date().toISOString()]
    );

    const buyerUpdated = await get(
      "SELECT id, nombre, curso, rol, contacto, monedas, card_code, is_admin FROM users WHERE id = ?",
      [buyerId]
    );

    res.json({ ok: true, buyer: buyerUpdated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en compra" });
  }
});


router.get("/purchases", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: "Falta userId" });
    }
    const rows = await all(
      `SELECT pr.id, pr.product_id, pr.buyer_id, pr.seller_id, pr.quantity, pr.total, pr.created_at,
              p.nombre as producto_nombre,
              ub.nombre as comprador_nombre,
              us.nombre as vendedor_nombre
       FROM purchases pr
       JOIN products p ON p.id = pr.product_id
       JOIN users ub ON ub.id = pr.buyer_id
       JOIN users us ON us.id = pr.seller_id
       WHERE pr.buyer_id = ? OR pr.seller_id = ?
       ORDER BY pr.created_at DESC
       LIMIT 50`,
      [userId, userId]
    );
    res.json({ purchases: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error listando compras" });
  }
});

module.exports = router;

