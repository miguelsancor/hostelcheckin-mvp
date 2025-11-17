import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ContactAutocomplete from "../components/ContactAutocomplete";

const API_BASE = import.meta.env.VITE_API_BASE || "http://18.206.179.50:4000";

export default function Login() {
  const [tipoBusqueda, setTipoBusqueda] = useState<
    "documento" | "codigo" | "contacto"
  >("documento");

  const [tipoDocumento, setTipoDocumento] = useState("Cédula");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [codigoReserva, setCodigoReserva] = useState("");

  // 🔥 valor ingresado desde el autocompletado
  const [valorContacto, setValorContacto] = useState("");

  const navigate = useNavigate();

  /* ===================================================
      BUSCAR RESERVA ORIGINAL — SIN CAMBIOS
  =================================================== */
  const buscarReserva = async () => {
    try {
      let reserva: any = null;

      if (tipoBusqueda === "codigo" && codigoReserva) {
        const res = await fetch(
          `${API_BASE}/api/nobeds/reserva/${codigoReserva}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.ok && data.reserva) reserva = data.reserva;
        }
      } else if (tipoBusqueda === "documento" && numeroDocumento) {
        const res = await fetch(`${API_BASE}/api/checkin/buscar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tipoDocumento, numeroDocumento }),
        });
        if (res.ok) {
          reserva = await res.json();
        }
      } else if (tipoBusqueda === "contacto" && valorContacto) {
        const res = await fetch(
          `${API_BASE}/api/checkin/buscar-combinado/${encodeURIComponent(
            valorContacto
          )}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.ok && data.data) reserva = data.data;
        }
      }

      if (!reserva) {
        alert("Reserva no encontrada");
        return;
      }

      localStorage.setItem(
        "usuario",
        JSON.stringify({ role: "guest-checkin" })
      );
      localStorage.setItem("reserva", JSON.stringify(reserva));
      navigate("/checkin", { replace: true });
    } catch (err) {
      alert("Error de conexión");
    }
  };

  const crearFormatoEnBlanco = () => {
    localStorage.setItem(
      "usuario",
      JSON.stringify({ role: "guest-checkin" })
    );
    localStorage.setItem("reserva", JSON.stringify({}));
    navigate("/checkin", { replace: true });
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>
          <img
            src="https://kuyay.co/wp-content/uploads/2025/02/android-chrome-192x192-1-e1739471996937.png"
            alt="Kuyay Logo"
            width="100"
            height="100"
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
              <option value="documento">ID | Documento</option>
              <option value="codigo">Reservation # | Nº Reserva</option>
              <option value="contacto">Email o Teléfono</option>
            </select>
          </label>

          {/* ================================
              🔹 BUSCAR POR DOCUMENTO
          ================================= */}
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

          {/* ================================
              🔹 BUSCAR POR CÓDIGO RESERVA
          ================================= */}
          {tipoBusqueda === "codigo" && (
            <input
              type="text"
              placeholder="Código de Reserva"
              value={codigoReserva}
              onChange={(e) => setCodigoReserva(e.target.value)}
              style={styles.input}
            />
          )}

          {/* ================================
              🔹 BUSCAR POR CONTACTO (AUTOCOMPLETE)
          ================================= */}
          {tipoBusqueda === "contacto" && (
            <div style={{ position: "relative" }}>
              <ContactAutocomplete
                value={valorContacto}
                onChange={setValorContacto}
                onSelectSuggestion={(c) => {
                  // puedes disparar consulta automática si quieres
                  console.log("Seleccionado:", c);
                }}
              />
            </div>
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
      </div>
    </div>
  );
}

/* ========================
      ESTILOS INLINE
======================== */
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
    color: "#333",
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
