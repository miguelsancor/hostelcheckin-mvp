const express = require("express");
const router = express.Router();

const {
  createBold,
  getPayment
} = require("./payment.controller");

router.post("/bold/create", createBold);
router.get("/:numeroReserva", getPayment);

module.exports = router;