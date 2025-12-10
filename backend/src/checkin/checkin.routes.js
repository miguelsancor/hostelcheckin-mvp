const express = require("express");
const router = express.Router();

const { upload } = require("../utils/upload");
const {
  postCheckinSimple,
  postCheckinMultiple,
  buscarReserva,
  huespedesHoy,
  contactos,
  buscarCombinado,
  getByNumeroReserva,
} = require("./checkin.controller");

// /api/checkin (simple con archivos dinámicos)
router.post("/checkin", upload.any(), postCheckinSimple);

router.post("/checkin/guardar-multiple", upload.any(), postCheckinMultiple);

router.post("/checkin/buscar", buscarReserva);

router.get("/checkin/hoy", huespedesHoy);

router.get("/checkin/contactos", contactos);

router.get("/checkin/buscar-combinado/:valor", buscarCombinado);

router.get("/checkin/por-reserva/:numeroReserva", getByNumeroReserva);

module.exports = router;
