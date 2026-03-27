const express = require("express");
const router = express.Router();
const { handleQuery } = require("./agent.controller");

// POST /api/agent/query
router.post("/query", handleQuery);

module.exports = router;
