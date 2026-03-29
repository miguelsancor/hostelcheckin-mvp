const express = require("express");
const router = express.Router();

const {
  listarHuespedes,
  detalleHuesped,
  eliminarHuesped,
  actualizarCheckinUrlPorId,
  actualizarCheckinPorReserva,
  stats,
  metrics,
  getRoomLocksMap,
  addRoomLockEntry,
  updateRoomLockEntry,
  deleteRoomLockEntry,
} = require("./admin.controller");

const {
  saveReservaCobro,
  getReservaCobro,
  listReservaCobros,
} = require("./admin.billing.controller");

// ============================================================
// HUÉSPEDES
// ============================================================

// /admin/huespedes
router.get("/huespedes", listarHuespedes);

// /admin/huesped/:id
router.get("/huesped/:id", detalleHuesped);

// /admin/huespedes/:id (DELETE)
router.delete("/huespedes/:id", eliminarHuesped);

// /admin/huesped/:id/checkin
router.put("/huesped/:id/checkin", actualizarCheckinUrlPorId);

// /admin/huesped/checkin-por-reserva
router.put("/huesped/checkin-por-reserva", actualizarCheckinPorReserva);

// ============================================================
// STATS / MÉTRICAS
// ============================================================

// /admin/stats
router.get("/stats", stats);

// /admin/metrics
router.get("/metrics", metrics);

// ============================================================
// COBROS / VALOR HOSPEDAJE
// ============================================================

// /admin/cobros
router.get("/cobros", listReservaCobros);

// /admin/cobros/:numeroReserva
router.get("/cobros/:numeroReserva", getReservaCobro);

// /admin/cobros
router.post("/cobros", saveReservaCobro);

// ============================================================
// ROOM LOCKS MAP (MAPEO HABITACIONES)
// ============================================================

// /admin/room-locks-map
router.get("/room-locks-map", getRoomLocksMap);
router.post("/room-locks-map", addRoomLockEntry);
router.put("/room-locks-map/:roomId", updateRoomLockEntry);
router.delete("/room-locks-map/:roomId", deleteRoomLockEntry);

module.exports = router;