const { nowMs } = require("../utils/helpers");
const { TTLOCK_BASE, getAccessToken, ttPost } = require("./ttlock.service");
const prisma = require("../utils/prismaClient");
const crypto = require("crypto");
const roomLocksMap = require("../../config/roomLocksMap.json");

/* =======================================================================
   Helpers internos
   ======================================================================= */

function normalizeTs(v) {
  const n = Number(String(v).trim());
  if (!Number.isFinite(n)) return null;
  if (n > 0 && n < 100000000000) return n * 1000;
  return n;
}

function genPin(digits = 4) {
  const d = Math.min(9, Math.max(4, Number(digits || 4)));
  let pin = "";
  for (let i = 0; i < d; i++) pin += String(crypto.randomInt(0, 10));
  return pin;
}

async function syncGuestCodigoTTLock(huespedId) {
  const activos = await prisma.passcode.findMany({
    where: {
      huespedId: Number(huespedId),
      estado: "ACTIVO",
      codigo: { not: null },
    },
    orderBy: [{ creadoEn: "desc" }, { id: "desc" }],
  });

  const codigo = activos.length ? String(activos[0].codigo || "").trim() : "";

  await prisma.huesped.update({
    where: { id: Number(huespedId) },
    data: {
      codigoTTLock: codigo || null,
    },
  });

  return codigo || null;
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
      return res.status(400).json({
        ok: false,
        provider: "ttlock",
        ...r,
      });
    }

    return res.json({ ok: true, provider: "ttlock", correlationId, result: r });
  } catch (e) {
    console.error("mcp/create-key exception:", e?.response?.data || e.message);
    return res.status(500).json({
      ok: false,
      error: e?.response?.data || e.message,
    });
  }
}

/* =======================================================================
   Crear PASSCODE individual
   ======================================================================= */
async function createPasscode(req, res) {
  try {
    const {
      lockId,
      endAt,
      startAt,
      code,
      name,
      pinDigits,
      huespedId,
      numeroReserva,
    } = req.body || {};

    if (!lockId || !endAt) {
      return res.status(400).json({
        ok: false,
        error: "lockId y endAt son requeridos",
      });
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

    const r = await ttPost("/v3/keyboardPwd/add", {
      clientId: process.env.TTLOCK_CLIENT_ID,
      accessToken,
      lockId,
      keyboardPwd: pin,
      keyboardPwdName: name || "AutoCheckin",
      startDate: sAt,
      endDate: eAt,
      addType: 2,
      date: nowMs(),
    });

    if (parseInt(r?.errcode ?? 0, 10) !== 0) {
      return res.status(400).json({ ok: false, error: r });
    }

    if (huespedId || numeroReserva) {
      let huesped = null;

      if (huespedId) {
        huesped = await prisma.huesped.findUnique({
          where: { id: Number(huespedId) },
        });
      } else if (numeroReserva) {
        huesped = await prisma.huesped.findUnique({
          where: { numeroReserva: String(numeroReserva) },
        });
      }

      if (huesped) {
        const keyboardPwdId = r?.keyboardPwdId ?? null;

        const row = {
          huespedId: huesped.id,
          lockId: Number(lockId),
          lockAlias: null,
          codigo: String(pin),
          keyboardPwdId: keyboardPwdId !== null ? Number(keyboardPwdId) : null,
          tipo: "ADD",
          startDate: BigInt(String(sAt)),
          endDate: BigInt(String(eAt)),
          estado: "ACTIVO",
          ttlockOk: true,
          ttlockMessage: "CREADO",
        };

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
        } else {
          await prisma.passcode.create({ data: row });
        }

        await prisma.huesped.update({
          where: { id: huesped.id },
          data: {
            codigoTTLock: String(pin),
          },
        });
      }
    }

    return res.json({ ok: true, provider: "ttlock", pin, result: r });
  } catch (e) {
    console.error("mcp/create-passcode error:", e?.response?.data || e.message);
    return res.status(500).json({
      ok: false,
      error: e?.response?.data || e.message,
    });
  }
}

