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
   API Check-in (simple)
   ======================================================================= */
   app.post(
    "/api/checkin",
    upload.fields([{ name: "anverso" }, { name: "reverso" }, { name: "firma" }]),
    async (req, res) => {
      try {
        const parsed = JSON.parse(req.body.data || "{}");
  
        // 👉 AÑADIMOS motivoDetallado y motivoViaje global
        const {
          huespedes = [],
          fechaIngreso,
          fechaSalida,
          codigoTTLock,
          motivoDetallado,
          motivoViaje: motivoViajeGlobal,
        } = parsed;
  
        if (!Array.isArray(huespedes) || !huespedes.length) {
          return res
            .status(400)
            .json({ ok: false, error: "No llegaron huéspedes" });
        }
  
        const titular = huespedes[0];
  
        // ✅ GENERAR NUMERO DE RESERVA
        const numeroReserva = generarNumeroReserva();
  
        // ✅ URL de checkin
        const checkinUrl = `http://localhost:5173/checkin?reserva=${numeroReserva}`;
  
        const fIng = toDateStr(
          titular?.fechaIngreso ?? fechaIngreso,
          new Date()
        );
        const fSal = toDateStr(
          titular?.fechaSalida ?? fechaSalida,
          new Date()
        );
  
        // 🔥 MOTIVO FINAL: tomamos de varios posibles nombres
        const motivoFinal = toStr(
          (titular &&
            (titular.motivoViaje ||
              titular.motivoDetallado ||
              titular.motivo)) ||
            motivoViajeGlobal ||
            motivoDetallado
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
  
          // ✅ AHORA SE GUARDA SIEMPRE
          motivoViaje: motivoFinal,
  
          fechaIngreso: fIng,
          fechaSalida: fSal,
  
          numeroReserva,
          checkinUrl,
          creadoEn: new Date(),
          codigoTTLock: toStr(codigoTTLock),
        };
  
        await prisma.huesped.create({ data: payload });
  
        return res.json({
          ok: true,
          numeroReserva,
          checkinUrl,
          total: 1,
        });
      } catch (e) {
        console.error("ERROR /api/checkin:", e);
        res
          .status(500)
          .json({ ok: false, error: "Error al registrar el check-in" });
      }
    }
  );
  
  
