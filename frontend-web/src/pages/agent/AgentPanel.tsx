import { useState, useRef, useEffect } from "react";
import { API_BASE } from "../admin/admin.utils";

/* =======================================================================
   TIPOS
   ======================================================================= */
type TarjetaDato = {
  tipo: string;
  titulo: string;
  datos: any;
};

type AgentResponse = {
  ok: boolean;
  tipo?: string;
  mensaje?: string;
  message?: string;
  tarjetas?: TarjetaDato[];
  error?: string;
};

type Mensaje = {
  rol: "usuario" | "agente";
  texto: string;
  tarjetas?: TarjetaDato[];
  timestamp: number;
};

/* =======================================================================
   ESTILOS (consistentes con admin.styles.ts)
   ======================================================================= */
const panelContainer: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "#000",
  display: "flex",
  flexDirection: "column",
  zIndex: 10001,
};

const header: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "1rem 1.25rem",
  borderBottom: "1px solid #1f2937",
  background: "#020617",
  flexShrink: 0,
};

const headerTitle: React.CSSProperties = {
  fontSize: "1.1rem",
  fontWeight: 700,
  color: "#fff",
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
};

const btnCerrar: React.CSSProperties = {
  background: "#1e293b",
  color: "#fff",
  border: "1px solid #334155",
  padding: "0.5rem 1rem",
  borderRadius: "0.5rem",
  cursor: "pointer",
  fontSize: "0.9rem",
};

const chatArea: React.CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "1rem",
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
};

const inputBar: React.CSSProperties = {
  display: "flex",
  gap: "0.5rem",
  padding: "0.75rem 1rem",
  borderTop: "1px solid #1f2937",
  background: "#020617",
  flexShrink: 0,
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: "0.75rem 1rem",
  borderRadius: "0.6rem",
  border: "1px solid #334155",
  background: "#0f172a",
  color: "#fff",
  fontSize: "0.95rem",
  outline: "none",
};

const btnEnviar: React.CSSProperties = {
  background: "#2563eb",
  color: "#fff",
  border: "none",
  padding: "0.75rem 1.25rem",
  borderRadius: "0.6rem",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "0.95rem",
  whiteSpace: "nowrap",
};

const msgUsuario: React.CSSProperties = {
  alignSelf: "flex-end",
  background: "#1e3a5f",
  color: "#fff",
  padding: "0.65rem 1rem",
  borderRadius: "1rem 1rem 0.25rem 1rem",
  maxWidth: "85%",
  fontSize: "0.95rem",
  wordBreak: "break-word",
};

const msgAgente: React.CSSProperties = {
  alignSelf: "flex-start",
  background: "#0f172a",
  color: "#fff",
  padding: "0.65rem 1rem",
  borderRadius: "1rem 1rem 1rem 0.25rem",
  maxWidth: "90%",
  fontSize: "0.95rem",
  border: "1px solid #1f2937",
  wordBreak: "break-word",
};

const tarjetaBase: React.CSSProperties = {
  background: "#020617",
  border: "1px solid #1f2937",
  borderRadius: "0.85rem",
  padding: "1rem",
  marginTop: "0.5rem",
};

const tarjetaTitulo: React.CSSProperties = {
  fontSize: "0.85rem",
  fontWeight: 700,
  color: "#94a3b8",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  marginBottom: "0.6rem",
};

const datoPar: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: "0.3rem 0",
  borderBottom: "1px solid #111827",
  fontSize: "0.9rem",
};

const datoLabel: React.CSSProperties = {
  color: "#94a3b8",
  fontWeight: 600,
};

const datoValor: React.CSSProperties = {
  color: "#fff",
  fontWeight: 500,
  textAlign: "right",
};

const badgeActivo: React.CSSProperties = {
  display: "inline-block",
  padding: "0.15rem 0.5rem",
  borderRadius: "0.4rem",
  background: "#052e16",
  color: "#86efac",
  border: "1px solid #166534",
  fontWeight: 700,
  fontSize: "0.8rem",
};

