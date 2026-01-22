const prisma = require("../utils/prismaClient");
const { nowMs } = require("../utils/helpers");
const { getAccessToken, ttPost } = require("../mcp/ttlock.service");


/* =======================================================================
   ADMIN - LISTA / DETALLE / DELETE
   ======================================================================= */
async function listarHuespedes(_req, res) {
  try {
    const lista = await prisma.huesped.findMany({
      orderBy: { creadoEn: "desc" },
    });

    res.json({ ok: true, total: lista.length, data: lista });
  } catch (e) {
    console.error("admin/huespedes:", e);
    res.status(500).json({ ok: false, error: "Error interno" });
  }
}

async function detalleHuesped(req, res) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id))
      return res.status(400).json({ ok: false, error: "ID inválido" });

    const huesped = await prisma.huesped.findUnique({ where: { id } });

    if (!huesped)
      return res.status(404).json({ ok: false, error: "No encontrado" });

    res.json({ ok: true, data: huesped });
  } catch (e) {
    console.error("detalle huesped:", e);
    res.status(500).json({ ok: false });
  }
}

async function eliminarHuesped(req, res) {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ ok: false, error: "ID inválido" });
    }

    // 1) Validar huésped
    const huesped = await prisma.huesped.findUnique({ where: { id } });
    if (!huesped) {
      return res.status(404).json({ ok: false, error: "No encontrado" });
    }

    // 2) Buscar passcodes asociados en BD
    const passcodes = await prisma.passcode.findMany({
      where: { huespedId: id },
      select: { id: true, lockId: true, keyboardPwdId: true, lockAlias: true },
    });

    const resultadosTTLock = [];

    // 3) Borrar en TTLock (si hay passcodes y tienen ids válidos)
    if (passcodes.length > 0) {
      const accessToken = await getAccessToken();

      for (const p of passcodes) {
        if (!p.lockId || !p.keyboardPwdId) {
          resultadosTTLock.push({
            passcodeId: p.id,
            lockId: p.lockId ?? null,
            lockAlias: p.lockAlias ?? null,
            keyboardPwdId: p.keyboardPwdId ?? null,
            ok: false,
            warning: "Sin lockId o keyboardPwdId (no se puede borrar en TTLock)",
          });
          continue;
        }

        try {
          const r = await ttPost("/v3/keyboardPwd/delete", {
            clientId: process.env.TTLOCK_CLIENT_ID,
            accessToken,
            lockId: p.lockId,
            keyboardPwdId: p.keyboardPwdId,
            date: nowMs(),
          });

          resultadosTTLock.push({
            passcodeId: p.id,
            lockId: p.lockId,
            lockAlias: p.lockAlias ?? null,
            keyboardPwdId: p.keyboardPwdId,
            ok: parseInt(r?.errcode ?? -1, 10) === 0,
            result: r,
          });
        } catch (err) {
          resultadosTTLock.push({
            passcodeId: p.id,
            lockId: p.lockId,
            lockAlias: p.lockAlias ?? null,
            keyboardPwdId: p.keyboardPwdId,
            ok: false,
            error: err?.response?.data || err.message,
          });
        }
      }
    }

    // 4) Borrar en BD (Passcodes -> Huésped)
    await prisma.passcode.deleteMany({ where: { huespedId: id } });
    await prisma.huesped.delete({ where: { id } });

    return res.json({
      ok: true,
      deletedHuespedId: id,
      totalPasscodes: passcodes.length,
      resultadosTTLock,
    });
  } catch (e) {
    console.error("admin delete:", e?.response?.data || e.message);
    return res.status(500).json({ ok: false, error: "No se pudo eliminar" });
  }
}


/* =======================================================================
   ADMIN - GUARDAR / ACTUALIZAR CHECKIN URL
   ======================================================================= */
