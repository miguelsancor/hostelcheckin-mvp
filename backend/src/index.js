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

// ✅ NUEVO: rutas de pagos
const paymentRoutes = require("./payments/payment.router");

const app = express();

app.use(cors());
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));

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
app.use("/api", checkinRoutes);               // /api/checkin, /api/checkin/...
app.use("/api/nobeds", nobedsRoutes);         // /api/nobeds/reserva/:id, /reservas
app.use("/api/tra", traRoutes);               // /api/tra/status/:reserva, /retry/:reserva
app.use("/api/payments", paymentRoutes);      // ✅ /api/payments/bold/create, /api/payments/:numeroReserva
app.use("/api/agent", agentRoutes);            // /api/agent/query
app.use("/mcp", mcpRoutes);                   // /mcp/create-key, etc.
app.use("/admin/auth", adminAuthRoutes);      // /admin/auth/login
app.use("/admin", adminRoutes);               // /admin/huespedes, /stats, etc.

/* ============================================================
   HEALTHCHECK
   ============================================================ */
app.get("/health", (_req, res) => {
  return res.json({
    ok: true,
    service: "hostelcheckin-backend"
  });
});

/* ============================================================
   404
   ============================================================ */
app.use((req, res) => {
  return res.status(404).json({
    ok: false,
    message: "Ruta no encontrada"
  });
});

/* ============================================================
   MANEJO GLOBAL DE ERRORES
   ============================================================ */
app.use((err, _req, res, _next) => {
  console.error("❌ Error no controlado:", err);
  return res.status(500).json({
    ok: false,
    message: "Error interno del servidor"
  });
});

/* ============================================================
   SERVER
   ============================================================ */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en http://localhost:${PORT}`);
});