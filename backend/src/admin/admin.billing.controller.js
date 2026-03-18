const prisma = require("../utils/prismaClient");

// Guardar o actualizar el cobro de una reserva
async function saveReservaCobro(req, res) {
  try {
    const {
      numeroReserva,
      totalHospedaje,
      anticipo = 0,
      saldoPendiente,
      moneda = "COP",
    } = req.body || {};

    if (!numeroReserva) {
      return res.status(400).json({
        ok: false,
        error: "numeroReserva es obligatorio",
      });
    }

    if (totalHospedaje === undefined || totalHospedaje === null || isNaN(Number(totalHospedaje))) {
      return res.status(400).json({
        ok: false,
        error: "totalHospedaje es obligatorio y debe ser numérico",
      });
    }

    const total = Number(totalHospedaje);
    const anti = Number(anticipo || 0);

    let saldo = saldoPendiente;
    if (saldo === undefined || saldo === null || saldo === "") {
      saldo = total - anti;
    }

    saldo = Number(saldo);

    const data = await prisma.reservaCobro.upsert({
      where: { numeroReserva: String(numeroReserva) },
      update: {
        totalHospedaje: total,
        anticipo: anti,
        saldoPendiente: saldo,
        moneda: String(moneda || "COP"),
      },
      create: {
        numeroReserva: String(numeroReserva),
        totalHospedaje: total,
        anticipo: anti,
        saldoPendiente: saldo,
        moneda: String(moneda || "COP"),
      },
    });

    return res.json({
      ok: true,
      data,
      message: "Cobro guardado correctamente",
    });
  } catch (error) {
    console.error("saveReservaCobro error:", error);
    return res.status(500).json({
      ok: false,
      error: "Error guardando cobro de reserva",
      detail: error.message,
    });
  }
}

// Obtener cobro por número de reserva
async function getReservaCobro(req, res) {
  try {
    const { numeroReserva } = req.params;

    if (!numeroReserva) {
      return res.status(400).json({
        ok: false,
        error: "numeroReserva es obligatorio",
      });
    }

    const data = await prisma.reservaCobro.findUnique({
      where: { numeroReserva: String(numeroReserva) },
    });

    if (!data) {
      return res.status(404).json({
        ok: false,
        error: "No existe cobro para esa reserva",
      });
    }

    return res.json({
      ok: true,
      data,
    });
  } catch (error) {
    console.error("getReservaCobro error:", error);
    return res.status(500).json({
      ok: false,
      error: "Error consultando cobro de reserva",
      detail: error.message,
    });
  }
}

// Listar cobros
async function listReservaCobros(req, res) {
  try {
    const data = await prisma.reservaCobro.findMany({
      orderBy: {
        creadoEn: "desc",
      },
    });

    return res.json({
      ok: true,
      total: data.length,
      data,
    });
  } catch (error) {
    console.error("listReservaCobros error:", error);
    return res.status(500).json({
      ok: false,
      error: "Error listando cobros",
      detail: error.message,
    });
  }
}

module.exports = {
  saveReservaCobro,
  getReservaCobro,
  listReservaCobros,
};