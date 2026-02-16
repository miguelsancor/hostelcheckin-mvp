const express = require("express");
const router = express.Router();

const {
  statusByReserva,
  retryByReserva,
  forceProcess,
} = require("./tra.controller");

// Semáforo
router.get("/status/:numeroReserva", statusByReserva);

// Reintentar (si quedó rojo)
router.post("/retry/:numeroReserva", retryByReserva);

// (opcional) forzar procesamiento inmediato para pruebas
router.post("/process/:numeroReserva", forceProcess);

module.exports = router;
