import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [tipoBusqueda, setTipoBusqueda] = useState("documento");
  const [tipoDocumento, setTipoDocumento] = useState("Cédula");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [codigoReserva, setCodigoReserva] = useState("");

  const navigate = useNavigate();

  const buscarReserva = async () => {
    try {
      let reserva: any = null;

      // Búsqueda por código de reserva (NoBeds)
      if (tipoBusqueda === "codigo" && codigoReserva) {
        const res = await fetch(
          `http://18.206.179.50:4000/api/nobeds/reserva/${codigoReserva}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.ok) reserva = data.reserva;
        }
      }

      // Búsqueda por documento (BD interna)
      else if (tipoBusqueda === "documento" && numeroDocumento) {
        const res = await fetch("http://18.206.179.50:4000/api/checkin/buscar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tipoDocumento, numeroDocumento }),
        });

        if (res.ok) {
          const data = await res.json();
          reserva = data;
        }
      }

      // Búsqueda combinada Teléfono/Email (BD → NoBeds)
      else if (tipoBusqueda === "telefono" && numeroDocumento) {
        const res = await fetch(
          `http://18.206.179.50:4000/api/checkin/buscar-combinado/${numeroDocumento}`
        );

        if (res.ok) {
          const data = await res.json();
          reserva = data.data;
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
      console.error("Error al consultar reserva:", err);
      alert("Error de conexión con el servidor");
    }
  };

  const crearFormatoEnBlanco = () => {
    localStorage.setItem("usuario", JSON.stringify({ role: "guest-checkin" }));
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
              onChange={(e) => setTipoBusqueda(e.target.value)}
              style={styles.select}
            >
              <option value="documento">ID | Documento</option>
              <option value="codigo">Reservation # | # Reserva</option>
              <option value="telefono">Teléfono / Email</option>
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

          {tipoBusqueda === "telefono" && (
            <input
              type="text"
              placeholder="Teléfono o Email"
              value={numeroDocumento}
              onChange={(e) => setNumeroDocumento(e.target.value)}
              style={styles.input}
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
    backgroundColor: "#fff",
    color: "#333333",
  },
  select: {
    padding: "0.75rem",
    borderRadius: "0.5rem",
    border: "1px solid #4b5563",
    backgroundColor: "#fff",
    color: "#333333",
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