/* =======================================================================
   API Check-in múltiple
   ======================================================================= */
   app.post("/api/checkin/guardar-multiple", upload.any(), async (req, res) => {
    try {
      let guests = parseGuestsFromFormData(req.body, req.files);
      const parsedData = req.body?.data ? JSON.parse(req.body.data) : {};
  
      if (!guests.length && parsedData.huespedes) {
        guests = parsedData.huespedes;
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
  
      // 🔥 MOTIVO FINAL: igual que arriba, pero usando parsedData
      const motivoFinal = toStr(
        (titular &&
          (titular.motivoViaje ||
            titular.motivoDetallado ||
            titular.motivo)) ||
          parsedData.motivoViaje ||
          parsedData.motivoDetallado
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
  
        // ✅ ahora sí va a Prisma
        motivoViaje: motivoFinal,
  
        fechaIngreso: fIng,
        fechaSalida: fSal,
        numeroReserva,
        creadoEn: new Date(),
  
        checkinUrl: toStr(parsedData.checkinUrl),
        codigoTTLock: toStr(parsedData.codigoTTLock),
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
  

/* =======================================================================
   Buscar reserva
   ======================================================================= */
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
      return res.status(400).json({ ok: false, error: "Parámetros insuficientes" });
    }

    if (!huesped) {
      return res.status(404).json({ ok: false, error: "Reserva no encontrada" });
    }

    res.json(huesped);
  } catch (error) {
    console.error("error /api/checkin/buscar:", error);
    res.status(500).json({ ok: false, error: "Error al buscar reserva" });
  }
});

/* =======================================================================
   Huéspedes de HOY
   ======================================================================= */
app.get("/api/checkin/hoy", async (_req, res) => {
  try {
    const inicio = new Date();
    inicio.setHours(0, 0, 0, 0);

    const fin = new Date();
    fin.setHours(23, 59, 59, 999);

    const lista = await prisma.huesped.findMany({
      where: {
        creadoEn: { gte: inicio, lte: fin },
      },
      orderBy: { creadoEn: "desc" },
    });

    return res.json({ ok: true, total: lista.length, huespedes: lista });
  } catch (err) {
    console.error("error /api/checkin/hoy:", err);
    return res.status(500).json({ ok: false, error: "Error interno" });
  }
});

/* =======================================================================
   CONTACTOS (autocomplete)
   ======================================================================= */
app.get("/api/checkin/contactos", async (req, res) => {
  try {
    let { query } = req.query;
    if (!query) return res.json([]);

    query = String(query).trim().toLowerCase();

    const rawSqlite = await prisma.huesped.findMany({
      where: {
        OR: [
          { telefono: { contains: query } },
          { email: { contains: query } },
        ],
      },
      select: {
        id: true,
        nombre: true,
        telefono: true,
        email: true,
        numeroReserva: true,
      },
      take: 20,
    });

    const sqliteResults = rawSqlite.map((r) => ({
      origen: "sqlite",
      id: r.id,
      nombre: r.nombre,
      telefono: r.telefono,
      email: r.email,
      numeroReserva: r.numeroReserva,
    }));

    let nobeds = [];
    try {
      const url = `${process.env.NOBEDS_API}/${process.env.NOBEDS_TOKEN}`;
      const nbRes = await axios.get(url, { timeout: 20000 });

      if (Array.isArray(nbRes.data)) {
        nobeds = nbRes.data
          .filter((r) => {
            return (
              (r.email && r.email.toLowerCase().includes(query)) ||
              (r.phone && String(r.phone).toLowerCase().includes(query))
            );
          })
          .map((r) => ({
            origen: "nobeds",
            id: r.id || `nb-${r.phone || r.email}`,
            nombre: `${r.first_name} ${r.last_name}`,
            telefono: r.phone,
            email: r.email,
            numeroReserva: r.order_id,
          }));
      }
    } catch (err) {
      console.error("Error obteniendo nobeds:", err.message);
    }

    return res.json([...sqliteResults, ...nobeds].slice(0, 20));
  } catch (error) {
    console.error("ERROR /api/checkin/contactos:", error);
    return res.status(500).json({ error: "Error interno" });
  }
});

/* =======================================================================
   BUSCAR COMBINADO
   ======================================================================= */
app.get("/api/checkin/buscar-combinado/:valor", async (req, res) => {
  try {
    const { valor } = req.params;
    if (!valor) return res.status(400).json({ ok: false, error: "Falta valor" });

    let huesped = await prisma.huesped.findFirst({
      where: {
        OR: [{ telefono: valor }, { email: valor }],
      },
    });

    if (huesped) {
      return res.json({ ok: true, origen: "local", data: huesped });
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
        return res.json({ ok: true, origen: "nobeds", data: match });
      }
    }

    return res.status(404).json({ ok: false, error: "No encontrado" });
  } catch (error) {
    console.error("buscar-combinado error:", error);
    return res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
});

/* =======================================================================
   NOBEDS
   ======================================================================= */
app.get("/api/nobeds/reserva/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId)
      return res.status(400).json({ ok: false, error: "Falta orderId" });

    const url = `${process.env.NOBEDS_API}/${process.env.NOBEDS_TOKEN}?order_id=${orderId}`;
    const { data } = await axios.get(url, { timeout: 20000 });

    if (!data || !Array.isArray(data) || !data.length) {
      return res.status(404).json({ ok: false, error: "Reserva no encontrada" });
    }

    res.json({ ok: true, reserva: data[0] });
  } catch (err) {
    console.error("error /api/nobeds/reserva:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/api/nobeds/reservas", async (_req, res) => {
  try {
    const url = `${process.env.NOBEDS_API}/${process.env.NOBEDS_TOKEN}`;
    const { data } = await axios.get(url, { timeout: 20000 });
    res.json({ ok: true, reservas: data });
  } catch (err) {
    console.error("error /api/nobeds/reservas:", err.message);
    res.status(500).json({ ok: false, error: err.message });
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
         console.log("→ /mcp/create-key FALTAN CAMPOS", { body:req.body });
         return res.status(400).json({ ok:false, error:"lockId, receiverUsername y endAt son requeridos" });
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
   
       if (r?.errcode && r.errcode !== 0) {
         console.error("TTLock key/send ERROR:", r, {
           base: TTLOCK_BASE,
           clientId: process.env.TTLOCK_CLIENT_ID,
           body: req.body,
         });
         // Reenvía el detalle para verlo en Network → Response
         return res.status(400).json({
           ok: false,
           provider: "ttlock",
           ...r,
         });
       }
   
       res.json({ ok: true, provider: "ttlock", correlationId, result: r });
     } catch (e) {
       console.error("mcp/create-key exception:", e?.response?.data || e.message);
       res.status(500).json({ ok:false, error: e?.response?.data || e.message });
     }
   });
   
   // === Crear PASSCODE (como en la app TTLock) ===
   // Modo A: TTLock genera el código (keyboardPwdType=3)
   // Modo B: Tú eliges el código 6–9 dígitos (keyboardPwdType=2 con 'keyboardPwd')
   app.post("/mcp/create-passcode", async (req, res) => {
     try {
       const { lockId, endAt, startAt, code, name } = req.body || {};
       if (!lockId || !endAt) {
         return res.status(400).json({ ok: false, error: "lockId y endAt son requeridos" });
       }
   
       const accessToken = await getAccessToken();
       const base = {
         clientId: process.env.TTLOCK_CLIENT_ID,
         accessToken,
         lockId,
         startDate: startAt || nowMs(),
         endDate: endAt,
         date: nowMs(),
       };
   
       let r;
   
       // ¿Te pasan un código propio?
       if (code !== undefined && code !== null && String(code).trim() !== "") {
         const pwd = String(code).trim();
         if (!/^\d{6,9}$/.test(pwd)) {
           return res.status(400).json({ ok: false, error: "El code debe ser 6–9 dígitos" });
         }
         r = await ttPost("/v3/keyboardPwd/add", {
           ...base,
           keyboardPwdType: 2,                 // custom
           keyboardPwd: pwd,                   // **campo correcto**
           keyboardPwdName: name || "AutoCheckin",
         });
       } else {
         // Generado por TTLock
         r = await ttPost("/v3/keyboardPwd/get", {
           ...base,
           keyboardPwdType: 3,                 // time-limited generado
         });
       }
   
       if (parseInt(r?.errcode ?? 0, 10) !== 0) {
         return res.status(400).json({ ok: false, error: r });
       }
       res.json({ ok: true, provider: "ttlock", result: r });
     } catch (e) {
       console.error("mcp/create-passcode error:", e?.response?.data || e.message);
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


// =======================================================
// ✅ CREAR MISMO PASSCODE EN TODAS LAS CERRADURAS (USANDO /mcp/keys)
// =======================================================
app.post("/mcp/create-passcode-all", async (req, res) => {
  try {
    const { code, startAt, endAt, name } = req.body || {};

    if (!startAt || !endAt || !code) {
      return res.status(400).json({
        ok: false,
        error: "code, startAt y endAt son obligatorios",
      });
    }

    const accessToken = await getAccessToken();

    // 🔥 AQUÍ ESTÁ LA CLAVE: usamos /v3/key/list en lugar de /v3/lock/list
    const keysResp = await ttPost("/v3/key/list", {
      clientId: process.env.TTLOCK_CLIENT_ID,
      accessToken,
      pageNo: 1,
      pageSize: 100,
      date: nowMs(),
    });

    if (!Array.isArray(keysResp?.list) || !keysResp.list.length) {
      return res.status(500).json({
        ok: false,
        error: "No se encontraron cerraduras en /v3/key/list",
      });
    }

    const resultados = [];

    for (const key of keysResp.list) {
      const r = await ttPost("/v3/keyboardPwd/add", {
        clientId: process.env.TTLOCK_CLIENT_ID,
        accessToken,
        lockId: key.lockId,                 // ✅ AQUÍ VIENE EL LOCK REAL
        startDate: startAt,
        endDate: endAt,
        keyboardPwdType: 2,
        keyboardPwd: String(code),
        keyboardPwdName: name || "MASTER",
        date: nowMs(),
      });

      resultados.push({
        lockId: key.lockId,
        ok: parseInt(r?.errcode ?? -1, 10) === 0,
        result: r,
      });
    }

    return res.json({
      ok: true,
      total: resultados.length,
      resultados,
    });
  } catch (err) {
    console.error("ERROR /create-passcode-all:", err?.response?.data || err.message);
    return res.status(500).json({
      ok: false,
      error: "Error creando passcode en todas las cerraduras",
    });
  }
});

 

/* =======================================================================
   ADMIN - CRUD / LISTA / DETALLE
   ======================================================================= */
app.get("/admin/huespedes", async (_req, res) => {
  try {
    const lista = await prisma.huesped.findMany({
      orderBy: { creadoEn: "desc" },
    });

    res.json({ ok: true, total: lista.length, data: lista });
  } catch (e) {
    console.error("admin/huespedes:", e);
    res.status(500).json({ ok: false, error: "Error interno" });
  }
});

app.get("/admin/huesped/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id))
      return res.status(400).json({ ok: false, error: "ID inválido" });

    const huesped = await prisma.huesped.findUnique({ where: { id } });

    if (!huesped)
      return res.status(404).json({ ok: false, error: "No encontrado" });

    res.json({ ok: true, data: huesped });
  } catch (e) {
    console.error("detalle huesped:", e);
    res.status(500).json({ ok: false });
  }
});

app.delete("/admin/huespedes/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id)
      return res.status(400).json({ ok: false, error: "ID inválido" });

    await prisma.huesped.delete({ where: { id } });

    res.json({ ok: true });
  } catch (e) {
    console.error("admin delete:", e);
    res.status(500).json({ ok: false, error: "No se pudo eliminar" });
  }
});

/* =======================================================================
   ADMIN - GUARDAR / ACTUALIZAR CHECKIN URL
   ======================================================================= */
   app.put("/admin/huesped/:id/checkin", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { checkinUrl } = req.body;
  
      if (!id || !checkinUrl) {
        return res.status(400).json({ ok: false, error: "Datos inválidos" });
      }
  
      const existe = await prisma.huesped.findUnique({
        where: { id },
      });
  
      if (!existe) {
        return res.status(404).json({ ok: false, error: "Huésped no encontrado" });
      }
  
      await prisma.huesped.update({
        where: { id },
        data: { checkinUrl },
      });
  
      res.json({ ok: true });
    } catch (e) {
      console.error("error guardar checkinUrl:", e);
      res.status(500).json({ ok: false, error: "Error al guardar checkinUrl" });
    }
  });
  
