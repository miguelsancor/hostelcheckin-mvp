const prisma = require("../utils/prismaClient");

async function upsertReservaCobro(data) {
  const {
    numeroReserva,
    huespedId,
    totalHospedaje,
    anticipo,
    saldoPendiente,
    moneda,
    estadoPago,
    observacion,
  } = data;

  return prisma.reservaCobro.upsert({
    where: {
      numeroReserva,
    },
    update: {
      huespedId: huespedId ?? undefined,
      totalHospedaje,
      anticipo,
      saldoPendiente,
      moneda,
      estadoPago,
      observacion: observacion ?? null,
      metadata: {
        updatedFrom: "admin-dashboard",
        updatedAt: new Date().toISOString(),
      },
    },
    create: {
      numeroReserva,
      huespedId: huespedId ?? null,
      totalHospedaje,
      anticipo,
      saldoPendiente,
      moneda,
      estadoPago,
      observacion: observacion ?? null,
      metadata: {
        createdFrom: "admin-dashboard",
        createdAt: new Date().toISOString(),
      },
    },
  });
}

async function getReservaCobroByReserva(numeroReserva) {
  return prisma.reservaCobro.findUnique({
    where: { numeroReserva },
  });
}

async function getAllReservaCobros() {
  return prisma.reservaCobro.findMany({
    orderBy: { actualizadoEn: "desc" },
  });
}

module.exports = {
  upsertReservaCobro,
  getReservaCobroByReserva,
  getAllReservaCobros,
};