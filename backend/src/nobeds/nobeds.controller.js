const axios = require("axios");

/* =======================================================================
   NOBEDS - reserva por orderId
   ======================================================================= */
async function getReservaById(req, res) {
  try {
    const { orderId } = req.params;
    if (!orderId)
      return res.status(400).json({ ok: false, error: "Falta orderId" });

    const url = `${process.env.NOBEDS_API}/${process.env.NOBEDS_TOKEN}?order_id=${orderId}`;
    const { data } = await axios.get(url, { timeout: 20000 });

    if (!data || !Array.isArray(data) || !data.length) {
      return res
        .status(404)
        .json({ ok: false, error: "Reserva no encontrada" });
    }

    res.json({ ok: true, reserva: data[0] });
  } catch (err) {
    console.error("error /api/nobeds/reserva:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
}

/* =======================================================================
   NOBEDS - todas las reservas
   ======================================================================= */
async function getTodasReservas(_req, res) {
  try {
    const url = `${process.env.NOBEDS_API}/${process.env.NOBEDS_TOKEN}`;
    const { data } = await axios.get(url, { timeout: 20000 });
    res.json({ ok: true, reservas: data });
  } catch (err) {
    console.error("error /api/nobeds/reservas:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
}

module.exports = {
  getReservaById,
  getTodasReservas,
};
