import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";

const API_BASE = "/api";

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

  archivoPasaporte?: string | null;
  archivoCedula?: string | null;
  archivoFirma?: string | null;
};

export default function AdminDashboard() {
  const [autenticado, setAutenticado] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [huespedes, setHuespedes] = useState<Huesped[]>([]);
  const [filtro, setFiltro] = useState("");
  const [metrics, setMetrics] = useState<any>(null);
  const [detalle, setDetalle] = useState<Huesped | null>(null);
  const [vista, setVista] = useState<"tabla" | "galeria">("tabla");
  const [scope, setScope] = useState<"hoy" | "todos">("todos");
  const [imagenZoom, setImagenZoom] = useState<string | null>(null);

  const [editTtlock, setEditTtlock] = useState<Huesped | null>(null);
  const [newTtlockEnd, setNewTtlockEnd] = useState("");
  const [savingTtlock, setSavingTtlock] = useState(false);

  const normalizarFecha = (value?: string | null) => {
    if (!value) return "";
    const s = String(value).trim();
    if (!s) return "";
    if (s.includes("T")) return s.split("T")[0];
    return s.slice(0, 10);
  };

  const getSecureUploadUrl = (file?: string | null) => {
    if (!file) return null;
    return `${API_BASE}/uploads/${encodeURIComponent(file)}`;
  };

  const ttlockText = (value?: string | null) => {
    const v = String(value || "").trim();
    return v || "-";
  };

  const checkSession = async () => {
    try {
      setCheckingSession(true);

      const res = await fetch(`${API_BASE}/admin/auth/session`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        setAutenticado(false);
        return;
      }

      const json = await res.json();
      setAutenticado(!!json?.ok);
    } catch (e) {
      console.error(e);
      setAutenticado(false);
    } finally {
      setCheckingSession(false);
    }
  };

  const login = async () => {
    try {
      if (!username.trim() || !password.trim()) {
        alert("Debes ingresar usuario y contraseña.");
        return;
      }

      setLoginLoading(true);

      const res = await fetch(`${API_BASE}/admin/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json?.ok) {
        alert(json?.error || "No se pudo iniciar sesión");
        return;
      }

      setPassword("");
      setAutenticado(true);
    } catch (e) {
      console.error(e);
      alert("Error iniciando sesión.");
    } finally {
      setLoginLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/admin/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {
      console.error(e);
    } finally {
      setAutenticado(false);
      setHuespedes([]);
      setMetrics(null);
      setDetalle(null);
    }
  };

  const cargarHuespedes = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/huespedes`, {
        credentials: "include",
      });

      if (res.status === 401) {
        setAutenticado(false);
        return;
      }

      const json = await res.json();

      const lista: Huesped[] =
        (json && Array.isArray(json.huespedes) && json.huespedes) ||
        (json && Array.isArray(json.data) && json.data) ||
        (Array.isArray(json) ? json : []);

      setHuespedes(lista);
    } catch (e) {
      console.error(e);
      alert("Error cargando huéspedes.");
      setHuespedes([]);
    }
  };

  const cargarMetrics = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/metrics`, {
        credentials: "include",
      });

      if (res.status === 401) {
        setAutenticado(false);
        return;
      }

      const json = await res.json();
      setMetrics(json);
    } catch (e) {
      console.error(e);
      setMetrics(null);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (autenticado) {
      cargarHuespedes();
      cargarMetrics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autenticado]);

  const filtrados = useMemo(() => {
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, "0");
    const dd = String(hoy.getDate()).padStart(2, "0");
    const hoyStr = `${yyyy}-${mm}-${dd}`;

    let base = huespedes;

    if (scope === "hoy") {
      base = base.filter((h) => normalizarFecha(h.fechaIngreso) === hoyStr);
    }

    const f = filtro.toLowerCase().trim();
    if (!f) return base;

    return base.filter((h) => {
      const texto = `
        ${h.nombre}
        ${h.numeroDocumento}
        ${h.telefono}
        ${h.email}
        ${h.numeroReserva}
        ${h.codigoTTLock ?? ""}
      `.toLowerCase();

      return texto.includes(f);
    });
  }, [huespedes, filtro, scope]);

  const eliminar = async (id: number) => {
    if (!confirm("¿Eliminar huésped?")) return;

    const res = await fetch(`${API_BASE}/admin/huespedes/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (res.status === 401) {
      setAutenticado(false);
      return;
    }

    await cargarHuespedes();
    await cargarMetrics();
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

  const abrirModalExtension = (h: Huesped) => {
    setEditTtlock(h);

    const baseDate =
      normalizarFecha(h.fechaSalida || "") ||
      normalizarFecha(h.fechaIngreso || "");
    const defaultValue = baseDate ? `${baseDate}T12:00` : "";

    setNewTtlockEnd(defaultValue);
  };

  const guardarExtensionTtlock = async () => {
    if (!editTtlock) return;

    if (!newTtlockEnd || !newTtlockEnd.trim()) {
      alert("Debes seleccionar una nueva fecha/hora.");
      return;
    }

    try {
      setSavingTtlock(true);

      const res = await fetch(
        `${API_BASE}/mcp/passcode/extend/${editTtlock.id}`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            newEndDate: newTtlockEnd,
          }),
        }
      );

      const json = await res.json();

      if (!res.ok || !json?.ok) {
        alert(json?.error || "No se pudo extender el código TTLock.");
        return;
      }

      alert("Código TTLock extendido correctamente.");
      setEditTtlock(null);
      setNewTtlockEnd("");
      await cargarHuespedes();
    } catch (e) {
      console.error(e);
      alert("Error actualizando TTLock.");
    } finally {
      setSavingTtlock(false);
    }
  };

  if (checkingSession) {
    return (
      <div style={loginContainer}>
        <div style={loginBox}>
          <h2>Validando sesión...</h2>
        </div>
      </div>
    );
  }

  if (!autenticado) {
    return (
      <div style={loginContainer}>
        <div style={loginBox}>
          <h2>Acceso Administrativo</h2>

          <input
            type="text"
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={input}
          />

          <input
            type="password"
            placeholder="Clave de administrador"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ ...input, marginTop: "0.75rem" }}
            onKeyDown={(e) => {
              if (e.key === "Enter") login();
            }}
          />

          <button onClick={login} style={btnLogin} disabled={loginLoading}>
            {loginLoading ? "Ingresando..." : "Ingresar"}
          </button>
        </div>
      </div>
    );
  }

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

          <button
            onClick={() => setScope(scope === "hoy" ? "todos" : "hoy")}
            style={btnScope}
            title="Cambiar alcance de datos"
          >
            {scope === "hoy" ? "📅 Mostrando: HOY" : "🗂️ Mostrando: TODOS"}
          </button>

          <input
            placeholder="Buscar..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            style={input}
          />
        </div>

        {vista === "galeria" && (
          <div style={galeriaGrid}>
            {filtrados.map((h) => {
              const urlPasaporte = getSecureUploadUrl(h.archivoPasaporte);
              const urlCedula = getSecureUploadUrl(h.archivoCedula);
              const urlFirma = getSecureUploadUrl(h.archivoFirma);

              const thumbUrl = urlPasaporte || urlCedula || urlFirma || null;

              const inicial =
                h.nombre && h.nombre.trim().length > 0
                  ? h.nombre.trim()[0].toUpperCase()
                  : "?";

              return (
                <div key={h.id} style={galeriaCard}>
                  {thumbUrl ? (
                    <img
                      src={thumbUrl}
                      style={imagenGaleria}
                      onClick={() => setImagenZoom(thumbUrl)}
                      alt="Documento"
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
                  <p>
                    <b>TTLock:</b> {ttlockText(h.codigoTTLock)}
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
                      flexWrap: "wrap",
                    }}
                  >
                    <button style={btnEye} onClick={() => setDetalle(h)}>
                      👁
                    </button>

                    <button
                      style={btnTtlock}
                      onClick={() => abrirModalExtension(h)}
                    >
                      ⏰
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

        {vista === "tabla" && (
          <div style={tablaWrapper}>
            <table style={tabla}>
              <thead>
                <tr>
                  <th style={th}>ID</th>
                  <th style={th}>Nombre</th>
                  <th style={th}>Documento</th>
                  <th style={th}>Teléfono</th>
                  <th style={th}>Email</th>
                  <th style={th}>Ingreso</th>
                  <th style={th}>Salida</th>
                  <th style={th}>Reserva</th>
                  <th style={th}>Checkin</th>
                  <th style={th}>TTLock</th>
                  <th style={th}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((h, idx) => (
                  <tr key={h.id} style={idx % 2 === 0 ? trEven : trOdd}>
                    <td style={td}>{h.id}</td>
                    <td style={td}>{h.nombre}</td>
                    <td style={td}>
                      {h.tipoDocumento} - {h.numeroDocumento}
                    </td>
                    <td style={td}>{h.telefono}</td>
                    <td style={td}>{h.email}</td>
                    <td style={td}>{h.fechaIngreso}</td>
                    <td style={td}>{h.fechaSalida}</td>
                    <td style={td}>{h.numeroReserva}</td>
                    <td style={td}>
                      {h.checkinUrl ? (
                        <a
                          href={h.checkinUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={link}
                        >
                          abrir
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td style={{ ...td, fontWeight: 700, color: "#facc15" }}>
                      {ttlockText(h.codigoTTLock)}
                    </td>
                    <td
                      style={{
                        ...td,
                        display: "flex",
                        gap: "0.5rem",
                        flexWrap: "wrap",
                      }}
                    >
                      <button style={btnEye} onClick={() => setDetalle(h)}>
                        👁
                      </button>

                      <button
                        style={btnTtlock}
                        onClick={() => abrirModalExtension(h)}
                      >
                        ⏰
                      </button>

                      <button style={btnDelete} onClick={() => eliminar(h.id)}>
                        ❌
                      </button>
                    </td>
                  </tr>
                ))}

                {filtrados.length === 0 && (
                  <tr>
                    <td style={{ ...td, padding: "1rem" }} colSpan={11}>
                      No hay registros para mostrar (scope: {scope}).
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
              <b>Código TTLock:</b>{" "}
              <span style={ttlockBadge}>{ttlockText(detalle.codigoTTLock)}</span>
            </p>

            <div style={imagenesDetalleGrid}>
              {detalle.archivoPasaporte && (
                <img
                  src={getSecureUploadUrl(detalle.archivoPasaporte) || ""}
                  style={imagenDetalle}
                  onClick={() =>
                    setImagenZoom(
                      getSecureUploadUrl(detalle.archivoPasaporte) || null
                    )
                  }
                  alt="Pasaporte"
                />
              )}
              {detalle.archivoCedula && (
                <img
                  src={getSecureUploadUrl(detalle.archivoCedula) || ""}
                  style={imagenDetalle}
                  onClick={() =>
                    setImagenZoom(
                      getSecureUploadUrl(detalle.archivoCedula) || null
                    )
                  }
                  alt="Cédula"
                />
              )}
              {detalle.archivoFirma && (
                <img
                  src={getSecureUploadUrl(detalle.archivoFirma) || ""}
                  style={imagenDetalle}
                  onClick={() =>
                    setImagenZoom(
                      getSecureUploadUrl(detalle.archivoFirma) || null
                    )
                  }
                  alt="Firma"
                />
              )}
            </div>

            <button onClick={() => setDetalle(null)} style={btnClose}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      {editTtlock && (
        <div style={modal}>
          <div style={modalBox}>
            <h3>Extender código TTLock</h3>

            <p>
              <b>Huésped:</b> {editTtlock.nombre}
            </p>
            <p>
              <b>Reserva:</b> {editTtlock.numeroReserva}
            </p>
            <p>
              <b>Código TTLock:</b>{" "}
              <span style={ttlockBadge}>{ttlockText(editTtlock.codigoTTLock)}</span>
            </p>
            <p>
              <b>Salida actual:</b> {editTtlock.fechaSalida ?? "-"}
            </p>

            <div style={{ marginTop: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>
                Nueva fecha / hora fin
              </label>
              <input
                type="datetime-local"
                value={newTtlockEnd}
                onChange={(e) => setNewTtlockEnd(e.target.value)}
                style={input}
              />
            </div>

            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                marginTop: "1rem",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => {
                  setEditTtlock(null);
                  setNewTtlockEnd("");
                }}
                style={btnToggle}
                disabled={savingTtlock}
              >
                Cancelar
              </button>

              <button
                onClick={guardarExtensionTtlock}
                style={btnTtlock}
                disabled={savingTtlock}
              >
                {savingTtlock ? "Guardando..." : "Guardar extensión"}
              </button>
            </div>
          </div>
        </div>
      )}

      {imagenZoom && (
        <div style={zoomOverlay} onClick={() => setImagenZoom(null)}>
          <img src={imagenZoom} style={zoomImage} alt="Zoom" />
        </div>
      )}
    </div>
  );
}

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
  borderRadius: "0.5rem",
  cursor: "pointer",
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
  marginBottom: "1rem",
};

const metricCard: React.CSSProperties = {
  background: "#0f172a",
  padding: "1rem",
  borderRadius: "0.7rem",
  textAlign: "center",
};

const tablaWrapper: React.CSSProperties = {
  overflowX: "auto",
  width: "100%",
  paddingBottom: "12px",
  border: "1px solid #1f2937",
  borderRadius: "0.8rem",
};

const tabla: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: "1100px",
};

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "0.75rem",
  background: "#0f172a",
  borderBottom: "1px solid #1f2937",
  position: "sticky",
  top: 0,
  zIndex: 2,
  whiteSpace: "nowrap",
};

const td: React.CSSProperties = {
  padding: "0.7rem",
  borderBottom: "1px solid #111827",
  color: "#fff",
  whiteSpace: "nowrap",
  fontSize: "0.95rem",
};

const trEven: React.CSSProperties = { background: "#030712" };
const trOdd: React.CSSProperties = { background: "#000000" };

const link: React.CSSProperties = {
  color: "#60a5fa",
  textDecoration: "underline",
};

const btnDelete: React.CSSProperties = {
  background: "#dc2626",
  color: "white",
  border: "none",
  padding: "0.3rem 0.6rem",
  borderRadius: "0.4rem",
  cursor: "pointer",
};

const btnEye: React.CSSProperties = {
  background: "#2563eb",
  color: "white",
  border: "none",
  padding: "0.3rem 0.6rem",
  borderRadius: "0.4rem",
  cursor: "pointer",
};

const btnTtlock: React.CSSProperties = {
  background: "#f59e0b",
  color: "white",
  border: "none",
  padding: "0.3rem 0.6rem",
  borderRadius: "0.4rem",
  cursor: "pointer",
};

const btnExcel: React.CSSProperties = {
  background: "#16a34a",
  color: "white",
  border: "none",
  padding: "0.5rem 1rem",
  borderRadius: "0.6rem",
  cursor: "pointer",
};

const btnLogout: React.CSSProperties = {
  background: "#991b1b",
  color: "white",
  border: "none",
  padding: "0.5rem 1rem",
  borderRadius: "0.6rem",
  cursor: "pointer",
};

const btnToggle: React.CSSProperties = {
  background: "#334155",
  color: "white",
  border: "none",
  padding: "0.5rem 1rem",
  borderRadius: "0.6rem",
  cursor: "pointer",
};

const btnScope: React.CSSProperties = {
  background: "#0b1220",
  color: "white",
  border: "1px solid #1f2937",
  padding: "0.5rem 1rem",
  borderRadius: "0.6rem",
  cursor: "pointer",
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
  borderRadius: "0.6rem",
  cursor: "pointer",
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

const ttlockBadge: React.CSSProperties = {
  display: "inline-block",
  padding: "0.2rem 0.55rem",
  borderRadius: "0.45rem",
  background: "#451a03",
  color: "#facc15",
  border: "1px solid #92400e",
  fontWeight: 700,
  letterSpacing: "0.03em",
};