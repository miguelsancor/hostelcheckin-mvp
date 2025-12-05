import { useEffect, useMemo, useState } from "react";

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
};

const API_BASE = "http://localhost:4000";

export default function AdminDashboard() {
  const [huespedes, setHuespedes] = useState<Huesped[]>([]);
  const [filtro, setFiltro] = useState("");
  const [stats, setStats] = useState({ hoy: 0, semana: 0, mes: 0 });

  const cargar = () => {
    fetch(`${API_BASE}/admin/huespedes`)
      .then((r) => r.json())
      .then((d) => setHuespedes(d.data || []));

    fetch(`${API_BASE}/admin/stats`)
      .then((r) => r.json())
      .then(setStats);
  };

  useEffect(() => {
    cargar();
  }, []);

  const filtrados = useMemo(() => {
    const q = filtro.toLowerCase();
    return huespedes.filter(
      (h) =>
        h.nombre.toLowerCase().includes(q) ||
        h.numeroDocumento.includes(q) ||
        h.telefono.includes(q) ||
        h.email.toLowerCase().includes(q)
    );
  }, [huespedes, filtro]);

  const eliminar = async (id: number) => {
    if (!confirm("¿Eliminar huésped?")) return;

    await fetch(`${API_BASE}/admin/huespedes/${id}`, { method: "DELETE" });
    cargar();
  };

  const exportarCSV = () => {
    const encabezado = [
      "ID",
      "Nombre",
      "Documento",
      "Teléfono",
      "Email",
      "Ingreso",
      "Salida",
      "Reserva",
    ];

    const filas = huespedes.map((h) => [
      h.id,
      h.nombre,
      `${h.tipoDocumento} ${h.numeroDocumento}`,
      h.telefono,
      h.email,
      h.fechaIngreso,
      h.fechaSalida,
      h.numeroReserva,
    ]);

    const csv = [encabezado, ...filas].map((r) => r.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "huespedes.csv";
    a.click();
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Dashboard Administrativo</h1>

      {/* ===== MÉTRICAS ===== */}
      <div style={styles.stats}>
        <div>Hoy: {stats.hoy}</div>
        <div>Semana: {stats.semana}</div>
        <div>Mes: {stats.mes}</div>
      </div>

      <div style={styles.actions}>
        <input
          placeholder="Buscar por nombre, documento, teléfono o email"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          style={styles.search}
        />

        <button onClick={exportarCSV} style={styles.export}>
          Exportar CSV
        </button>
      </div>

      <table style={styles.table}>
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
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtrados.map((h) => (
            <tr key={h.id}>
              <td>{h.id}</td>
              <td>{h.nombre}</td>
              <td>
                {h.tipoDocumento} {h.numeroDocumento}
              </td>
              <td>{h.telefono}</td>
              <td>{h.email}</td>
              <td>{h.fechaIngreso}</td>
              <td>{h.fechaSalida}</td>
              <td>{h.numeroReserva}</td>
              <td>
                <button
                  onClick={() => eliminar(h.id)}
                  style={styles.del}
                >
                  ❌
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ================= ESTILOS ================= */

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: "100vh",
    background: "#000",
    color: "#fff",
    padding: "2rem",
  },
  title: {
    textAlign: "center",
    marginBottom: "1rem",
  },
  stats: {
    display: "flex",
    gap: "2rem",
    justifyContent: "center",
    marginBottom: "1rem",
    fontSize: "1.2rem",
  },
  actions: {
    display: "flex",
    gap: "1rem",
    marginBottom: "1rem",
  },
  search: {
    flex: 1,
    padding: "0.6rem",
    borderRadius: "6px",
    border: "1px solid #333",
    background: "#111",
    color: "#fff",
  },
  export: {
    padding: "0.5rem 1rem",
    background: "#10b981",
    border: "none",
    borderRadius: "6px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  del: {
    background: "red",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
};
