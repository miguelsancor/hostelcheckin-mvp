import React, { useState, useEffect } from "react";
import { useCheckinForm } from "./CheckinForm.hook";
import { GuestCard } from "./CheckinForm.guest";
import { ResultModal, GuestsTodayModal } from "./CheckinForm.modal";
import { styles } from "./CheckinForm.styles";

/* =========================================================
   MODAL DE INFORMACIÓN DE CERRADURA
   ========================================================= */
type LockModalProps = {
  show: boolean;
  onClose: () => void;
  tiene: boolean;
};

function LockInfoModal({ show, onClose, tiene }: LockModalProps) {
  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999
      }}
    >
      <div
        style={{
          background: "#111827",
          padding: "2rem",
          borderRadius: "0.75rem",
          width: "90%",
          maxWidth: "420px",
          color: "white",
          textAlign: "center",
          boxShadow: "0 0 15px rgba(0,0,0,0.4)",
        }}
      >
        <h2 style={{ marginBottom: "1rem" }}>Información sobre la Cerradura</h2>

        {tiene ? (
          <p style={{ color: "#10b981", fontSize: "1.1rem" }}>
            ✔ Esta reserva tiene una cerradura configurada.
          </p>
        ) : (
          <p style={{ color: "#ef4444", fontSize: "1.1rem" }}>
            ✘ Esta reserva NO tiene una cerradura configurada.
          </p>
        )}

        <button
          onClick={onClose}
          style={{
            marginTop: "1.5rem",
            padding: "0.5rem 1.5rem",
            background: "#2563eb",
            border: "none",
            color: "white",
            borderRadius: "0.5rem",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   MODAL — MOTIVO DETALLADO DEL VIAJE
   ========================================================= */
const reasonsTrip = [
  "Tourism",
  "Medical check up",
  "Business",
  "Musical event",
  "Missed flight",
  "Family visit",
  "Sporting event",
  "Shopping",
  "Academic event",
  "Other",
];

type ReasonTripModalProps = {
  show: boolean;
  value: string;
  onSelect: (value: string) => void;
  onClose: () => void;
};

function ReasonTripModal({ show, value, onSelect, onClose }: ReasonTripModalProps) {
  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999
      }}
    >
      <div
        style={{
          background: "#111827",
          padding: "2rem",
          borderRadius: "0.75rem",
          width: "90%",
          maxWidth: "480px",
          color: "white",
          boxShadow: "0 0 25px rgba(0,0,0,0.5)",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "1.2rem" }}>
          Reason for trip
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
            marginBottom: "1.5rem"
          }}
        >
          {reasonsTrip.map((r) => (
            <label
              key={r}
              style={{
                display: "flex",
                gap: "0.5rem",
                alignItems: "center",
                cursor: "pointer"
              }}
            >
              <input
                type="radio"
                checked={value === r}
                onChange={() => onSelect(r)}
              />
              {r}
            </label>
          ))}
        </div>

        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: "0.7rem",
            borderRadius: "0.5rem",
            background: "#2563eb",
            color: "white",
            fontWeight: "bold",
            border: "none",
            cursor: "pointer"
          }}
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   COMPONENTE PRINCIPAL
   ========================================================= */
export default function CheckinForm() {
  const {
    formList,
    reserva,
    loading,
    showModal,
    modalMessage,
    showModalHoy,
    huespedesHoy,
    cargarHuespedesHoy,
    cerrarModalHoy,
    setShowModal,
    handleChange,
    handleFileChange,
    handleAddGuest,
    handleSubmit
  } = useCheckinForm();

  /* ===== Cerradura ===== */
  const [showLockModal, setShowLockModal] = useState(false);
  const [tieneCerradura, setTieneCerradura] = useState(false);

  useEffect(() => {
    if (!reserva) return;
    const tiene =
      reserva.lockId &&
      Number(reserva.lockId) !== 0 &&
      reserva.lockId !== "";
    setTieneCerradura(tiene);
    setShowLockModal(true);
  }, [reserva]);

  /* ===== Motivo detallado (solo 1 por reserva) ===== */
  const [showReasonTripModal, setShowReasonTripModal] = useState(false);
  const [motivoDetallado, setMotivoDetallado] = useState("");

  return (
    <>
      {/* MODALES */}
      <LockInfoModal
        show={showLockModal}
        tiene={tieneCerradura}
        onClose={() => setShowLockModal(false)}
      />

      <ResultModal
        show={showModal}
        message={modalMessage}
        onClose={() => setShowModal(false)}
      />

      <GuestsTodayModal
        show={showModalHoy}
        huespedes={huespedesHoy}
        onClose={cerrarModalHoy}
      />

      <ReasonTripModal
        show={showReasonTripModal}
        value={motivoDetallado}
        onSelect={setMotivoDetallado}
        onClose={() => setShowReasonTripModal(false)}
      />

      {/* CONTENIDO */}
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

        {/* CÓDIGO RESERVA */}
        {reserva?.numeroReserva && (
          <h3 style={styles.subTitle}>
            Código de Reserva:{" "}
            <span style={{ color: "#10b981" }}>{reserva.numeroReserva}</span>
          </h3>
        )}

        {/* MOTIVO DETALLADO — SOLO 1 PARA TODA LA RESERVA */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ color: "white", fontWeight: "bold" }}>
            Motivo detallado:
          </label>

          <div
            onClick={() => setShowReasonTripModal(true)}
            style={{
              marginTop: "0.5rem",
              background: "#1f2937",
              padding: "0.75rem",
              borderRadius: "0.5rem",
              cursor: "pointer",
              color: motivoDetallado ? "#10b981" : "#9ca3af",
            }}
          >
            {motivoDetallado || "Seleccione una opción"}
          </div>
        </div>

        {/* FORM DE HUÉSPEDES */}
        {formList.map((formData, index) => (
          <GuestCard
            key={index}
            data={formData}
            index={index}
            onChange={handleChange}
            onFile={handleFileChange}

            // Estas dos props YA NO SE USAN para cada huésped,
            // porque el motivo es general, no por persona.
            motivoDetallado={motivoDetallado}
            onOpenMotivoModal={() => setShowReasonTripModal(true)}
          />
        ))}

        {/* BOTONES */}
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
