const prisma = require("../utils/prismaClient");

/**
 * Create a payment intent (supports any channel: BOLD, BILLETERO, DATAFONO)
 */
async function createPaymentIntent({ numeroReserva, monto, canal, descripcion, metadata }) {
  return prisma.pago.create({
    data: {
      numeroReserva,
      metodo: canal || "BOLD",
      estado: "PENDING",
      monto,
      moneda: "COP",
      canal: canal || "BOLD",
      descripcion: descripcion || null,
      metadata: metadata || {},
    },
  });
}

/**
 * Confirm a payment by its ID
 */
async function confirmPayment({ paymentId, referencia, metadata }) {
  return prisma.pago.update({
    where: { id: paymentId },
    data: {
      estado: "APPROVED",
      referencia: referencia || null,
      metadata: metadata || {},
    },
  });
}

/**
 * Get payment status by ID
 */
async function getPaymentById(id) {
  return prisma.pago.findUnique({ where: { id } });
}

/**
 * Get latest payment for a reservation
 */
async function getPaymentByReserva(numeroReserva) {
  return prisma.pago.findFirst({
    where: { numeroReserva },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Mark payment via webhook (external provider callback)
 */
async function handleWebhook({ referencia, estado, metadata }) {
  const existing = await prisma.pago.findFirst({
    where: { referencia },
    orderBy: { createdAt: "desc" },
  });

  if (!existing) return null;

  return prisma.pago.update({
    where: { id: existing.id },
    data: {
      estado: estado || "APPROVED",
      metadata: { ...(existing.metadata || {}), ...(metadata || {}), webhookAt: new Date().toISOString() },
    },
  });
}

module.exports = {
  createPaymentIntent,
  confirmPayment,
  getPaymentById,
  getPaymentByReserva,
  handleWebhook,
};
