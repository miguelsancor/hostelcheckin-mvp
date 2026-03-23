const {
  createPaymentIntent,
  confirmPayment,
  getPaymentById,
  getPaymentByReserva,
  handleWebhook,
} = require("./payment.service");

const MOCK_MODE = (process.env.PAYMENT_MOCK_MODE || "true").toLowerCase() === "true";

/* ── POST /api/payments/create-intent ── */
async function createIntent(req, res) {
  try {
    const { numeroReserva, monto, canal, descripcion } = req.body;

    if (!numeroReserva || !monto) {
      return res.status(400).json({ ok: false, message: "numeroReserva y monto son obligatorios" });
    }

    const validCanals = ["BOLD", "BILLETERO", "DATAFONO"];
    const normalizedCanal = (canal || "BOLD").toUpperCase();
    if (!validCanals.includes(normalizedCanal)) {
      return res.status(400).json({ ok: false, message: `Canal inválido. Válidos: ${validCanals.join(", ")}` });
    }

    const payment = await createPaymentIntent({
      numeroReserva,
      monto: Number(monto),
      canal: normalizedCanal,
      descripcion,
      metadata: { mock: MOCK_MODE, createdVia: "create-intent" },
    });

    let checkoutUrl = null;

    if (normalizedCanal === "BOLD") {
      if (MOCK_MODE) {
        checkoutUrl = `https://bold.co/pay/demo/${payment.id}`;
      } else {
        // TODO: integrate real Bold API to generate checkout URL
        const boldApiUrl = process.env.BOLD_API_URL;
        const boldApiKey = process.env.BOLD_API_KEY;
        if (boldApiUrl && boldApiKey) {
          checkoutUrl = `${boldApiUrl}/checkout/${payment.id}`;
        }
      }
    }

    return res.json({
      ok: true,
      payment: {
        id: payment.id,
        estado: payment.estado,
        canal: payment.canal,
        monto: payment.monto,
        moneda: payment.moneda,
        referencia: payment.referencia,
      },
      checkoutUrl,
      mock: MOCK_MODE,
    });
  } catch (error) {
    console.error("Error createIntent:", error);
    return res.status(500).json({ ok: false, message: "Error creando intención de pago" });
  }
}

/* ── POST /api/payments/confirm ── */
async function confirm(req, res) {
  try {
    const { paymentId, referencia } = req.body;

    if (!paymentId) {
      return res.status(400).json({ ok: false, message: "paymentId es obligatorio" });
    }

    const existing = await getPaymentById(paymentId);
    if (!existing) {
      return res.status(404).json({ ok: false, message: "Pago no encontrado" });
    }

    if (existing.estado === "APPROVED") {
      return res.json({ ok: true, message: "Ya estaba aprobado", payment: existing });
    }

    const ref = referencia || (MOCK_MODE ? `MOCK-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}` : null);

    const updated = await confirmPayment({
      paymentId,
      referencia: ref,
      metadata: { ...(existing.metadata || {}), confirmedAt: new Date().toISOString(), mock: MOCK_MODE },
    });

    return res.json({ ok: true, payment: updated });
  } catch (error) {
    console.error("Error confirm:", error);
    return res.status(500).json({ ok: false, message: "Error confirmando pago" });
  }
}

/* ── GET /api/payments/status/:id ── */
async function getStatus(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ ok: false, message: "ID inválido" });
    }

    const payment = await getPaymentById(id);
    if (!payment) {
      return res.status(404).json({ ok: false, message: "Pago no encontrado" });
    }

    return res.json({ ok: true, payment });
  } catch (error) {
    console.error("Error getStatus:", error);
    return res.status(500).json({ ok: false, message: "Error consultando estado" });
  }
}

/* ── GET /api/payments/by-reserva/:numeroReserva ── */
async function getByReserva(req, res) {
  try {
    const { numeroReserva } = req.params;
    const payment = await getPaymentByReserva(numeroReserva);
    return res.json({ ok: true, payment });
  } catch (error) {
    console.error("Error getByReserva:", error);
    return res.status(500).json({ ok: false });
  }
}

/* ── POST /api/payments/webhook ── */
async function webhook(req, res) {
  try {
    const { referencia, estado, metadata } = req.body;

    if (!referencia) {
      return res.status(400).json({ ok: false, message: "referencia es obligatoria" });
    }

    const updated = await handleWebhook({ referencia, estado, metadata });

    if (!updated) {
      return res.status(404).json({ ok: false, message: "Pago con esa referencia no encontrado" });
    }

    return res.json({ ok: true, payment: updated });
  } catch (error) {
    console.error("Error webhook:", error);
    return res.status(500).json({ ok: false, message: "Error procesando webhook" });
  }
}

module.exports = {
  createIntent,
  confirm,
  getStatus,
  getByReserva,
  webhook,
};
