// backend/src/mcp/mcp.controller.js
const { nowMs } = require("../utils/helpers");
const { TTLOCK_BASE, getAccessToken, ttPost } = require("./ttlock.service");

// ✅ Prisma client (ajusta si tu export es distinto)
const prisma = require("../utils/prismaClient");

// ✅ Para generar PIN random si no viene code (único por registro)
const crypto = require("crypto");

// ✅ Mapeo room_id (Nobeds/Booking) -> aliases TTLock (Door 1..., Door 2...)
const roomLocksMap = require("../../config/roomLocksMap.json");

/* =======================================================================
   Helpers internos (quirúrgicos, sin tocar otros módulos)
   ======================================================================= */

// ✅ Normaliza timestamps: si vienen en segundos (10-11 dígitos) -> ms
function normalizeTs(v) {
  const n = Number(String(v).trim());
  if (!Number.isFinite(n)) return null;
  if (n > 0 && n < 100000000000) return n * 1000; // segundos -> ms
  return n; // ms
}

// ✅ Genera PIN numérico de N dígitos (por default 4, como operación hotel)
function genPin(digits = 4) {
  const d = Math.min(9, Math.max(4, Number(digits || 4)));
  let pin = "";
  for (let i = 0; i < d; i++) pin += String(crypto.randomInt(0, 10));
  return pin;
}

/* =======================================================================
   Enviar eKey
   ======================================================================= */
async function createKey(req, res) {
  try {
    const {
      lockId,
      receiverUsername,
      endAt,
      startAt,
      keyName,
      remarks,
      correlationId,
    } = req.body || {};
    if (!lockId || !receiverUsername || !endAt) {
      console.log("→ /mcp/create-key FALTAN CAMPOS", { body: req.body });
      return res.status(400).json({
        ok: false,
        error: "lockId, receiverUsername y endAt son requeridos",
      });
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
      return res.status(400).json({
        ok: false,
        provider: "ttlock",
        ...r,
      });
    }

    res.json({ ok: true, provider: "ttlock", correlationId, result: r });
  } catch (e) {
    console.error("mcp/create-key exception:", e?.response?.data || e.message);
    res
      .status(500)
      .json({ ok: false, error: e?.response?.data || e.message });
  }
}

/* =======================================================================
   Crear PASSCODE
   ✅ FIX REAL:
   - NO usar keyboardPwd/get (no instala en cerradura)
   - Usar keyboardPwd/add + addType:2 (gateway)
   - PIN 4 dígitos (operación hotel)
   ======================================================================= */
async function createPasscode(req, res) {
  try {
    const { lockId, endAt, startAt, code, name, pinDigits } = req.body || {};
    if (!lockId || !endAt) {
      return res
        .status(400)
        .json({ ok: false, error: "lockId y endAt son requeridos" });
    }

    const sAt = normalizeTs(startAt ?? nowMs());
    const eAt = normalizeTs(endAt);

    if (!sAt || !eAt) {
      return res.status(400).json({
        ok: false,
        error: "startAt/endAt inválidos (deben ser timestamps numéricos)",
      });
    }
    if (eAt <= sAt) {
      return res.status(400).json({
        ok: false,
        error: "endAt debe ser mayor que startAt",
      });
    }

    const accessToken = await getAccessToken();

    // ✅ PIN: si viene code lo uso, si no genero (default 4)
    let pin = null;
    if (code !== undefined && code !== null && String(code).trim() !== "") {
      pin = String(code).trim();
      if (!/^\d{4,9}$/.test(pin)) {
        return res
          .status(400)
          .json({ ok: false, error: "El code debe ser 4–9 dígitos" });
      }
    } else {
      // default 4 dígitos (operación hotel)
      pin = genPin(pinDigits || 4);
    }

    // ✅ TTLock exige startDate/endDate en ms y para gateway directo usar addType:2
    const r = await ttPost("/v3/keyboardPwd/add", {
      clientId: process.env.TTLOCK_CLIENT_ID,
      accessToken,
      lockId,
      keyboardPwd: pin,
      keyboardPwdName: name || "AutoCheckin",
      startDate: sAt,
      endDate: eAt,
      addType: 2, // ✅ vía gateway (si no, TTLock asume bluetooth/SDK)
      date: nowMs(),
    });

    if (parseInt(r?.errcode ?? 0, 10) !== 0) {
      return res.status(400).json({ ok: false, error: r });
    }

    return res.json({ ok: true, provider: "ttlock", pin, result: r });
  } catch (e) {
    console.error("mcp/create-passcode error:", e?.response?.data || e.message);
    res
      .status(500)
      .json({ ok: false, error: e?.response?.data || e.message });
  }
}