/* =======================================================================
   Apertura remota
   ======================================================================= */
async function openLock(req, res) {
  try {
    const { lockId, correlationId } = req.body || {};
    if (!lockId) {
      return res.status(400).json({ ok: false, error: "lockId requerido" });
    }

    const accessToken = await getAccessToken();

    const r = await ttPost("/v3/lock/remoteUnlock", {
      clientId: process.env.TTLOCK_CLIENT_ID,
      accessToken,
      lockId,
      date: nowMs(),
    });

    if (parseInt(r?.errcode ?? -1, 10) !== 0) {
      return res.status(400).json({ ok: false, error: r });
    }

    return res.json({ ok: true, provider: "ttlock", correlationId, result: r });
  } catch (e) {
    console.error("mcp/open-lock error:", e?.response?.data || e.message);
    return res.status(500).json({
      ok: false,
      error: e?.response?.data || e.message,
    });
  }
}

/* =======================================================================
   Revocar eKey
   ======================================================================= */
async function revokeKey(req, res) {
  try {
    const { keyId, remarks, correlationId } = req.body || {};
    if (!keyId) {
      return res.status(400).json({ ok: false, error: "keyId requerido" });
    }

    const accessToken = await getAccessToken();

    const r = await ttPost("/v3/key/delete", {
      clientId: process.env.TTLOCK_CLIENT_ID,
      accessToken,
      keyId,
      remarks: remarks || "",
      date: nowMs(),
    });

    if (parseInt(r?.errcode ?? -1, 10) !== 0) {
      return res.status(400).json({ ok: false, error: r });
    }

    return res.json({ ok: true, provider: "ttlock", correlationId, result: r });
  } catch (e) {
    console.error("mcp/revoke-key error:", e?.response?.data || e.message);
    return res.status(500).json({
      ok: false,
      error: e?.response?.data || e.message,
    });
  }
}

/* =======================================================================
   Listados generales
   ======================================================================= */
async function listLocks(_req, res) {
  try {
    const accessToken = await getAccessToken();

    // 1) Intentar /v3/lock/list (fuente primaria)
    let locksFromLockList = [];
    try {
      const r = await ttPost("/v3/lock/list", {
        clientId: process.env.TTLOCK_CLIENT_ID,
        accessToken,
        pageNo: 1,
        pageSize: 200,
        date: nowMs(),
      });
      locksFromLockList = Array.isArray(r?.list) ? r.list : [];
    } catch (_) {
      // endpoint puede no funcionar en todas las cuentas
    }

    // 2) Siempre consultar /v3/key/list para obtener cerraduras vía eKeys
    let locksFromKeyList = [];
    try {
      const r2 = await ttPost("/v3/key/list", {
        clientId: process.env.TTLOCK_CLIENT_ID,
        accessToken,
        pageNo: 1,
        pageSize: 200,
        date: nowMs(),
      });
      if (Array.isArray(r2?.list)) {
        locksFromKeyList = r2.list.map((k) => ({
          lockId: k.lockId,
          lockAlias: k.lockAlias || null,
          electricQuantity: k.electricQuantity ?? null,
          keyboardPwdVersion: k.keyboardPwdVersion ?? null,
          specialValue: k.specialValue ?? null,
          _source: "key",
        }));
      }
    } catch (_) {
      // fallback silencioso
    }

    // 3) Mergear: lock/list tiene prioridad, key/list agrega los que faltan
    const merged = new Map();
    for (const l of locksFromLockList) {
      merged.set(Number(l.lockId), l);
    }
    for (const l of locksFromKeyList) {
      const lid = Number(l.lockId);
      if (!merged.has(lid)) {
        merged.set(lid, l);
      }
    }

    const list = Array.from(merged.values());

    return res.json({ list, total: list.length });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: e?.response?.data || e.message,
    });
  }
}

