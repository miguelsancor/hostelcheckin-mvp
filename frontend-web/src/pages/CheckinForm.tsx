import React from "react";
import { useCheckinForm } from "./CheckinForm.hook";
import { GuestCard } from "./CheckinForm.guest";
import { ResultModal, GuestsTodayModal } from "./CheckinForm.modal";
import { styles } from "./CheckinForm.styles";

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

  return (
    <>
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

        {/* FORMULARIOS */}
        {formList.map((formData, index) => (
          <GuestCard
            key={index}
            data={formData}
            index={index}
            onChange={handleChange}
            onFile={handleFileChange}
          />
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
