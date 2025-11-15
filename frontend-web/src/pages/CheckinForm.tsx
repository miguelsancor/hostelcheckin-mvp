import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://18.206.179.50:4000";
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

  referral?: string;
  status?: string;
  nights?: number;
  guests?: number;
  price?: number;
  total?: number;
  b_extras?: string;
  b_smoking?: string;
  b_meal?: string;
  comment?: string;
};

type Reserva = {
  numeroReserva?: string;
  lockId?: number;
  nombre?: string;
  email?: string;
  telefono?: string;
  checkin?: string;
  checkout?: string;
};

type LockItem = {
  lockId: number;
  lockAlias?: string;
  keyName?: string;
  lockName?: string;
};

type HuespedBD = {
  id: number;
  nombre: string;
  numeroReserva: string;
  creadoEn: string;
};

export default function CheckinForm() {
  const [formList, setFormList] = useState<Huesped[]>([]);
  const [reserva, setReserva] = useState<Reserva | null>(null);
  const [loading, setLoading] = useState(false);
  const [locks, setLocks] = useState<LockItem[]>([]);
  const [huespedesHoy, setHuespedesHoy] = useState<HuespedBD[]>([]);

  // ================= MODAL =================
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  // Modal flotante FUERA DEL CONTENEDOR
  const modal = showModal ? (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.75)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 99999,
        padding: "2rem",
      }}
    >
      <div
        style={{
          background: "#1f2937",
          borderRadius: "1rem",
          width: "100%",
          maxWidth: "500px",
          padding: "2rem",
          border: "1px solid #444",
        }}
      >
        <h2 style={{ marginBottom: "1rem", fontSize: "1.5rem", color: "#fff" }}>
          Registro Completado
        </h2>

        <pre
          style={{
            background: "#111",
            color: "#fff",
            border: "1px solid #333",
            borderRadius: "0.5rem",
            padding: "1rem",
            whiteSpace: "pre-wrap",
            marginBottom: "2rem",
            fontSize: "0.9rem",
          }}
        >
          {modalMessage}
        </pre>

        <button
          onClick={() => setShowModal(false)}
          style={{
            padding: "0.75rem 2rem",
            background: "#10b981",
            color: "#fff",
            border: "none",
            width: "100%",
            borderRadius: "0.5rem",
            marginBottom: "1rem",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Cerrar
        </button>

        <button
          onClick={() => (window.location.href = "/")}
          style={{
            padding: "0.75rem 2rem",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            width: "100%",
            borderRadius: "0.5rem",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Volver al inicio
        </button>
      </div>
    </div>
  ) : null;

  // ========================== LOCAL STORAGE ==========================
  useEffect(() => {
    const data = localStorage.getItem("reserva");
    if (data) {
      try {
        const parsed = JSON.parse(data);

        if (parsed?.order_id) {
          const huesped: Huesped = {
            nombre: parsed.name || "",
            email: parsed.email || "",
            telefono: parsed.phone || "",
            fechaIngreso: parsed.checkin ? parsed.checkin.slice(0, 10) : "",
            fechaSalida: parsed.checkout ? parsed.checkout.slice(0, 10) : "",
            referral: parsed.referral || "",
            status: parsed.status || "",
            nights: parsed.nights || 0,
            guests: parsed.guests || 0,
            price: parsed.price || 0,
            total: parsed.total || 0,
            b_extras: parsed.b_extras || "",
            b_smoking: parsed.b_smoking || "",
            b_meal: parsed.b_meal || "",
            comment: parsed.comment || "",
          };

          setReserva({
            numeroReserva: String(parsed.order_id),
            nombre: parsed.name,
            email: parsed.email,
            telefono: parsed.phone,
            checkin: parsed.checkin,
            checkout: parsed.checkout,
          });

          setFormList([huesped]);
        } else {
          const items = Array.isArray(parsed) ? parsed : [parsed];
          setFormList(items.length ? items : [{}]);
          setReserva(items[0] ?? null);
        }
        return;
      } catch {}
    }

    setFormList([{}]);
    setReserva(null);
  }, []);

  useEffect(() => {
    if (reserva) {
      localStorage.setItem("reserva", JSON.stringify(reserva));
    }
  }, [reserva]);

  // ========================== TTLOCK ==========================
  useEffect(() => {
    const fetchLocks = async () => {
      try {
        const res = await fetch(`${API_BASE}/mcp/keys`);
        const data = await res.json();
        if (Array.isArray(data?.list)) setLocks(data.list);
      } catch {}
    };
    fetchLocks();
  }, []);

  // ========================== HANDLERS ==========================
  const handleChange = (index: number, e: any) => {
    const updated = [...formList];
    updated[index] = { ...updated[index], [e.target.name]: e.target.value };
    setFormList(updated);
  };

  const handleFileChange = (index: number, e: any) => {
    if (!e.target.files?.length) return;
    const updated = [...formList];
    updated[index] = { ...updated[index], [e.target.name]: e.target.files[0] };
    setFormList(updated);
  };

  const handleAddGuest = () => setFormList([...formList, {}]);

  function endOfDayEpochMs(dateStr?: string): number | null {
    if (!dateStr) return null;
    return new Date(dateStr + "T23:59:59.999").getTime();
  }

  async function createMcpPasscode(params: any) {
    const res = await fetch(`${API_BASE}/mcp/create-passcode`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok && json?.ok !== false, data: json };
  }

  const handleSubmit = async () => {
    if (!formList.length) return alert("Agrega al menos un huésped.");

    setLoading(true);
    try {
      const titular = formList[0];

      const fd = new FormData();
      fd.append(
        "data",
        JSON.stringify({
          huespedes: formList,
          fechaIngreso: titular.fechaIngreso || null,
          fechaSalida: titular.fechaSalida || null,
        })
      );

      const res = await fetch(`${API_BASE}/api/checkin`, {
        method: "POST",
        body: fd,
      });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        alert("Error guardando check-in.");
        return;
      }

      const numeroReserva = json.numeroReserva;

      setReserva((prev) => ({
        ...(prev || {}),
        numeroReserva,
      }));

      let msg = `Huéspedes registrados\nReserva: ${numeroReserva}\n`;

      const selectedLockId =
        reserva?.lockId || DEFAULT_LOCK_ID || 0;

      const endAt = endOfDayEpochMs(
        titular.fechaSalida || reserva?.checkout || ""
      );

      if (selectedLockId && endAt) {
        const resp = await createMcpPasscode({
          lockId: selectedLockId,
          startAt: Date.now(),
          endAt,
          name: `Reserva-${numeroReserva}`,
        });

        if (resp.ok) {
          const r = resp.data?.result || {};
          const code = r.keyboardPwd || r.password || r.code;
          msg += "Passcode creado.\n";
          if (code) msg += "Código: " + code;
        } else {
          msg += "No se pudo crear passcode.";
        }
      } else {
        msg += "Cerradura o fecha no válida.";
      }

      // Mostrar modal
      setModalMessage(msg);
      setShowModal(true);
    } catch (e) {
      alert("Error en conexión.");
    } finally {
      setLoading(false);
    }
  };

  const cargarHuespedesHoy = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/checkin/hoy`);
      const json = await res.json();
      setHuespedesHoy(json?.huespedes || []);
    } catch {
      setHuespedesHoy([]);
    }
  };

  // ========================== UI ==========================
  return (
    <>
      {modal}

      <div style={styles.container}>
        <h2 style={styles.title}>Registro de Huéspedes</h2>

        <button
          onClick={cargarHuespedesHoy}
          style={{
            marginBottom: "1.5rem",
            padding: "0.75rem 2rem",
            background: "#2563eb",
            borderRadius: "0.5rem",
            border: "none",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Ver huéspedes registrados hoy
        </button>

        {huespedesHoy.length > 0 && (
          <div style={styles.card}>
            <h3 style={{ marginBottom: "1rem" }}>
              Huéspedes registrados hoy
            </h3>
            <ul>
              {huespedesHoy.map((h) => (
                <li key={h.id}>
                  {h.nombre} – {h.numeroReserva} –{" "}
                  {new Date(h.creadoEn).toLocaleString()}
                </li>
              ))}
            </ul>
          </div>
        )}

        {reserva?.numeroReserva && (
          <h3 style={styles.subTitle}>
            Código de Reserva:{" "}
            <span style={{ color: "#10b981" }}>{reserva.numeroReserva}</span>
          </h3>
        )}

        <div style={styles.card}>
          <label style={{ marginBottom: "0.5rem", display: "block" }}>
            Seleccionar Cerradura
          </label>

          <select
            value={reserva?.lockId ?? ""}
            onChange={(e) =>
              setReserva({ ...(reserva || {}), lockId: Number(e.target.value) })
            }
            style={styles.input}
          >
            <option value="">-- Selecciona --</option>
            {locks.map((l) => (
              <option value={l.lockId} key={l.lockId}>
                {l.lockAlias || l.keyName || l.lockName}
              </option>
            ))}
          </select>
        </div>

        {/* FORMULARIOS */}
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
                name="referral"
                value={formData.referral || ""}
                onChange={(e) => handleChange(index, e)}
                placeholder="Origen reserva"
                style={styles.input}
              />
              <input
                name="status"
                value={formData.status || ""}
                onChange={(e) => handleChange(index, e)}
                placeholder="Estado"
                style={styles.input}
              />
              <input
                name="nights"
                type="number"
                value={formData.nights || ""}
                onChange={(e) => handleChange(index, e)}
                placeholder="Noches"
                style={styles.input}
              />
              <input
                name="guests"
                type="number"
                value={formData.guests || ""}
                onChange={(e) => handleChange(index, e)}
                placeholder="Huéspedes"
                style={styles.input}
              />
            </div>

            <div style={styles.row}>
              <input
                name="price"
                type="number"
                value={formData.price || ""}
                onChange={(e) => handleChange(index, e)}
                placeholder="Precio noche"
                style={styles.input}
              />
              <input
                name="total"
                type="number"
                value={formData.total || ""}
                onChange={(e) => handleChange(index, e)}
                placeholder="Total"
                style={styles.input}
              />
              <input
                name="b_extras"
                value={formData.b_extras || ""}
                onChange={(e) => handleChange(index, e)}
                placeholder="Extras"
                style={styles.input}
              />
            </div>

            <div style={styles.row}>
              <input
                name="b_smoking"
                value={formData.b_smoking || ""}
                onChange={(e) => handleChange(index, e)}
                placeholder="Fumador"
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

            <div>
              <textarea
                name="b_meal"
                value={formData.b_meal || ""}
                onChange={(e) => handleChange(index, e)}
                placeholder="Comidas incluidas"
                style={styles.input}
              />
              <textarea
                name="comment"
                value={formData.comment || ""}
                onChange={(e) => handleChange(index, e)}
                placeholder="Comentarios"
                style={styles.input}
              />
            </div>
          </div>
        ))}

        <div style={styles.actions}>
          <button
            onClick={handleAddGuest}
            style={{
              ...styles.button,
              backgroundColor: "#8b5cf6",
              marginRight: "1rem",
            }}
            disabled={loading}
          >
            Agregar Huésped
          </button>

          <button
            onClick={handleSubmit}
            style={styles.button}
            disabled={loading}
          >
            {loading ? "Enviando..." : "Enviar Registro"}
          </button>
        </div>
      </div>
    </>
  );
}

// ========================== ESTILOS ==========================
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