const badgeInactivo: React.CSSProperties = {
  display: "inline-block",
  padding: "0.15rem 0.5rem",
  borderRadius: "0.4rem",
  background: "#3f0d0d",
  color: "#fca5a5",
  border: "1px solid #991b1b",
  fontWeight: 700,
  fontSize: "0.8rem",
};

const badgeInfo: React.CSSProperties = {
  display: "inline-block",
  padding: "0.15rem 0.5rem",
  borderRadius: "0.4rem",
  background: "#0c1a3d",
  color: "#93c5fd",
  border: "1px solid #1e40af",
  fontWeight: 700,
  fontSize: "0.8rem",
};

const sugerenciasContainer: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.5rem",
  padding: "0.75rem 1rem",
  borderTop: "1px solid #111827",
  background: "#020617",
};

const btnSugerencia: React.CSSProperties = {
  background: "#0f172a",
  color: "#93c5fd",
  border: "1px solid #1e3a5f",
  padding: "0.4rem 0.75rem",
  borderRadius: "2rem",
  cursor: "pointer",
  fontSize: "0.82rem",
  fontWeight: 600,
  transition: "background 0.15s",
};

const codigoPIN: React.CSSProperties = {
  fontFamily: "monospace",
  fontSize: "1.3rem",
  fontWeight: 800,
  color: "#facc15",
  letterSpacing: "0.15em",
  background: "#451a03",
  padding: "0.3rem 0.7rem",
  borderRadius: "0.4rem",
  border: "1px solid #92400e",
};

/* =======================================================================
   SUGERENCIAS RÁPIDAS
   ======================================================================= */
const SUGERENCIAS = [
  "Huéspedes hoy",
  "Métricas del hotel",
  "Cerraduras disponibles",
];

const AGENT_QUERY_URL = `${API_BASE}/api/agent/query`;

/* =======================================================================
   COMPONENTE PRINCIPAL
   ======================================================================= */