/* =======================================================================
   Apertura remota
   ======================================================================= */
async function openLock(req, res) {
  try {
    const { lockId, correlationId } = req.body || {};
    if (!lockId)
      return res
        .status(400)
        .json({ ok: false, error: "lockId requerido" });

    const accessToken = await getAccessToken();
    const r = await ttPost("/v3/lock/remoteUnlock", {
      clientId: process.env.TTLOCK_CLIENT_ID,
      accessToken,
      lockId,
      date: nowMs(),
    });
    if (parseInt(r.errcode ?? -1, 10) !== 0)
      return res.status(400).json({ ok: false, error: r });
    res.json({ ok: true, provider: "ttlock", correlationId, result: r });
  } catch (e) {
    console.error("mcp/open-lock error:", e?.response?.data || e.message);
    res
      .status(500)
      .json({ ok: false, error: e?.response?.data || e.message });
  }
}

/* =======================================================================
   Revocar eKey
   ======================================================================= */
async function revokeKey(req, res) {
  try {
    const { keyId, remarks, correlationId } = req.body || {};
    if (!keyId)
      return res
        .status(400)
        .json({ ok: false, error: "keyId requerido" });

    const accessToken = await getAccessToken();
    const r = await ttPost("/v3/key/delete", {
      clientId: process.env.TTLOCK_CLIENT_ID,
      accessToken,
      keyId,
      remarks: remarks || "",
      date: nowMs(),
    });
    if (parseInt(r.errcode ?? -1, 10) !== 0)
      return res.status(400).json({ ok: false, error: r });
    res.json({ ok: true, provider: "ttlock", correlationId, result: r });
  } catch (e) {
    console.error("mcp/revoke-key error:", e?.response?.data || e.message);
    res
      .status(500)
      .json({ ok: false, error: e?.response?.data || e.message });
  }
}

/* =======================================================================
   Listados
   ======================================================================= */
async function listLocks(_req, res) {
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
    res
      .status(500)
      .json({ ok: false, error: e?.response?.data || e.message });
  }
}

async function listKeys(_req, res) {
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
    res
      .status(500)
      .json({ ok: false, error: e?.response?.data || e.message });
  }
}

/* =======================================================================
   Crear PASSCODE por ROOM_ID (Nobeds/Booking) + ✅ Guardar en BD
   ✅ Un solo PIN por registro (mismo PIN para las puertas del room)
   ✅ FIX: 4 dígitos por default + addType:2 gateway
   ======================================================================= */
