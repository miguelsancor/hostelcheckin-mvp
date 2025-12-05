import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ContactAutocomplete from "../components/ContactAutocomplete";

// @ts-ignore
import * as QRCode from "qrcode";

const API_BASE = import.meta.env.VITE_API_BASE || "http://18.206.179.50:4000";

export default function Login() {
  const [tipoBusqueda, setTipoBusqueda] = useState<
    "documento" | "codigo" | "contacto"
  >("documento");

  const [tipoDocumento, setTipoDocumento] = useState("Cédula");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [codigoReserva, setCodigoReserva] = useState("");

  const [valorContacto, setValorContacto] = useState("");

  // link + qr
  const [linkCheckin, setLinkCheckin] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // reserva encontrada
  const [reservaEncontrada, setReservaEncontrada] = useState<any>(null);

  const navigate = useNavigate();

  /* ===============================================
      GENERAR LINK + QR
  =============================================== */
  const generarLinkYQR = async (reserva: any) => {
    if (!reserva) return;

    const numero =
      reserva.numeroReserva || reserva.order_id || reserva.numero || null;

    if (!numero) return;

    const link = `http://18.206.179.50:5173/checkin?reserva=${numero}`;
    setLinkCheckin(link);

    try {
      const url = await QRCode.toDataURL(link, {
        width: 280,
        margin: 2,
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error("Error QR:", err);
    }
  };

  /* ===============================================
      BUSCAR RESERVA
  =============================================== */
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
      }

      if (tipoBusqueda === "documento" && numeroDocumento) {
        const res = await fetch(`${API_BASE}/api/checkin/buscar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tipoDocumento, numeroDocumento }),
        });
        if (res.ok) reserva = await res.json();
      }

      if (tipoBusqueda === "contacto" && valorContacto) {
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

      // guardar
      setReservaEncontrada(reserva);

      // generar link + qr
      await generarLinkYQR(reserva);

    } catch (err) {
      alert("Error de conexión");
    }
  };

  /* ===============================================
      CONTINUAR AL FORMULARIO CHECKIN
  =============================================== */
  const continuarAlCheckin = () => {
    if (!reservaEncontrada) return;

    localStorage.setItem(
      "usuario",
      JSON.stringify({ role: "guest-checkin" })
    );
    localStorage.setItem("reserva", JSON.stringify(reservaEncontrada));

    navigate("/checkin", { replace: true });
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
            width="100"
            height="100"
          />
        </h2>

        {/* -------------------- INPUTS ------------------ */}
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

        {/* -------------------- BOTONES ------------------ */}
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

        {/* -------------------- LINK + QR ------------------ */}
        {linkCheckin && (
          <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
            <p style={{ color: "#fff" }}>Link para completar check-in:</p>

            <div
              style={{
                background: "#111",
                padding: "0.8rem",
                borderRadius: "8px",
                wordBreak: "break-all",
                color: "#0bf",
              }}
            >
              {linkCheckin}
            </div>

            <button
              style={{
                ...styles.button,
                backgroundColor: "#10b981",
                marginTop: "0.8rem",
              }}
              onClick={() => navigator.clipboard.writeText(linkCheckin)}
            >
              Copiar Link
            </button>

            {qrDataUrl && (
              <div style={{ marginTop: "1rem" }}>
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  style={{ width: "180px", height: "180px" }}
                />
              </div>
            )}

            <button
              style={{
                ...styles.button,
                backgroundColor: "#f59e0b",
                marginTop: "1rem",
              }}
              onClick={continuarAlCheckin}
            >
              Continuar al Check-in
            </button>
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
