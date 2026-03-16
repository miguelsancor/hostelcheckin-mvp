import React, { useEffect, useMemo, useState } from "react";
import { useCheckinForm } from "./CheckinForm.hook";
import { GuestCard } from "./CheckinForm.guest";
import { ResultModal, GuestsTodayModal } from "./CheckinForm.modal";
import { styles } from "./CheckinForm.styles";
import TERMS_TEXT from "./terminoscondiciones.txt?raw";

function CameraHintIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 4.5L7.4 6.5H5.5C4.12 6.5 3 7.62 3 9V17.5C3 18.88 4.12 20 5.5 20H18.5C19.88 20 21 18.88 21 17.5V9C21 7.62 19.88 6.5 18.5 6.5H16.6L15 4.5H9Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function BoldIcon() {
  return (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        background: "linear-gradient(135deg, #0ea5e9, #2563eb, #7c3aed)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontWeight: 900,
        fontSize: "0.9rem",
        letterSpacing: "0.04em",
        boxShadow: "0 10px 25px rgba(37,99,235,0.35)",
      }}
    >
      B
    </div>
  );
}

function ShieldPayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3L19 6V11C19 15.5 16.2 19.74 12 21C7.8 19.74 5 15.5 5 11V6L12 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 12.2L11.1 13.8L14.8 10.1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatCOP(value: number) {
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `$${value}`;
  }
}

function generateMockPaymentRef() {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  const time = Date.now().toString().slice(-6);
  return `BOLD-${time}-${rand}`;
}

