const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const mime = require("mime-types");

const checkinRoutes = require("./checkin/checkin.routes");
const nobedsRoutes = require("./nobeds/nobeds.routes");
const mcpRoutes = require("./mcp/mcp.routes");
const adminRoutes = require("./admin/admin.routes");
const adminAuthRoutes = require("./admin/admin.auth.routes");
const traRoutes = require("./tra/tra.routes");
const agentRoutes = require("./agent/agent.routes");
const documentReaderRoutes = require("./document-reader/documentReader.routes");
const paymentRoutes = require("./payments/payment.router");

const app = express();

app.use(cors());
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* ============================================================
   🔥 SERVIR ARCHIVOS SUBIDOS (IMÁGENES / FIRMAS / DOCUMENTOS)
   ============================================================ */
const uploadsPath = path.join(__dirname, "..", "uploads");

/* ==========================================
   SERVIR ARCHIVOS DE UPLOADS CON MIME REAL
   ========================================== */
app.get("/uploads/:file", (req, res) => {
  try {
    const filename = req.params.file;
    const filepath = path.join(process.cwd(), "uploads", filename);

    if (!fs.existsSync(filepath)) {
      return res.status(404).send("Archivo no encontrado");
    }

    const mimeType = mime.lookup(filepath) || "application/octet-stream";

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Access-Control-Allow-Origin", "*");

    return res.sendFile(filepath);
  } catch (error) {
    console.error("❌ Error sirviendo archivo:", error);
    return res.status(500).send("Error sirviendo archivo");
  }
});

console.log("📁 Carpeta de uploads sirviéndose desde:", uploadsPath);

/* ============================================================
   RUTAS PRINCIPALES
   ============================================================ */
app.use("/api", checkinRoutes);
app.use("/api/nobeds", nobedsRoutes);
app.use("/api/tra", traRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/agent", agentRoutes);
app.use("/api/document-reader", documentReaderRoutes);
app.use("/mcp", mcpRoutes);
app.use("/admin/auth", adminAuthRoutes);
app.use("/admin", adminRoutes);

/* ============================================================
   HEALTHCHECK
   ============================================================ */
app.get("/health", (_req, res) => {
  return res.json({
    ok: true,
    service: "hostelcheckin-backend",
  });
});

/* ============================================================
   404
   ============================================================ */
app.use((req, res) => {
  return res.status(404).json({
    ok: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
});

/* ============================================================
   MANEJO GLOBAL DE ERRORES
   ============================================================ */
app.use((err, _req, res, _next) => {
  console.error("❌ Error no controlado:", err);

  if (err?.message === "INVALID_FILE_TYPE") {
    return res.status(400).json({
      ok: false,
      reason: "NOT_A_DOCUMENT",
    });
  }

  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      ok: false,
      reason: "LOW_RESOLUTION",
    });
  }

  return res.status(500).json({
    ok: false,
    message: "Error interno del servidor",
  });
});

/* ============================================================
   SERVER
   ============================================================ */
const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Backend corriendo en http://0.0.0.0:${PORT}`);
});