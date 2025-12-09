const express = require("express");
const router = express.Router();

const {
  getReservaById,
  getTodasReservas,
} = require("./nobeds.controller");

// /api/nobeds/reserva/:orderId
router.get("/reserva/:orderId", getReservaById);

// /api/nobeds/reservas
router.get("/reservas", getTodasReservas);

module.exports = router;
