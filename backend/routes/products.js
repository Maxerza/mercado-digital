const express = require("express");
const { run, get, all } = require("../database");

const router = express.Router();


function ahoraISO() {
  return new Date().toISOString();
}


router.get("/products", async (req, res) => {
  try {
    const rows = await all(
      `SELECT p.*, u.nombre as vendedor_nombre, u.contacto as vendedor_contacto, u.curso as vendedor_curso
       FROM products p
       JOIN users u ON u.id = p.seller_id
       WHERE p.is_active = 1
       ORDER BY p.created_at DESC`
    );
    res.json({ products: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error listando productos" });
  }
});


router.get("/products/popular", async (req, res) => {
  try {
    const now = ahoraISO();
    const rows = await all(
      `SELECT p.*, u.nombre as vendedor_nombre, u.contacto as vendedor_contacto, u.curso as vendedor_curso
       FROM products p
       JOIN users u ON u.id = p.seller_id
       WHERE p.promoted_until IS NOT NULL AND p.promoted_until >= ? AND p.is_active = 1
       ORDER BY p.promoted_until DESC`,
      [now]
    );
    res.json({ products: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error listando populares" });
  }
});


router.post("/products", async (req, res) => {
  try {
    const { sellerId, nombre, descripcion, precio, stock, imageData } = req.body;
    if (!sellerId || !nombre || !descripcion || !precio || stock === undefined) {
      return res.status(400).json({ error: "Faltan campos" });
    }

    const vendedor = await get("SELECT id, rol FROM users WHERE id = ?", [
      sellerId,
    ]);
    if (!vendedor) {
      return res.status(404).json({ error: "Vendedor no encontrado" });
    }

    if (vendedor.rol !== "Vendedor" && vendedor.rol !== "Ambos") {
      return res.status(403).json({ error: "El usuario no puede vender" });
    }

    const price = parseInt(precio, 10);
    const stockValue = parseInt(stock, 10);

    if (Number.isNaN(price) || Number.isNaN(stockValue)) {
      return res.status(400).json({ error: "Precio o stock inválido" });
    }

    if (price < 1 || stockValue < 0) {
      return res.status(400).json({ error: "Precio o stock inválido" });
    }

    const result = await run(
      "INSERT INTO products (seller_id, nombre, descripcion, precio, stock, image_data, is_active, promoted_until, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, NULL, ?)",
      [sellerId, nombre, descripcion, price, stockValue, imageData || null, ahoraISO()]
    );

    const product = await get("SELECT * FROM products WHERE id = ?", [
      result.id,
    ]);

    res.json({ product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creando producto" });
  }
});


router.put("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { sellerId, nombre, descripcion, precio, stock, imageData } = req.body;

    if (!sellerId || !nombre || !descripcion || !precio || stock === undefined) {
      return res.status(400).json({ error: "Faltan campos" });
    }

    const product = await get("SELECT * FROM products WHERE id = ?", [id]);
    if (!product) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    if (product.seller_id !== sellerId) {
      return res.status(403).json({ error: "No autorizado" });
    }

    const price = parseInt(precio, 10);
    const stockValue = parseInt(stock, 10);
    if (Number.isNaN(price) || Number.isNaN(stockValue)) {
      return res.status(400).json({ error: "Precio o stock inválido" });
    }
    await run(
      "UPDATE products SET nombre = ?, descripcion = ?, precio = ?, stock = ?, image_data = ?, is_active = 1 WHERE id = ?",
      [nombre, descripcion, price, stockValue, imageData || null, id]
    );

    const actualizado = await get("SELECT * FROM products WHERE id = ?", [
      id,
    ]);
    res.json({ product: actualizado });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error actualizando producto" });
  }
});


router.delete("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { sellerId } = req.body;

    if (!sellerId) {
      return res.status(400).json({ error: "Falta sellerId" });
    }

    const product = await get("SELECT * FROM products WHERE id = ?", [id]);
    if (!product) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    if (product.seller_id !== sellerId) {
      return res.status(403).json({ error: "No autorizado" });
    }

    await run("DELETE FROM products WHERE id = ?", [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error eliminando producto" });
  }
});


router.post("/products/:id/promote", async (req, res) => {
  try {
    const { id } = req.params;
    const { sellerId } = req.body;

    const product = await get("SELECT * FROM products WHERE id = ?", [id]);
    if (!product) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    if (product.seller_id !== sellerId) {
      return res.status(403).json({ error: "No autorizado" });
    }

    const seller = await get("SELECT monedas FROM users WHERE id = ?", [
      sellerId,
    ]);
    if (!seller || seller.monedas < 10) {
      return res.status(400).json({ error: "Monedas insuficientes" });
    }

    const fecha = new Date();
    fecha.setDate(fecha.getDate() + 7);
    const promotedUntil = fecha.toISOString();

    await run("UPDATE users SET monedas = monedas - 10 WHERE id = ?", [
      sellerId,
    ]);
    await run("UPDATE products SET promoted_until = ? WHERE id = ?", [
      promotedUntil,
      id,
    ]);

    const updated = await get("SELECT * FROM products WHERE id = ?", [id]);
    const sellerUpdated = await get(
      "SELECT id, nombre, curso, rol, contacto, monedas, card_code, is_admin FROM users WHERE id = ?",
      [sellerId]
    );
    res.json({ product: updated, seller: sellerUpdated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error promocionando" });
  }
});

module.exports = router;