async function actualizarCheckinUrlPorId(req, res) {
  try {
    const id = Number(req.params.id);
    const { checkinUrl } = req.body;

    if (!id || !checkinUrl) {
      return res
        .status(400)
        .json({ ok: false, error: "Datos inválidos" });
    }

    const existe = await prisma.huesped.findUnique({
      where: { id },
    });

    if (!existe) {
      return res
        .status(404)
        .json({ ok: false, error: "Huésped no encontrado" });
    }

    await prisma.huesped.update({
      where: { id },
      data: { checkinUrl },
    });

    res.json({ ok: true });
  } catch (e) {
    console.error("error guardar checkinUrl:", e);
    res
      .status(500)
      .json({ ok: false, error: "Error al guardar checkinUrl" });
  }
}

/* =======================================================================
   ADMIN - CHECKIN POR NUMERO DE RESERVA (UPSERT REAL)
   ======================================================================= */
async function actualizarCheckinPorReserva(req, res) {
  try {
    const { numeroReserva, checkinUrl } = req.body;

    if (!numeroReserva || !checkinUrl) {
      return res
        .status(400)
        .json({ ok: false, error: "Datos incompletos" });
    }

    const existente = await prisma.huesped.findUnique({
      where: { numeroReserva: String(numeroReserva) },
    });

    if (!existente) {
      return res.status(404).json({
        ok: false,
        error:
          "No existe un huésped real para esta reserva. Debe llenarse el formulario primero.",
      });
    }

    await prisma.huesped.update({
      where: { numeroReserva: String(numeroReserva) },
      data: { checkinUrl },
    });

    return res.json({ ok: true, action: "updated" });
  } catch (e) {
    console.error("error guardar checkinUrl por reserva:", e);
    res
      .status(500)
      .json({ ok: false, error: "Error al guardar checkinUrl" });
  }
}

/* =======================================================================
   ADMIN - STATS
   ======================================================================= */
async function stats(req, res) {
  try {
    const hoyInicio = new Date();
    hoyInicio.setHours(0, 0, 0, 0);

    const semanaInicio = new Date();
    semanaInicio.setDate(semanaInicio.getDate() - 7);

    const mesInicio = new Date();
    mesInicio.setDate(1);

    const hoy = await prisma.huesped.count({
      where: { creadoEn: { gte: hoyInicio } },
    });

    const semana = await prisma.huesped.count({
      where: { creadoEn: { gte: semanaInicio } },
    });

    const mes = await prisma.huesped.count({
      where: { creadoEn: { gte: mesInicio } },
    });

    res.json({ ok: true, hoy, semana, mes });
  } catch (e) {
    console.error("stats:", e);
    res.status(500).json({ ok: false });
  }
}

/* =======================================================================
   ADMIN - METRICS
   ======================================================================= */
async function metrics(_req, res) {
  try {
    const total = await prisma.huesped.count();

    const hoyInicio = new Date();
    hoyInicio.setHours(0, 0, 0, 0);

    const hoyFin = new Date();
    hoyFin.setHours(23, 59, 59, 999);

    const hoy = await prisma.huesped.count({
      where: { creadoEn: { gte: hoyInicio, lte: hoyFin } },
    });

    const mesInicio = new Date();
    mesInicio.setDate(1);
    mesInicio.setHours(0, 0, 0, 0);

    const mes = await prisma.huesped.count({
      where: { creadoEn: { gte: mesInicio } },
    });

    const ultima = await prisma.huesped.findFirst({
      orderBy: { creadoEn: "desc" },
    });

    res.json({
      ok: true,
      total,
      hoy,
      mes,
      ultimaReserva: ultima?.numeroReserva || "N/A",
    });
  } catch (err) {
    console.error("metrics error:", err);
    res.status(500).json({ ok: false });
  }
}

module.exports = {
  listarHuespedes,
  detalleHuesped,
  eliminarHuesped,
  actualizarCheckinUrlPorId,
  actualizarCheckinPorReserva,
  stats,
  metrics,
};
