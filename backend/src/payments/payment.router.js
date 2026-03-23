const express = require("express");
const router = express.Router();

const {
  createIntent,
  confirm,
  getStatus,
  getByReserva,
  webhook,
} = require("./payment.controller");

router.post("/create-intent", createIntent);
router.post("/confirm", confirm);
router.get("/status/:id", getStatus);
router.get("/by-reserva/:numeroReserva", getByReserva);
router.post("/webhook", webhook);

module.exports = router;
