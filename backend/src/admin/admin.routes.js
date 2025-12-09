const express = require("express");
const router = express.Router();

const {
  listarHuespedes,
  detalleHuesped,
  eliminarHuesped,
  actualizarCheckinUrlPorId,
  actualizarCheckinPorReserva,
  stats,
  metrics,
} = require("./admin.controller");

// /admin/huespedes
router.get("/huespedes", listarHuespedes);

// /admin/huesped/:id
router.get("/huesped/:id", detalleHuesped);

// /admin/huespedes/:id (DELETE)
router.delete("/huespedes/:id", eliminarHuesped);

// /admin/huesped/:id/checkin
router.put("/huesped/:id/checkin", actualizarCheckinUrlPorId);

// /admin/huesped/checkin-por-reserva
router.put("/huesped/checkin-por-reserva", actualizarCheckinPorReserva);

// /admin/stats
router.get("/stats", stats);

// /admin/metrics
router.get("/metrics", metrics);

module.exports = router;
