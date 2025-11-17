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
  // ======================= ESTADOS PRINCIPALES =======================
  const [formList, setFormList] = useState<Huesped[]>([]);
  const [reserva, setReserva] = useState<Reserva | null>(null);
  const [loading, setLoading] = useState(false);
  const [locks, setLocks] = useState<LockItem[]>([]);
  const [huespedesHoy, setHuespedesHoy] = useState<HuespedBD[]>([]);

  // ======================= MODALES =======================
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const [showModalHoy, setShowModalHoy] = useState(false);

  // ======================= CARGA RESERVA =======================
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
            fechaIngreso: parsed.checkin?.slice(0, 10),
            fechaSalida: parsed.checkout?.slice(0, 10),
            referral: parsed.referral,
            status: parsed.status,
            nights: parsed.nights,
            guests: parsed.guests,
            price: parsed.price,
            total: parsed.total,
            b_extras: parsed.b_extras,
            b_smoking: parsed.b_smoking,
            b_meal: parsed.b_meal,
            comment: parsed.comment,
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
          const arr = Array.isArray(parsed) ? parsed : [parsed];
          setFormList(arr.length ? arr : [{}]);
          setReserva(arr[0] ?? null);
        }
        return;
      } catch {}
    }

    setFormList([{}]);
    setReserva(null);
  }, []);

  useEffect(() => {
    if (reserva) localStorage.setItem("reserva", JSON.stringify(reserva));
  }, [reserva]);

  // ======================= TTLOCK =======================
  useEffect(() => {
    fetch(`${API_BASE}/mcp/keys`)
      .then((res) => res.json())
      .then((json) => {
        if (Array.isArray(json?.list)) setLocks(json.list);
      })
      .catch(() => {});
  }, []);

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

  function endOfDayEpochMs(date?: string) {
    if (!date) return null;
    return new Date(date + "T23:59:59.999").getTime();
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

  // ======================= SUBMIT =======================
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

      if (!json.ok) {
        alert("Error guardando en la base de datos.");
        return;
      }

      const numeroReserva = json.numeroReserva;

      setReserva((prev) => ({
        ...(prev || {}),
        numeroReserva,
      }));

      let msg = `Huéspedes registrados\nReserva: ${numeroReserva}\n`;

      const lockId = reserva?.lockId || DEFAULT_LOCK_ID;
      const endAt = endOfDayEpochMs(
        titular.fechaSalida || reserva?.checkout || ""
      );

      if (lockId && endAt) {
        const r = await createMcpPasscode({
          lockId,
          startAt: Date.now(),
          endAt,
          name: `Reserva-${numeroReserva}`,
        });

        if (r.ok) {
          const data = r.data?.result || {};
          const code = data.keyboardPwd || data.password || data.code;
          msg += "Passcode creado.\n";
          if (code) msg += "Código: " + code;
        } else {
          msg += "No se pudo crear passcode.";
        }
      } else {
        msg += "Cerradura o fecha inválida.";
      }

      setModalMessage(msg);
      setShowModal(true);
    } catch {
      alert("Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  const cargarHuespedesHoy = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/checkin/hoy`);
      const json = await res.json();
      setHuespedesHoy(json.huespedes || []);
    } catch {
      setHuespedesHoy([]);
    }
  };

  // ======================= UI =======================
  return (
    <>
      {/* ========== MODAL CHECK-IN ========== */}
      {showModal && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
              Registro Completado
            </h2>

            <pre style={modalPre}>{modalMessage}</pre>

            <button onClick={() => setShowModal(false)} style={btnPrimary}>
              Cerrar
            </button>

            <button
              onClick={() => (window.location.href = "/")}
              style={btnSecondary}
            >
              Volver al inicio
            </button>
          </div>
        </div>
      )}

      {/* ========== MODAL HUÉSPEDES HOY ========== */}
      {showModalHoy && (
        <div style={modalOverlay}>
          <div style={{ ...modalBox, maxWidth: "600px", maxHeight: "80vh", overflowY: "auto" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
              Huéspedes registrados hoy
            </h2>

            {huespedesHoy.length === 0 ? (
              <p>No hay registros hoy.</p>
            ) : (
              <ul style={{ paddingLeft: "1rem", lineHeight: "1.8rem" }}>
                {huespedesHoy.map((h) => (
                  <li key={h.id}>
                    <strong style={{ color: "#10b981" }}>{h.nombre}</strong>
                    <br />
                    {h.numeroReserva} — {new Date(h.creadoEn).toLocaleString()}
                    <hr style={{ borderColor: "#333", margin: "0.8rem 0" }} />
                  </li>
                ))}
              </ul>
            )}

            <button onClick={() => setShowModalHoy(false)} style={btnPrimary}>
              Cerrar
            </button>

            <button
              onClick={() => (window.location.href = "/")}
              style={btnSecondary}
            >
              Volver al inicio
            </button>
          </div>
        </div>
      )}

      {/* ========== CONTENIDO PRINCIPAL ========== */}
      <div style={styles.container}>
        <h2 style={styles.title}>Registro de Huéspedes</h2>

        <button
          onClick={async () => {
            await cargarHuespedesHoy();
            setShowModalHoy(true);
          }}
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

        {reserva?.numeroReserva && (
          <h3 style={styles.subTitle}>
            Código de Reserva:{" "}
            <span style={{ color: "#10b981" }}>{reserva.numeroReserva}</span>
          </h3>
        )}

        {/* CERRADURA */}
        <div style={styles.card}>
          <label style={{ marginBottom: "0.5rem", display: "block" }}>
            Seleccionar Cerradura
          </label>
          <select
            value={reserva?.lockId ?? ""}
            onChange={(e) =>
              setReserva({
                ...(reserva || {}),
                lockId: Number(e.target.value),
              })
            }
            style={styles.input}
          >
            <option value="">-- Selecciona --</option>
            {locks.map((l) => (
              <option key={l.lockId} value={l.lockId}>
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

// ======================= ESTILOS =======================
const modalOverlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0,0,0,0.75)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 99999,
  padding: "2rem",
};

const modalBox: React.CSSProperties = {
  background: "#1f2937",
  borderRadius: "1rem",
  width: "100%",
  maxWidth: "500px",
  padding: "2rem",
  border: "1px solid #444",
  color: "white",
};

const modalPre: React.CSSProperties = {
  whiteSpace: "pre-wrap",
  background: "#111",
  padding: "1rem",
  borderRadius: "0.5rem",
  border: "1px solid #333",
  marginBottom: "1.5rem",
  fontSize: "0.9rem",
};

const btnPrimary: React.CSSProperties = {
  padding: "0.75rem 2rem",
  width: "100%",
  background: "#10b981",
  color: "white",
  borderRadius: "0.5rem",
  border: "none",
  fontWeight: "bold",
  cursor: "pointer",
  marginBottom: "1rem",
};

const btnSecondary: React.CSSProperties = {
  padding: "0.75rem 2rem",
  width: "100%",
  background: "#2563eb",
  color: "white",
  borderRadius: "0.5rem",
  border: "none",
  fontWeight: "bold",
  cursor: "pointer",
};

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
    border: "1px solid #444",
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
