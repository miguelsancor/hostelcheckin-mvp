const { nowMs } = require("../utils/helpers");
const { TTLOCK_BASE, getAccessToken, ttPost } = require("./ttlock.service");

// ✅ Prisma client (ajusta si tu export es distinto)
const prisma = require("../utils/prismaClient");

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
   ======================================================================= */
async function createPasscode(req, res) {
  try {
    const { lockId, endAt, startAt, code, name } = req.body || {};
    if (!lockId || !endAt) {
      return res
        .status(400)
        .json({ ok: false, error: "lockId y endAt son requeridos" });
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

    if (code !== undefined && code !== null && String(code).trim() !== "") {
      const pwd = String(code).trim();
      if (!/^\d{6,9}$/.test(pwd)) {
        return res
          .status(400)
          .json({ ok: false, error: "El code debe ser 6–9 dígitos" });
      }
      r = await ttPost("/v3/keyboardPwd/add", {
        ...base,
        keyboardPwdType: 2,
        keyboardPwd: pwd,
        keyboardPwdName: name || "AutoCheckin",
      });
    } else {
      r = await ttPost("/v3/keyboardPwd/get", {
        ...base,
        keyboardPwdType: 3,
      });
    }

    if (parseInt(r?.errcode ?? 0, 10) !== 0) {
      return res.status(400).json({ ok: false, error: r });
    }
    res.json({ ok: true, provider: "ttlock", result: r });
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
   Crear mismo passcode en todas las cerraduras + ✅ Guardar en BD
   ======================================================================= */
async function createPasscodeAll(req, res) {
  try {
    const { code, startAt, endAt, name, numeroReserva, huespedId } = req.body || {};

    if (!startAt || !endAt || !code) {
      return res.status(400).json({
        ok: false,
        error: "code, startAt y endAt son obligatorios",
      });
    }

    // ✅ Para guardar en BD necesitamos huésped
    if (!numeroReserva && !huespedId) {
      return res.status(400).json({
        ok: false,
        error: "Para guardar en BD debes enviar numeroReserva o huespedId",
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
        details: { huespedId: huespedId ?? null, numeroReserva: numeroReserva ?? null },
      });
    }

    const accessToken = await getAccessToken();

    // 2) Obtener cerraduras accesibles vía eKeys
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

    // 3) Crear passcode en cada cerradura
    for (const key of keysResp.list) {
      const r = await ttPost("/v3/keyboardPwd/add", {
        clientId: process.env.TTLOCK_CLIENT_ID,
        accessToken,
        lockId: key.lockId,
        startDate: startAt,
        endDate: endAt,
        keyboardPwdType: 2,
        keyboardPwd: String(code),
        keyboardPwdName: name || "MASTER",
        date: nowMs(),
      });

      resultados.push({
        lockId: key.lockId,
        lockAlias: key.lockAlias || null,
        ok: parseInt(r?.errcode ?? -1, 10) === 0,
        result: r,
      });
    }

    // 4) ✅ Persistir en BD (uno por puerta)
    // Nota: tu TTLock a veces no devuelve "codigo", por eso lo guardamos como null si quieres,
    // o guardamos el "code" que tú mandas (master). Aquí lo guardo, porque es el que usas.
    const startBig = BigInt(startAt);
    const endBig = BigInt(endAt);

    const toUpsert = resultados.map((x) => {
      const keyboardPwdId = x?.result?.keyboardPwdId ?? null;

      return {
        huespedId: huesped.id,
        lockId: Number(x.lockId),
        lockAlias: x.lockAlias,
        codigo: String(code), // master que enviaste
        keyboardPwdId: keyboardPwdId !== null ? Number(keyboardPwdId) : null,
        tipo: "ADD",
        startDate: startBig,
        endDate: endBig,

        estado: "ACTIVO",
        ttlockOk: !!x.ok,
        ttlockMessage: x.ok ? "CREADO" : "NO_CREADO",
      };
    });

    // Estrategia: Upsert si tenemos keyboardPwdId, create si no.
    // (Con @@unique([lockId, keyboardPwdId]) no duplicas cuando viene el ID.)
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
        // Si TTLock no devolvió keyboardPwdId, guardamos un registro simple (puede repetirse si reintentas)
        await prisma.passcode.create({ data: row });
        saved++;
      }
    }

    return res.json({
      ok: true,
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
      error: "Error creando passcode en todas las cerraduras",
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
      } catch (err) {
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
