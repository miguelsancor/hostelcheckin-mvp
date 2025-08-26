const axios = require("axios");
const TTLOCK_BASE = "https://api.ttlock.com";

let _token = null;
let _expiresAt = 0;

function nowMs() { return Date.now(); }

async function getAccessToken({ clientId, clientSecret, username, password }) {
  const needs = !_token || Date.now() > _expiresAt - 30000;
  if (!needs) return _token;

  const { data } = await axios.post(
    `${TTLOCK_BASE}/oauth2/token`,
    new URLSearchParams({
      clientId, clientSecret, username, password, date: nowMs().toString()
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" }, timeout: 20000 }
  );

  if (!data.access_token) throw new Error("No access_token from TTLock");
  _token = data.access_token;
  _expiresAt = Date.now() + (parseInt(data.expires_in || "7200", 10) * 1000);
  return _token;
}

async function ttPost(path, body) {
  const { data } = await axios.post(
    `${TTLOCK_BASE}${path}`,
    new URLSearchParams(body),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" }, timeout: 20000 }
  );
  return data;
}

async function sendKey(params, env) {
  const accessToken = await getAccessToken(env);
  const payload = {
    clientId: env.clientId,
    accessToken,
    lockId: params.lockId,
    receiverUsername: params.receiverUsername,
    keyName: params.keyName || "GuestKey",
    remarks: params.remarks || "",
    startDate: params.startAt || nowMs(),
    endDate: params.endAt,
    date: nowMs()
  };
  return ttPost("/v3/key/send", payload);
}

async function remoteUnlock(lockId, env) {
  const accessToken = await getAccessToken(env);
  const payload = {
    clientId: env.clientId,
    accessToken,
    lockId,
    date: nowMs()
  };
  return ttPost("/v3/lock/remoteUnlock", payload);
}

async function deleteKey(keyId, remarks, env) {
  const accessToken = await getAccessToken(env);
  const payload = {
    clientId: env.clientId,
    accessToken,
    keyId,
    remarks: remarks || "",
    date: nowMs()
  };
  return ttPost("/v3/key/delete", payload);
}

module.exports = { sendKey, remoteUnlock, deleteKey };
