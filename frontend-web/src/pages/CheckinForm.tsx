import { useEffect, useState } from "react";

/**
 * Ajusta estos defaults si es necesario:
 * - VITE_API_BASE: base URL de tu backend (donde está /mcp/*)
 * - VITE_TTLOCK_LOCK_ID: id de la cerradura por defecto si la reserva no lo trae
 */
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";
const DEFAULT_LOCK_ID = Number(import.meta.env.VITE_TTLOCK_LOCK_ID || "0");

type Huesped = {
  nombre?: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
  nacionalidad?: string;
  direccion?: string;
  lugarProcedencia?: string;
  lugarDestino?: string;
  telefono?: string;
  email?: string;
  motivoViaje?: string;
  fechaIngreso?: string; // "YYYY-MM-DD"
  fechaSalida?: string;  // "YYYY-MM-DD"
  archivoAnverso?: File;
  archivoReverso?: File;
  archivoFirma?: File;
};

type Reserva = {
  numeroReserva?: string;
  lockId?: number; // si tu backend lo guarda aquí, se usará para MCP
};

export default function CheckinForm() {
  const [formList, setFormList] = useState<Huesped[]>([]);
  const [reserva, setReserva] = useState<Reserva | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const data = localStorage.getItem("reserva");
    if (data) {
      try {
        const parsed = JSON.parse(data);
        const items = Array.isArray(parsed) ? parsed : [parsed];
        setFormList(items.length ? items : [{}]);
        setReserva(items[0] ?? null);
        return;
      } catch { /* ignore */ }
    }
    setFormList([{}]);
    setReserva(null);
  }, []);

  useEffect(() => {
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
      (updatedList[index] as any)[name] = files[0];
      setFormList(updatedList);
    }
  };

  const handleAddGuest = () => setFormList([...formList, {}]);

  /** "YYYY-MM-DD" -> epoch(ms) al final del día local (23:59:59.999) */
  function endOfDayEpochMs(dateStr?: string | null): number | null {
    if (!dateStr) return null;
    return new Date(dateStr + "T23:59:59.999").getTime();
  }

  /** (AÚN EXISTE por si lo necesitas) Llama /mcp/create-key en el backend */
  async function createMcpKey(params: {
    lockId: number;
    receiverUsername: string;
    endAt: number;
    keyName?: string;
    remarks?: string;
    correlationId?: string;
  }) {
    const res = await fetch(`${API_BASE}/mcp/create-key`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // credentials: "include",
      body: JSON.stringify(params),
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok && json?.ok !== false, status: res.status, data: json };
  }

  /** NUEVO: crear passcode como en la app (usa /mcp/create-passcode) */
  async function createMcpPasscode(params: {
    lockId: number;
    endAt: number;
    startAt?: number;
    code?: string;   // opcional, 6–9 dígitos; si no lo envías, TTLock lo genera
    name?: string;   // opcional, nombre del passcode
  }) {
    const res = await fetch(`${API_BASE}/mcp/create-passcode`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok && json?.ok !== false, status: res.status, data: json };
  }

  const handleSubmit = async () => {
    if (!formList.length) {
      alert("Agrega al menos un huésped.");
      return;
    }

    setLoading(true);
    const form = new FormData();

    // campos con corchetes (primer intento del backend)
    formList.forEach((formData, index) => {
      Object.entries(formData).forEach(([key, value]) => {
        form.append(`huespedes[${index}][${key}]`, value as any);
      });
    });

    // 🔴 Respaldo en JSON (segundo intento del backend)
    form.append("data", JSON.stringify({ huespedes: formList }));

    try {
      // 1) Guardar huéspedes en tu backend
      const res = await fetch(`${API_BASE}/api/checkin/guardar-multiple`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        alert("Error al registrar los huéspedes.");
        setLoading(false);
        return;
      }

      const saved = await res.json().catch(() => null); // { ok, numeroReserva, total }
      const numeroReserva = saved?.numeroReserva || reserva?.numeroReserva || "S/N";

      // 2) Crear PASSCODE en TTLock (no eKey) — como la app
      const lockId =
        (reserva?.lockId && Number(reserva.lockId)) ||
        (DEFAULT_LOCK_ID > 0 ? DEFAULT_LOCK_ID : 0);

      const endAtMs = endOfDayEpochMs(formList[0]?.fechaSalida || null);

      const passName = `Reserva-${numeroReserva}`;
      const correlationId = `res-${numeroReserva}-${Date.now()}`;

      let mcpMsg = `Huéspedes registrados ✅\nReserva: ${numeroReserva}\n`;

      if (lockId && endAtMs) {
        try {
          // TIP: si quieres forzar un código propio, pasa { code: "735190" }
          const mcpResp = await createMcpPasscode({
            lockId,
            startAt: Date.now(),
            endAt: endAtMs,
            name: passName,
          });

          if (mcpResp.ok && (mcpResp.data?.result || mcpResp.data?.ok)) {
            const r = mcpResp.data?.result || {};
            const code =
              r.keyboardPwd ?? r.password ?? r.keyboardpwd ?? r.code ?? null;

            mcpMsg += "🔓 Passcode creado en TTLock.";
            if (code) mcpMsg += `\n🔢 Código: ${code}`;
            mcpMsg += `\n⏱️ Válido hasta: ${new Date(endAtMs).toLocaleString()}`;
          } else {
            console.warn("MCP create-passcode error:", mcpResp);
            const detail = mcpResp?.data?.error?.errmsg || "revisa permisos TTLock";
            mcpMsg += `⚠️ No se pudo crear el passcode (${detail}).`;
          }
        } catch (e) {
          console.error("MCP error:", e);
          mcpMsg += "⚠️ Error llamando a MCP (revisa consola).";
        }
      } else {
        mcpMsg +=
          "ℹ️ Se omitió creación de passcode (faltan lockId o fecha de salida). Define VITE_TTLOCK_LOCK_ID o incluye lockId en la reserva.";
      }

      alert(mcpMsg);

      // 3) Limpiar estado
      setFormList([]);
      localStorage.removeItem("reserva");
    } catch (err) {
      console.error("Error:", err);
      alert("Fallo la conexión al servidor.");
    } finally {
      setLoading(false);
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
        <button onClick={handleAddGuest} style={{ ...styles.button, backgroundColor: "#8b5cf6", marginRight: "1rem" }} disabled={loading}>
          ➕ Agregar Huésped
        </button>
        <button onClick={handleSubmit} style={styles.button} disabled={loading}>
          {loading ? "Enviando..." : "✅ Enviar Registro"}
        </button>
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
