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
        zIndex: 9999,
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
        <h2 style={{ marginBottom: "1rem" }}>
          Información sobre la Cerradura
        </h2>

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
            fontWeight: "bold",
          }}
        >
          Cerrar
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
    locks,
    huespedesHoy,
    showModal,
    modalMessage,
    showModalHoy,
    handleChange,
    handleFileChange,
    handleAddGuest,
    handleSubmit,
    cargarHuespedesHoy,
    cerrarModalHoy,
    setShowModal,
  } = useCheckinForm();

  /* =========================================================
     LÓGICA DEL MODAL DE CERRADURA
     ========================================================= */
  const [showLockModal, setShowLockModal] = useState(false);
  const [tieneCerradura, setTieneCerradura] = useState(false);

  useEffect(() => {
    if (!reserva) return;

    const tiene =
      reserva.lockId !== undefined &&
      reserva.lockId !== null &&
      Number(reserva.lockId) !== 0 &&
      reserva.lockId !== "";

    setTieneCerradura(tiene);
    setShowLockModal(true); // Mostrar siempre al cargar reserva
  }, [reserva]);

  return (
    <>
      {/* ======================= MODAL INFO CERRADURA ======================= */}
      <LockInfoModal
        show={showLockModal}
        tiene={tieneCerradura}
        onClose={() => setShowLockModal(false)}
      />

      {/* ======================= MODAL RESULTADO ======================= */}
      <ResultModal
        show={showModal}
        message={modalMessage}
        onClose={() => setShowModal(false)}
      />

      {/* ======================= MODAL HUÉSPEDES HOY ======================= */}
      <GuestsTodayModal
        show={showModalHoy}
        huespedes={huespedesHoy}
        onClose={cerrarModalHoy}
      />

      {/* ======================= CONTENEDOR PRINCIPAL ======================= */}
      <div style={styles.container}>
        <h2 style={styles.title}>Registro de Huéspedes</h2>

        {/* BOTÓN PARA VER HUÉSPEDES HOY */}
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

        {/* NÚMERO DE RESERVA */}
        {reserva?.numeroReserva && (
          <h3 style={styles.subTitle}>
            Código de Reserva:{" "}
            <span style={{ color: "#10b981" }}>{reserva.numeroReserva}</span>
          </h3>
        )}

        {/* ======================= CERRADURA ======================= */}
        {/* 🔥 COMENTADO PARA OCULTAR SELECT 🔥 */}
        {/*
        <div style={styles.card}>
          <label style={{ marginBottom: "0.5rem", display: "block" }}>
            Seleccionar Cerradura
          </label>

          <select
            value={reserva?.lockId !== undefined ? reserva.lockId : ""}
            disabled
            style={{
              ...styles.input,
              backgroundColor: "#1f2937",
              opacity: 0.8,
              cursor: "not-allowed",
            }}
          >
            <option value="">-- Selecciona --</option>
            {locks.map((l) => (
              <option key={l.lockId} value={l.lockId}>
                {l.lockAlias || l.keyName || l.lockName}
              </option>
            ))}
          </select>
        </div>
        */}

        {/* ======================= FORM DE HUÉSPEDES ======================= */}
        {formList.map((formData, index) => (
          <GuestCard
            key={index}
            data={formData}
            index={index}
            onChange={handleChange}
            onFile={handleFileChange}
          />
        ))}

        {/* ======================= BOTONES ======================= */}
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
