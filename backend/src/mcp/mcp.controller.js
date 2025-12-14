const { nowMs } = require("../utils/helpers");
const { TTLOCK_BASE, getAccessToken, ttPost } = require("./ttlock.service");

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
   Crear mismo passcode en todas las cerraduras
   ======================================================================= */
async function createPasscodeAll(req, res) {
  try {
    const { code, startAt, endAt, name } = req.body || {};

    if (!startAt || !endAt || !code) {
      return res.status(400).json({
        ok: false,
        error: "code, startAt y endAt son obligatorios",
      });
    }

    const accessToken = await getAccessToken();

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
        lockAlias: key.lockAlias || null,      // 👈 AQUI EL CAMBIO
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
    console.error(
      "ERROR /create-passcode-all:",
      err?.response?.data || err.message
    );
    return res.status(500).json({
      ok: false,
      error: "Error creando passcode en todas las cerraduras",
    });
  }
}

/* =======================================================================
   Listar PASSCODES de todas las cerraduras (robusto / hotel-safe)
   ======================================================================= */
   async function listPasscodesAll(req, res) {
    try {
      const accessToken = await getAccessToken();
  
      // 1. Obtener cerraduras accesibles vía eKeys
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
  
      // 2. Por cada cerradura, intentar listar passcodes
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
          // 🔒 Cerradura sin soporte de passcodes (404 Tomcat)
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
