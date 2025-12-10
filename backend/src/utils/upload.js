const path = require("path");
const fs = require("fs");
const multer = require("multer");
const crypto = require("crypto");

/* ============================================================
   CREAR DIRECTORIO uploads SI NO EXISTE
   ============================================================ */
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/* ============================================================
   MULTER — guarda archivo temporal sin extensión
   ============================================================ */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },

  filename: function (req, file, cb) {
    // Archivo temporal: sin extensión
    const tempName = crypto.randomBytes(16).toString("hex");
    cb(null, tempName);
  },
});

const upload = multer({ storage });

/* ============================================================
   RENOMBRAR AUTOMÁTICAMENTE A SU EXTENSIÓN REAL
   ============================================================ */

function getExtensionFromMime(mime) {
  if (!mime) return "jpg";

  const map = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/jpg": "jpg",
    "image/gif": "gif",
    "image/svg+xml": "svg",
  };

  return map[mime] || "jpg";
}

async function renameWithExtension(file) {
  if (!file) return null;

  const ext = getExtensionFromMime(file.mimetype);
  const newName = `${file.filename}.${ext}`;

  const tempPath = file.path;
  const finalPath = path.join(uploadDir, newName);

  await fs.promises.rename(tempPath, finalPath);

  return newName;
}

module.exports = {
  upload,
  renameWithExtension,
};