async function listKeys(_req, res) {
  try {
    const accessToken = await getAccessToken();

    const r = await ttPost("/v3/key/list", {
      clientId: process.env.TTLOCK_CLIENT_ID,
      accessToken,
      pageNo: 1,
      pageSize: 200,
      date: nowMs(),
    });

    return res.json(r);
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: e?.response?.data || e.message,
    });
  }
}

/* =======================================================================
   Crear PASSCODE por ROOM_ID + guardar en BD + reflejar en Huesped
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
      });
    }

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

    const targetLocks = keysResp.list.filter((k) => {
      const alias = String(k.lockAlias || "").trim().toLowerCase();
      return targetAliases.some(
        (a) => alias === String(a).trim().toLowerCase()
      );
    });

    if (!targetLocks.length) {
      return res.status(404).json({
        ok: false,
        error: `No se encontraron locks TTLock para aliases=${JSON.stringify(targetAliases)}`,
      });
    }

    const resultados = [];

    for (const key of targetLocks) {
      const r = await ttPost("/v3/keyboardPwd/add", {
        clientId: process.env.TTLOCK_CLIENT_ID,
        accessToken,
        lockId: key.lockId,
        keyboardPwd: String(pin),
        keyboardPwdName: name || `RES-${huesped.numeroReserva || huesped.id}`,
        startDate: sAt,
        endDate: eAt,
        addType: 2,
        date: nowMs(),
      });

      resultados.push({
        lockId: key.lockId,
        lockAlias: key.lockAlias || null,
        ok: parseInt(r?.errcode ?? -1, 10) === 0,
        result: r,
      });
    }

    const startBig = BigInt(String(sAt));
    const endBig = BigInt(String(eAt));

    for (const x of resultados) {
      const keyboardPwdId = x?.result?.keyboardPwdId ?? null;

      const row = {
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
      } else {
        await prisma.passcode.create({ data: row });
      }
    }

    await prisma.huesped.update({
      where: { id: huesped.id },
      data: {
        codigoTTLock: String(pin),
      },
    });

    return res.json({
      ok: true,
      room_id: rid,
      room: map.room || null,
      pin,
      total: resultados.length,
      huesped: {
        id: huesped.id,
        numeroReserva: huesped.numeroReserva,
        nombre: huesped.nombre,
      },
      resultados,
    });
  } catch (err) {
    console.error("ERROR /create-passcode-all:", err?.response?.data || err.message);

    return res.status(500).json({
      ok: false,
      error: "Error creando passcode por room_id",
      details: err?.response?.data || err.message,
    });
  }
}

/* =======================================================================
   Listar PASSCODES de todas las cerraduras
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
    console.error("ERROR /list-passcodes-all:", err?.response?.data || err.message);

    return res.status(500).json({
      ok: false,
      error: "Error consultando passcodes",
    });
  }
}

/* =======================================================================
   Listar PASSCODES activos por huésped
   ======================================================================= */
