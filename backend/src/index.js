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
const { requireAdminAuth } = require("./admin/admin.auth.middleware");

// ✅ rutas TRA
const traRoutes = require("./tra/tra.routes");

const app = express();

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
   SERVIR ARCHIVOS SUBIDOS (compatibilidad actual)
   ============================================================ */
const uploadsPath = path.join(__dirname, "..", "uploads");

app.get("/uploads/:file", (req, res) => {
  const filename = req.params.file;
  const filepath = path.join(process.cwd(), "uploads", filename);

  if (!fs.existsSync(filepath)) {
    return res.status(404).send("Archivo no encontrado");
  }

  const mimeType = mime.lookup(filepath) || "application/octet-stream";

  res.setHeader("Content-Type", mimeType);
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Access-Control-Allow-Origin", "*");

  res.sendFile(filepath);
});

console.log("📁 Carpeta de uploads sirviéndose desde:", uploadsPath);

/* ============================================================
   HEALTHCHECK
   ============================================================ */
app.get("/health", (_req, res) => res.json({ ok: true }));

/* ============================================================
   RUTAS PÚBLICAS PRINCIPALES
   ============================================================ */
app.use("/api", checkinRoutes);        // /api/checkin, /api/checkin/...
app.use("/api/nobeds", nobedsRoutes);  // /api/nobeds/reserva/:id, /reservas
app.use("/api/tra", traRoutes);        // /api/tra/status/:reserva, /retry/:reserva

/* ============================================================
   AUTH ADMIN NUEVO
   ============================================================ */
app.use("/api/admin/auth", adminAuthRoutes);

/* ============================================================
   ARCHIVOS ADMIN PROTEGIDOS
   ============================================================ */
app.use("/api/admin/uploads", requireAdminAuth, adminFilesRoutes);

/* ============================================================
   MCP
   Dejamos ambos prefijos para no romper nada:
   - legado: /mcp
   - nuevo:  /api/mcp
   ============================================================ */
app.use("/mcp", mcpRoutes);
app.use("/api/mcp", mcpRoutes);

/* ============================================================
   ADMIN
   Dejamos ambos prefijos:
   - legado: /admin
   - nuevo:  /api/admin
   OJO: /api/admin/auth ya está montado arriba y no se pisa.
   ============================================================ */
app.use("/admin", adminRoutes);
app.use("/api/admin", requireAdminAuth, adminRoutes);

/* ============================================================
   SERVER
   ============================================================ */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en http://localhost:${PORT}`);
});
