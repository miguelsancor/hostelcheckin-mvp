import { useEffect, useState } from "react";

/**
 * Ajusta estos defaults si es necesario:
 * - VITE_API_BASE: tu backend (localhost:4000)
 * - VITE_TTLOCK_LOCK_ID: id de la cerradura por defecto
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
  fechaIngreso?: string;
  fechaSalida?: string;
  archivoAnverso?: File;
  archivoReverso?: File;
  archivoFirma?: File;
};

type Reserva = {
  numeroReserva?: string;
  lockId?: number;
  nombre?: string; // mapeo desde NoBeds (name)
  email?: string;  // mapeo desde NoBeds (emails)
  telefono?: string; // mapeo desde NoBeds (phone)
  checkin?: string; // mapeo desde NoBeds
  checkout?: string; // mapeo desde NoBeds
};

type LockItem = {
  lockId: number;
  lockAlias?: string;
  keyName?: string;
  lockName?: string;
};

export default function CheckinForm() {
  const [formList, setFormList] = useState<Huesped[]>([]);
  const [reserva, setReserva] = useState<Reserva | null>(null);
  const [loading, setLoading] = useState(false);

  const [locks, setLocks] = useState<LockItem[]>([]);

  // Cargar reserva del localStorage
  useEffect(() => {
    const data = localStorage.getItem("reserva");
    if (data) {
      try {
        const parsed = JSON.parse(data);

        // 🔄 Mapeo si la reserva viene de NoBeds
        if (parsed?.order_id) {
          const huesped: Huesped = {
            nombre: parsed.name || "",
            email: parsed.emails || "",
            telefono: parsed.phone || "",
            fechaIngreso: parsed.checkin
              ? parsed.checkin.slice(0, 10)
              : undefined,
            fechaSalida: parsed.checkout
              ? parsed.checkout.slice(0, 10)
              : undefined,
          };
          setReserva({
            numeroReserva: String(parsed.order_id),
            nombre: parsed.name,
            email: parsed.emails,
            telefono: parsed.phone,
            checkin: parsed.checkin,
            checkout: parsed.checkout,
          });
          setFormList([huesped]);
        } else {
          // 🔄 Caso reserva local
          const items = Array.isArray(parsed) ? parsed : [parsed];
          setFormList(items.length ? items : [{}]);
          setReserva(items[0] ?? null);
        }
        return;
      } catch {
        /* ignore */
      }
    }
    setFormList([{}]);
    setReserva(null);
  }, []);

  useEffect(() => {
    if (reserva && !localStorage.getItem("reserva")) {
      localStorage.setItem("reserva", JSON.stringify(reserva));
    }
  }, [reserva]);

  // 🔑 cargar cerraduras desde backend
  useEffect(() => {
    const fetchLocks = async () => {
      try {
        const res = await fetch(`${API_BASE}/mcp/keys`);
        const data = await res.json();
        if (Array.isArray(data?.list)) {
          setLocks(data.list as LockItem[]);
        }
      } catch (err) {
        console.error("Error al cargar cerraduras:", err);
      }
    };
    fetchLocks();
  }, []);

  const handleChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const updatedList = [...formList];
    updatedList[index] = { ...updatedList[index], [name]: value };
    setFormList(updatedList);
  };

  const handleFileChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      const updatedList = [...formList];
      (updatedList[index] as any)[name] = files[0];
      setFormList(updatedList);
    }
  };

  const handleAddGuest = () => setFormList([...formList, {}]);

  function endOfDayEpochMs(dateStr?: string | null): number | null {
    if (!dateStr) return null;
    return new Date(dateStr + "T23:59:59.999").getTime();
  }

  async function createMcpPasscode(params: {
    lockId: number;
    endAt: number;
    startAt?: number;
    code?: string;
    name?: string;
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

    try {
      const numeroReserva =
        reserva?.numeroReserva || `TEMP-${Date.now().toString().slice(-6)}`;

      const selectedLockId =
        (reserva?.lockId && Number(reserva.lockId)) ||
        (DEFAULT_LOCK_ID > 0 ? DEFAULT_LOCK_ID : 0);

      const endAtMs = endOfDayEpochMs(
        formList[0]?.fechaSalida || reserva?.checkout || null
      );

      const passName = `Reserva-${numeroReserva}`;
      const correlationId = `res-${numeroReserva}-${Date.now()}`;

      let mcpMsg = `Huéspedes registrados ✅\nReserva: ${numeroReserva}\n`;

      if (selectedLockId && endAtMs) {
        try {
          const mcpResp = await createMcpPasscode({
            lockId: selectedLockId,
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
            mcpMsg += `\n⏱️ Válido hasta: ${new Date(
              endAtMs
            ).toLocaleString()}`;
          } else {
            console.warn("MCP create-passcode error:", mcpResp);
            const detail =
              mcpResp?.data?.error?.errmsg || "revisa permisos TTLock";
            mcpMsg += `⚠️ No se pudo crear el passcode (${detail}).`;
          }
        } catch (e) {
          console.error("MCP error:", e);
          mcpMsg += "⚠️ Error llamando a MCP (revisa consola).";
        }
      } else {
        mcpMsg +=
          "ℹ️ Se omitió creación de passcode (faltan lockId o fecha de salida).";
      }

      alert(mcpMsg);

      // limpiar
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
          Código de Reserva:{" "}
          <span style={{ color: "#10b981" }}>{reserva.numeroReserva}</span>
        </h3>
      )}

      <div style={styles.card}>
        <label style={{ display: "block", marginBottom: "0.5rem" }}>
          Seleccionar Cerradura (TTLock)
        </label>
        <select
          value={reserva?.lockId ?? ""}
          onChange={(e) =>
            setReserva({ ...(reserva || {}), lockId: Number(e.target.value) })
          }
          style={styles.input}
        >
          <option value="">-- Selecciona una cerradura --</option>
          {locks.map((lock) => (
            <option key={lock.lockId} value={lock.lockId}>
              {lock.lockAlias ||
                lock.keyName ||
                lock.lockName ||
                `Lock-${lock.lockId}`}
            </option>
          ))}
        </select>
      </div>

      {formList.map((formData, index) => (
        <div key={index} style={styles.card}>
          <div style={styles.row}>
            <input
              name="nombre"
              value={formData.nombre || ""}
              onChange={(e) => handleChange(index, e)}
              placeholder="Nombre completo"
              style={styles.input}
            />
            <select
              name="tipoDocumento"
              value={formData.tipoDocumento || ""}
              onChange={(e) => handleChange(index, e)}
              style={styles.input}
            >
              <option value="Cédula">Cédula</option>
              <option value="Pasaporte">Pasaporte</option>
            </select>
            <input
              name="numeroDocumento"
              value={formData.numeroDocumento || ""}
              onChange={(e) => handleChange(index, e)}
              placeholder="Número documento"
              style={styles.input}
            />
            <input
              name="nacionalidad"
              value={formData.nacionalidad || ""}
              onChange={(e) => handleChange(index, e)}
              placeholder="Colombia"
              style={styles.input}
            />
          </div>

          <div style={styles.row}>
            <input
              name="direccion"
              value={formData.direccion || ""}
              onChange={(e) => handleChange(index, e)}
              placeholder="Dirección"
              style={styles.input}
            />
            <input
              name="lugarProcedencia"
              value={formData.lugarProcedencia || ""}
              onChange={(e) => handleChange(index, e)}
              placeholder="Lugar procedencia"
              style={styles.input}
            />
            <input
              name="lugarDestino"
              value={formData.lugarDestino || ""}
              onChange={(e) => handleChange(index, e)}
              placeholder="Lugar destino"
              style={styles.input}
            />
          </div>

          <div style={styles.row}>
            <input
              name="telefono"
              value={formData.telefono || ""}
              onChange={(e) => handleChange(index, e)}
              placeholder="Teléfono"
              style={styles.input}
            />
            <input
              name="email"
              value={formData.email || ""}
              onChange={(e) => handleChange(index, e)}
              placeholder="Email"
              type="email"
              style={styles.input}
            />
            <select
              name="motivoViaje"
              value={formData.motivoViaje || ""}
              onChange={(e) => handleChange(index, e)}
              style={styles.input}
            >
              <option value="Turismo">Turismo</option>
              <option value="Negocios">Negocios</option>
            </select>
          </div>

          <div style={styles.row}>
            <input
              type="date"
              name="fechaIngreso"
              value={formData.fechaIngreso || ""}
              onChange={(e) => handleChange(index, e)}
              style={styles.input}
            />
            <input
              type="date"
              name="fechaSalida"
              value={formData.fechaSalida || ""}
              onChange={(e) => handleChange(index, e)}
              style={styles.input}
            />
          </div>

          <div style={styles.row}>
            <input
              type="file"
              name="archivoAnverso"
              onChange={(e) => handleFileChange(index, e)}
              style={styles.input}
            />
            <input
              type="file"
              name="archivoReverso"
              onChange={(e) => handleFileChange(index, e)}
              style={styles.input}
            />
            <input
              type="file"
              name="archivoFirma"
              onChange={(e) => handleFileChange(index, e)}
              style={styles.input}
            />
          </div>
        </div>
      ))}

      <div style={styles.actions}>
        <button
          onClick={handleAddGuest}
          style={{ ...styles.button, backgroundColor: "#8b5cf6", marginRight: "1rem" }}
          disabled={loading}
        >
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
  title: { fontSize: "2rem", marginBottom: "0.5rem" },
  subTitle: { fontSize: "1.2rem", marginBottom: "2rem" },
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
  actions: { marginTop: "1.5rem", textAlign: "center" },
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
