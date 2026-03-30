/**
 * Document Reader — Routes
 * POST /api/document-reader/extract
 */
const express = require("express");
const { upload } = require("../utils/upload");
const { extractDocument } = require("./documentReader.controller");

const router = express.Router();

// POST /api/document-reader/extract — multipart con campo "documento"
router.post("/extract", upload.single("documento"), extractDocument);

module.exports = router;