async function listGuestPasscodes(req, res) {
  try {
    const huespedId = Number(req.params?.huespedId);

    if (!huespedId) {
      return res.status(400).json({
        ok: false,
        error: "huespedId es requerido",
      });
    }

    const huesped = await prisma.huesped.findUnique({
      where: { id: huespedId },
      include: {
        passcodes: {
          orderBy: [{ creadoEn: "desc" }, { id: "desc" }],
        },
      },
    });

    if (!huesped) {
      return res.status(404).json({
        ok: false,
        error: "Huésped no encontrado",
      });
    }

    const activos = (huesped.passcodes || []).filter((p) => p.estado === "ACTIVO");

    // Verify each passcode against TTLock API
    let ttlockPasscodesByLock = {};
    try {
      const accessToken = await getAccessToken();
      const lockIdsUnique = [...new Set(activos.map((p) => p.lockId))];

      for (const lockId of lockIdsUnique) {
        try {
          const r = await ttPost("/v3/keyboardPwd/list", {
            clientId: process.env.TTLOCK_CLIENT_ID,
            accessToken,
            lockId,
            pageNo: 1,
            pageSize: 200,
            date: nowMs(),
          });
          if (Array.isArray(r?.list)) {
            ttlockPasscodesByLock[lockId] = r.list;
          }
        } catch (_) {
          // Lock may not support passcodes
        }
      }
    } catch (_) {
      // TTLock API unavailable, continue with DB data only
    }

    const data = activos.map((p) => {
      const ttlockList = ttlockPasscodesByLock[p.lockId] || [];
      const ttlockMatch = p.keyboardPwdId
        ? ttlockList.find((t) => t.keyboardPwdId === p.keyboardPwdId)
        : null;

      return {
        id: p.id,
        lockId: p.lockId,
        lockAlias: p.lockAlias || null,
        codigo: p.codigo || null,
        keyboardPwdId: p.keyboardPwdId || null,
        tipo: p.tipo,
        estado: p.estado,
        ttlockOk: p.ttlockOk,
        ttlockMessage: p.ttlockMessage || null,
        startDate: p.startDate ? Number(p.startDate) : null,
        endDate: p.endDate ? Number(p.endDate) : null,
        creadoEn: p.creadoEn,
        // TTLock verification
        ttlockVerified: ttlockMatch ? true : (p.keyboardPwdId ? false : null),
        ttlockLiveData: ttlockMatch
          ? {
              keyboardPwd: ttlockMatch.keyboardPwd || null,
              keyboardPwdName: ttlockMatch.keyboardPwdName || null,
              startDate: ttlockMatch.startDate || null,
              endDate: ttlockMatch.endDate || null,
              status: ttlockMatch.status,
            }
          : null,
      };
    });

    return res.json({
      ok: true,
      huesped: {
        id: huesped.id,
        nombre: huesped.nombre,
        numeroReserva: huesped.numeroReserva,
        codigoTTLock: huesped.codigoTTLock || null,
      },
      total: data.length,
      passcodes: data,
    });
  } catch (err) {
    console.error("ERROR /guest-passcodes/:huespedId:", err?.response?.data || err.message);

    return res.status(500).json({
      ok: false,
      error: "Error consultando passcodes del huésped",
      details: err?.response?.data || err.message,
    });
  }
}

/* =======================================================================
   ✅ Asignar cerraduras existentes a un huésped
   ======================================================================= */
