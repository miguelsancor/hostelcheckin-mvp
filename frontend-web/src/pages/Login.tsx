import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ContactAutocomplete, {
  type ContactSuggestion,
} from "../components/ContactAutocomplete";

const API_BASE = import.meta.env.VITE_API_BASE || "http:///api";

type TipoBusqueda = "codigo" | "documento" | "contacto";

// ✅ Convierte "2026-02-04T00:00:00" -> "2026-02-04"
function toDateInput(value?: string | null) {
  if (!value) return "";
  const s = String(value).trim();
  if (s.includes("T")) return s.split("T")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

// Normaliza un teléfono: quita espacios, guiones, paréntesis
function normalizePhone(raw: string) {
  const s = String(raw || "").trim();
  const digits = s.replace(/[^\d]/g, "");
  return digits;
}

// Genera candidatos para búsqueda: tolera +57, 57, sin prefijo
function phoneCandidates(input: string) {
  const d = normalizePhone(input);
  if (!d) return [];

  const c: string[] = [];
  c.push(d);

  if (d.startsWith("57") && d.length >= 12) {
    const tail = d.slice(2);
    c.push(tail);
    c.push(`+${d}`);
  } else if (d.length === 10) {
    c.push(`57${d}`);
    c.push(`+57${d}`);
  }

  return Array.from(new Set(c)).filter(Boolean);
}

// Normaliza email (trim + lower)
function normalizeEmail(raw: string) {
  return String(raw || "").trim().toLowerCase();
}

export default function Login() {
  // ✅ por defecto contacto
  const [tipoBusqueda, setTipoBusqueda] = useState<TipoBusqueda>("contacto");

  const [tipoDocumento, setTipoDocumento] = useState("Cédula");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [codigoReserva, setCodigoReserva] = useState("");
  const [valorContacto, setValorContacto] = useState("");
  const [contactoSeleccionado, setContactoSeleccionado] =
    useState<ContactSuggestion | null>(null);

  const [loading, setLoading] = useState(false);
  const [reservaEncontrada, setReservaEncontrada] = useState<any>(null);
  const navigate = useNavigate();

  const tabs = useMemo(
    () => [
      { key: "codigo" as const, label: "Número de reserva" },
      { key: "documento" as const, label: "Documento" },
      { key: "contacto" as const, label: "Nombre / Email / Teléfono" },
    ],
    []
  );

  /* ===============================================
      GENERAR Y GUARDAR LINK EN BD (NO BLOQUEANTE)
  =============================================== */
  const generarYGuardarLink = async (reserva: any) => {
    const numero = String(
      reserva?.numeroReserva || reserva?.order_id || reserva?.numero || ""
    ).trim();
    if (!numero) return;

    const PUBLIC_BASE =
      import.meta.env.VITE_PUBLIC_BASE_URL ||
      `${window.location.protocol}//${window.location.host}`;

    const link = `${PUBLIC_BASE}/checkin?reserva=${encodeURIComponent(numero)}`;
    localStorage.setItem("checkinUrlReal", link);

    try {
      await fetch(`${API_BASE}/admin/huesped/checkin-por-reserva`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numeroReserva: numero, checkinUrl: link }),
      });
    } catch {
      // silencioso
    }
  };

  /* ===============================================
      ✅ Crear sesión compartible (token) y navegar /checkin?t=
  =============================================== */
  const crearSesionYNavegar = async (reserva: any) => {
    localStorage.setItem("usuario", JSON.stringify({ role: "guest-checkin" }));
    localStorage.setItem("reserva", JSON.stringify(reserva));

    const numeroReserva = String(
      reserva?.numeroReserva || reserva?.order_id || reserva?.numero || ""
    ).trim();

    const checkin = toDateInput(reserva?.checkin);
    const checkout = toDateInput(reserva?.checkout);

    // Nobeds: usar balance (deuda pendiente) como monto a cobrar
    const balanceRaw = reserva?.balance;
    const balanceParsed = balanceRaw != null ? Number(balanceRaw) : NaN;
    const cobro = Number.isFinite(balanceParsed) && balanceParsed > 0 ? balanceParsed : undefined;

    // Fallback: price o total solo si no hay balance
    const priceFallback = [reserva?.price, reserva?.total, reserva?.b_price]
      .map(v => v != null ? Number(v) : NaN)
      .find(v => Number.isFinite(v) && v > 0);

    const montoFinal = cobro ?? priceFallback;

    const reservaObj = {
      numeroReserva: numeroReserva || "",
      nombre: reserva?.nombre || reserva?.name || reserva?.b_name || "",
      email: reserva?.email || "",
      telefono: reserva?.telefono || reserva?.phone || "",
      checkin,
      checkout,
      room_id: reserva?.room_id ?? null,
      lockId: reserva?.lockId,
      balance: cobro,
      total: montoFinal,
      price: Number.isFinite(priceFallback) ? priceFallback : montoFinal,
    };

    const formList = [
      {
        nombre: reservaObj.nombre,
        tipoDocumento: reserva?.tipoDocumento || "",
        numeroDocumento: reserva?.numeroDocumento || "",
        nacionalidad: reserva?.nacionalidad || "",
        direccion: reserva?.direccion || "",
        lugarProcedencia: reserva?.lugarProcedencia || "",
        lugarDestino: reserva?.lugarDestino || "",
        telefono: reservaObj.telefono,
        email: reservaObj.email,
        motivoViaje: reserva?.motivoViaje || "",
        fechaIngreso: checkin,
        fechaSalida: checkout,
      },
    ];

    if (!numeroReserva) {
      navigate("/checkin", { replace: true });
      return;
    }

    try {
      const resp = await fetch(`${API_BASE}/api/checkin/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reserva: reservaObj, formList }),
      });

      const json = await resp.json();

      if (json?.ok && json?.token) {
        navigate(`/checkin?t=${encodeURIComponent(String(json.token))}`, {
          replace: true,
        });
        return;
      }
    } catch {
      // no rompemos
    }

    navigate("/checkin", { replace: true });
  };

  const crearFormatoEnBlanco = () => {
    localStorage.setItem("usuario", JSON.stringify({ role: "guest-checkin" }));
    localStorage.setItem("reserva", JSON.stringify({}));
    navigate("/checkin", { replace: true });
  };

  /* ===============================================
      ✅ BUSCAR RESERVA
  =============================================== */
  const buscarReserva = async () => {
    try {
      setLoading(true);
      setReservaEncontrada(null);

      let reserva: any = null;

      // 1) Número de reserva (NoBeds)
      if (tipoBusqueda === "codigo") {
        const code = codigoReserva.trim();
        if (!code) {
          alert("Ingresa el número de reserva");
          return;
        }

        const res = await fetch(
          `${API_BASE}/api/nobeds/reserva/${encodeURIComponent(code)}`
        );

        if (res.ok) {
          const data = await res.json();
          if (data?.ok && data?.reserva) reserva = data.reserva;
        }
      }

      // 2) Documento (SQLite local)
      if (tipoBusqueda === "documento") {
        const doc = numeroDocumento.trim();
        if (!doc) {
          alert("Ingresa el número de documento");
          return;
        }

        const res = await fetch(`${API_BASE}/api/checkin/buscar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tipoDocumento,
            numeroDocumento: doc,
          }),
        });

        if (res.ok) reserva = await res.json();
      }

      // 3) Contacto / Nombre
      if (tipoBusqueda === "contacto") {
        const raw = valorContacto.trim();

        if (!raw) {
          alert("Ingresa nombre, email o teléfono");
          return;
        }

        // ✅ si el usuario eligió una sugerencia, usar primero su numeroReserva
        if (contactoSeleccionado?.numeroReserva) {
          const nr = String(contactoSeleccionado.numeroReserva).trim();

          if (nr) {
            const nb = await fetch(
              `${API_BASE}/api/nobeds/reserva/${encodeURIComponent(nr)}`
            );

            if (nb.ok) {
              const data = await nb.json();
              if (data?.ok && data?.reserva) {
                reserva = data.reserva;
              }
            }

            if (!reserva) {
              const local = await fetch(
                `${API_BASE}/api/checkin/por-reserva/${encodeURIComponent(nr)}`
              );

              if (local.ok) {
                const data = await local.json();
                if (data?.ok && data?.data) {
                  reserva = data.data;
                }
              }
            }
          }
        }

        // ✅ flujo actual tolerante por email / teléfono
        if (!reserva) {
          const isEmail = raw.includes("@");
          const candidates = isEmail
            ? [normalizeEmail(raw), raw.trim(), raw]
            : phoneCandidates(raw).concat([raw.trim(), raw]);

          for (const v of Array.from(new Set(candidates)).filter(Boolean)) {
            const res = await fetch(
              `${API_BASE}/api/checkin/buscar-combinado/${encodeURIComponent(v)}`
            );

            if (res.ok) {
              const data = await res.json();
              if (data?.ok && data?.data) {
                reserva = data.data;
                break;
              }
            }
          }
        }

        // ✅ fallback predictivo por nombre/email/teléfono
        if (!reserva) {
          const q = raw.includes("@")
            ? normalizeEmail(raw)
            : normalizePhone(raw) || raw;

          const res = await fetch(
            `${API_BASE}/api/checkin/contactos?query=${encodeURIComponent(q)}`
          );

          if (res.ok) {
            const list = await res.json();

            if (Array.isArray(list) && list.length > 0) {
              const best = list[0];
              const nr = String(best?.numeroReserva || "").trim();

              if (nr) {
                const nb = await fetch(
                  `${API_BASE}/api/nobeds/reserva/${encodeURIComponent(nr)}`
                );

                if (nb.ok) {
                  const data = await nb.json();
                  if (data?.ok && data?.reserva) {
                    reserva = data.reserva;
                  }
                }

                if (!reserva) {
                  const local = await fetch(
                    `${API_BASE}/api/checkin/por-reserva/${encodeURIComponent(nr)}`
                  );

                  if (local.ok) {
                    const data = await local.json();
                    if (data?.ok && data?.data) {
                      reserva = data.data;
                    }
                  }
                }
              }
            }
          }
        }
      }

      if (!reserva) {
        alert("Reserva no encontrada");
        return;
      }

      setReservaEncontrada(reserva);

      await generarYGuardarLink(reserva);
      await crearSesionYNavegar(reserva);
    } catch {
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const activeTabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: "11px 12px",
    borderRadius: 14,
    border: active ? "1px solid rgba(59,130,246,0.5)" : "1px solid rgba(255,255,255,0.08)",
    background: active
      ? "linear-gradient(135deg, rgba(59,130,246,0.22), rgba(124,58,237,0.14))"
      : "rgba(255,255,255,0.04)",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: 13,
    transition: "all 0.25s ease",
    boxShadow: active ? "0 4px 20px rgba(59,130,246,0.15)" : "none",
  });

  return (
    <div style={ui.page}>
      <div style={ui.card}>
        <div style={ui.header}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            overflow: "hidden",
            boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}>
            <img
              src="https://kuyay.co/wp-content/uploads/2025/02/android-chrome-192x192-1-e1739471996937.png"
              width="48"
              height="48"
              alt="Kuyay"
              style={{ display: "block" }}
            />
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontWeight: 900, fontSize: 17, lineHeight: 1.1, letterSpacing: "-0.01em" }}>Kuyay Hostel</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Auto Check-in</div>
          </div>
        </div>

        <h2 style={ui.title}>Auto Check-in</h2>
        <p style={ui.subtitle}>
          Ingresa tu <b style={{ color: "#fff" }}>número de reserva</b>, <b style={{ color: "#fff" }}>documento</b>, <b style={{ color: "#fff" }}>nombre</b>,{" "}
          <b style={{ color: "#fff" }}>email</b> o <b style={{ color: "#fff" }}>teléfono</b> del titular para comenzar.
        </p>

        {/* Tabs */}
        <div style={ui.tabs}>
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              style={activeTabStyle(tipoBusqueda === t.key)}
              onClick={() => setTipoBusqueda(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Inputs por tab */}
        <div
          style={{
            marginTop: 14,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {tipoBusqueda === "codigo" && (
            <>
              <input
                type="text"
                placeholder="Número de reserva (Ej: 837462 o NB-10293)"
                value={codigoReserva}
                onChange={(e) => setCodigoReserva(e.target.value)}
                style={ui.input}
              />
              <div style={ui.hint}>
                Ejemplo: <b>837462</b> o <b>NB-10293</b>
              </div>
            </>
          )}

          {tipoBusqueda === "documento" && (
            <>
              <div style={{ display: "flex", gap: 10 }}>
                <select
                  value={tipoDocumento}
                  onChange={(e) => setTipoDocumento(e.target.value)}
                  style={ui.select}
                >
                  <option value="Cédula">Cédula</option>
                  <option value="Pasaporte">Pasaporte</option>
                </select>

                <input
                  type="text"
                  placeholder="Número de documento"
                  value={numeroDocumento}
                  onChange={(e) => setNumeroDocumento(e.target.value)}
                  style={{ ...ui.input, flex: 1 }}
                />
              </div>
              <div style={ui.hint}>
                Tip: no importa si escribes con puntos/espacios, el sistema intenta
                tolerarlo.
              </div>
            </>
          )}

          {tipoBusqueda === "contacto" && (
            <>
              <ContactAutocomplete
                value={valorContacto}
                onChange={(val) => {
                  setValorContacto(val);
                  setContactoSeleccionado(null);
                }}
                onSelectSuggestion={(item) => {
                  setContactoSeleccionado(item);
                  setValorContacto(
                    item?.nombre ||
                      item?.email ||
                      item?.telefono ||
                      item?.numeroReserva ||
                      ""
                  );
                }}
              />
              <div style={ui.hint}>
                Puedes buscar por <b>teléfono</b>, <b>email</b> o <b>nombre</b>. Te mostraremos coincidencias del titular.
              </div>

            </>
          )}
        </div>

        {/* Botones */}
        <div
          style={{
            marginTop: 16,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <button style={ui.primaryBtn} onClick={buscarReserva} disabled={loading}>
            {loading ? "Buscando..." : "Iniciar check-in"}
          </button>

          <button
            style={ui.secondaryBtn}
            onClick={crearFormatoEnBlanco}
            disabled={loading}
          >
            Reservar
          </button>
        </div>

        <div style={{ marginTop: 14, fontSize: 12.5, color: "#64748b", textAlign: "center" }}>
          ¿Necesitas ayuda?{" "}
          <a href="#" style={{ color: "#93c5fd", fontWeight: 700 }}>
            Contactar recepción
          </a>
        </div>

        {reservaEncontrada && (
          <div style={{ marginTop: 12, fontSize: 12, opacity: 0.85 }}>
            Reserva detectada:{" "}
            <b>
              {String(
                reservaEncontrada?.numeroReserva ||
                  reservaEncontrada?.order_id ||
                  reservaEncontrada?.numero ||
                  "-"
              )}
            </b>
          </div>
        )}
      </div>
    </div>
  );
}

/* ======================= UI STYLES 2026 (solo Login) ======================= */
const ui: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 14px",
  },
  card: {
    width: "100%",
    maxWidth: 480,
    borderRadius: 22,
    padding: "24px 22px 20px",
    color: "#fff",
    background: "linear-gradient(165deg, rgba(15,23,42,0.92), rgba(2,6,23,0.96))",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04) inset",
    backdropFilter: "blur(24px)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  title: {
    margin: "6px 0 6px",
    fontSize: 30,
    letterSpacing: -0.3,
    fontWeight: 900,
    background: "linear-gradient(135deg, #fff 60%, #93c5fd)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    margin: 0,
    opacity: 0.85,
    fontSize: 13.5,
    lineHeight: 1.5,
    color: "#cbd5e1",
  },
  tabs: {
    marginTop: 16,
    display: "flex",
    gap: 8,
  },
  input: {
    width: "100%",
    padding: "13px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.93)",
    color: "#111827",
    outline: "none",
    fontSize: 14,
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  select: {
    width: 160,
    padding: "13px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.93)",
    color: "#111827",
    outline: "none",
    fontSize: 14,
  },
  hint: {
    marginTop: -2,
    fontSize: 12,
    opacity: 0.75,
    color: "#94a3b8",
  },
  primaryBtn: {
    width: "100%",
    padding: "13px 14px",
    borderRadius: 14,
    border: "none",
    background: "linear-gradient(135deg, #2563eb, #7c3aed)",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: 15,
    letterSpacing: "0.01em",
    boxShadow: "0 8px 28px rgba(37,99,235,0.28)",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
  },
  secondaryBtn: {
    width: "100%",
    padding: "13px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: 15,
    transition: "background-color 0.2s ease",
  },
};
