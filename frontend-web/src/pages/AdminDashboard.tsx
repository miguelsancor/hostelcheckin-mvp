import { useEffect, useState } from "react";

const API_BASE = "http://localhost:4000";

type Huesped = {
  id: number;
  nombre: string;
  tipoDocumento: string;
  numeroDocumento: string;
  nacionalidad: string;
  telefono: string;
  email: string;
  fechaIngreso: string;
  fechaSalida: string;
  numeroReserva: string;
  direccion?: string;
  lugarProcedencia?: string;
  lugarDestino?: string;
  motivoViaje?: string;
};

export default function AdminDashboard() {
  const [huespedes, setHuespedes] = useState<Huesped[]>([]);
  const [filtro, setFiltro] = useState("");
  const [metrics, setMetrics] = useState<any>(null);

  // ✅ OJITO (DETALLE)
  const [detalle, setDetalle] = useState<Huesped | null>(null);

  /* =========================
     CARGA DE DATOS
  ========================= */
  const cargarHuespedes = async () => {
    const res = await fetch(`${API_BASE}/api/checkin/hoy`);
    const json = await res.json();
    setHuespedes(json.huespedes || []);
  };

  const cargarMetrics = async () => {
    const res = await fetch(`${API_BASE}/admin/metrics`);
    const json = await res.json();
    setMetrics(json);
  };

  useEffect(() => {
    cargarHuespedes();
    cargarMetrics();
  }, []);

  /* =========================
     FILTRO BUSCADOR
  ========================= */
  const filtrados = huespedes.filter((h) => {
    const texto = `${h.nombre} ${h.numeroDocumento} ${h.telefono} ${h.email}`.toLowerCase();
    return texto.includes(filtro.toLowerCase());
  });

  /* =========================
     ELIMINAR
  ========================= */
  const eliminar = async (id: number) => {
    if (!confirm("¿Eliminar huésped?")) return;
    await fetch(`${API_BASE}/admin/huesped/${id}`, { method: "DELETE" });
    cargarHuespedes();
    cargarMetrics();
  };

  return (
    <div style={container}>
      <div style={card}>

        <h1 style={{ textAlign: "center" }}>Dashboard Administrativo</h1>

        {/* =========================
           MÉTRICAS
        ========================= */}
        {metrics && (
          <div style={metricsGrid}>
            <div style={metricCard}>
              <h4>Total</h4>
              <p>{metrics.total}</p>
            </div>
            <div style={metricCard}>
              <h4>Hoy</h4>
              <p>{metrics.hoy}</p>
            </div>
            <div style={metricCard}>
              <h4>Este mes</h4>
              <p>{metrics.mes}</p>
            </div>
            <div style={metricCard}>
              <h4>Última reserva</h4>
              <p style={{ fontSize: "0.8rem" }}>{metrics.ultimaReserva}</p>
            </div>
          </div>
        )}

        {/* =========================
           BUSCADOR
        ========================= */}
        <input
          placeholder="Buscar por nombre, documento, teléfono o email"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          style={input}
        />

        {/* =========================
           TABLA
        ========================= */}
        <div style={tablaWrapper}>
          <table style={tabla}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Documento</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Ingreso</th>
                <th>Salida</th>
                <th>Reserva</th>
                <th>Acción</th>
              </tr>
            </thead>

            <tbody>
              {filtrados.map((h) => (
                <tr key={h.id}>
                  <td>{h.id}</td>
                  <td>{h.nombre}</td>
                  <td>{h.tipoDocumento} - {h.numeroDocumento}</td>
                  <td>{h.telefono}</td>
                  <td>{h.email}</td>
                  <td>{h.fechaIngreso}</td>
                  <td>{h.fechaSalida}</td>
                  <td>{h.numeroReserva}</td>
                  <td style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                    {/* ✅ OJITO RESTAURADO */}
                    <button style={btnEye} onClick={() => setDetalle(h)}>👁</button>
                    <button style={btnDelete} onClick={() => eliminar(h.id)}>❌</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* =========================
           MODAL DETALLE (OJITO)
      ========================= */}
      {detalle && (
        <div style={modal}>
          <div style={modalBox}>
            <h3>Detalle del Huésped</h3>

            <p><b>Nombre:</b> {detalle.nombre}</p>
            <p><b>Documento:</b> {detalle.tipoDocumento} - {detalle.numeroDocumento}</p>
            <p><b>Teléfono:</b> {detalle.telefono}</p>
            <p><b>Email:</b> {detalle.email}</p>
            <p><b>Ingreso:</b> {detalle.fechaIngreso}</p>
            <p><b>Salida:</b> {detalle.fechaSalida}</p>
            <p><b>Reserva:</b> {detalle.numeroReserva}</p>

            <button style={btnClose} onClick={() => setDetalle(null)}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================
   ESTILOS
========================= */

const container: React.CSSProperties = {
  background: "#000",
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  padding: "2rem"
};

const card: React.CSSProperties = {
  background: "rgba(0,0,0,0.9)",
  borderRadius: "1rem",
  padding: "2rem",
  width: "100%",
  maxWidth: "1200px",
  color: "#fff"
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "0.8rem",
  borderRadius: "0.5rem",
  border: "1px solid #333",
  background: "#111",
  color: "#fff",
  marginBottom: "1.5rem"
};

const metricsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "1rem",
  marginBottom: "1.5rem"
};

const metricCard: React.CSSProperties = {
  background: "#0f172a",
  padding: "1rem",
  borderRadius: "0.75rem",
  textAlign: "center",
  border: "1px solid #1e293b"
};

const tablaWrapper: React.CSSProperties = {
  overflowX: "auto",
  width: "100%"
};

const tabla: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse"
};

const btnDelete: React.CSSProperties = {
  background: "red",
  border: "none",
  color: "white",
  padding: "0.4rem 0.6rem",
  borderRadius: "0.4rem",
  cursor: "pointer"
};

const btnEye: React.CSSProperties = {
  background: "#2563eb",
  border: "none",
  color: "white",
  padding: "0.4rem 0.6rem",
  borderRadius: "0.4rem",
  cursor: "pointer"
};

/* ========= MODAL ========= */

const modal: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.8)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 99999
};

const modalBox: React.CSSProperties = {
  background: "#020617",
  padding: "2rem",
  borderRadius: "1rem",
  width: "100%",
  maxWidth: "400px",
  color: "white",
  border: "1px solid #1e293b"
};

const btnClose: React.CSSProperties = {
  marginTop: "1rem",
  width: "100%",
  padding: "0.6rem",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "0.5rem",
  cursor: "pointer"
};
