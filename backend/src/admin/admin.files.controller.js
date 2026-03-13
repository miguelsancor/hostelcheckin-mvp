const path = require("path");
const fs = require("fs");

const UPLOADS_DIR = path.resolve(__dirname, "../../uploads");

function getFile(req, res) {
  try {
    const rawFile = String(req.params.file || "").trim();

    if (!rawFile) {
      return res.status(400).json({ ok: false, error: "Falta archivo" });
    }

    const safeName = path.basename(rawFile);
    const fullPath = path.join(UPLOADS_DIR, safeName);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ ok: false, error: "Archivo no encontrado" });
    }

    return res.sendFile(fullPath);
  } catch (error) {
    console.error("admin file error:", error);
    return res.status(500).json({ ok: false, error: "Error interno" });
  }
}

module.exports = {
  getFile,
};
