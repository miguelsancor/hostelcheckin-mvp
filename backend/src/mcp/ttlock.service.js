const axios = require("axios");
const crypto = require("crypto");
const { nowMs } = require("../utils/helpers");

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
  _tt_expiresAt =
    Date.now() + parseInt(data.expires_in || "7200", 10) * 1000;
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

module.exports = {
  TTLOCK_BASE,
  getAccessToken,
  ttPost,
};
