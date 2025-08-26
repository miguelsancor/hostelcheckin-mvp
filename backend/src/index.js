// backend/src/index.js
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const axios = require("axios");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

/* ================== uploads ================== */
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const upload = multer({ dest: uploadsDir });

/* ================== utils ================== */
const nowMs = () => Date.now();

function generarNumeroReserva() {
  const timestamp = Date.now().toString().slice(-8);
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${timestamp}-RES-${random}`;
}

// Lee campos tipo huespedes[0][nombre] + archivos
function parseGuestsFromFormData(body, files = []) {
  const guests = [];
  const re = /^huespedes\[(\d+)\]\[(.+)\]$/;

  for (const [k, v] of Object.entries(body)) {
    const m = re.exec(k);
    if (!m) continue;
    const idx = Number(m[1]);
    const key = m[2];
    if (!guests[idx]) guests[idx] = {};
    guests[idx][key] = v;
  }
  for (const file of files) {
    const m = re.exec(file.fieldname);
    if (!m) continue;
    const idx = Number(m[1]);
    const key = m[2];
    if (!guests[idx]) guests[idx] = {};
    guests[idx][key] = {
      path: file.path,
      mimetype: file.mimetype,
      originalname: file.originalname,
      size: file.size,
    };
  }
  return guests.filter(Boolean);
}

// Helpers para tu modelo (fechas String y 1 fila por reserva @unique)
const toStr = (v) => (v === undefined || v === null ? "" : String(v));
const toDateStr = (v, fallbackDate) => {
  const d = v ? new Date(v) : fallbackDate;
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
};

/* =======================================================================
   API Check-in — compatible con tu schema:
   - Guarda SOLO el PRIMER huésped (titular) por `numeroReserva @unique`
   - Guarda `fechaIngreso` y `fechaSalida` como String "YYYY-MM-DD"
   ======================================================================= */

// Versión clásica JSON+archivos
app.post(
  "/api/checkin",
  upload.fields([{ name: "anverso" }, { name: "reverso" }, { name: "firma" }]),
  async (req, res) => {
    try {
      const parsed = JSON.parse(req.body.data || "{}");
      const { huespedes = [], fechaIngreso, fechaSalida } = parsed;

      if (!Array.isArray(huespedes) || !huespedes.length) {
        return res.status(400).json({ ok: false, error: "No llegaron huéspedes" });
      }

      const titular = huespedes[0]; // ← SOLO 1 fila por reserva
      const numeroReserva = generarNumeroReserva();

      const fIng = toDateStr(titular?.fechaIngreso ?? fechaIngreso, new Date());
      const fSal = toDateStr(titular?.fechaSalida ?? fechaSalida, new Date());

      const payload = {
        nombre:           toStr(titular?.nombre),
        tipoDocumento:    toStr(titular?.tipoDocumento),
        numeroDocumento:  toStr(titular?.numeroDocumento),
        nacionalidad:     toStr(titular?.nacionalidad),
        direccion:        toStr(titular?.direccion),
        lugarProcedencia: toStr(titular?.lugarProcedencia),
        lugarDestino:     toStr(titular?.lugarDestino),
        telefono:         toStr(titular?.telefono),
        email:            toStr(titular?.email),
        motivoViaje:      toStr(titular?.motivoViaje),
        fechaIngreso:     fIng, // String
        fechaSalida:      fSal, // String
        numeroReserva,          // @unique
        creadoEn:         new Date(),
      };

      await prisma.huesped.create({ data: payload });

      res.json({
        ok: true,
        numeroReserva,
        total: 1,
        note: "Con el schema actual (numeroReserva @unique) se guardó solo el titular.",
      });
    } catch (e) {
      console.error("❌ /api/checkin error:", e);
      if (e.code === "P2002") {
        return res.status(409).json({ ok: false, error: "numeroReserva duplicado (único)" });
      }
      res.status(500).json({ ok: false, error: e?.message || "Error al registrar el check-in" });
    }
  }
);

// FormData con corchetes + respaldo JSON en "data"
app.post("/api/checkin/guardar-multiple", upload.any(), async (req, res) => {
  try {
    let guests = parseGuestsFromFormData(req.body, req.files);
    if (!guests.length && req.body?.data) {
      try {
        const parsed = JSON.parse(req.body.data);
        if (parsed && Array.isArray(parsed.huespedes)) guests = parsed.huespedes;
      } catch {}
    }
    if (!guests.length) {
      return res.status(400).json({ ok: false, error: "No llegaron huéspedes" });
    }

    const titular = guests[0]; // ← SOLO 1 fila por reserva
    const numeroReserva = generarNumeroReserva();

    const fIng = toDateStr(titular?.fechaIngreso, new Date());
    const fSal = toDateStr(titular?.fechaSalida, new Date());

    const payload = {
      nombre:           toStr(titular?.nombre),
      tipoDocumento:    toStr(titular?.tipoDocumento),
      numeroDocumento:  toStr(titular?.numeroDocumento),
      nacionalidad:     toStr(titular?.nacionalidad),
      direccion:        toStr(titular?.direccion),
      lugarProcedencia: toStr(titular?.lugarProcedencia),
      lugarDestino:     toStr(titular?.lugarDestino),
      telefono:         toStr(titular?.telefono),
      email:            toStr(titular?.email),
      motivoViaje:      toStr(titular?.motivoViaje),
      fechaIngreso:     fIng, // String
      fechaSalida:      fSal, // String
      numeroReserva,          // @unique
      creadoEn:         new Date(),
    };

    await prisma.huesped.create({ data: payload });

    res.json({
      ok: true,
      numeroReserva,
      total: 1,
      note: "Con el schema actual (numeroReserva @unique) se guardó solo el titular.",
    });
  } catch (e) {
    console.error("❌ guardar-multiple error:", e);
    if (e.code === "P2002") {
      return res.status(409).json({ ok: false, error: "numeroReserva duplicado (único)" });
    }
    res.status(500).json({ ok: false, error: e?.message || "Error al guardar huéspedes" });
  }
});

// Buscar por número de reserva (devuelve 1 fila — el titular)
app.post("/api/checkin/buscar", async (req, res) => {
  const { codigoReserva } = req.body;
  try {
    const huesped = await prisma.huesped.findUnique({
      where: { numeroReserva: codigoReserva },
    });
    if (!huesped) return res.status(404).json({ ok: false, error: "Reserva no encontrada" });
    res.json(huesped);
  } catch (error) {
    console.error("❌ /api/checkin/buscar error:", error);
    res.status(500).json({ ok: false, error: "Error al buscar reserva" });
  }
});

/* =======================================================================
   MCP ↔ TTLock
   ======================================================================= */
const TTLOCK_BASE = process.env.TTLOCK_BASE || "https://api.ttlock.com";
let _tt_token = null;
let _tt_expiresAt = 0;

async function getAccessToken() {
  const needs = !_tt_token || Date.now() > _tt_expiresAt - 30000;
  if (!needs) return _tt_token;

  const md5Pass = crypto
    .createHash("md5")
    .update(process.env.TTLOCK_PASSWORD || "")
    .digest("hex");

  const form = new URLSearchParams({
    clientId: process.env.TTLOCK_CLIENT_ID || "",
    clientSecret: process.env.TTLOCK_CLIENT_SECRET || "",
    username: process.env.TTLOCK_USERNAME || "",
    password: md5Pass,
    date: String(nowMs()),
  });

  const { data } = await axios.post(`${TTLOCK_BASE}/oauth2/token`, form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    timeout: 20000,
  });

  if (!data?.access_token) throw new Error("No access_token from TTLock");
  _tt_token = data.access_token;
  _tt_expiresAt = Date.now() + (parseInt(data.expires_in || "7200", 10) * 1000);
  return _tt_token;
}

async function ttPost(pathUrl, formBody) {
  const { data } = await axios.post(
    `${TTLOCK_BASE}${pathUrl}`,
    new URLSearchParams(formBody),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" }, timeout: 20000 }
  );
  return data;
}

// Enviar eKey
app.post("/mcp/create-key", async (req, res) => {
  try {
    const { lockId, receiverUsername, endAt, startAt, keyName, remarks, correlationId } = req.body || {};
    if (!lockId || !receiverUsername || !endAt) {
      return res.status(400).json({ ok: false, error: "lockId, receiverUsername y endAt son requeridos" });
    }
    const accessToken = await getAccessToken();
    const r = await ttPost("/v3/key/send", {
      clientId: process.env.TTLOCK_CLIENT_ID,
      accessToken,
      lockId,
      receiverUsername,
      keyName: keyName || "GuestKey",
      remarks: remarks || "",
      startDate: startAt || nowMs(),
      endDate: endAt,
      date: nowMs(),
    });
    if (parseInt(r.errcode ?? -1, 10) !== 0) return res.status(400).json({ ok: false, error: r });
    res.json({ ok: true, provider: "ttlock", correlationId, result: r });
  } catch (e) {
    console.error("mcp/create-key error:", e?.response?.data || e.message);
    res.status(500).json({ ok: false, error: e?.response?.data || e.message });
  }
});

// Apertura remota
app.post("/mcp/open-lock", async (req, res) => {
  try {
    const { lockId, correlationId } = req.body || {};
    if (!lockId) return res.status(400).json({ ok: false, error: "lockId requerido" });

    const accessToken = await getAccessToken();
    const r = await ttPost("/v3/lock/remoteUnlock", {
      clientId: process.env.TTLOCK_CLIENT_ID,
      accessToken,
      lockId,
      date: nowMs(),
    });
    if (parseInt(r.errcode ?? -1, 10) !== 0) return res.status(400).json({ ok: false, error: r });
    res.json({ ok: true, provider: "ttlock", correlationId, result: r });
  } catch (e) {
    console.error("mcp/open-lock error:", e?.response?.data || e.message);
    res.status(500).json({ ok: false, error: e?.response?.data || e.message });
  }
});

// Revocar eKey
app.post("/mcp/revoke-key", async (req, res) => {
  try {
    const { keyId, remarks, correlationId } = req.body || {};
    if (!keyId) return res.status(400).json({ ok: false, error: "keyId requerido" });

    const accessToken = await getAccessToken();
    const r = await ttPost("/v3/key/delete", {
      clientId: process.env.TTLOCK_CLIENT_ID,
      accessToken,
      keyId,
      remarks: remarks || "",
      date: nowMs(),
    });
    if (parseInt(r.errcode ?? -1, 10) !== 0) return res.status(400).json({ ok: false, error: r });
    res.json({ ok: true, provider: "ttlock", correlationId, result: r });
  } catch (e) {
    console.error("mcp/revoke-key error:", e?.response?.data || e.message);
    res.status(500).json({ ok: false, error: e?.response?.data || e.message });
  }
});

// Listados útiles
app.get("/mcp/locks", async (_req, res) => {
  try {
    const accessToken = await getAccessToken();
    const r = await ttPost("/v3/lock/list", {
      clientId: process.env.TTLOCK_CLIENT_ID,
      accessToken,
      pageNo: 1,
      pageSize: 100,
      date: nowMs(),
    });
    res.json(r);
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.response?.data || e.message });
  }
});

app.get("/mcp/keys", async (_req, res) => {
  try {
    const accessToken = await getAccessToken();
    const r = await ttPost("/v3/key/list", {
      clientId: process.env.TTLOCK_CLIENT_ID,
      accessToken,
      pageNo: 1,
      pageSize: 100,
      date: nowMs(),
    });
    res.json(r);
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.response?.data || e.message });
  }
});

/* ================== Debug & Health ================== */
app.get("/mcp/debug/env", (_req, res) => {
  const mask = (s) => (s ? s.slice(0, 4) + "****" + s.slice(-4) : "(vacío)");
  res.json({
    PORT: process.env.PORT || 4000,
    TTLOCK_BASE: TTLOCK_BASE,
    TTLOCK_CLIENT_ID: process.env.TTLOCK_CLIENT_ID || "(vacío)",
    TTLOCK_CLIENT_SECRET: mask(process.env.TTLOCK_CLIENT_SECRET || ""),
    TTLOCK_USERNAME: process.env.TTLOCK_USERNAME || "(vacío)",
    TTLOCK_PASSWORD: "(oculto)",
  });
});

app.get("/mcp/debug/token-raw", async (_req, res) => {
  try {
    const md5Pass = crypto.createHash("md5").update(process.env.TTLOCK_PASSWORD || "").digest("hex");
    const form = new URLSearchParams({
      clientId: process.env.TTLOCK_CLIENT_ID,
      clientSecret: process.env.TTLOCK_CLIENT_SECRET,
      username: process.env.TTLOCK_USERNAME,
      password: md5Pass,
      date: String(Date.now()),
    });
    const { data } = await axios.post(`${TTLOCK_BASE}/oauth2/token`, form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 20000,
    });
    res.json({ raw: data });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.response?.data || e.message });
  }
});

app.get("/health", (_req, res) => res.json({ ok: true }));

/* ================ Start ================ */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`✅ Backend corriendo en http://localhost:${PORT}`)
);
