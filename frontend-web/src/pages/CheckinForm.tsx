import React, { useState } from "react";
import { useCheckinForm } from "./CheckinForm.hook";
import { GuestCard } from "./CheckinForm.guest";
import { ResultModal, GuestsTodayModal } from "./CheckinForm.modal";
import { styles } from "./CheckinForm.styles";

const TABS = [
  { id: "personal", label: "👤 Datos personales" },
  { id: "viaje", label: "✈️ Información del viaje" },
];

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
    removeGuestByIndex, // ✅ NUEVO
    handleSubmit,
  } = useCheckinForm();

  const [activeTab, setActiveTab] = useState("personal");
  const [motivoDetallado, setMotivoDetallado] = useState("");
  const [showReasonTripModal, setShowReasonTripModal] = useState(false);

  // ✅ Titular = primer huésped
  const titular = formList?.[0];

  return (
    <>
      {/* ================= MODAL RESULTADOS ================= */}
      <ResultModal
        show={showModal}
        message={modalMessage}
        guest={titular}
        reserva={reserva as any}
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
            background: "#10b981",
            borderRadius: "0.5rem",
            border: "none",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Volver a Consulta
        </button>

        {reserva?.numeroReserva && (
          <h3 style={styles.subTitle}>
            Código de Reserva:{" "}
            <span style={{ color: "#10b981" }}>{reserva.numeroReserva}</span>
          </h3>
        )}

        {/* ================= TABS ================= */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            marginBottom: "2rem",
            flexWrap: "wrap",
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "0.6rem 1.5rem",
                borderRadius: "0.5rem",
                border: "none",
                cursor: "pointer",
                background: activeTab === tab.id ? "#2563eb" : "#1f2937",
                color: "white",
                fontWeight: "bold",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* =============== FORMULARIO =============== */}
        {activeTab === "personal" && (
          <>
            {formList.map((formData, index) => (
              <GuestCard
                key={formData._id ?? index}
                data={formData}
                index={index}
                onChange={handleChange}
                onFile={handleFileChange}
                activeTab={activeTab}
                onRemove={removeGuestByIndex} // ✅ AQUÍ QUEDA VIVO EL BOTÓN
              />
            ))}

            {/* ✅ BOTÓN "AGREGAR HUÉSPED" SOLO EN DATOS PERSONALES */}
            <div style={{ marginTop: "1.25rem", textAlign: "center" }}>
              <button
                onClick={handleAddGuest}
                style={{
                  ...styles.button,
                  backgroundColor: "#8b5cf6",
                  width: "auto",
                  padding: "0.85rem 1.5rem",
                }}
                disabled={loading}
              >
                Agregar Huésped / Add Guest
              </button>
            </div>
          </>
        )}

        {/* ✅ VIAJE: SOLO TITULAR */}
        {activeTab === "viaje" && titular && (
          <>
            <GuestCard
              key={titular._id ?? 0}
              data={titular}
              index={0}
              onChange={handleChange}
              onFile={handleFileChange}
              activeTab={activeTab}
            />

            {/* ================= MOTIVO DE VIAJE ================= */}
            <div style={{ marginTop: "2rem" }}>
              <label style={{ color: "white", fontWeight: "bold" }}>
                Motivo del viaje / Trip reason
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
                  textAlign: "center",
                }}
              >
                {motivoDetallado || "Seleccione una opción / Select one"}
              </div>
            </div>
          </>
        )}

        {/* ================= SUBMIT FINAL ================= */}
        <div style={styles.actions}>
          <button
            onClick={() => handleSubmit(motivoDetallado)}
            style={styles.button}
            disabled={loading}
          >
            {loading ? "Enviando..." : "Enviar Registro / Submit"}
          </button>
        </div>
      </div>

      {/* ================= MODAL MOTIVO VIAJE ================= */}
      {showReasonTripModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
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
            }}
          >
            <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>
              Reason for trip
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
                marginBottom: "1.5rem",
              }}
            >
              {reasonsTrip.map((r) => (
                <label
                  key={r}
                  style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
                >
                  <input
                    type="radio"
                    checked={motivoDetallado === r}
                    onChange={() => setMotivoDetallado(r)}
                  />
                  {r}
                </label>
              ))}
            </div>

            <button
              onClick={() => setShowReasonTripModal(false)}
              style={{
                width: "100%",
                padding: "0.7rem",
                borderRadius: "0.5rem",
                background: "#2563eb",
                color: "white",
                fontWeight: "bold",
                border: "none",
              }}
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
