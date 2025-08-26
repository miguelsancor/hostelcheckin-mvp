const express = require("express");
const { sendKey, remoteUnlock, deleteKey } = require("./ttlockAdapter");
const router = express.Router();

function envCfg() {
  return {
    clientId: process.env.TTLOCK_CLIENT_ID,
    clientSecret: process.env.TTLOCK_CLIENT_SECRET,
    username: process.env.TTLOCK_USERNAME,
    password: process.env.TTLOCK_PASSWORD
  };
}

function ok(res, data, correlationId) {
  return res.json({ ok: true, correlationId, provider: "ttlock", result: data });
}
function fail(res, err, code = 400) {
  return res.status(code).json({ ok: false, error: typeof err === "string" ? err : (err?.message || err) });
}

router.post("/create-key", async (req, res) => {
  try {
    const { lockId, receiverUsername, endAt, startAt, keyName, remarks, correlationId } = req.body || {};
    if (!lockId || !receiverUsername || !endAt) return fail(res, "lockId, receiverUsername y endAt son requeridos");
    const r = await sendKey({ lockId, receiverUsername, endAt, startAt, keyName, remarks }, envCfg());
    if (parseInt(r.errcode ?? -1, 10) !== 0) return fail(res, r);
    return ok(res, r, correlationId);
  } catch (e) { return fail(res, e); }
});

router.post("/open-lock", async (req, res) => {
  try {
    const { lockId, correlationId } = req.body || {};
    if (!lockId) return fail(res, "lockId requerido");
    const r = await remoteUnlock(lockId, envCfg());
    if (parseInt(r.errcode ?? -1, 10) !== 0) return fail(res, r);
    return ok(res, r, correlationId);
  } catch (e) { return fail(res, e); }
});

router.post("/revoke-key", async (req, res) => {
  try {
    const { keyId, remarks, correlationId } = req.body || {};
    if (!keyId) return fail(res, "keyId requerido");
    const r = await deleteKey(keyId, remarks, envCfg());
    if (parseInt(r.errcode ?? -1, 10) !== 0) return fail(res, r);
    return ok(res, r, correlationId);
  } catch (e) { return fail(res, e); }
});

module.exports = router;
