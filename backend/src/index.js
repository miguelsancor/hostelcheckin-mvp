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

// Rutas principales
app.use("/api", checkinRoutes);        // /api/checkin, /api/checkin/...
app.use("/api/nobeds", nobedsRoutes);  // /api/nobeds/reserva/:id, /reservas
app.use("/mcp", mcpRoutes);            // /mcp/create-key, /mcp/locks, etc.
app.use("/admin", adminRoutes);        // /admin/huespedes, /stats, etc.

// Healthcheck simple
app.get("/health", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend corriendo en http://18.206.179.50:${PORT}`);
});