async function assignSelectedLocksToGuest(req, res) {
  try {
    const {
      huespedId,
      numeroReserva,
      lockIds,
      startAt,
      endAt,
      code,
      pinDigits,
      name,
      reassign,
    } = req.body || {};

    const normalizedLockIds = Array.isArray(lockIds)
      ? lockIds.map((x) => Number(x)).filter((x) => Number.isFinite(x) && x > 0)
      : [];

    if (!huespedId && !numeroReserva) {
      return res.status(400).json({
        ok: false,
        error: "Debes enviar huespedId o numeroReserva",
      });
    }

    if (!normalizedLockIds.length) {
      return res.status(400).json({
        ok: false,
        error: "Debes enviar al menos una cerradura",
      });
    }

    if (!startAt || !endAt) {
      return res.status(400).json({
        ok: false,
        error: "startAt y endAt son requeridos",
      });
    }

    const sAt = normalizeTs(startAt);
    const eAt = normalizeTs(endAt);

    if (!sAt || !eAt) {
      return res.status(400).json({
        ok: false,
        error: "startAt/endAt inválidos",
      });
    }

    if (eAt <= sAt) {
      return res.status(400).json({
        ok: false,
        error: "endAt debe ser mayor que startAt",
      });
    }

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
        error: "Huésped no encontrado",
      });
    }

    let pin = null;
    if (code !== undefined && code !== null && String(code).trim() !== "") {
      pin = String(code).trim();
      if (!/^\d{4,9}$/.test(pin)) {
        return res.status(400).json({
          ok: false,
          error: "El code debe ser 4–9 dígitos",
        });
      }
    } else if (huesped.codigoTTLock && String(huesped.codigoTTLock).trim()) {
      pin = String(huesped.codigoTTLock).trim();
    } else {
      pin = genPin(pinDigits || 4);
    }

    const accessToken = await getAccessToken();

    const locksResp = await ttPost("/v3/lock/list", {
      clientId: process.env.TTLOCK_CLIENT_ID,
      accessToken,
      pageNo: 1,
      pageSize: 200,
      date: nowMs(),
    });

    const availableLocks = Array.isArray(locksResp?.list) ? locksResp.list : [];
    if (!availableLocks.length) {
      return res.status(500).json({
        ok: false,
        error: "No se pudieron obtener cerraduras de TTLock",
      });
    }

    const selectedLocks = availableLocks.filter((l) =>
      normalizedLockIds.includes(Number(l.lockId))
    );

    if (!selectedLocks.length) {
      return res.status(404).json({
        ok: false,
        error: "No se encontraron las cerraduras seleccionadas en TTLock",
      });
    }

    // Check for duplicate: same lockId+pin assigned to ANOTHER guest
    for (const lock of selectedLocks) {
      const lockId = Number(lock.lockId);
      const duplicateOtherGuest = await prisma.passcode.findFirst({
        where: {
          lockId,
          codigo: pin,
          estado: "ACTIVO",
          huespedId: { not: huesped.id },
        },
      });
      if (duplicateOtherGuest) {
        return res.status(409).json({
          ok: false,
          error: `El PIN ${pin} ya está asignado a otro huésped en la cerradura ${lock.lockAlias || lockId}. Usa un PIN diferente.`,
          lockId,
          lockAlias: lock.lockAlias || null,
        });
      }
    }

    const resultados = [];
    const startBig = BigInt(String(sAt));
    const endBig = BigInt(String(eAt));

    for (const lock of selectedLocks) {
      const lockId = Number(lock.lockId);
      const lockAlias = lock.lockAlias || null;

      const existingActive = await prisma.passcode.findFirst({
        where: {
          huespedId: huesped.id,
          lockId,
          estado: "ACTIVO",
        },
        orderBy: { id: "desc" },
      });

      // --- Already assigned, no reassign requested ---
      if (existingActive && !reassign) {
        resultados.push({
          lockId,
          lockAlias,
          ok: true,
          skipped: true,
          status: "ya_existia",
          message: "Ya existe passcode activo para esta cerradura",
          keyboardPwdId: existingActive.keyboardPwdId || null,
          codigo: existingActive.codigo || pin,
        });
        continue;
      }

      // --- Reassign: delete old on TTLock + BD, then create new ---
      if (existingActive && reassign) {
        let deleteOk = false;
        if (existingActive.keyboardPwdId) {
          try {
            const delR = await ttPost("/v3/keyboardPwd/delete", {
              clientId: process.env.TTLOCK_CLIENT_ID,
              accessToken,
              lockId,
              keyboardPwdId: existingActive.keyboardPwdId,
              date: nowMs(),
            });
            deleteOk = parseInt(delR?.errcode ?? -1, 10) === 0;
          } catch (delErr) {
            console.error("Error deleting old passcode on reassign:", delErr?.message);
          }
        } else {
          deleteOk = true; // no TTLock record to delete
        }

        if (!deleteOk) {
          resultados.push({
            lockId,
            lockAlias,
            ok: false,
            skipped: false,
            status: "error_reasignar",
            message: "No se pudo eliminar el passcode anterior en TTLock",
            codigo: existingActive.codigo || pin,
          });
          continue;
        }

        // Mark old as REASIGNADO in DB
        await prisma.passcode.update({
          where: { id: existingActive.id },
          data: {
            estado: "REASIGNADO",
            ttlockOk: true,
            ttlockMessage: "REASIGNADO",
          },
        });
      }

      // --- Create new passcode on TTLock ---
      const r = await ttPost("/v3/keyboardPwd/add", {
        clientId: process.env.TTLOCK_CLIENT_ID,
        accessToken,
        lockId,
        keyboardPwd: String(pin),
        keyboardPwdName: name || `RES-${huesped.numeroReserva || huesped.id}`,
        startDate: sAt,
        endDate: eAt,
        addType: 2,
        date: nowMs(),
      });

      const ok = parseInt(r?.errcode ?? -1, 10) === 0;
      const keyboardPwdId = r?.keyboardPwdId ?? null;

      if (ok) {
        const row = {
          huespedId: huesped.id,
          lockId,
          lockAlias,
          codigo: String(pin),
          keyboardPwdId: keyboardPwdId !== null ? Number(keyboardPwdId) : null,
          tipo: "ADD",
          startDate: startBig,
          endDate: endBig,
          estado: "ACTIVO",
          ttlockOk: true,
          ttlockMessage: existingActive ? "REASIGNADO_NUEVO" : "CREADO_MANUAL",
        };

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
        } else {
          await prisma.passcode.create({ data: row });
        }
      }

      resultados.push({
        lockId,
        lockAlias,
        ok,
        skipped: false,
        status: ok
          ? (existingActive ? "reasignada" : "asignada")
          : "error",
        keyboardPwdId: keyboardPwdId !== null ? Number(keyboardPwdId) : null,
        codigo: String(pin),
        message: ok
          ? (existingActive ? "Reasignada con mismo PIN" : "Asignada correctamente")
          : `Error TTLock: ${JSON.stringify(r)}`,
        result: r,
      });
    }

    await prisma.huesped.update({
      where: { id: huesped.id },
      data: {
        codigoTTLock: String(pin),
      },
    });

    await syncGuestCodigoTTLock(huesped.id);

    return res.json({
      ok: resultados.some((x) => x.ok),
      pin,
      total: resultados.length,
      asignadas: resultados.filter((x) => x.ok && !x.skipped && x.status === "asignada").length,
      reasignadas: resultados.filter((x) => x.ok && x.status === "reasignada").length,
      yaExistian: resultados.filter((x) => x.skipped).length,
      errores: resultados.filter((x) => !x.ok).length,
      huesped: {
        id: huesped.id,
        nombre: huesped.nombre,
        numeroReserva: huesped.numeroReserva,
      },
      resultados,
    });
  } catch (err) {
    console.error("ERROR /assign-locks-to-guest:", err?.response?.data || err.message);

    return res.status(500).json({
      ok: false,
      error: "Error asignando cerraduras al huésped",
      details: err?.response?.data || err.message,
    });
  }
}

