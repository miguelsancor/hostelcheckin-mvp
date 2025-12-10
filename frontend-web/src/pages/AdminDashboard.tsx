import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

const API_BASE = "http://18.206.179.50:4000";
const ADMIN_PASSWORD = "admin123";

type Huesped = {
  id: number;
  nombre: string;
  tipoDocumento: string;
  numeroDocumento: string;
  nacionalidad: string;
  direccion: string;
  lugarProcedencia: string;
  lugarDestino: string;
  telefono: string;
  email: string;
  motivoViaje: string;
  fechaIngreso: string;
  fechaSalida: string;
  numeroReserva: string;
  creadoEn: string;

  checkinUrl?: string | null;
  codigoTTLock?: string | null;

  // 🔥 campos de archivos que vienen de Prisma
  archivoPasaporte?: string | null;
  archivoCedula?: string | null;
  archivoFirma?: string | null;
};

export default function AdminDashboard() {
  /* =========================
     LOGIN
  ========================= */
  const [autenticado, setAutenticado] = useState<boolean>(
    localStorage.getItem("admin_auth") === "true"
  );
  const [password, setPassword] = useState("");

  const login = () => {
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem("admin_auth", "true");
      setAutenticado(true);
    } else {
      alert("Clave incorrecta");
    }
  };

  const logout = () => {
    localStorage.removeItem("admin_auth");
    setAutenticado(false);
  };

  /* =========================
     DATOS
  ========================= */
  const [huespedes, setHuespedes] = useState<Huesped[]>([]);
  const [filtro, setFiltro] = useState("");
  const [metrics, setMetrics] = useState<any>(null);
  const [detalle, setDetalle] = useState<Huesped | null>(null);
  const [vista, setVista] = useState<"tabla" | "galeria">("tabla");

  // 🔍 imagen a hacer zoom
  const [imagenZoom, setImagenZoom] = useState<string | null>(null);

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
    if (autenticado) {
      cargarHuespedes();
      cargarMetrics();
    }
  }, [autenticado]);

  const filtrados = huespedes.filter((h) => {
    const texto = `
      ${h.nombre}
      ${h.numeroDocumento}
      ${h.telefono}
      ${h.email}
      ${h.numeroReserva}
    `.toLowerCase();
    return texto.includes(filtro.toLowerCase());
  });

  const eliminar = async (id: number) => {
    if (!confirm("¿Eliminar huésped?")) return;
    await fetch(`${API_BASE}/admin/huespedes/${id}`, { method: "DELETE" });
    cargarHuespedes();
    cargarMetrics();
  };

  const exportarExcel = () => {
    const data = filtrados.map((h) => ({
      ID: h.id,
      Nombre: h.nombre,
      Documento: `${h.tipoDocumento} ${h.numeroDocumento}`,
      Nacionalidad: h.nacionalidad,
      Dirección: h.direccion,
      Procedencia: h.lugarProcedencia,
      Destino: h.lugarDestino,
      Teléfono: h.telefono,
      Email: h.email,
      Motivo: h.motivoViaje,
      Ingreso: h.fechaIngreso,
      Salida: h.fechaSalida,
      Reserva: h.numeroReserva,
      Checkin_URL: h.checkinUrl ?? "",
      TTLock: h.codigoTTLock ?? "",
      Creado: h.creadoEn,
      Pasaporte: h.archivoPasaporte ?? "",
      Cedula: h.archivoCedula ?? "",
      Firma: h.archivoFirma ?? "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Huespedes");
    XLSX.writeFile(wb, `huespedes_${Date.now()}.xlsx`);
  };

  /* =========================
     LOGIN UI
  ========================= */
  if (!autenticado) {
    return (
      <div style={loginContainer}>
        <div style={loginBox}>
          <h2>Acceso Administrativo</h2>
          <input
            type="password"
            placeholder="Clave de administrador"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={input}
          />
          <button onClick={login} style={btnLogin}>
            Ingresar
          </button>
        </div>
      </div>
    );
  }

  /* =========================
     DASHBOARD
  ========================= */
  return (
    <div style={container}>
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h1>Dashboard Administrativo</h1>
          <button onClick={logout} style={btnLogout}>
            Salir
          </button>
        </div>

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
              <p>{metrics.ultimaReserva}</p>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
          <button onClick={exportarExcel} style={btnExcel}>
            📥 Excel
          </button>

          <button
            onClick={() => setVista(vista === "tabla" ? "galeria" : "tabla")}
            style={btnToggle}
          >
            {vista === "tabla" ? "📸 Galería" : "📋 Tabla"}
          </button>

          <input
            placeholder="Buscar..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            style={input}
          />
        </div>

        {/* =========================
            VISTA GALERÍA
        ========================= */}
        {vista === "galeria" && (
          <div style={galeriaGrid}>
            {filtrados.map((h) => {
              const urlPasaporte = h.archivoPasaporte
                ? `${API_BASE}/uploads/${h.archivoPasaporte}`
                : null;
              const urlCedula = h.archivoCedula
                ? `${API_BASE}/uploads/${h.archivoCedula}`
                : null;
              const urlFirma = h.archivoFirma
                ? `${API_BASE}/uploads/${h.archivoFirma}`
                : null;

              const thumbUrl = urlPasaporte || urlCedula || urlFirma || null;

              const inicial =
                h.nombre && h.nombre.trim().length > 0
                  ? h.nombre.trim()[0].toUpperCase()
                  : "?";

              return (
                <div key={h.id} style={galeriaCard}>
                  {/* Imagen / inicial */}
                  {thumbUrl ? (
                    <img
                      src={thumbUrl}
                      style={imagenGaleria}
                      onClick={() => setImagenZoom(thumbUrl)}
                    />
                  ) : (
                    <div style={imagenPlaceholder}>{inicial}</div>
                  )}

                  <h3>{h.nombre}</h3>
                  <p>
                    <b>Documento:</b> {h.tipoDocumento} {h.numeroDocumento}
                  </p>
                  <p>
                    <b>Tel:</b> {h.telefono}
                  </p>
                  <p>
                    <b>Email:</b> {h.email}
                  </p>
                  <p>
                    <b>Ingreso:</b> {h.fechaIngreso}
                  </p>
                  <p>
                    <b>Reserva:</b> {h.numeroReserva}
                  </p>

                  {h.checkinUrl ? (
                    <a
                      href={h.checkinUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={galeriaLink}
                    >
                      Abrir check-in
                    </a>
                  ) : (
                    <span style={{ opacity: 0.5 }}>Sin check-in</span>
                  )}

                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      marginTop: "1rem",
                    }}
                  >
                    <button style={btnEye} onClick={() => setDetalle(h)}>
                      👁
                    </button>
                    <button style={btnDelete} onClick={() => eliminar(h.id)}>
                      ❌
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* =========================
            TABLA NORMAL
        ========================= */}
        {vista === "tabla" && (
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
                  <th>Checkin</th>
                  <th>TTLock</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((h) => (
                  <tr key={h.id}>
                    <td>{h.id}</td>
                    <td>{h.nombre}</td>
                    <td>
                      {h.tipoDocumento} - {h.numeroDocumento}
                    </td>
                    <td>{h.telefono}</td>
                    <td>{h.email}</td>
                    <td>{h.fechaIngreso}</td>
                    <td>{h.fechaSalida}</td>
                    <td>{h.numeroReserva}</td>
                    <td>
                      {h.checkinUrl ? (
                        <a href={h.checkinUrl} target="_blank" rel="noreferrer">
                          abrir
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>{h.codigoTTLock ?? "-"}</td>
                    <td style={{ display: "flex", gap: "0.5rem" }}>
                      <button style={btnEye} onClick={() => setDetalle(h)}>
                        👁
                      </button>
                      <button style={btnDelete} onClick={() => eliminar(h.id)}>
                        ❌
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =========================
          MODAL DETALLE TEXTO + INFO
      ========================= */}
      {detalle && (
        <div style={modal}>
          <div style={modalBox}>
            <h3>Detalle del Huésped</h3>

            <p>
              <b>Nombre:</b> {detalle.nombre}
            </p>
            <p>
              <b>Documento:</b> {detalle.tipoDocumento}{" "}
              {detalle.numeroDocumento}
            </p>
            <p>
              <b>Nacionalidad:</b> {detalle.nacionalidad}
            </p>
            <p>
              <b>Dirección:</b> {detalle.direccion}
            </p>
            <p>
              <b>Procedencia:</b> {detalle.lugarProcedencia}
            </p>
            <p>
              <b>Destino:</b> {detalle.lugarDestino}
            </p>
            <p>
              <b>Motivo:</b> {detalle.motivoViaje}
            </p>
            <p>
              <b>Email:</b> {detalle.email}
            </p>
            <p>
              <b>Teléfono:</b> {detalle.telefono}
            </p>
            <p>
              <b>Ingreso:</b> {detalle.fechaIngreso}
            </p>
            <p>
              <b>Salida:</b> {detalle.fechaSalida}
            </p>
            <p>
              <b>Reserva:</b> {detalle.numeroReserva}
            </p>
            <p>
              <b>Checkin URL:</b> {detalle.checkinUrl ?? "-"}
            </p>
            <p>
              <b>Código TTLock:</b> {detalle.codigoTTLock ?? "-"}
            </p>

            {/* Miniaturas dentro del detalle (también clicables para zoom) */}
            <div style={imagenesDetalleGrid}>
              {detalle.archivoPasaporte && (
                <img
                  src={`${API_BASE}/uploads/${detalle.archivoPasaporte}`}
                  style={imagenDetalle}
                  onClick={() =>
                    setImagenZoom(`${API_BASE}/uploads/${detalle.archivoPasaporte}`)
                  }
                />
              )}
              {detalle.archivoCedula && (
                <img
                  src={`${API_BASE}/uploads/${detalle.archivoCedula}`}
                  style={imagenDetalle}
                  onClick={() =>
                    setImagenZoom(`${API_BASE}/uploads/${detalle.archivoCedula}`)
                  }
                />
              )}
              {detalle.archivoFirma && (
                <img
                  src={`${API_BASE}/uploads/${detalle.archivoFirma}`}
                  style={imagenDetalle}
                  onClick={() =>
                    setImagenZoom(`${API_BASE}/uploads/${detalle.archivoFirma}`)
                  }
                />
              )}
            </div>

            <button onClick={() => setDetalle(null)} style={btnClose}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* =========================
          OVERLAY DE ZOOM IMAGEN
      ========================= */}
      {imagenZoom && (
        <div style={zoomOverlay} onClick={() => setImagenZoom(null)}>
          <img src={imagenZoom} style={zoomImage} />
        </div>
      )}
    </div>
  );
}

/* ================= ESTILOS ================= */

const loginContainer: React.CSSProperties = {
  background: "#000",
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};
const loginBox: React.CSSProperties = {
  background: "#020617",
  padding: "2rem",
  borderRadius: "1rem",
  textAlign: "center",
  color: "white",
  width: "300px",
};
const btnLogin: React.CSSProperties = {
  marginTop: "1rem",
  background: "#2563eb",
  color: "white",
  border: "none",
  padding: "0.6rem",
  width: "100%",
};

const container: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "#000",
  display: "flex",
  justifyContent: "flex-start",
  alignItems: "flex-start",
  padding: "1.5rem",
  overflowX: "hidden",
  overflowY: "auto",
  zIndex: 9999,
};

const card: React.CSSProperties = {
  background: "transparent",
  padding: "1rem",
  width: "100%",
  color: "#fff",
};

const input: React.CSSProperties = {
  padding: "0.7rem",
  borderRadius: "0.4rem",
  border: "1px solid #333",
  background: "#111",
  color: "#fff",
  width: "100%",
};

const metricsGrid: React.CSSProperties = {
  display: "grid",
  gap: "1rem",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
};
const metricCard: React.CSSProperties = {
  background: "#0f172a",
  padding: "1rem",
  borderRadius: "0.7rem",
  textAlign: "center",
};

const tablaWrapper: React.CSSProperties = {
  overflowX: "auto",
  width: "100vw",
  paddingBottom: "12px",
};

const tabla: React.CSSProperties = { width: "100%" };

const btnDelete: React.CSSProperties = {
  background: "red",
  color: "white",
  border: "none",
  padding: "0.3rem 0.6rem",
};

const btnEye: React.CSSProperties = {
  background: "#2563eb",
  color: "white",
  border: "none",
  padding: "0.3rem 0.6rem",
};

const btnExcel: React.CSSProperties = {
  background: "#16a34a",
  color: "white",
  border: "none",
  padding: "0.5rem 1rem",
};

const btnLogout: React.CSSProperties = {
  background: "#991b1b",
  color: "white",
  border: "none",
  padding: "0.5rem 1rem",
};

const btnToggle: React.CSSProperties = {
  background: "#334155",
  color: "white",
  border: "none",
  padding: "0.5rem 1rem",
};

const galeriaGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  gap: "1rem",
  width: "100%",
};

const galeriaCard: React.CSSProperties = {
  background: "#0f172a",
  padding: "1rem",
  borderRadius: "0.8rem",
  color: "white",
  display: "flex",
  flexDirection: "column",
  gap: "0.3rem",
};

const imagenGaleria: React.CSSProperties = {
  width: "100%",
  height: "200px",
  objectFit: "cover",
  borderRadius: "0.6rem",
  cursor: "zoom-in",
  marginBottom: "0.5rem",
  border: "1px solid #1f2937",
};

const imagenPlaceholder: React.CSSProperties = {
  width: "100%",
  height: "200px",
  borderRadius: "0.6rem",
  background: "linear-gradient(135deg,#1e293b,#020617)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "3rem",
  fontWeight: 700,
};

const galeriaLink: React.CSSProperties = {
  background: "#2563eb",
  padding: "0.3rem 0.5rem",
  color: "white",
  textAlign: "center",
  borderRadius: "0.3rem",
  marginTop: "0.5rem",
};

const modal: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.8)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 10000,
};

const modalBox: React.CSSProperties = {
  background: "#020617",
  padding: "2rem",
  borderRadius: "1rem",
  color: "white",
  maxWidth: "600px",
  maxHeight: "90vh",
  overflowY: "auto",
};

const btnClose: React.CSSProperties = {
  marginTop: "1rem",
  background: "#2563eb",
  color: "white",
  width: "100%",
  border: "none",
  padding: "0.6rem",
};

const imagenesDetalleGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "1rem",
  marginTop: "1rem",
};

const imagenDetalle: React.CSSProperties = {
  width: "100%",
  height: "200px",
  objectFit: "cover",
  borderRadius: "0.6rem",
  border: "1px solid #1f2937",
  cursor: "zoom-in",
};

const zoomOverlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.9)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 11000,
};

const zoomImage: React.CSSProperties = {
  maxWidth: "90vw",
  maxHeight: "90vh",
  borderRadius: "1rem",
  border: "2px solid #1d4ed8",
  objectFit: "contain",
};
