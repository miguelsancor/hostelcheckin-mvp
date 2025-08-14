import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [tipoBusqueda, setTipoBusqueda] = useState("documento");
  const [tipoDocumento, setTipoDocumento] = useState("Cédula");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [codigoReserva, setCodigoReserva] = useState("");

  const navigate = useNavigate();

  const buscarReserva = async () => {
    const body = tipoBusqueda === "documento"
      ? { tipoDocumento, numeroDocumento }
      : { codigoReserva };

    try {
      const res = await fetch("http://18.206.179.50:4040/api/checkin/buscar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        alert("Reserva no encontrada");
        return;
      }

      const data = await res.json();
      localStorage.setItem("reserva", JSON.stringify(data));
      navigate("/checkin");
    } catch (err) {
      console.error("Error al consultar reserva:", err);
      alert("Error de conexión con el servidor");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>🏨 Check-in Digital</h2>

        <div style={styles.inputGroup}>
          <select
            value={tipoBusqueda}
            onChange={(e) => setTipoBusqueda(e.target.value)}
            style={styles.select}
          >
            <option value="documento">Buscar por Documento</option>
            <option value="codigo">Buscar por Código de Reserva</option>
          </select>

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
        </div>

        <div style={styles.buttonGroup}>
          <button style={styles.button} onClick={buscarReserva}>
            Consultar Reserva
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
    background: "linear-gradient(135deg, #0f172a, #1e293b)",
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
  title: {
    marginBottom: "1.5rem",
    textAlign: "center",
    fontSize: "1.6rem",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  input: {
    padding: "0.75rem",
    borderRadius: "0.5rem",
    border: "1px solid #4b5563",
    backgroundColor: "#111827",
    color: "#f9fafb",
  },
  select: {
    padding: "0.75rem",
    borderRadius: "0.5rem",
    border: "1px solid #4b5563",
    backgroundColor: "#111827",
    color: "#f9fafb",
  },
  buttonGroup: {
    marginTop: "1.5rem",
  },
  button: {
    width: "100%",
    padding: "0.75rem",
    border: "none",
    borderRadius: "0.5rem",
    backgroundColor: "#10b981",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
  },
};