export default function AgentPanel({ onClose }: { onClose: () => void }) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    {
      rol: "agente",
      texto:
        "¡Hola! Soy el asistente operativo de Kuyay. Puedo ayudarte a consultar huéspedes, reservas, check-ins y cerraduras. ¿Qué necesitas?",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [cargando, setCargando] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al final
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [mensajes]);

  const enviarConsulta = async (texto?: string) => {
    const consulta = (texto || input).trim();
    if (!consulta || cargando) return;

    // Agregar mensaje del usuario
    setMensajes((prev) => [
      ...prev,
      { rol: "usuario", texto: consulta, timestamp: Date.now() },
    ]);
    setInput("");
    setCargando(true);

    try {
      const res = await fetch(AGENT_QUERY_URL, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: consulta }),
      });

      const data: AgentResponse = await res.json();
      const textoRespuesta = data.mensaje || data.message || data.error || "No obtuve respuesta.";

      setMensajes((prev) => [
        ...prev,
        {
          rol: "agente",
          texto: textoRespuesta,
          tarjetas: data.tarjetas || [],
          timestamp: Date.now(),
        },
      ]);
    } catch (err) {
      setMensajes((prev) => [
        ...prev,
        {
          rol: "agente",
          texto: "Error de conexión con el servidor. Verifica que el backend esté activo.",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setCargando(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviarConsulta();
    }
  };

  return (
    <div style={panelContainer}>
      {/* HEADER */}
      <div style={header}>
        <div style={headerTitle}>
          <span>🤖</span>
          <span>Kuyay Assistant</span>
        </div>
        <button onClick={onClose} style={btnCerrar}>
          ✕ Cerrar
        </button>
      </div>

      {/* CHAT */}
      <div ref={chatRef} style={chatArea}>
        {mensajes.map((m, i) => (
          <div key={i}>
            <div style={m.rol === "usuario" ? msgUsuario : msgAgente}>
              {m.texto.split("\n").map((linea, j) => (
                <span key={j}>
                  {linea}
                  {j < m.texto.split("\n").length - 1 && <br />}
                </span>
              ))}
            </div>

            {/* TARJETAS */}
            {m.tarjetas?.map((t, k) => (
              <RenderTarjeta key={k} tarjeta={t} onBuscar={enviarConsulta} />
            ))}
          </div>
        ))}

        {cargando && (
          <div style={{ ...msgAgente, opacity: 0.6 }}>
            <span>Consultando datos...</span>
          </div>
        )}
      </div>

      {/* SUGERENCIAS RÁPIDAS */}
      <div style={sugerenciasContainer}>
        {SUGERENCIAS.map((s) => (
          <button
            key={s}
            style={btnSugerencia}
            onClick={() => enviarConsulta(s)}
            disabled={cargando}
          >
            {s}
          </button>
        ))}
      </div>

      {/* INPUT */}
      <div style={inputBar}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar huésped, reserva, estado de check-in..."
          style={inputStyle}
          disabled={cargando}
          autoFocus
        />
        <button
          onClick={() => enviarConsulta()}
          style={{
            ...btnEnviar,
            opacity: cargando || !input.trim() ? 0.5 : 1,
          }}
          disabled={cargando || !input.trim()}
        >
          Enviar
        </button>
      </div>
    </div>
  );
}

/* =======================================================================
   RENDERIZADO DE TARJETAS
   ======================================================================= */
function RenderTarjeta({
  tarjeta,
  onBuscar,
}: {
  tarjeta: TarjetaDato;
  onBuscar: (texto: string) => void;
}) {
  const { tipo, titulo, datos } = tarjeta;

  switch (tipo) {
    case "huesped":
      return (
        <div style={tarjetaBase}>
          <div style={tarjetaTitulo}>👤 {titulo}</div>
          {Object.entries(datos).map(([key, val]) => {
            if (key === "id") return null;
            return (
              <div key={key} style={datoPar}>
                <span style={datoLabel}>{formatLabel(key)}</span>
                <span style={datoValor}>{String(val || "-")}</span>
              </div>
            );
          })}
        </div>
      );

    case "checkin":
      return (
        <div style={tarjetaBase}>
          <div style={tarjetaTitulo}>📋 {titulo}</div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <span style={datos.activa ? badgeActivo : datos.usada ? badgeInfo : badgeInactivo}>
              {datos.estado}
            </span>
          </div>
          {datos.expiracion && (
            <div style={datoPar}>
              <span style={datoLabel}>Expiración</span>
              <span style={datoValor}>
                {new Date(datos.expiracion).toLocaleString("es-CO")}
              </span>
            </div>
          )}
          {datos.checkinUrl && (
            <div style={{ marginTop: "0.5rem" }}>
              <a
                href={datos.checkinUrl}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#60a5fa", textDecoration: "underline", fontSize: "0.9rem" }}
              >
                Abrir formulario de check-in
              </a>
            </div>
          )}
        </div>
      );

    case "cerraduras":
      return (
        <div style={tarjetaBase}>
          <div style={tarjetaTitulo}>🔐 {titulo}</div>
          {datos.mensaje && (
            <p style={{ color: "#94a3b8", fontSize: "0.9rem", margin: 0 }}>
              {datos.mensaje}
            </p>
          )}
          {datos.passcodes?.map((p: any, i: number) => (
            <div
              key={i}
              style={{
                background: "#0f172a",
                border: "1px solid #1f2937",
                borderRadius: "0.65rem",
                padding: "0.75rem",
                marginTop: "0.5rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, color: "#fff" }}>
                  {p.lockAlias}
                </span>
                <span style={p.verificado ? badgeActivo : badgeInactivo}>
                  {p.verificado ? "Verificado" : "Sin verificar"}
                </span>
              </div>
              {p.codigo && p.codigo !== "-" && (
                <div style={{ marginTop: "0.5rem" }}>
                  <span style={{ color: "#94a3b8", fontSize: "0.82rem" }}>PIN: </span>
                  <span style={codigoPIN}>{p.codigo}</span>
                </div>
              )}
              {p.fin && (
                <div style={{ marginTop: "0.35rem", fontSize: "0.82rem", color: "#94a3b8" }}>
                  Válido hasta: {new Date(p.fin).toLocaleString("es-CO")}
                </div>
              )}
            </div>
          ))}
        </div>
      );

    case "cobro":
      return (
        <div style={tarjetaBase}>
          <div style={tarjetaTitulo}>💰 {titulo}</div>
          <div style={datoPar}>
            <span style={datoLabel}>Total</span>
            <span style={datoValor}>
              {formatMoney(datos.totalHospedaje, datos.moneda)}
            </span>
          </div>
          <div style={datoPar}>
            <span style={datoLabel}>Anticipo</span>
            <span style={datoValor}>
              {formatMoney(datos.anticipo, datos.moneda)}
            </span>
          </div>
          <div style={datoPar}>
            <span style={datoLabel}>Saldo pendiente</span>
            <span style={datoValor}>
              {formatMoney(datos.saldoPendiente, datos.moneda)}
            </span>
          </div>
        </div>
      );

    case "metricas":
      return (
        <div style={tarjetaBase}>
          <div style={tarjetaTitulo}>📊 {titulo}</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: "0.75rem",
              marginTop: "0.5rem",
            }}
          >
            <MetricaBox label="Total huéspedes" value={datos.total} />
            <MetricaBox label="Hoy" value={datos.hoy} />
            <MetricaBox label="Este mes" value={datos.mes} />
            <MetricaBox label="Passcodes activos" value={datos.passcodesActivos} />
          </div>
        </div>
      );

    case "lista_huespedes":
      return (
        <div style={tarjetaBase}>
          <div style={tarjetaTitulo}>📋 {titulo}</div>
          {datos.huespedes?.length === 0 && (
            <p style={{ color: "#94a3b8", fontSize: "0.9rem", margin: 0 }}>
              No hay huéspedes registrados hoy.
            </p>
          )}
          {datos.huespedes?.map((h: any) => (
            <div
              key={h.id}
              style={{
                background: "#0f172a",
                border: "1px solid #1f2937",
                borderRadius: "0.65rem",
                padding: "0.65rem 0.85rem",
                marginTop: "0.4rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
              }}
              onClick={() => onBuscar(h.numeroReserva)}
            >
              <div>
                <div style={{ fontWeight: 700, color: "#fff", fontSize: "0.92rem" }}>
                  {h.nombre}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                  Reserva: {h.numeroReserva}
                </div>
              </div>
              <span style={{ color: "#60a5fa", fontSize: "0.8rem" }}>Ver →</span>
            </div>
          ))}
        </div>
      );

    case "locks":
      return (
        <div style={tarjetaBase}>
          <div style={tarjetaTitulo}>🔒 {titulo}</div>
          <p style={{ color: "#94a3b8", fontSize: "0.9rem", margin: "0 0 0.5rem" }}>
            {datos.totalActivos} cerradura(s) con códigos activos
          </p>
          {datos.locksConPascodesActivos?.map((l: any) => (
            <div
              key={l.lockId}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "0.4rem 0",
                borderBottom: "1px solid #111827",
                fontSize: "0.9rem",
              }}
            >
              <span style={{ color: "#fff" }}>{l.lockAlias || `Lock ${l.lockId}`}</span>
              <span style={badgeActivo}>Activa</span>
            </div>
          ))}
        </div>
      );

    default:
      return null;
  }
}

/* =======================================================================
   HELPERS
   ======================================================================= */
function MetricaBox({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        background: "#0f172a",
        padding: "0.75rem",
        borderRadius: "0.65rem",
        textAlign: "center",
        border: "1px solid #1f2937",
      }}
    >
      <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>
        {value ?? 0}
      </div>
      <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "0.2rem" }}>
        {label}
      </div>
    </div>
  );
}

function formatLabel(key: string): string {
  const map: Record<string, string> = {
    documento: "Documento",
    telefono: "Teléfono",
    email: "Email",
    nacionalidad: "Nacionalidad",
    reserva: "Reserva",
    ingreso: "Ingreso",
    salida: "Salida",
    motivoViaje: "Motivo de viaje",
    direccion: "Dirección",
  };
  return map[key] || key.charAt(0).toUpperCase() + key.slice(1);
}

function formatMoney(value?: number, currency = "COP") {
  const n = Number(value || 0);
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${currency} ${n}`;
  }
}
