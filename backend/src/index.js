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
const adminFilesRoutes = require("./admin/admin.files.routes");

// ✅ NUEVO: rutas TRA
const traRoutes = require("./tra/tra.routes");

// ✅ NUEVO: middleware auth admin
const { requireAdminAuth } = require("./admin/admin.auth.middleware");

const app = express();

/* ============================================================
   CORS
   ============================================================ */
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

/* ============================================================
   RUTAS PÚBLICAS
   ============================================================ */
app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api", checkinRoutes);        // /api/checkin, /api/checkin/...
app.use("/api/nobeds", nobedsRoutes);  // /api/nobeds/reserva/:id, /reservas
app.use("/api/tra", traRoutes);        // /api/tra/status/:reserva, /retry/:reserva

/* ============================================================
   AUTH ADMIN
   ============================================================ */
app.use("/api/admin/auth", adminAuthRoutes);

/* ============================================================
   ARCHIVOS ADMIN PROTEGIDOS
   ============================================================ */
app.use("/api/admin/uploads", requireAdminAuth, adminFilesRoutes);

/* ============================================================
   MCP
   IMPORTANTE:
   tu frontend llama /api/mcp/... por eso se monta así.
   ============================================================ */
app.use("/api/mcp", mcpRoutes);

/* ============================================================
   ADMIN PROTEGIDO
   IMPORTANTE:
   tu frontend llama /api/admin/huespedes y /api/admin/metrics
   ============================================================ */
app.use("/api/admin", requireAdminAuth, adminRoutes);

/* ============================================================
   OPCIONAL: bloquear acceso público directo a uploads
   ============================================================ */
app.get("/uploads/:file", (_req, res) => {
  return res.status(403).json({
    ok: false,
    error: "Acceso público deshabilitado",
  });
});

/* ============================================================
   DEBUG INFO
   ============================================================ */
const uploadsPath = path.join(__dirname, "..", "uploads");
console.log("📁 Carpeta de uploads detectada en:", uploadsPath);

/* ============================================================
   SERVER
   ============================================================ */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en http://localhost:${PORT}`);
});
