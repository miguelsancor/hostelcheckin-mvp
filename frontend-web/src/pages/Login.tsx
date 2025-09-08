import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [tipoBusqueda, setTipoBusqueda] = useState("documento");
  const [tipoDocumento, setTipoDocumento] = useState("Cédula");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [codigoReserva, setCodigoReserva] = useState("");

  const navigate = useNavigate();

  const buscarReserva = async () => {
    const body =
      tipoBusqueda === "documento"
        ? { tipoDocumento, numeroDocumento }
        : { codigoReserva };

    try {
      const res = await fetch("http://localhost:4000/api/checkin/buscar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        alert("Reserva no encontrada");
        return;
      }

      const data = await res.json();
      const reserva = Array.isArray(data) ? data[0] : data;
      if (!reserva) {
        alert("Reserva no encontrada");
        return;
      }

      // Deja pasar el ProtectedRoute
      localStorage.setItem("usuario", JSON.stringify({ role: "guest-checkin" }));
      localStorage.setItem("reserva", JSON.stringify(reserva));
      navigate("/checkin", { replace: true });
    } catch (err) {
      console.error("Error al consultar reserva:", err);
      alert("Error de conexión con el servidor");
    }
  };

  // ✅ NUEVO: crear formato en blanco
  const crearFormatoEnBlanco = () => {
    localStorage.setItem("usuario", JSON.stringify({ role: "guest-checkin" }));
    localStorage.setItem("reserva", JSON.stringify({})); // sin datos
    navigate("/checkin", { replace: true });
  };

  return (
    <div  style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}><img src="https://kuyay.co/wp-content/uploads/2025/02/android-chrome-192x192-1-e1739471996937.png" alt="Kuyay Logo" width="100" height="100"></img></h2>

        <div className="select-search-type" style={styles.inputGroup}>
          <label>Buscar por:
          <select name="Buscar por:"
            value={tipoBusqueda}
            onChange={(e) => setTipoBusqueda(e.target.value)}
            style={styles.select}
          >
            <option value="documento">ID | Documento</option>
            <option value="codigo">Reservation # | # Reserva</option>
          </select>
          </label>

          {tipoBusqueda === "documento" && (
            <>
              <select className="select-reserv-document"
                value={tipoDocumento}
                onChange={(e) => setTipoDocumento(e.target.value)}
                style={styles.select}
              >
                <option value="Cédula">Cédula</option>
                <option value="Pasaporte">Pasaporte</option>
              </select>
              <input className="input-reserv-document"
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
        </div>

        <div style={styles.buttonGroup}>
          <button id="button-reservation" style={styles.button} onClick={buscarReserva}>
            Consultar Reserva
          </button>
          <button id="button-cheking"
            style={{ ...styles.button, backgroundColor: "#3b82f6", marginTop: "0.75rem" }}
            onClick={crearFormatoEnBlanco}
          >
            Reservar
          </button>
        </div>
      </div>
    </div>
  );
}

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
    color: "#333333",
    boxShadow: "0 0 20px rgba(0,0,0,0.4)",
  },
  title: { marginBottom: "1.5rem", textAlign: "center", fontSize: "1.6rem" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "1rem" },
  input: {
    padding: "0.75rem",
    borderRadius: "0.5rem",
    border: "1px solid #4b5563",
    backgroundColor: "#ffffffff",
    color: "#333333",
  },
  select: {
    padding: "0.75rem",
    borderRadius: "0.5rem",
    border: "1px solid #4b5563",
    backgroundColor: "#ffffffff",
    color: "#333333",
  },
  buttonGroup: { marginTop: "1.5rem", display: "flex", flexDirection: "column" },
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
