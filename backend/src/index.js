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

const toStr = (v) => (v === undefined || v === null ? "" : String(v));
const toDateStr = (v, fallbackDate) => {
  const d = v ? new Date(v) : fallbackDate;
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

/* =======================================================================
   API Check-in
   ======================================================================= */
app.post(
  "/api/checkin",
  upload.fields([{ name: "anverso" }, { name: "reverso" }, { name: "firma" }]),
  async (req, res) => {
    try {
      const parsed = JSON.parse(req.body.data || "{}");
      const { huespedes = [], fechaIngreso, fechaSalida } = parsed;

      if (!Array.isArray(huespedes) || !huespedes.length) {
        return res
          .status(400)
          .json({ ok: false, error: "No llegaron huéspedes" });
      }

      const titular = huespedes[0];
      const numeroReserva = generarNumeroReserva();

      const fIng = toDateStr(
        titular?.fechaIngreso ?? fechaIngreso,
        new Date()
      );
      const fSal = toDateStr(
        titular?.fechaSalida ?? fechaSalida,
        new Date()
      );

      const payload = {
        nombre: toStr(titular?.nombre),
        tipoDocumento: toStr(titular?.tipoDocumento),
        numeroDocumento: toStr(titular?.numeroDocumento),
        nacionalidad: toStr(titular?.nacionalidad),
        direccion: toStr(titular?.direccion),
        lugarProcedencia: toStr(titular?.lugarProcedencia),
        lugarDestino: toStr(titular?.lugarDestino),
        telefono: toStr(titular?.telefono),
        email: toStr(titular?.email),
        motivoViaje: toStr(titular?.motivoViaje),
        fechaIngreso: fIng,
        fechaSalida: fSal,
        numeroReserva,
        creadoEn: new Date(),
      };

      await prisma.huesped.create({ data: payload });

      res.json({ ok: true, numeroReserva, total: 1 });
    } catch (e) {
      console.error("error /api/checkin:", e);
      res
        .status(500)
        .json({ ok: false, error: "Error al registrar el check-in" });
    }
  }
);

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
      return res
        .status(400)
        .json({ ok: false, error: "No llegaron huéspedes" });
    }

    const titular = guests[0];
    const numeroReserva = generarNumeroReserva();

    const fIng = toDateStr(titular?.fechaIngreso, new Date());
    const fSal = toDateStr(titular?.fechaSalida, new Date());

    const payload = {
      nombre: toStr(titular?.nombre),
      tipoDocumento: toStr(titular?.tipoDocumento),
      numeroDocumento: toStr(titular?.numeroDocumento),
      nacionalidad: toStr(titular?.nacionalidad),
      direccion: toStr(titular?.direccion),
      lugarProcedencia: toStr(titular?.lugarProcedencia),
      lugarDestino: toStr(titular?.lugarDestino),
      telefono: toStr(titular?.telefono),
      email: toStr(titular?.email),
      motivoViaje: toStr(titular?.motivoViaje),
      fechaIngreso: fIng,
      fechaSalida: fSal,
      numeroReserva,
      creadoEn: new Date(),
    };

    await prisma.huesped.create({ data: payload });
    res.json({ ok: true, numeroReserva, total: 1 });
  } catch (e) {
    console.error("error guardar-multiple:", e);
    res
      .status(500)
      .json({ ok: false, error: "Error al guardar huéspedes" });
  }
});

app.post("/api/checkin/buscar", async (req, res) => {
  const { codigoReserva, tipoDocumento, numeroDocumento } = req.body;

  try {
    let huesped;

    if (codigoReserva) {
      huesped = await prisma.huesped.findUnique({
        where: { numeroReserva: codigoReserva },
      });
    } else if (tipoDocumento && numeroDocumento) {
      huesped = await prisma.huesped.findFirst({
        where: { tipoDocumento, numeroDocumento },
      });
    } else {
      return res
        .status(400)
        .json({ ok: false, error: "Parámetros insuficientes" });
    }

    if (!huesped)
      return res
        .status(404)
        .json({ ok: false, error: "Reserva no encontrada" });

    res.json(huesped);
  } catch (error) {
    console.error("error /api/checkin/buscar:", error);
    res.status(500).json({ ok: false, error: "Error al buscar reserva" });
  }
});

/* ===================================================================
   NUEVA API: huéspedes registrados HOY
   =================================================================== */
