const path = require("path");
const sqlite3 = require("sqlite3").verbose();


const dbPath = path.join(__dirname, "mercado.db");
const db = new sqlite3.Database(dbPath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function columnExists(table, column) {
  const rows = await all(`PRAGMA table_info(${table})`);
  return rows.some((row) => row.name === column);
}

async function init() {

  await run(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      curso TEXT NOT NULL,
      rol TEXT NOT NULL,
      password TEXT NOT NULL,
      contacto TEXT NOT NULL,
      monedas INTEGER NOT NULL DEFAULT 50,
      card_code TEXT,
      is_admin INTEGER NOT NULL DEFAULT 0
    )`
  );


  const hasCardCode = await columnExists("users", "card_code");
  if (!hasCardCode) {
    await run("ALTER TABLE users ADD COLUMN card_code TEXT");
  }
  const hasIsAdmin = await columnExists("users", "is_admin");
  if (!hasIsAdmin) {
    await run("ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0");
  }


  await run(
    `CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seller_id INTEGER NOT NULL,
      nombre TEXT NOT NULL,
      descripcion TEXT NOT NULL,
      precio INTEGER NOT NULL,
      stock INTEGER NOT NULL,
      image_data TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      promoted_until TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (seller_id) REFERENCES users(id)
    )`
  );

  const hasImageData = await columnExists("products", "image_data");
  if (!hasImageData) {
    await run("ALTER TABLE products ADD COLUMN image_data TEXT");
  }
  const hasIsActive = await columnExists("products", "is_active");
  if (!hasIsActive) {
    await run("ALTER TABLE products ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1");
  }


  await run(
    `CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      buyer_id INTEGER NOT NULL,
      seller_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      total INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (buyer_id) REFERENCES users(id),
      FOREIGN KEY (seller_id) REFERENCES users(id)
    )`
  );


  await run(
    `CREATE TABLE IF NOT EXISTS credits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`
  );


  await run(
    `CREATE TABLE IF NOT EXISTS invite_codes (
      code TEXT PRIMARY KEY,
      used INTEGER NOT NULL DEFAULT 0,
      used_by INTEGER,
      used_at TEXT
    )`
  );


  const inviteCount = await get("SELECT COUNT(*) as total FROM invite_codes");
  if (!inviteCount || inviteCount.total === 0) {
    const codes = new Set();
    while (codes.size < 90) {
      const part = Math.random().toString(36).toUpperCase().slice(2, 8);
      codes.add(`MD-${part}`);
    }
    for (const code of codes) {
      await run("INSERT INTO invite_codes (code, used) VALUES (?, 0)", [code]);
    }
  }


  await run(
    `CREATE TABLE IF NOT EXISTS admin (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      total_comisiones INTEGER NOT NULL DEFAULT 0
    )`
  );


  const row = await get("SELECT id FROM admin WHERE id = 1");
  if (!row) {
    await run("INSERT INTO admin (id, total_comisiones) VALUES (1, 0)");
  }
}

module.exports = { db, run, get, all, init };