async function createPasscodeAll(req, res) {
  try {
    const {
      code,
      startAt,
      endAt,
      name,
      numeroReserva,
      huespedId,
      roomId,
      room_id,
      pinDigits,
    } = req.body || {};

    if (!startAt || !endAt) {
      return res.status(400).json({
        ok: false,
        error: "startAt y endAt son obligatorios",
      });
    }

    if (!numeroReserva && !huespedId) {
      return res.status(400).json({
        ok: false,
        error: "Para guardar en BD debes enviar numeroReserva o huespedId",
      });
    }

    const rid = String(roomId ?? room_id ?? "").trim();
    if (!rid) {
      return res.status(400).json({
        ok: false,
        error: "roomId (o room_id) es obligatorio para mapear las cerraduras",
      });
    }

    // ✅ Normaliza fechas
    const sAt = normalizeTs(startAt);
    const eAt = normalizeTs(endAt);

    if (!sAt || !eAt) {
      return res.status(400).json({
        ok: false,
        error: "startAt/endAt inválidos (deben ser timestamps numéricos)",
      });
    }
    if (eAt <= sAt) {
      return res.status(400).json({
        ok: false,
        error: "endAt debe ser mayor que startAt",
      });
    }

    // 1) Resolver huésped
    let huesped = null;
    if (huespedId) {
      huesped = await prisma.huesped.findUnique({
        where: { id: Number(huespedId) },
      });
    } else {
      huesped = await prisma.huesped.findUnique({
        where: { numeroReserva: String(numeroReserva) },
      });
    }

    if (!huesped) {
      return res.status(404).json({
        ok: false,
        error: "Huésped no encontrado para asociar passcodes",
        details: {
          huespedId: huespedId ?? null,
          numeroReserva: numeroReserva ?? null,
          room_id: rid,
        },
      });
    }

    // 2) Mapeo room_id -> aliases
    const map = roomLocksMap[rid];
    if (!map || !Array.isArray(map.aliases) || map.aliases.length === 0) {
      return res.status(404).json({
        ok: false,
        error: `No existe mapeo para room_id=${rid} en roomLocksMap.json`,
      });
    }

    const targetAliases = map.aliases
      .map((a) => String(a || "").trim())
      .filter(Boolean);

    // 3) ✅ PIN (default 4 dígitos)
    let pin = null;

    if (code !== undefined && code !== null && String(code).trim() !== "") {
      pin = String(code).trim();
      if (!/^\d{4,9}$/.test(pin)) {
        return res.status(400).json({
          ok: false,
          error: "El code debe ser 4–9 dígitos",
        });
      }
    } else {
      pin = genPin(pinDigits || 4);
    }

    const accessToken = await getAccessToken();

    // 4) Obtener cerraduras accesibles
    const keysResp = await ttPost("/v3/key/list", {
      clientId: process.env.TTLOCK_CLIENT_ID,
      accessToken,
      pageNo: 1,
      pageSize: 200,
      date: nowMs(),
    });

    if (!Array.isArray(keysResp?.list) || !keysResp.list.length) {
      return res.status(500).json({
        ok: false,
        error: "No se encontraron cerraduras en /v3/key/list",
      });
    }

    // 5) Filtrar cerraduras del ROOM por lockAlias
    const targetLocks = keysResp.list.filter((k) =>
      targetAliases.includes(String(k.lockAlias || "").trim())
    );

    if (!targetLocks.length) {
      return res.status(404).json({
        ok: false,
        error: `No se encontraron locks TTLock para aliases=${JSON.stringify(
          targetAliases
        )}`,
        hint:
          "Revisa que lockAlias en TTLock sea EXACTAMENTE igual al Excel (Door 1 Ay, etc.)",
      });
    }

    const resultados = [];

    // 6) Crear el MISMO PIN en las cerraduras del room
    for (const key of targetLocks) {
      const r = await ttPost("/v3/keyboardPwd/add", {
        clientId: process.env.TTLOCK_CLIENT_ID,
        accessToken,
        lockId: key.lockId,
        keyboardPwd: String(pin),
        keyboardPwdName: name || `RES-${huesped.numeroReserva || huesped.id}`,
        startDate: sAt,
        endDate: eAt,
        addType: 2, // ✅ gateway
        date: nowMs(),
      });

      resultados.push({
        lockId: key.lockId,
        lockAlias: key.lockAlias || null,
        ok: parseInt(r?.errcode ?? -1, 10) === 0,
        result: r,
      });
    }

    // 7) ✅ Persistir en BD
    const startBig = BigInt(String(sAt));
    const endBig = BigInt(String(eAt));

    const toUpsert = resultados.map((x) => {
      const keyboardPwdId = x?.result?.keyboardPwdId ?? null;

      return {
        huespedId: huesped.id,
        lockId: Number(x.lockId),
        lockAlias: x.lockAlias || map.room || null,
        codigo: String(pin),
        keyboardPwdId: keyboardPwdId !== null ? Number(keyboardPwdId) : null,
        tipo: "ADD",
        startDate: startBig,
        endDate: endBig,
        estado: "ACTIVO",
        ttlockOk: !!x.ok,
        ttlockMessage: x.ok ? "CREADO" : "NO_CREADO",
      };
    });

    let saved = 0;

    for (const row of toUpsert) {
      if (row.keyboardPwdId !== null) {
        await prisma.passcode.upsert({
          where: {
            lockId_keyboardPwdId: {
              lockId: row.lockId,
              keyboardPwdId: row.keyboardPwdId,
            },
          },
          create: row,
          update: {
            huespedId: row.huespedId,
            lockAlias: row.lockAlias,
            codigo: row.codigo,
            tipo: row.tipo,
            startDate: row.startDate,
            endDate: row.endDate,
            estado: row.estado,
            ttlockOk: row.ttlockOk,
            ttlockMessage: row.ttlockMessage,
          },
        });
        saved++;
      } else {
        await prisma.passcode.create({ data: row });
        saved++;
      }
    }

    return res.json({
      ok: true,
      room_id: rid,
      room: map.room || null,
      pin,
      total: resultados.length,
      saved,
      huesped: {
        id: huesped.id,
        numeroReserva: huesped.numeroReserva,
        nombre: huesped.nombre,
      },
      resultados,
    });
  } catch (err) {
    console.error(
      "ERROR /create-passcode-all:",
      err?.response?.data || err.message
    );
    return res.status(500).json({
      ok: false,
      error: "Error creando passcode por room_id",
      details: err?.response?.data || err.message,
    });
  }
}

