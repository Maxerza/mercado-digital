const express = require("express");
const { run, get } = require("../database");

const router = express.Router();


const cursosPermitidos = ["10-1", "10-2", "10-3", "11-1", "11-2"];
const rolesPermitidos = ["Comprador", "Vendedor", "Ambos"];


const ADMIN_REGISTER_CODE = "PekasiolPeluco";
const TEMP_INVITE_CODE = "INICIO-2026";

function randomCodePart() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 4; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

async function generateCardCode(curso) {
  const cursoClean = String(curso || "").replace(/-/g, "");
  let code = "";
  let tries = 0;
  while (tries < 5) {
    code = `MD${cursoClean}${randomCodePart()}`;
    const exists = await get("SELECT id FROM users WHERE card_code = ?", [code]);
    if (!exists) return code;
    tries += 1;
  }
  return `MD${cursoClean}${Date.now().toString().slice(-4)}`;
}


router.post("/register", async (req, res) => {
  try {
    const { nombre, curso, rol, password, contacto, verifyCode, adminCode } =
      req.body;

    if (!nombre || !curso || !rol || !password || !contacto) {
      return res.status(400).json({ error: "Faltan campos" });
    }

    if (nombre.trim().length < 10) {
      return res
        .status(400)
        .json({ error: "El nombre debe tener al menos 10 caracteres" });
    }

    if (!cursosPermitidos.includes(curso)) {
      return res.status(400).json({ error: "Curso no permitido" });
    }

    if (!rolesPermitidos.includes(rol)) {
      return res.status(400).json({ error: "Rol no permitido" });
    }

    const existente = await get("SELECT id FROM users WHERE nombre = ?", [
      nombre,
    ]);
    if (existente) {
      return res.status(400).json({ error: "Nombre ya registrado" });
    }

    const codeClean = String(verifyCode || "").trim().toUpperCase();
    if (codeClean === TEMP_INVITE_CODE) {
      const cardCode = await generateCardCode(curso);
      const isAdmin = adminCode === ADMIN_REGISTER_CODE ? 1 : 0;

      const result = await run(
        "INSERT INTO users (nombre, curso, rol, password, contacto, monedas, card_code, is_admin) VALUES (?, ?, ?, ?, ?, 50, ?, ?)",
        [nombre.trim(), curso, rol, password, contacto.trim(), cardCode, isAdmin]
      );

      const user = await get(
        "SELECT id, nombre, curso, rol, contacto, monedas, card_code, is_admin FROM users WHERE id = ?",
        [result.id]
      );

      return res.json({ user });
    }
    const invite = await get(
      "SELECT code, used FROM invite_codes WHERE code = ?",
      [codeClean]
    );
    if (!invite || invite.used === 1) {
      return res.status(400).json({ error: "Código de verificación inválido" });
    }

    const cardCode = await generateCardCode(curso);
    const isAdmin = adminCode === ADMIN_REGISTER_CODE ? 1 : 0;

    const result = await run(
      "INSERT INTO users (nombre, curso, rol, password, contacto, monedas, card_code, is_admin) VALUES (?, ?, ?, ?, ?, 50, ?, ?)",
      [nombre.trim(), curso, rol, password, contacto.trim(), cardCode, isAdmin]
    );

    await run(
      "UPDATE invite_codes SET used = 1, used_by = ?, used_at = ? WHERE code = ?",
      [result.id, new Date().toISOString(), codeClean]
    );

    const user = await get(
      "SELECT id, nombre, curso, rol, contacto, monedas, card_code, is_admin FROM users WHERE id = ?",
      [result.id]
    );

    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en registro" });
  }
});


router.post("/login", async (req, res) => {
  try {
    const { nombre, password } = req.body;
    if (!nombre || !password) {
      return res.status(400).json({ error: "Faltan campos" });
    }

    const user = await get(
      "SELECT id, nombre, curso, rol, contacto, monedas, card_code, is_admin FROM users WHERE nombre = ? AND password = ?",
      [nombre, password]
    );

    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en login" });
  }
});


router.get("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await get(
      "SELECT id, nombre, curso, rol, contacto, monedas, card_code, is_admin FROM users WHERE id = ?",
      [id]
    );
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo usuario" });
  }
});

module.exports = router;