/* =======================================================================
   ADMIN - CREAR O ACTUALIZAR CHECKIN POR NUMERO DE RESERVA (UPSERT REAL)
   ======================================================================= */
   app.put("/admin/huesped/checkin-por-reserva", async (req, res) => {
    try {
      const { numeroReserva, checkinUrl } = req.body;
  
      if (!numeroReserva || !checkinUrl) {
        return res.status(400).json({ ok: false, error: "Datos incompletos" });
      }
  
      const existente = await prisma.huesped.findUnique({
        where: { numeroReserva: String(numeroReserva) },
      });
  
      if (!existente) {
        return res.status(404).json({
          ok: false,
          error: "No existe un huésped real para esta reserva. Debe llenarse el formulario primero.",
        });
      }
  
      await prisma.huesped.update({
        where: { numeroReserva: String(numeroReserva) },
        data: { checkinUrl },
      });
  
      return res.json({ ok: true, action: "updated" });
    } catch (e) {
      console.error("error guardar checkinUrl por reserva:", e);
      res.status(500).json({ ok: false, error: "Error al guardar checkinUrl" });
    }
  });
  
  


/* =======================================================================
   ADMIN - STATS
   ======================================================================= */
app.get("/admin/stats", async (_req, res) => {
  try {
    const hoyInicio = new Date();
    hoyInicio.setHours(0, 0, 0, 0);

    const semanaInicio = new Date();
    semanaInicio.setDate(semanaInicio.getDate() - 7);

    const mesInicio = new Date();
    mesInicio.setDate(1);

    const hoy = await prisma.huesped.count({
      where: { creadoEn: { gte: hoyInicio } },
    });

    const semana = await prisma.huesped.count({
      where: { creadoEn: { gte: semanaInicio } },
    });

    const mes = await prisma.huesped.count({
      where: { creadoEn: { gte: mesInicio } },
    });

    res.json({ ok: true, hoy, semana, mes });
  } catch (e) {
    console.error("stats:", e);
    res.status(500).json({ ok: false });
  }
});