/* =======================================================================
   Listar PASSCODES de todas las cerraduras (robusto / hotel-safe)
   ======================================================================= */
async function listPasscodesAll(req, res) {
  try {
    const accessToken = await getAccessToken();

    const keysResp = await ttPost("/v3/key/list", {
      clientId: process.env.TTLOCK_CLIENT_ID,
      accessToken,
      pageNo: 1,
      pageSize: 100,
      date: nowMs(),
    });

    if (!Array.isArray(keysResp?.list)) {
      return res.status(500).json({
        ok: false,
        error: "Respuesta inválida de TTLock (/v3/key/list)",
      });
    }

    if (keysResp.list.length === 0) {
      return res.json({
        ok: true,
        totalLocks: 0,
        resultados: [],
        warning: "La cuenta no tiene cerraduras asociadas",
      });
    }

    const resultados = [];

    for (const key of keysResp.list) {
      try {
        const r = await ttPost("/v3/keyboardPwd/list", {
          clientId: process.env.TTLOCK_CLIENT_ID,
          accessToken,
          lockId: key.lockId,
          pageNo: 1,
          pageSize: 100,
          date: nowMs(),
        });

        resultados.push({
          lockId: key.lockId,
          lockAlias: key.lockAlias || null,
          total: r?.total || 0,
          passcodes: Array.isArray(r?.list) ? r.list : [],
          ok: parseInt(r?.errcode ?? 0, 10) === 0,
        });
      } catch (_err) {
        resultados.push({
          lockId: key.lockId,
          lockAlias: key.lockAlias || null,
          total: 0,
          passcodes: [],
          ok: false,
          warning: "La cerradura no soporta passcodes (keyboardPwd)",
        });
      }
    }

    return res.json({
      ok: true,
      totalLocks: resultados.length,
      resultados,
    });
  } catch (err) {
    console.error(
      "ERROR /list-passcodes-all:",
      err?.response?.data || err.message
    );

    return res.status(500).json({
      ok: false,
      error: "Error consultando passcodes",
    });
  }
}

/* =======================================================================
   Borrar PASSCODE (TTLock)
   ======================================================================= */
async function deletePasscode(req, res) {
  try {
    const { lockId, keyboardPwdId } = req.body || {};

    if (!lockId || !keyboardPwdId) {
      return res.status(400).json({
        ok: false,
        error: "lockId y keyboardPwdId son requeridos",
      });
    }

    const accessToken = await getAccessToken();

    const r = await ttPost("/v3/keyboardPwd/delete", {
      clientId: process.env.TTLOCK_CLIENT_ID,
      accessToken,
      lockId,
      keyboardPwdId,
      date: nowMs(),
    });

    if (parseInt(r?.errcode ?? -1, 10) !== 0) {
      return res.status(400).json({
        ok: false,
        provider: "ttlock",
        error: r,
      });
    }

    return res.json({
      ok: true,
      provider: "ttlock",
      result: r,
    });
  } catch (e) {
    console.error("mcp/delete-passcode error:", e?.response?.data || e.message);
    return res.status(500).json({
      ok: false,
      error: e?.response?.data || e.message,
    });
  }
}

/* =======================================================================
   Debug env
   ======================================================================= */
function debugEnv(_req, res) {
  const mask = (s) => (s ? s.slice(0, 4) + "****" + s.slice(-4) : "(vacio)");
  res.json({
    PORT: process.env.PORT || 4000,
    TTLOCK_BASE,
    TTLOCK_CLIENT_ID: process.env.TTLOCK_CLIENT_ID || "(vacio)",
    TTLOCK_CLIENT_SECRET: mask(process.env.TTLOCK_CLIENT_SECRET || ""),
    TTLOCK_USERNAME: process.env.TTLOCK_USERNAME || "(vacio)",
    TTLOCK_PASSWORD: "(oculto)",
  });
}

module.exports = {
  createKey,
  createPasscode,
  openLock,
  revokeKey,
  listLocks,
  listKeys,
  createPasscodeAll,
  listPasscodesAll,
  deletePasscode,
  debugEnv,
};