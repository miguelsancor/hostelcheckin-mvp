const prisma = require("../utils/prismaClient");

async function createBoldPayment({ numeroReserva, monto, descripcion }) {
  const payment = await prisma.pago.create({
    data: {
      numeroReserva,
      metodo: "BOLD",
      estado: "PENDING",
      monto,
      descripcion,
      canal: "WEB",
      metadata: {}
    }
  });

  return payment;
}

async function markPaymentApproved({ referencia }) {
  return prisma.pago.updateMany({
    where: { referencia },
    data: {
      estado: "APPROVED"
    }
  });
}

async function getPaymentByReserva(numeroReserva) {
  return prisma.pago.findFirst({
    where: { numeroReserva },
    orderBy: { createdAt: "desc" }
  });
}

module.exports = {
  createBoldPayment,
  markPaymentApproved,
  getPaymentByReserva
};