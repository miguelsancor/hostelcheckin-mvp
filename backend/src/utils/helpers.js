const crypto = require("crypto");

const nowMs = () => Date.now();

function generarNumeroReserva() {
  const timestamp = Date.now().toString().slice(-8);
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${timestamp}-RES-${random}`;
}

const toStr = (v) => (v === undefined || v === null ? "" : String(v));

const toDateStr = (v, fallbackDate) => {
  const d = v ? new Date(v) : fallbackDate;
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

module.exports = {
  nowMs,
  generarNumeroReserva,
  toStr,
  toDateStr,
};
