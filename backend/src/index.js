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
   🔥 SERVIR ARCHIVOS ESTÁTICOS DE /uploads
   Esto es lo que faltaba para que funcionen las imágenes
   ============================================================ */
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"))
);

// Rutas principales
app.use("/api", checkinRoutes);        
app.use("/api/nobeds", nobedsRoutes);  
app.use("/mcp", mcpRoutes);            
app.use("/admin", adminRoutes);        

// Healthcheck simple
app.get("/health", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend corriendo en http://localhost:${PORT}`);
});
