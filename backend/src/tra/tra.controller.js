const prisma = require("../utils/prismaClient");
const { getTraStatus, retryTra, processTraForReserva } = require("./tra.service");

async function statusByReserva(req, res) {
  try {
    const numeroReserva = String(req.params.numeroReserva || "").trim();
    if (!numeroReserva) return res.status(400).json({ ok: false, error: "Falta numeroReserva" });

    const data = await getTraStatus(numeroReserva);
    return res.json({ ok: true, ...data });
  } catch (e) {
    console.error("TRA statusByReserva error:", e);
    return res.status(500).json({ ok: false, error: "Error interno" });
  }
}

async function retryByReserva(req, res) {
  try {
    const numeroReserva = String(req.params.numeroReserva || "").trim();
    if (!numeroReserva) return res.status(400).json({ ok: false, error: "Falta numeroReserva" });

    const out = await retryTra(numeroReserva);
    return res.json(out);
  } catch (e) {
    console.error("TRA retryByReserva error:", e);
    return res.status(500).json({ ok: false, error: "Error interno" });
  }
}

// (Opcional) Forzar procesado inmediato (debug)
async function forceProcess(req, res) {
  try {
    const numeroReserva = String(req.params.numeroReserva || "").trim();
    if (!numeroReserva) return res.status(400).json({ ok: false, error: "Falta numeroReserva" });

    const out = await processTraForReserva(numeroReserva);
    return res.json(out);
  } catch (e) {
    console.error("TRA forceProcess error:", e);
    return res.status(500).json({ ok: false, error: "Error interno" });
  }
}

module.exports = {
  statusByReserva,
  retryByReserva,
  forceProcess,
};
