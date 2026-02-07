const prisma = require("../utils/prismaClient");

const SESSION_TTL_MS = 6 * 60 * 60 * 1000; // 6 horas

function newToken() {
  return (
    (globalThis.crypto && globalThis.crypto.randomUUID && globalThis.crypto.randomUUID()) ||
    require("crypto").randomUUID()
  );
}

function pickNumeroReserva(reserva) {
  return String(
    reserva?.numeroReserva ||
      reserva?.order_id ||
      reserva?.numero ||
      ""
  ).trim();
}

/**
 * POST /api/checkin/session
 * body: { reserva, formList }
 * return: { ok:true, token, shareUrl }
 */
async function createSession(req, res) {
  try {
    const { reserva, formList } = req.body || {};
    const numeroReserva = pickNumeroReserva(reserva);

    if (!numeroReserva) {
      return res.status(400).json({ ok: false, message: "Falta numeroReserva en reserva" });
    }

    const token = newToken();
    const expiracion = new Date(Date.now() + SESSION_TTL_MS);

    const payload = {
      reserva: reserva || null,
      formList: Array.isArray(formList) ? formList : [],
    };

    // Upsert por numeroReserva: si ya existe, actualiza token/payload/expiracion
    await prisma.checkinSession.upsert({
      where: { numeroReserva },
      update: {
        token,
        payload,
        expiracion,
        checkinUrl: null,
      },
      create: {
        numeroReserva,
        token,
        payload,
        expiracion,
        checkinUrl: null,
      },
    });

    return res.json({ ok: true, token, shareUrl: `/checkin?t=${encodeURIComponent(token)}` });
  } catch (e) {
    console.error("createSession error:", e);
    return res.status(500).json({ ok: false, message: "Error creando sesión" });
  }
}

/**
 * GET /api/checkin/session/:token
 * return: { ok:true, reserva, formList }
 */
async function getSession(req, res) {
  try {
    const token = String(req.params.token || "").trim();
    if (!token) return res.status(400).json({ ok: false, message: "Falta token" });

    const sess = await prisma.checkinSession.findUnique({ where: { token } });

    if (!sess) return res.status(404).json({ ok: false, message: "Sesión no existe" });

    // expirada
    if (sess.expiracion && new Date(sess.expiracion).getTime() < Date.now()) {
      return res.status(404).json({ ok: false, message: "Sesión expiró" });
    }

    const payload = sess.payload || {};
    const reserva = payload.reserva || null;
    const formList = Array.isArray(payload.formList) ? payload.formList : [];

    // (Opcional) marca “usadoEn” la primera vez
    if (!sess.usadoEn) {
      await prisma.checkinSession.update({
        where: { token },
        data: { usadoEn: new Date() },
      });
    }

    return res.json({ ok: true, reserva, formList });
  } catch (e) {
    console.error("getSession error:", e);
    return res.status(500).json({ ok: false, message: "Error obteniendo sesión" });
  }
}

/**
 * PUT /api/checkin/session/:token
 * body: { reserva, formList }
 * return: { ok:true }
 */
async function saveSession(req, res) {
  try {
    const token = String(req.params.token || "").trim();
    if (!token) return res.status(400).json({ ok: false, message: "Falta token" });

    const sess = await prisma.checkinSession.findUnique({ where: { token } });
    if (!sess) return res.status(404).json({ ok: false, message: "Sesión no existe" });

    // expirada
    if (sess.expiracion && new Date(sess.expiracion).getTime() < Date.now()) {
      return res.status(404).json({ ok: false, message: "Sesión expiró" });
    }

    const { reserva, formList } = req.body || {};
    const payload = {
      reserva: reserva || null,
      formList: Array.isArray(formList) ? formList : [],
    };

    await prisma.checkinSession.update({
      where: { token },
      data: { payload },
    });

    return res.json({ ok: true });
  } catch (e) {
    console.error("saveSession error:", e);
    return res.status(500).json({ ok: false, message: "Error guardando sesión" });
  }
}

module.exports = { createSession, getSession, saveSession };
