import { useEffect, useState } from "react";

export default function CheckinForm() {
  const [formList, setFormList] = useState<any[]>([]);
  const [reserva, setReserva] = useState<any | null>(null);

  useEffect(() => {
    const data = localStorage.getItem("reserva");
    if (data) {
      const parsed = JSON.parse(data);
      setReserva(parsed);
      setFormList([parsed]);
    }
  }, []);

  useEffect(() => {
    // Si viene reserva por otro medio, guardar en localStorage para mantenerla
    if (reserva && !localStorage.getItem("reserva")) {
      localStorage.setItem("reserva", JSON.stringify(reserva));
    }
  }, [reserva]);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const updatedList = [...formList];
    updatedList[index] = { ...updatedList[index], [name]: value };
    setFormList(updatedList);
  };

  const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      const updatedList = [...formList];
      updatedList[index] = { ...updatedList[index], [name]: files[0] };
      setFormList(updatedList);
    }
  };

  const handleAddGuest = () => {
    setFormList([...formList, {}]);
  };

  const handleSubmit = async () => {
    const form = new FormData();
    formList.forEach((formData, index) => {
      Object.entries(formData).forEach(([key, value]) => {
        form.append(`huespedes[${index}][${key}]`, value as any);
      });
    });

    try {
      const res = await fetch("http://34.75.5.236:4040/api/checkin/guardar-multiple", {
        method: "POST",
        body: form,
      });

      if (res.ok) {
        alert("Todos los huéspedes fueron registrados exitosamente.");
        setFormList([]);
        localStorage.removeItem("reserva");
      } else {
        alert("Error al registrar los huéspedes.");
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Fallo la conexión al servidor.");
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📄 Registro de Huéspedes</h2>
      {reserva?.numeroReserva && (
        <h3 style={styles.subTitle}>
          Código de Reserva: <span style={{ color: "#10b981" }}>{reserva.numeroReserva}</span>
        </h3>
      )}

      {formList.map((formData, index) => (
        <div key={index} style={styles.card}>
          <div style={styles.row}>
            <input name="nombre" value={formData.nombre || ""} onChange={(e) => handleChange(index, e)} placeholder="Nombre completo" style={styles.input} />
            <select name="tipoDocumento" value={formData.tipoDocumento || ""} onChange={(e) => handleChange(index, e)} style={styles.input}>
              <option value="Cédula">Cédula</option>
              <option value="Pasaporte">Pasaporte</option>
            </select>
            <input name="numeroDocumento" value={formData.numeroDocumento || ""} onChange={(e) => handleChange(index, e)} placeholder="Número documento" style={styles.input} />
            <input name="nacionalidad" value={formData.nacionalidad || ""} onChange={(e) => handleChange(index, e)} placeholder="Colombia" style={styles.input} />
          </div>

          <div style={styles.row}>
            <input name="direccion" value={formData.direccion || ""} onChange={(e) => handleChange(index, e)} placeholder="Dirección" style={styles.input} />
            <input name="lugarProcedencia" value={formData.lugarProcedencia || ""} onChange={(e) => handleChange(index, e)} placeholder="Lugar procedencia" style={styles.input} />
            <input name="lugarDestino" value={formData.lugarDestino || ""} onChange={(e) => handleChange(index, e)} placeholder="Lugar destino" style={styles.input} />
          </div>

          <div style={styles.row}>
            <input name="telefono" value={formData.telefono || ""} onChange={(e) => handleChange(index, e)} placeholder="Teléfono" style={styles.input} />
            <input name="email" value={formData.email || ""} onChange={(e) => handleChange(index, e)} placeholder="Email" type="email" style={styles.input} />
            <select name="motivoViaje" value={formData.motivoViaje || ""} onChange={(e) => handleChange(index, e)} style={styles.input}>
              <option value="Turismo">Turismo</option>
              <option value="Negocios">Negocios</option>
            </select>
          </div>

          <div style={styles.row}>
            <input type="date" name="fechaIngreso" value={formData.fechaIngreso || ""} onChange={(e) => handleChange(index, e)} style={styles.input} />
            <input type="date" name="fechaSalida" value={formData.fechaSalida || ""} onChange={(e) => handleChange(index, e)} style={styles.input} />
          </div>

          <div style={styles.row}>
            <input type="file" name="archivoAnverso" onChange={(e) => handleFileChange(index, e)} style={styles.input} />
            <input type="file" name="archivoReverso" onChange={(e) => handleFileChange(index, e)} style={styles.input} />
            <input type="file" name="archivoFirma" onChange={(e) => handleFileChange(index, e)} style={styles.input} />
          </div>
        </div>
      ))}

      <div style={styles.actions}>
        <button onClick={handleAddGuest} style={{ ...styles.button, backgroundColor: "#8b5cf6", marginRight: "1rem" }}>➕ Agregar Huésped</button>
        <button onClick={handleSubmit} style={styles.button}>✅ Enviar Registro</button>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    background: "#000",
    color: "#fff",
    minHeight: "100vh",
    padding: "2rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  title: {
    fontSize: "2rem",
    marginBottom: "0.5rem",
  },
  subTitle: {
    fontSize: "1.2rem",
    marginBottom: "2rem",
  },
  card: {
    border: "1px solid #ccc",
    padding: "2rem",
    borderRadius: "1rem",
    backgroundColor: "#111",
    maxWidth: "90%",
    width: "1100px",
    marginBottom: "2rem",
  },
  row: {
    display: "flex",
    flexWrap: "wrap",
    gap: "1rem",
    marginBottom: "1rem",
  },
  input: {
    flex: "1",
    minWidth: "180px",
    padding: "0.75rem",
    borderRadius: "0.5rem",
    border: "1px solid #4b5563",
    backgroundColor: "#1f2937",
    color: "#f9fafb",
  },
  actions: {
    marginTop: "1.5rem",
    textAlign: "center",
  },
  button: {
    padding: "0.75rem 2rem",
    border: "none",
    borderRadius: "0.5rem",
    backgroundColor: "#10b981",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "1rem",
  },
};