/* =======================================================================
   Borrar PASSCODE (TTLock + BD + sync Huesped)
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

    const dbPasscode = await prisma.passcode.findFirst({
      where: {
        lockId: Number(lockId),
        keyboardPwdId: Number(keyboardPwdId),
      },
    });

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

    if (dbPasscode) {
      await prisma.passcode.update({
        where: { id: dbPasscode.id },
        data: {
          estado: "ELIMINADO",
          ttlockOk: true,
          ttlockMessage: "ELIMINADO",
        },
      });

      await syncGuestCodigoTTLock(dbPasscode.huespedId);
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
   Borrar PASSCODES seleccionados por checklist
   ======================================================================= */
async function deleteSelectedPasscodes(req, res) {
  try {
    const huespedId = Number(req.body?.huespedId);
    const items = Array.isArray(req.body?.items) ? req.body.items : [];

    if (!huespedId) {
      return res.status(400).json({
        ok: false,
        error: "huespedId es requerido",
      });
    }

    if (!items.length) {
      return res.status(400).json({
        ok: false,
        error: "Debes enviar al menos un passcode a eliminar",
      });
    }

    const huesped = await prisma.huesped.findUnique({
      where: { id: huespedId },
    });

    if (!huesped) {
      return res.status(404).json({
        ok: false,
        error: "Huésped no encontrado",
      });
    }

    const accessToken = await getAccessToken();
    const resultados = [];

    for (const item of items) {
      const lockId = Number(item?.lockId);
      const keyboardPwdId = Number(item?.keyboardPwdId);

      if (!lockId || !keyboardPwdId) {
        resultados.push({
          lockId: item?.lockId ?? null,
          keyboardPwdId: item?.keyboardPwdId ?? null,
          ok: false,
          error: "lockId o keyboardPwdId inválido",
        });
        continue;
      }

      const dbPasscode = await prisma.passcode.findFirst({
        where: {
          huespedId,
          lockId,
          keyboardPwdId,
          estado: "ACTIVO",
        },
      });

      if (!dbPasscode) {
        resultados.push({
          lockId,
          keyboardPwdId,
          ok: false,
          error: "Passcode activo no encontrado para este huésped",
        });
        continue;
      }

      try {
        const r = await ttPost("/v3/keyboardPwd/delete", {
          clientId: process.env.TTLOCK_CLIENT_ID,
          accessToken,
          lockId,
          keyboardPwdId,
          date: nowMs(),
        });

        const ok = parseInt(r?.errcode ?? -1, 10) === 0;

        if (ok) {
          await prisma.passcode.update({
            where: { id: dbPasscode.id },
            data: {
              estado: "ELIMINADO",
              ttlockOk: true,
              ttlockMessage: "ELIMINADO_CHECKLIST",
            },
          });
        } else {
          await prisma.passcode.update({
            where: { id: dbPasscode.id },
            data: {
              ttlockOk: false,
              ttlockMessage: `ERROR_DELETE: ${JSON.stringify(r)}`,
            },
          });
        }

        resultados.push({
          passcodeId: dbPasscode.id,
          lockId,
          lockAlias: dbPasscode.lockAlias || null,
          keyboardPwdId,
          codigo: dbPasscode.codigo || null,
          ok,
          result: r,
        });
      } catch (err) {
        resultados.push({
          passcodeId: dbPasscode.id,
          lockId,
          lockAlias: dbPasscode.lockAlias || null,
          keyboardPwdId,
          codigo: dbPasscode.codigo || null,
          ok: false,
          error: err?.response?.data || err.message,
        });
      }
    }

    await syncGuestCodigoTTLock(huespedId);

    const deleted = resultados.filter((x) => x.ok).length;

    return res.json({
      ok: deleted > 0,
      deleted,
      total: resultados.length,
      huesped: {
        id: huesped.id,
        nombre: huesped.nombre,
        numeroReserva: huesped.numeroReserva,
      },
      resultados,
    });
  } catch (err) {
    console.error("ERROR /delete-passcodes-selected:", err?.response?.data || err.message);

    return res.status(500).json({
      ok: false,
      error: "Error eliminando passcodes seleccionados",
      details: err?.response?.data || err.message,
    });
  }
}