type PaymentStatus = "PENDING" | "PROCESSING" | "APPROVED";

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
    removeGuestByIndex,
    handleSubmit,
  } = useCheckinForm();

  const titular = formList?.[0];

  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsError, setTermsError] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  // ✅ Pago mock Bold
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("PENDING");
  const [paymentError, setPaymentError] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentApprovedAt, setPaymentApprovedAt] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const paymentAmount = useMemo(() => {
    const raw =
      reserva?.saldoPendiente ??
      reserva?.saldo ??
      reserva?.montoPendiente ??
      reserva?.totalPendiente ??
      reserva?.total ??
      50000;

    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 50000;
  }, [reserva]);

  const paymentDescription = useMemo(() => {
    const room =
      reserva?.room ||
      reserva?.roomName ||
      reserva?.habitacion ||
      reserva?.nombreHabitacion ||
      "Reserva de hospedaje";

    const nr =
      reserva?.numeroReserva ||
      reserva?.numero_reserva ||
      reserva?.codigoReserva ||
      "SIN-RESERVA";

    return `${room} · ${nr}`;
  }, [reserva]);

  const paymentStatusLabel = useMemo(() => {
    if (paymentStatus === "APPROVED") return "Aprobado";
    if (paymentStatus === "PROCESSING") return "Procesando";
    return "Pendiente";
  }, [paymentStatus]);

  const paymentStatusColor = useMemo(() => {
    if (paymentStatus === "APPROVED") return "#10b981";
    if (paymentStatus === "PROCESSING") return "#f59e0b";
    return "#ef4444";
  }, [paymentStatus]);

  const onSubmitClick = () => {
    if (paymentStatus !== "APPROVED") {
      setPaymentError("Debes completar el pago con Bold antes de enviar el registro.");
      return;
    }

    if (!acceptTerms) {
      setTermsError("Debes aceptar los términos y condiciones para continuar.");
      return;
    }

    setPaymentError("");
    setTermsError("");
    handleSubmit(titular?.motivoViaje || "");
  };

  const openBoldPayment = () => {
    setPaymentError("");
    setShowPaymentModal(true);
  };

  const confirmMockPayment = async () => {
    try {
      setProcessingPayment(true);
      setPaymentStatus("PROCESSING");
      setPaymentError("");

      await new Promise((resolve) => setTimeout(resolve, 1800));

      const ref = generateMockPaymentRef();
      const approvedAt = new Date().toLocaleString("es-CO");

      setPaymentRef(ref);
      setPaymentApprovedAt(approvedAt);
      setPaymentStatus("APPROVED");
      setShowPaymentModal(false);
    } catch {
      setPaymentStatus("PENDING");
      setPaymentError("No se pudo procesar el pago demo.");
    } finally {
      setProcessingPayment(false);
    }
  };

  const resetMockPayment = () => {
    setPaymentStatus("PENDING");
    setPaymentRef("");
    setPaymentApprovedAt("");
    setPaymentError("");
  };

  return (
    <>
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

      <div
        style={{
          ...styles.container,
          width: "100%",
          maxWidth: isMobile ? "100%" : "860px",
          margin: "0 auto",
          padding: isMobile ? "1rem" : "2rem",
          boxSizing: "border-box",
          overflowX: "hidden",
          position: "relative",
        }}
      >
        <h2
          style={{
            ...styles.title,
            textAlign: "center",
            fontSize: isMobile ? "2rem" : undefined,
            lineHeight: 1.15,
            marginBottom: "1rem",
          }}
        >
          Registro de Huéspedes
        </h2>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "1.25rem",
          }}
        >
          <button
            onClick={cargarHuespedesHoy}
            style={{
              padding: isMobile ? "0.75rem 1rem" : "0.75rem 2rem",
              background: "#10b981",
              borderRadius: "0.5rem",
              border: "none",
              color: "white",
              fontWeight: "bold",
              cursor: "pointer",
              width: isMobile ? "100%" : "auto",
              maxWidth: isMobile ? "320px" : "none",
            }}
          >
            Volver a Consulta
          </button>
        </div>

        {reserva?.numeroReserva && (
          <h3
            style={{
              ...styles.subTitle,
              textAlign: "center",
              fontSize: isMobile ? "1.1rem" : undefined,
              lineHeight: 1.3,
              marginBottom: "1rem",
            }}
          >
            Código de Reserva:{" "}
            <span style={{ color: "#10b981", wordBreak: "break-word" }}>
              {reserva.numeroReserva}
            </span>
          </h3>
        )}

        <div
          style={{
            marginBottom: "1.2rem",
            background:
              "linear-gradient(135deg, rgba(37,99,235,0.18), rgba(139,92,246,0.14))",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: "0.95rem",
            padding: isMobile ? "0.9rem" : "1rem 1.1rem",
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "flex-start" : "center",
            gap: "0.85rem",
            boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              minWidth: "42px",
              borderRadius: "0.85rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#93c5fd",
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <CameraHintIcon />
          </div>

          <div style={{ flex: 1 }}>
            <div
              style={{
                color: "white",
                fontWeight: 800,
                fontSize: "0.96rem",
                marginBottom: "0.25rem",
              }}
            >
              Puedes subir documentos o usar la cámara de tu dispositivo
            </div>
            <div
              style={{
                color: "#cbd5e1",
                fontSize: "0.84rem",
                lineHeight: 1.5,
              }}
            >
              En celulares compatibles el sistema intentará abrir la cámara.
              Algunos navegadores muestran primero el selector del dispositivo.
              El documento sigue siendo opcional.
            </div>
          </div>
        </div>

        {formList.map((formData, index) => (
          <GuestCard
            key={formData._id ?? index}
            data={formData}
            index={index}
            onChange={handleChange}
            onFile={handleFileChange}
            onRemove={removeGuestByIndex}
          />
        ))}

        <div style={{ marginTop: "1.25rem", textAlign: "center" }}>
          <button
            onClick={handleAddGuest}
            style={{
              ...styles.button,
              backgroundColor: "#8b5cf6",
              width: isMobile ? "100%" : "auto",
              maxWidth: isMobile ? "320px" : "none",
              padding: "0.85rem 1.5rem",
            }}
            disabled={loading}
          >
            Agregar Huésped / Add Guest
          </button>
        </div>

        {/* ✅ BLOQUE PAGO BOLD */}
        <div
          style={{
            marginTop: "1.5rem",
            background:
              "linear-gradient(135deg, rgba(14,165,233,0.14), rgba(37,99,235,0.16), rgba(124,58,237,0.14))",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: "1rem",
            padding: isMobile ? "1rem" : "1.1rem",
            boxShadow: "0 16px 40px rgba(0,0,0,0.20)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              alignItems: isMobile ? "flex-start" : "center",
              gap: "0.9rem",
              marginBottom: "1rem",
            }}
          >
            <BoldIcon />

            <div style={{ flex: 1 }}>
              <div
                style={{
                  color: "white",
                  fontWeight: 900,
                  fontSize: "1rem",
                  marginBottom: "0.25rem",
                }}
              >
                Pago con Bold
              </div>

              <div
                style={{
                  color: "#cbd5e1",
                  fontSize: "0.88rem",
                  lineHeight: 1.45,
                }}
              >
                Flujo visual preparado para integrar la pasarela Bold. Por ahora
                opera con datos demo para dejar la experiencia construida.
              </div>
            </div>

            <div
              style={{
                padding: "0.45rem 0.8rem",
                borderRadius: "999px",
                background: `${paymentStatusColor}22`,
                border: `1px solid ${paymentStatusColor}66`,
                color: paymentStatusColor,
                fontWeight: 800,
                fontSize: "0.84rem",
                whiteSpace: "nowrap",
              }}
            >
              {paymentStatusLabel}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1.1fr 0.9fr",
              gap: "1rem",
            }}
          >
            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "0.9rem",
                padding: "1rem",
              }}
            >
              <div
                style={{
                  color: "#93c5fd",
                  fontWeight: 800,
                  fontSize: "0.84rem",
                  letterSpacing: "0.03em",
                  textTransform: "uppercase",
                  marginBottom: "0.75rem",
                }}
              >
                Resumen del cobro
              </div>

              <div
                style={{
                  display: "grid",
                  gap: "0.7rem",
                  color: "white",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "1rem",
                  }}
                >
                  <span style={{ color: "#cbd5e1" }}>Método</span>
                  <strong>BOLD</strong>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "1rem",
                  }}
                >
                  <span style={{ color: "#cbd5e1" }}>Concepto</span>
                  <strong style={{ textAlign: "right" }}>{paymentDescription}</strong>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "1rem",
                  }}
                >
                  <span style={{ color: "#cbd5e1" }}>Moneda</span>
                  <strong>COP</strong>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "1rem",
                    alignItems: "center",
                    paddingTop: "0.35rem",
                    borderTop: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <span style={{ color: "#cbd5e1" }}>Total a pagar</span>
                  <strong style={{ fontSize: "1.25rem", color: "#10b981" }}>
                    {formatCOP(paymentAmount)}
                  </strong>
                </div>
              </div>
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "0.9rem",
                padding: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.8rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  color: "white",
                  fontWeight: 800,
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.08)",
                    color: "#93c5fd",
                  }}
                >
                  <ShieldPayIcon />
                </span>
                Estado del pago
              </div>

              <div
                style={{
                  color: "#cbd5e1",
                  fontSize: "0.9rem",
                  lineHeight: 1.45,
                }}
              >
                Completa el pago para continuar con el envío del registro y el
                flujo de check-in.
              </div>

              <div
                style={{
                  borderRadius: "0.75rem",
                  background: "rgba(0,0,0,0.2)",
                  padding: "0.8rem",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div style={{ color: "#94a3b8", fontSize: "0.82rem", marginBottom: 6 }}>
                  Referencia
                </div>
                <div style={{ color: "white", fontWeight: 800 }}>
                  {paymentRef || "Se generará al aprobar el pago"}
                </div>

                <div
                  style={{
                    color: "#94a3b8",
                    fontSize: "0.82rem",
                    marginTop: "0.8rem",
                    marginBottom: 6,
                  }}
                >
                  Fecha de aprobación
                </div>
                <div style={{ color: "white", fontWeight: 700 }}>
                  {paymentApprovedAt || "-"}
                </div>
              </div>

              <button
                type="button"
                onClick={openBoldPayment}
                disabled={paymentStatus === "APPROVED" || processingPayment}
                style={{
                  width: "100%",
                  background:
                    paymentStatus === "APPROVED"
                      ? "#065f46"
                      : "linear-gradient(135deg, #0ea5e9, #2563eb, #7c3aed)",
                  border: "none",
                  color: "white",
                  borderRadius: "0.75rem",
                  padding: "0.95rem 1rem",
                  cursor:
                    paymentStatus === "APPROVED" || processingPayment
                      ? "not-allowed"
                      : "pointer",
                  fontWeight: 900,
                  fontSize: "0.96rem",
                  opacity: paymentStatus === "APPROVED" ? 0.9 : 1,
                  boxShadow: "0 14px 30px rgba(37,99,235,0.25)",
                }}
              >
                {paymentStatus === "APPROVED"
                  ? "Pago aprobado con Bold"
                  : "Pagar con Bold"}
              </button>

              {paymentStatus === "APPROVED" && (
                <button
                  type="button"
                  onClick={resetMockPayment}
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.16)",
                    color: "white",
                    borderRadius: "0.75rem",
                    padding: "0.8rem 1rem",
                    cursor: "pointer",
                    fontWeight: 800,
                  }}
                >
                  Reiniciar pago demo
                </button>
              )}
            </div>
          </div>

          {paymentError && (
            <div
              style={{
                marginTop: "0.9rem",
                color: "#fca5a5",
                fontSize: "0.9rem",
              }}
            >
              {paymentError}
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: "1.5rem",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "0.75rem",
            padding: isMobile ? "0.9rem" : "1rem",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              alignItems: isMobile ? "stretch" : "center",
              gap: "0.75rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <input
                id="acceptTerms"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => {
                  setAcceptTerms(e.target.checked);
                  if (e.target.checked) setTermsError("");
                }}
                style={{
                  transform: "scale(1.2)",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              />

              <label
                htmlFor="acceptTerms"
                style={{
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 700,
                  lineHeight: 1.35,
                }}
              >
                Acepto los Términos y Condiciones del servicio
              </label>
            </div>

            <button
              type="button"
              onClick={() => setShowTermsModal(true)}
              style={{
                marginLeft: isMobile ? 0 : "auto",
                width: isMobile ? "100%" : "auto",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.18)",
                color: "white",
                borderRadius: "0.5rem",
                padding: "0.65rem 0.8rem",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              Ver términos
            </button>
          </div>

          {termsError && (
            <div
              style={{
                marginTop: "0.75rem",
                color: "#fca5a5",
                fontSize: "0.9rem",
              }}
            >
              {termsError}
            </div>
          )}
        </div>

        <div
          style={{
            ...styles.actions,
            marginTop: "1.5rem",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <button
            onClick={onSubmitClick}
            style={{
              ...styles.button,
              width: isMobile ? "100%" : "auto",
              maxWidth: isMobile ? "320px" : "none",
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
            disabled={loading}
          >
            {loading ? "Enviando..." : "Enviar Registro / Submit"}
          </button>
        </div>

        <div
          style={{
            marginTop: "1rem",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <a
            href="https://cheking.kuyay.co/admin"
            target="_blank"
            rel="noreferrer"
            style={{
              fontSize: "0.72rem",
              color: "rgba(255,255,255,0.38)",
              textDecoration: "none",
              letterSpacing: "0.02em",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "rgba(255,255,255,0.62)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(255,255,255,0.38)";
            }}
          >
            Acceso interno
          </a>
        </div>
      </div>

      {/* ✅ MODAL TÉRMINOS */}
      {showTermsModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            padding: isMobile ? "0.75rem" : "1rem",
          }}
          onClick={() => setShowTermsModal(false)}
        >
          <div
            style={{
              background: "#111827",
              padding: isMobile ? "1rem" : "1.25rem",
              borderRadius: "0.75rem",
              width: "100%",
              maxWidth: isMobile ? "100%" : "860px",
              color: "white",
              border: "1px solid rgba(255,255,255,0.12)",
              boxSizing: "border-box",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                alignItems: isMobile ? "stretch" : "center",
                gap: "1rem",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: isMobile ? "1rem" : "1.1rem",
                  lineHeight: 1.3,
                }}
              >
                Términos y Condiciones del servicio
              </h2>

              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                style={{
                  marginLeft: isMobile ? 0 : "auto",
                  background: "#2563eb",
                  border: "none",
                  borderRadius: "0.5rem",
                  color: "white",
                  padding: "0.55rem 0.9rem",
                  fontWeight: 800,
                  cursor: "pointer",
                  width: isMobile ? "100%" : "auto",
                }}
              >
                Cerrar
              </button>
            </div>

            <div
              style={{
                marginTop: "1rem",
                maxHeight: isMobile ? "55vh" : "60vh",
                overflowY: "auto",
                padding: isMobile ? "0.85rem" : "1rem",
                background: "rgba(255,255,255,0.04)",
                borderRadius: "0.65rem",
                whiteSpace: "pre-wrap",
                lineHeight: 1.45,
                fontSize: isMobile ? "0.9rem" : "0.95rem",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {TERMS_TEXT}
            </div>

            <div
              style={{
                marginTop: "1rem",
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: "0.75rem",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setAcceptTerms(true);
                  setTermsError("");
                  setShowTermsModal(false);
                }}
                style={{
                  flex: 1,
                  background: "#10b981",
                  border: "none",
                  borderRadius: "0.5rem",
                  color: "white",
                  padding: "0.75rem",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                Acepto los términos
              </button>

              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: "0.5rem",
                  color: "white",
                  padding: "0.75rem",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ MODAL PAGO BOLD DEMO */}
      {showPaymentModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.78)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100000,
            padding: isMobile ? "0.8rem" : "1rem",
          }}
          onClick={() => {
            if (!processingPayment) setShowPaymentModal(false);
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 520,
              background: "#0f172a",
              color: "white",
              borderRadius: "1rem",
              padding: isMobile ? "1rem" : "1.25rem",
              border: "1px solid rgba(255,255,255,0.10)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.40)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.85rem",
                marginBottom: "1rem",
              }}
            >
              <BoldIcon />
              <div>
                <div style={{ fontWeight: 900, fontSize: "1.05rem" }}>
                  Checkout Bold
                </div>
                <div style={{ color: "#cbd5e1", fontSize: "0.88rem" }}>
                  Simulación visual para integración inicial
                </div>
              </div>
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "0.85rem",
                padding: "1rem",
                display: "grid",
                gap: "0.7rem",
                marginBottom: "1rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span style={{ color: "#cbd5e1" }}>Comercio</span>
                <strong>Kuyay Hostel</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span style={{ color: "#cbd5e1" }}>Concepto</span>
                <strong style={{ textAlign: "right" }}>{paymentDescription}</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span style={{ color: "#cbd5e1" }}>Medio de pago</span>
                <strong>Bold</strong>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  paddingTop: "0.55rem",
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <span style={{ color: "#cbd5e1" }}>Total</span>
                <strong style={{ color: "#10b981", fontSize: "1.2rem" }}>
                  {formatCOP(paymentAmount)}
                </strong>
              </div>
            </div>

            <div
              style={{
                marginBottom: "1rem",
                background: "rgba(59,130,246,0.08)",
                border: "1px solid rgba(59,130,246,0.18)",
                color: "#dbeafe",
                borderRadius: "0.85rem",
                padding: "0.9rem",
                lineHeight: 1.5,
                fontSize: "0.9rem",
              }}
            >
              Esta pantalla es una simulación inicial. Luego aquí conectaremos la
              URL real o el checkout oficial de Bold con datos del comercio.
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: "0.75rem",
              }}
            >
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                disabled={processingPayment}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.16)",
                  color: "white",
                  borderRadius: "0.75rem",
                  padding: "0.9rem 1rem",
                  cursor: processingPayment ? "not-allowed" : "pointer",
                  fontWeight: 800,
                }}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmMockPayment}
                disabled={processingPayment}
                style={{
                  flex: 1,
                  background: "linear-gradient(135deg, #0ea5e9, #2563eb, #7c3aed)",
                  border: "none",
                  color: "white",
                  borderRadius: "0.75rem",
                  padding: "0.9rem 1rem",
                  cursor: processingPayment ? "not-allowed" : "pointer",
                  fontWeight: 900,
                  boxShadow: "0 14px 30px rgba(37,99,235,0.25)",
                }}
              >
                {processingPayment ? "Procesando pago..." : "Aprobar pago demo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}