app.get("/api/checkin/hoy", async (_req, res) => {
  try {
    const inicio = new Date();
    inicio.setHours(0, 0, 0, 0);

    const fin = new Date();
    fin.setHours(23, 59, 59, 999);

    const lista = await prisma.huesped.findMany({
      where: {
        creadoEn: {
          gte: inicio,
          lte: fin,
        },
      },
      orderBy: { creadoEn: "desc" },
    });

    return res.json({
      ok: true,
      total: lista.length,
      huespedes: lista, // IMPORTANTE: propiedad se llama "huespedes"
    });
  } catch (err) {
    console.error("error /api/checkin/hoy:", err);
    return res.status(500).json({ ok: false, error: "Error interno" });
  }
});

/* ===================================================================
   Búsqueda combinada Teléfono/Email → BD → NoBeds
   =================================================================== */
app.get("/api/checkin/buscar-combinado/:valor", async (req, res) => {
  try {
    const { valor } = req.params;

    if (!valor) {
      return res.status(400).json({ ok: false, error: "Falta valor" });
    }

    // Buscar en base de datos local
    let huesped = await prisma.huesped.findFirst({
      where: {
        OR: [{ telefono: valor }, { email: valor }],
      },
    });

    if (huesped) {
      return res.json({
        ok: true,
        origen: "local",
        data: huesped,
      });
    }

    const url = `${process.env.NOBEDS_API}/${process.env.NOBEDS_TOKEN}`;
    const { data } = await axios.get(url, { timeout: 20000 });

    if (Array.isArray(data)) {
      const match = data.find(
        (r) =>
          (r.email && r.email.toLowerCase() === valor.toLowerCase()) ||
          (r.phone && String(r.phone).trim() === valor.trim())
      );

      if (match) {
        return res.json({
          ok: true,
          origen: "nobeds",
          data: match,
        });
      }
    }

    return res.status(404).json({
      ok: false,
      error: "No encontrado",
    });
  } catch (error) {
    console.error("buscar-combinado error:", error);
    return res.status(500).json({
      ok: false,
      error: "Error interno del servidor",
    });
  }
});

/* =======================================================================
   Integración NoBeds
   ======================================================================= */
const NOBEDS_API =
  process.env.NOBEDS_API || "https://api.nobeds.com/api/Bookings";
const NOBEDS_TOKEN = process.env.NOBEDS_TOKEN || "";

app.get("/api/nobeds/reserva/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId)
      return res.status(400).json({ ok: false, error: "Falta orderId" });

    const url = `${NOBEDS_API}/${NOBEDS_TOKEN}?order_id=${orderId}`;
    console.log("Consultando NoBeds:", url);

    const { data } = await axios.get(url, { timeout: 20000 });

    if (!data || !Array.isArray(data) || !data.length) {
      return res
        .status(404)
        .json({ ok: false, error: "Reserva no encontrada" });
    }

    res.json({ ok: true, reserva: data[0] });
  } catch (err) {
    console.error("error /api/nobeds/reserva:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/api/nobeds/reservas", async (_req, res) => {
  try {
    const url = `${NOBEDS_API}/${NOBEDS_TOKEN}`;
    const { data } = await axios.get(url, { timeout: 20000 });
    res.json({ ok: true, reservas: data });
  } catch (err) {
    console.error("error /api/nobeds/reservas:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* =======================================================================
   MCP y TTLock
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
  _tt_expiresAt = Date.now() + parseInt(data.expires_in || "7200", 10) * 1000;
  return _tt_token;
}

async function ttPost(pathUrl, formBody) {
  const { data } = await axios.post(
    `${TTLOCK_BASE}${pathUrl}`,
    new URLSearchParams(formBody),
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 20000,
    }
  );
  return data;
}

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
  const mask = (s) => (s ? s.slice(0, 4) + "****" + s.slice(-4) : "(vacio)");
  res.json({
    PORT: process.env.PORT || 4000,
    TTLOCK_BASE: TTLOCK_BASE,
    TTLOCK_CLIENT_ID: process.env.TTLOCK_CLIENT_ID || "(vacio)",
    TTLOCK_CLIENT_SECRET: mask(process.env.TTLOCK_CLIENT_SECRET || ""),
    TTLOCK_USERNAME: process.env.TTLOCK_USERNAME || "(vacio)",
    TTLOCK_PASSWORD: "(oculto)",
  });
});

app.get("/health", (_req, res) => res.json({ ok: true }));

/* ================ Start ================ */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`Backend corriendo en http://18.206.179.50:${PORT}`)
);
