const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { extractDocument } = require("./document-reader.controller");

const router = express.Router();

const tempDir = path.join(process.cwd(), "uploads", "tmp");
fs.mkdirSync(tempDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, tempDir);
  },
  filename: (_req, file, cb) => {
    const safeOriginalName = String(file.originalname || "document")
      .replace(/\s+/g, "_")
      .replace(/[^\w.-]/g, "");
    cb(null, `${Date.now()}-${safeOriginalName}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("INVALID_FILE_TYPE"));
    }

    cb(null, true);
  },
});

router.post("/extract", upload.single("documento"), extractDocument);

module.exports = router;