import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ContactAutocomplete from "../components/ContactAutocomplete";

const API_BASE = import.meta.env.VITE_API_BASE || "http://18.206.179.50:4000";

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
  // ✅ CAMBIO 1: por defecto Email / Teléfono
  const [tipoBusqueda, setTipoBusqueda] = useState<TipoBusqueda>("contacto");

  const [tipoDocumento, setTipoDocumento] = useState("Cédula");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [codigoReserva, setCodigoReserva] = useState("");
  const [valorContacto, setValorContacto] = useState("");

  const [loading, setLoading] = useState(false);
  const [reservaEncontrada, setReservaEncontrada] = useState<any>(null);
  const navigate = useNavigate();

  const tabs = useMemo(
    () => [
      { key: "codigo" as const, label: "Número de reserva" },
      { key: "documento" as const, label: "Documento" },
      { key: "contacto" as const, label: "Email / Teléfono" },
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

    const reservaObj = {
      numeroReserva: numeroReserva || "",
      nombre: reserva?.nombre || reserva?.name || "",
      email: reserva?.email || "",
      telefono: reserva?.telefono || reserva?.phone || "",
      checkin,
      checkout,
      room_id: reserva?.room_id ?? null,
      lockId: reserva?.lockId,
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
      ✅ BUSCAR RESERVA (sin tocar backend)
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

      // 3) Contacto (email/teléfono) - tolerante
      if (tipoBusqueda === "contacto") {
        const raw = valorContacto.trim();
        if (!raw) {
          alert("Ingresa email o teléfono");
          return;
        }

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

        // fallback: autocomplete contactos
        if (!reserva) {
          const q = isEmail ? normalizeEmail(raw) : normalizePhone(raw);
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
                  if (data?.ok && data?.reserva) reserva = data.reserva;
                }

                if (!reserva) {
                  const local = await fetch(
                    `${API_BASE}/api/checkin/por-reserva/${encodeURIComponent(nr)}`
                  );
                  if (local.ok) {
                    const data = await local.json();
                    if (data?.ok && data?.data) reserva = data.data;
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
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.12)",
    background: active ? "rgba(59,130,246,0.22)" : "rgba(255,255,255,0.06)",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  });

  return (
    <div style={ui.page}>
      <div style={ui.card}>
        <div style={ui.header}>
          <img
            src="https://kuyay.co/wp-content/uploads/2025/02/android-chrome-192x192-1-e1739471996937.png"
            width="44"
            height="44"
            alt="Kuyay"
            style={{ borderRadius: 12 }}
          />
          <div style={{ textAlign: "left" }}>
            <div style={{ fontWeight: 800, lineHeight: 1.1 }}>Kuyay Hostel</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Auto Check-in</div>
          </div>
        </div>

        <h2 style={ui.title}>Auto Check-in</h2>
        <p style={ui.subtitle}>
          Ingresa tu <b>número de reserva</b>, <b>documento</b> o <b>contacto</b>{" "}
          del titular para comenzar.
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
                onChange={setValorContacto}
                onSelectSuggestion={() => {}}
              />
              <div style={ui.hint}>
                Teléfono: puedes escribir <b>sin +57</b> (ej: 3001234567). Email: se
                limpia automáticamente.
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

          <button style={ui.secondaryBtn} onClick={crearFormatoEnBlanco} disabled={loading}>
            Reservar
          </button>
        </div>

        {/* ✅ CAMBIO 2: QUITAMOS BLOQUE DE PASOS (stepsBox) */}

        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>
          ¿Necesitas ayuda?{" "}
          <a href="#" style={{ color: "#93c5fd" }}>
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

/* ======================= UI STYLES (solo Login) ======================= */
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
    maxWidth: 460,
    borderRadius: 18,
    padding: "18px 18px 16px",
    color: "#fff",
    background: "rgba(17, 24, 39, 0.70)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 24px 80px rgba(0,0,0,0.55)",
    backdropFilter: "blur(10px)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  title: {
    margin: "6px 0 6px",
    fontSize: 28,
    letterSpacing: 0.2,
  },
  subtitle: {
    margin: 0,
    opacity: 0.9,
    fontSize: 13,
    lineHeight: 1.4,
  },
  tabs: {
    marginTop: 14,
    display: "flex",
    gap: 8,
  },
  input: {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.92)",
    color: "#111827",
    outline: "none",
    fontSize: 14,
  },
  select: {
    width: 160,
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.92)",
    color: "#111827",
    outline: "none",
    fontSize: 14,
  },
  hint: {
    marginTop: -4,
    fontSize: 12,
    opacity: 0.85,
  },
  primaryBtn: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "none",
    backgroundColor: "#2563eb",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },
  secondaryBtn: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.06)",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },
};