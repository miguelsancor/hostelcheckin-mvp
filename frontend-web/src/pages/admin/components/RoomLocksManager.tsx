import { useEffect, useState } from "react";
import {
  apiGetRoomLocksMap,
  apiAddRoomLockEntry,
  apiDeleteRoomLockEntry,
  type RoomLocksMap,
} from "../admin.api";

const ALIAS_PRESETS: Record<string, string[]> = {
  "Sede Ay": ["Door 1 Ay", "Door 2 Ay"],
  "Sede Yc": ["Door 1 Yc", "Door 2 Yc"],
};

export default function RoomLocksManager() {
  const [map, setMap] = useState<RoomLocksMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // form para agregar
  const [newRoomId, setNewRoomId] = useState("");
  const [newRoom, setNewRoom] = useState("");
  const [newSede, setNewSede] = useState("Sede Ay");

  const cargar = async () => {
    setLoading(true);
    try {
      const data = await apiGetRoomLocksMap();
      setMap(data);
    } catch {
      setError("No se pudo cargar el mapa de habitaciones");
    }
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const handleAdd = async () => {
    setError("");
    setSuccess("");
    if (!newRoomId.trim() || !newRoom.trim()) {
      setError("Room ID y nombre de habitación son obligatorios");
      return;
    }
    const aliases = ALIAS_PRESETS[newSede] || ALIAS_PRESETS["Sede Ay"];
    const { res, json } = await apiAddRoomLockEntry(newRoomId.trim(), newRoom.trim(), aliases);
    if (!res.ok) {
      setError(json?.error || "Error al agregar");
      return;
    }
    setSuccess(`✅ Habitación ${newRoom.toUpperCase()} (ID: ${newRoomId}) agregada correctamente`);
    setNewRoomId("");
    setNewRoom("");
    cargar();
  };

  const handleDelete = async (roomId: string, roomName: string) => {
    if (!confirm(`¿Eliminar mapeo de ${roomName} (${roomId})?`)) return;
    setError("");
    setSuccess("");
    const { res, json } = await apiDeleteRoomLockEntry(roomId);
    if (!res.ok) {
      setError(json?.error || "Error al eliminar");
      return;
    }
    setSuccess(`🗑️ Habitación ${roomName} eliminada`);
    cargar();
  };

  const entries = Object.entries(map).sort((a, b) => a[1].room.localeCompare(b[1].room));

  return (
    <div style={{ padding: "1rem 0" }}>
      <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>
        🏠 Mapeo de Habitaciones → Cerraduras
      </h3>
      <p style={{ fontSize: "0.85rem", color: "#aaa", margin: "0 0 1rem" }}>
        Cuando NoBeds envía un <code>room_id</code> desconocido, el sistema pedirá registrarlo aquí antes de generar el código TTLock.
      </p>

      {error && (
        <div style={{ background: "#dc262620", border: "1px solid #dc2626", color: "#f87171", padding: "0.5rem 0.75rem", borderRadius: 6, marginBottom: "0.75rem", fontSize: "0.85rem" }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ background: "#16a34a20", border: "1px solid #16a34a", color: "#4ade80", padding: "0.5rem 0.75rem", borderRadius: 6, marginBottom: "0.75rem", fontSize: "0.85rem" }}>
          {success}
        </div>
      )}

      {/* Formulario para agregar */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem", alignItems: "flex-end" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <label style={{ fontSize: "0.75rem", color: "#aaa" }}>Room ID (NoBeds)</label>
          <input
            value={newRoomId}
            onChange={(e) => setNewRoomId(e.target.value)}
            placeholder="ej: 2512560"
            style={{ padding: "0.4rem 0.6rem", borderRadius: 6, border: "1px solid #444", background: "#1a1a2e", color: "#fff", fontSize: "0.85rem", width: 130 }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <label style={{ fontSize: "0.75rem", color: "#aaa" }}>Nombre Habitación</label>
          <input
            value={newRoom}
            onChange={(e) => setNewRoom(e.target.value)}
            placeholder="ej: MUNAY"
            style={{ padding: "0.4rem 0.6rem", borderRadius: 6, border: "1px solid #444", background: "#1a1a2e", color: "#fff", fontSize: "0.85rem", width: 140 }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <label style={{ fontSize: "0.75rem", color: "#aaa" }}>Sede</label>
          <select
            value={newSede}
            onChange={(e) => setNewSede(e.target.value)}
            style={{ padding: "0.4rem 0.6rem", borderRadius: 6, border: "1px solid #444", background: "#1a1a2e", color: "#fff", fontSize: "0.85rem" }}
          >
            {Object.keys(ALIAS_PRESETS).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleAdd}
          style={{ padding: "0.4rem 1rem", borderRadius: 6, background: "#2563eb", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}
        >
          + Agregar
        </button>
      </div>

      {/* Tabla */}
      {loading ? (
        <p style={{ color: "#aaa" }}>Cargando...</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #333", color: "#aaa", textAlign: "left" }}>
                <th style={{ padding: "0.4rem 0.5rem" }}>Room ID</th>
                <th style={{ padding: "0.4rem 0.5rem" }}>Habitación</th>
                <th style={{ padding: "0.4rem 0.5rem" }}>Aliases (puertas)</th>
                <th style={{ padding: "0.4rem 0.5rem", width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {entries.map(([id, entry]) => (
                <tr key={id} style={{ borderBottom: "1px solid #222" }}>
                  <td style={{ padding: "0.4rem 0.5rem", color: "#93c5fd", fontFamily: "monospace" }}>{id}</td>
                  <td style={{ padding: "0.4rem 0.5rem", color: "#fff", fontWeight: 600 }}>{entry.room}</td>
                  <td style={{ padding: "0.4rem 0.5rem", color: "#aaa" }}>{entry.aliases.join(", ")}</td>
                  <td style={{ padding: "0.4rem 0.5rem" }}>
                    <button
                      onClick={() => handleDelete(id, entry.room)}
                      style={{ background: "#dc262630", color: "#f87171", border: "1px solid #dc262660", borderRadius: 4, padding: "0.2rem 0.5rem", cursor: "pointer", fontSize: "0.8rem" }}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: "1rem", textAlign: "center", color: "#666" }}>
                    No hay mapeos registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
