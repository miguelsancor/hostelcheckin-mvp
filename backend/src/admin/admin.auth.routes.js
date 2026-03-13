const express = require("express");
const router = express.Router();

const {
  login,
  session,
  logout,
} = require("./admin.auth.controller");

const { requireAdminAuth } = require("./admin.auth.middleware");

router.post("/login", login);
router.get("/session", requireAdminAuth, session);
router.post("/logout", requireAdminAuth, logout);

module.exports = router;