/* =======================================================================
   ADMIN - METRICS
   ======================================================================= */
app.get("/admin/metrics", async (_req, res) => {
  try {
    const total = await prisma.huesped.count();

    const hoyInicio = new Date();
    hoyInicio.setHours(0, 0, 0, 0);

    const hoyFin = new Date();
    hoyFin.setHours(23, 59, 59, 999);

    const hoy = await prisma.huesped.count({
      where: { creadoEn: { gte: hoyInicio, lte: hoyFin } },
    });

    const mesInicio = new Date();
    mesInicio.setDate(1);
    mesInicio.setHours(0, 0, 0, 0);

    const mes = await prisma.huesped.count({
      where: { creadoEn: { gte: mesInicio } },
    });

    const ultima = await prisma.huesped.findFirst({
      orderBy: { creadoEn: "desc" },
    });

    res.json({
      ok: true,
      total,
      hoy,
      mes,
      ultimaReserva: ultima?.numeroReserva || "N/A",
    });
  } catch (err) {
    console.error("metrics error:", err);
    res.status(500).json({ ok: false });
  }
});

/* =======================================================================
   Buscar por NÚMERO DE RESERVA (PARA ABRIR DESDE URL)
   ======================================================================= */
   app.get("/api/checkin/por-reserva/:numeroReserva", async (req, res) => {
    try {
      const valor = String(req.params.numeroReserva).trim();
  
      if (!valor) {
        return res.status(400).json({ ok: false, error: "Falta numeroReserva" });
      }
  
      // 🔥 BUSCA POR RESERVA INTERNA O EXTERNA
      const huesped = await prisma.huesped.findFirst({
        where: {
          OR: [
            { numeroReserva: valor },
            { numeroDocumento: valor },
          ],
        },
      });
  
      if (!huesped) {
        return res.status(404).json({
          ok: false,
          error: "Reserva no encontrada en base de datos",
          buscado: valor,
        });
      }
  
      return res.json({ ok: true, data: huesped });
    } catch (err) {
      console.error("ERROR /api/checkin/por-reserva:", err);
      return res.status(500).json({ ok: false, error: "Error interno" });
    }
  });
  



/* ================== Debug & Health ================== */
app.get("/mcp/debug/env", (_req, res) => {
  const mask = (s) => (s ? s.slice(0, 4) + "****" + s.slice(-4) : "(vacio)");
  res.json({
    PORT: process.env.PORT || 4000,
    TTLOCK_BASE,
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
  console.log(`Backend corriendo en http://localhost:${PORT}`)
);
