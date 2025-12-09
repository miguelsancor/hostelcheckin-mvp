const path = require("path");
const fs = require("fs");
const multer = require("multer");

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({ dest: uploadsDir });

module.exports = {
  upload,
  uploadsDir,
};
