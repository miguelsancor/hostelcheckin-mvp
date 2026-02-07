import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ContactAutocomplete from "../components/ContactAutocomplete";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

type TipoBusqueda = "documento" | "codigo" | "contacto";

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

export default function Login() {
  const [tipoBusqueda, setTipoBusqueda] = useState<TipoBusqueda>("documento");

  const [tipoDocumento, setTipoDocumento] = useState("Cédula");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [codigoReserva, setCodigoReserva] = useState("");
  const [valorContacto, setValorContacto] = useState("");

  const [reservaEncontrada, setReservaEncontrada] = useState<any>(null);
  const navigate = useNavigate();

  /* ===============================================
      GENERAR Y GUARDAR LINK EN BD (NO BLOQUEANTE)
      (lo dejo igual pero ya NO depende de esto el flujo)
  =============================================== */
  const generarYGuardarLink = async (reserva: any) => {
    const numero = String(
      reserva?.numeroReserva || reserva?.order_id || reserva?.numero || ""
    ).trim();
    if (!numero) return;

    const PUBLIC_BASE =
      import.meta.env.VITE_PUBLIC_BASE_URL ||
      `${window.location.protocol}//${window.location.host}`;

    // ⚠️ Compat, pero ya NO se usa como navegación principal
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
      ✅ NUEVO: Crear sesión compartible (token) en backend
      y navegar a /checkin?t=TOKEN
  =============================================== */
  const crearSesionYNavegar = async (reserva: any) => {
    // 1) guardar como antes (por si el usuario vuelve al mismo navegador)
    localStorage.setItem("usuario", JSON.stringify({ role: "guest-checkin" }));
    localStorage.setItem("reserva", JSON.stringify(reserva));

    // 2) construir "reservaObj" robusto (nobeds / sqlite)
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

    // 3) formList inicial (sin Files)
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

    // 4) si NO hay numeroReserva, igual deja entrar al form (sin token)
    if (!numeroReserva) {
      navigate("/checkin", { replace: true });
      return;
    }

    // 5) crear token en backend y redirigir a /checkin?t=...
    try {
      const resp = await fetch(`${API_BASE}/api/checkin/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reserva: reservaObj, formList }),
      });

      const json = await resp.json();

      if (json?.ok && json?.token) {
        // ✅ Esta URL es la compartible (funciona en OTRO navegador)
        navigate(`/checkin?t=${encodeURIComponent(String(json.token))}`, { replace: true });
        return;
      }
    } catch {
      // si falla, no rompemos
    }

    // 6) fallback: entra al checkin normal (funciona al menos en este navegador)
    navigate("/checkin", { replace: true });
  };

  const crearFormatoEnBlanco = () => {
    localStorage.setItem("usuario", JSON.stringify({ role: "guest-checkin" }));
    localStorage.setItem("reserva", JSON.stringify({}));

    navigate("/checkin", { replace: true });
  };

  /* ===============================================
      BUSCAR RESERVA
  =============================================== */
  const buscarReserva = async () => {
    try {
      let reserva: any = null;

      // 1) Por código de reserva (NoBeds)
      if (tipoBusqueda === "codigo" && codigoReserva.trim()) {
        const res = await fetch(
          `${API_BASE}/api/nobeds/reserva/${encodeURIComponent(codigoReserva.trim())}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data?.ok && data?.reserva) reserva = data.reserva;
        }
      }

      // 2) Por documento (SQLite local)
      if (tipoBusqueda === "documento" && numeroDocumento.trim()) {
        const res = await fetch(`${API_BASE}/api/checkin/buscar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tipoDocumento,
            numeroDocumento: numeroDocumento.trim(),
          }),
        });
        if (res.ok) reserva = await res.json();
      }

      // 3) Por contacto (email/teléfono)
      if (tipoBusqueda === "contacto" && valorContacto.trim()) {
        const res = await fetch(
          `${API_BASE}/api/checkin/buscar-combinado/${encodeURIComponent(valorContacto.trim())}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data?.ok && data?.data) reserva = data.data;
        }
      }

      if (!reserva) {
        alert("Reserva no encontrada");
        return;
      }

      setReservaEncontrada(reserva);

      // No bloqueante
      await generarYGuardarLink(reserva);

      // ✅ CLAVE: ahora SIEMPRE crea token y navega con ?t=
      await crearSesionYNavegar(reserva);
    } catch (err) {
      alert("Error de conexión");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>
          <img
            src="https://kuyay.co/wp-content/uploads/2025/02/android-chrome-192x192-1-e1739471996937.png"
            width="100"
            height="100"
            alt="Kuyay"
          />
        </h2>

        <div style={styles.inputGroup}>
          <label>
            Buscar por:
            <select
              value={tipoBusqueda}
              onChange={(e) => setTipoBusqueda(e.target.value as any)}
              style={styles.select}
            >
              <option value="documento">ID / Documento</option>
              <option value="codigo">Número de Reserva</option>
              <option value="contacto">Email / Teléfono</option>
            </select>
          </label>

          {tipoBusqueda === "documento" && (
            <>
              <select
                value={tipoDocumento}
                onChange={(e) => setTipoDocumento(e.target.value)}
                style={styles.select}
              >
                <option value="Cédula">Cédula</option>
                <option value="Pasaporte">Pasaporte</option>
              </select>

              <input
                type="text"
                placeholder="Número de Documento"
                value={numeroDocumento}
                onChange={(e) => setNumeroDocumento(e.target.value)}
                style={styles.input}
              />
            </>
          )}

          {tipoBusqueda === "codigo" && (
            <input
              type="text"
              placeholder="Código de Reserva"
              value={codigoReserva}
              onChange={(e) => setCodigoReserva(e.target.value)}
              style={styles.input}
            />
          )}

          {tipoBusqueda === "contacto" && (
            <ContactAutocomplete
              value={valorContacto}
              onChange={setValorContacto}
              onSelectSuggestion={() => {}}
            />
          )}
        </div>

        <div style={styles.buttonGroup}>
          <button style={styles.button} onClick={buscarReserva}>
            Consultar Reserva
          </button>

          <button
            style={{
              ...styles.button,
              backgroundColor: "#3b82f6",
              marginTop: "0.75rem",
            }}
            onClick={crearFormatoEnBlanco}
          >
            Reservar
          </button>
        </div>

        {reservaEncontrada && (
          <div style={{ marginTop: "1rem", fontSize: "0.85rem", opacity: 0.85 }}>
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

/* ======================= ESTILOS ======================= */
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#1f2937",
    padding: "2rem",
    borderRadius: "1rem",
    width: "100%",
    maxWidth: "400px",
    color: "#fff",
    boxShadow: "0 0 20px rgba(0,0,0,0.4)",
  },
  title: { marginBottom: "1.5rem", textAlign: "center", fontSize: "1.6rem" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "1rem" },
  input: {
    padding: "0.75rem",
    borderRadius: "0.5rem",
    border: "1px solid #4b5563",
    backgroundColor: "#fff",
    color: "#333",
  },
  select: {
    padding: "0.75rem",
    borderRadius: "0.5rem",
    border: "1px solid #4b5563",
    backgroundColor: "#fff",
    color: "#333",
  },
  buttonGroup: {
    marginTop: "1.5rem",
    display: "flex",
    flexDirection: "column",
  },
  button: {
    width: "100%",
    padding: "0.75rem",
    border: "none",
    borderRadius: "0.5rem",
    backgroundColor: "#f25c93",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
  },
};
