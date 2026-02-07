const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const express = require("express");
const cors = require("cors");

const checkinRoutes = require("./checkin/checkin.routes");
const nobedsRoutes = require("./nobeds/nobeds.routes");
const mcpRoutes = require("./mcp/mcp.routes");
const adminRoutes = require("./admin/admin.routes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

/* ============================================================
   🔥 SERVIR ARCHIVOS SUBIDOS (IMÁGENES / FIRMAS / DOCUMENTOS)
   ============================================================ */
const uploadsPath = path.join(__dirname, "..", "uploads");
const fs = require("fs");
const mime = require("mime-types");

/* ==========================================
   SERVIR ARCHIVOS DE UPLOADS CON MIME REAL
   ========================================== */
app.get("/uploads/:file", (req, res) => {
  const filename = req.params.file;
  const filepath = path.join(process.cwd(), "uploads", filename);

  if (!fs.existsSync(filepath)) {
    return res.status(404).send("Archivo no encontrado");
  }

  // Detectar tipo MIME correcto
  const mimeType = mime.lookup(filepath) || "application/octet-stream";

  res.setHeader("Content-Type", mimeType);
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Access-Control-Allow-Origin", "*");

  res.sendFile(filepath);
});


console.log("📁 Carpeta de uploads sirviéndose desde:", uploadsPath);

/* ============================================================
   RUTAS PRINCIPALES
   ============================================================ */
app.use("/api", checkinRoutes);        // /api/checkin, /api/checkin/...
app.use("/api/nobeds", nobedsRoutes);  // /api/nobeds/reserva/:id, /reservas
app.use("/mcp", mcpRoutes);            // /mcp/create-key, etc.
app.use("/admin", adminRoutes);        // /admin/huespedes, /stats, etc.

/* ============================================================
   HEALTHCHECK
   ============================================================ */
app.get("/health", (_req, res) => res.json({ ok: true }));

/* ============================================================
   SERVER
   ============================================================ */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en http://localhost:${PORT}`);
});
