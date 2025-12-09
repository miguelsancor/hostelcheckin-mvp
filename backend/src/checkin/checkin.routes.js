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

// /api/checkin  (simple)
router.post(
  "/checkin",
  upload.fields([{ name: "anverso" }, { name: "reverso" }, { name: "firma" }]),
  postCheckinSimple
);

// /api/checkin/guardar-multiple
router.post("/checkin/guardar-multiple", upload.any(), postCheckinMultiple);

// /api/checkin/buscar
router.post("/checkin/buscar", buscarReserva);

// /api/checkin/hoy
router.get("/checkin/hoy", huespedesHoy);

// /api/checkin/contactos
router.get("/checkin/contactos", contactos);

// /api/checkin/buscar-combinado/:valor
router.get("/checkin/buscar-combinado/:valor", buscarCombinado);

// /api/checkin/por-reserva/:numeroReserva
router.get("/checkin/por-reserva/:numeroReserva", getByNumeroReserva);

module.exports = router;
