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
  const [valorContacto, setValorContacto] = useState("");

  const [reservaEncontrada, setReservaEncontrada] = useState<any>(null);
  const navigate = useNavigate();

  /* ===============================================
      GENERAR Y GUARDAR LINK EN BD
  =============================================== */
  const generarYGuardarLink = async (reserva: any) => {
    const numero = String(
      reserva.numeroReserva ||
      reserva.order_id ||
      reserva.numero ||
      ""
    );
  
    if (!numero) return;
  
    const PUBLIC_BASE =
      import.meta.env.VITE_PUBLIC_BASE_URL ||
      `${window.location.protocol}//${window.location.host}`;
  
    // ✅ LINK LIMPIO Y EDITABLE POR RESERVA
    const link = `${PUBLIC_BASE}/checkin?reserva=${encodeURIComponent(numero)}`;
  
    // ✅ Guardar también local para el hook
    localStorage.setItem("checkinUrlReal", link);
  
    await fetch(`${API_BASE}/admin/huesped/checkin-por-reserva`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        numeroReserva: numero,
        checkinUrl: link,
      }),
    });
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

      setReservaEncontrada(reserva);

      // ✅ Genera y guarda el link REAL en BD + localStorage
      await generarYGuardarLink(reserva);

      // ✅ Continuar directo al check-in
      continuarAlCheckin(reserva);
    } catch (err) {
      alert("Error de conexión");
    }
  };

  /* ===============================================
      CONTINUAR AL FORMULARIO CHECKIN
  =============================================== */
  const continuarAlCheckin = (reserva: any) => {
    localStorage.setItem(
      "usuario",
      JSON.stringify({ role: "guest-checkin" })
    );
    localStorage.setItem("reserva", JSON.stringify(reserva));

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