/* =======================================================================
   Extender PASSCODE(s) activos por huésped
   ======================================================================= */
async function extendPasscodeByGuest(req, res) {
  try {
    const huespedId = Number(req.params?.huespedId || req.body?.huespedId);
    const { newEndDate } = req.body || {};

    if (!huespedId || !newEndDate) {
      return res.status(400).json({
        ok: false,
        error: "huespedId y newEndDate son requeridos",
      });
    }

    const newEndAt = new Date(String(newEndDate)).getTime();

    if (!Number.isFinite(newEndAt)) {
      return res.status(400).json({
        ok: false,
        error: "newEndDate inválido",
      });
    }

    const huesped = await prisma.huesped.findUnique({
      where: { id: huespedId },
    });

    if (!huesped) {
      return res.status(404).json({
        ok: false,
        error: "Huésped no encontrado",
      });
    }

    const passcodes = await prisma.passcode.findMany({
      where: {
        huespedId,
        estado: "ACTIVO",
      },
      orderBy: {
        id: "desc",
      },
    });

    if (!passcodes.length) {
      return res.status(404).json({
        ok: false,
        error: "No se encontraron passcodes activos para este huésped",
      });
    }

    const accessToken = await getAccessToken();
    const resultados = [];

    for (const pc of passcodes) {
      if (
        pc.lockId === null ||
        pc.lockId === undefined ||
        pc.keyboardPwdId === null ||
        pc.keyboardPwdId === undefined ||
        !pc.codigo ||
        pc.startDate === null ||
        pc.startDate === undefined
      ) {
        resultados.push({
          passcodeId: pc.id,
          lockId: pc.lockId ?? null,
          keyboardPwdId: pc.keyboardPwdId ?? null,
          codigo: pc.codigo ?? null,
          ok: false,
          error: "Passcode incompleto en BD",
        });
        continue;
      }

      const startDateNum = Number(pc.startDate);

      if (!Number.isFinite(startDateNum)) {
        resultados.push({
          passcodeId: pc.id,
          lockId: pc.lockId,
          keyboardPwdId: pc.keyboardPwdId,
          codigo: pc.codigo,
          ok: false,
          error: "startDate inválido en BD",
        });
        continue;
      }

      if (newEndAt <= startDateNum) {
        resultados.push({
          passcodeId: pc.id,
          lockId: pc.lockId,
          keyboardPwdId: pc.keyboardPwdId,
          codigo: pc.codigo,
          ok: false,
          error: "La nueva fecha debe ser mayor al startDate del passcode",
        });
        continue;
      }

      const r = await ttPost("/v3/keyboardPwd/change", {
        clientId: process.env.TTLOCK_CLIENT_ID,
        accessToken,
        lockId: Number(pc.lockId),
        keyboardPwdId: Number(pc.keyboardPwdId),
        keyboardPwd: String(pc.codigo),
        startDate: startDateNum,
        endDate: newEndAt,
        changeType: 2,
        date: nowMs(),
      });

      const ok = parseInt(r?.errcode ?? -1, 10) === 0;

      if (ok) {
        await prisma.passcode.update({
          where: { id: pc.id },
          data: {
            endDate: BigInt(String(newEndAt)),
            ttlockOk: true,
            ttlockMessage: "EXTENDIDO",
          },
        });
      } else {
        await prisma.passcode.update({
          where: { id: pc.id },
          data: {
            ttlockOk: false,
            ttlockMessage: `ERROR_EXTEND: ${JSON.stringify(r)}`,
          },
        });
      }

      resultados.push({
        passcodeId: pc.id,
        lockId: pc.lockId,
        lockAlias: pc.lockAlias || null,
        keyboardPwdId: pc.keyboardPwdId,
        codigo: pc.codigo,
        ok,
        result: r,
      });
    }

    await syncGuestCodigoTTLock(huesped.id);

    const updated = resultados.filter((x) => x.ok).length;

    return res.json({
      ok: updated > 0,
      updated,
      total: resultados.length,
      huesped: {
        id: huesped.id,
        nombre: huesped.nombre,
        numeroReserva: huesped.numeroReserva,
      },
      resultados,
    });
  } catch (err) {
    console.error("ERROR /extend-passcode-by-guest:", err?.response?.data || err.message);

    return res.status(500).json({
      ok: false,
      error: "Error extendiendo passcodes del huésped",
      details: err?.response?.data || err.message,
    });
  }
}

/* =======================================================================
   Debug env
   ======================================================================= */
function debugEnv(_req, res) {
  const mask = (s) => (s ? s.slice(0, 4) + "****" + s.slice(-4) : "(vacio)");

  return res.json({
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
  listGuestPasscodes,
  assignSelectedLocksToGuest,
  deletePasscode,
  deleteSelectedPasscodes,
  extendPasscodeByGuest,
  debugEnv,
};