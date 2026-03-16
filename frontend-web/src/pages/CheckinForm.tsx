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

function BoldWordmark() {
  return (
    <div
      style={{
        minWidth: 64,
        height: 56,
        borderRadius: 16,
        padding: "0 16px",
        background: "linear-gradient(135deg, #111827, #1f2937)",
        border: "1px solid rgba(255,255,255,0.10)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontWeight: 900,
        fontSize: "1rem",
        letterSpacing: "0.08em",
        boxShadow: "0 14px 30px rgba(0,0,0,0.24)",
      }}
    >
      BOLD
    </div>
  );
}

function LockSecureIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 10V8a5 5 0 0 1 10 0v2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="15" r="1.2" fill="currentColor" />
    </svg>
  );
}

function CardPayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 9H21" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function BankPayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 10L12 5L20 10" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M6 10V18M10 10V18M14 10V18M18 10V18" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 19H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function WalletPayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="6" width="16" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M15 12H18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="15" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8.7 12.3L10.8 14.4L15.5 9.7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AlertTriangleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 4L20 18H4L12 4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M12 9V13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="16.5" r="1" fill="currentColor" />
    </svg>
  );
}

function ExternalArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M14 5H19V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 14L19 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M19 14V18C19 18.55 18.55 19 18 19H6C5.45 19 5 18.55 5 18V6C5 5.45 5.45 5 6 5H10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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
  return `BOLD-DEMO-${time}-${rand}`;
}

type PaymentStatus = "PENDING" | "REDIRECTED" | "PROCESSING" | "APPROVED";

const BOLD_MODE = (import.meta.env.VITE_BOLD_MODE || "demo").toLowerCase();
const BOLD_CHECKOUT_URL = import.meta.env.VITE_BOLD_CHECKOUT_URL || "";
const BOLD_BUSINESS_NAME = import.meta.env.VITE_BOLD_BUSINESS_NAME || "Kuyay Hostel";
const BOLD_PUBLIC_LABEL = import.meta.env.VITE_BOLD_PUBLIC_LABEL || "Pago seguro con Bold";

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

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("PENDING");
  const [paymentError, setPaymentError] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentApprovedAt, setPaymentApprovedAt] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);

  const isBoldDemo = BOLD_MODE !== "prod";
  const hasRealBoldUrl = !!BOLD_CHECKOUT_URL?.trim();

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
    if (paymentStatus === "APPROVED") return "Pago confirmado";
    if (paymentStatus === "PROCESSING") return "Procesando";
    if (paymentStatus === "REDIRECTED") return "Pendiente de confirmación";
    return "Pendiente";
  }, [paymentStatus]);

  const paymentStatusColor = useMemo(() => {
    if (paymentStatus === "APPROVED") return "#10b981";
    if (paymentStatus === "PROCESSING") return "#f59e0b";
    if (paymentStatus === "REDIRECTED") return "#38bdf8";
    return "#ef4444";
  }, [paymentStatus]);

  const paymentHelperText = useMemo(() => {
    if (isBoldDemo) {
      return "Modo demo activo. Esta sección está en construcción y no realiza cobros reales todavía.";
    }
    if (paymentStatus === "REDIRECTED") {
      return "Fuiste redirigido a Bold. El pago debe confirmarse desde backend o por validación real del comercio.";
    }
    if (paymentStatus === "APPROVED") {
      return "Pago marcado como confirmado.";
    }
    return "Serás redirigido a Bold para completar tu pago de forma segura.";
  }, [isBoldDemo, paymentStatus]);

  const canSubmit = useMemo(() => {
    if (isBoldDemo) {
      return acceptTerms;
    }
    return acceptTerms && paymentStatus === "APPROVED";
  }, [acceptTerms, isBoldDemo, paymentStatus]);

  const onSubmitClick = () => {
    if (!isBoldDemo && paymentStatus !== "APPROVED") {
      setPaymentError("Debes completar y confirmar el pago con Bold antes de enviar el registro.");
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

    if (isBoldDemo) {
      setShowPaymentModal(true);
      return;
    }

    if (!hasRealBoldUrl) {
      setPaymentError("La pasarela está configurada en producción, pero aún no tiene URL real de Bold.");
      return;
    }

    setPaymentStatus("REDIRECTED");
    window.open(BOLD_CHECKOUT_URL, "_blank", "noopener,noreferrer");
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

  const markPendingConfirmation = () => {
    setShowPaymentModal(false);
    setPaymentStatus("REDIRECTED");
    setPaymentRef("BOLD-DEMO-PENDIENTE");
    setPaymentApprovedAt("");
  };

  const resetMockPayment = () => {
    setPaymentStatus("PENDING");
    setPaymentRef("");
    setPaymentApprovedAt("");
    setPaymentError("");
  };

  const paymentButtonLabel = useMemo(() => {
    if (paymentStatus === "APPROVED") return "Pago confirmado";
    if (isBoldDemo) return "Probar flujo demo";
    return "Pagar con Bold";
  }, [paymentStatus, isBoldDemo]);

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

        <div
          style={{
            marginTop: "1.5rem",
            background:
              "linear-gradient(135deg, rgba(14,165,233,0.12), rgba(37,99,235,0.14), rgba(124,58,237,0.12))",
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
            <BoldWordmark />

            <div style={{ flex: 1 }}>
              <div
                style={{
                  color: "white",
                  fontWeight: 900,
                  fontSize: "1rem",
                  marginBottom: "0.2rem",
                }}
              >
                {BOLD_PUBLIC_LABEL}
              </div>

              <div
                style={{
                  color: "#cbd5e1",
                  fontSize: "0.88rem",
                  lineHeight: 1.45,
                }}
              >
                Pasarela preparada para integración con Bold. El diseño ya está listo para operar con enlace real o ambiente de pruebas.
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
              marginBottom: "1rem",
              background: isBoldDemo
                ? "rgba(245,158,11,0.10)"
                : "rgba(59,130,246,0.10)",
              border: isBoldDemo
                ? "1px solid rgba(245,158,11,0.30)"
                : "1px solid rgba(59,130,246,0.26)",
              color: isBoldDemo ? "#fde68a" : "#dbeafe",
              borderRadius: "0.9rem",
              padding: "0.9rem 1rem",
              display: "flex",
              alignItems: "flex-start",
              gap: "0.7rem",
              lineHeight: 1.5,
              fontSize: "0.92rem",
            }}
          >
            <span style={{ marginTop: 2, display: "inline-flex" }}>
              <AlertTriangleIcon />
            </span>
            <div>
              <strong style={{ display: "block", marginBottom: 4 }}>
                {isBoldDemo ? "Pasarela en construcción" : "Flujo conectado a Bold"}
              </strong>
              <span>
                {paymentHelperText}
              </span>
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
                  <span style={{ color: "#cbd5e1" }}>Comercio</span>
                  <strong>{BOLD_BUSINESS_NAME}</strong>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "1rem",
                  }}
                >
                  <span style={{ color: "#cbd5e1" }}>Método</span>
                  <strong>Bold</strong>
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

              <div
                style={{
                  marginTop: "1rem",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.6rem",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    padding: "0.5rem 0.7rem",
                    borderRadius: "999px",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "white",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                  }}
                >
                  <CardPayIcon />
                  Tarjetas
                </div>

                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    padding: "0.5rem 0.7rem",
                    borderRadius: "999px",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "white",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                  }}
                >
                  <BankPayIcon />
                  PSE
                </div>

                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    padding: "0.5rem 0.7rem",
                    borderRadius: "999px",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "white",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                  }}
                >
                  <WalletPayIcon />
                  Nequi
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
                  <LockSecureIcon />
                </span>
                Pago seguro en línea
              </div>

              <div
                style={{
                  color: "#cbd5e1",
                  fontSize: "0.9rem",
                  lineHeight: 1.45,
                }}
              >
                Tu pago se procesa fuera de este formulario, a través del checkout de Bold. Este formulario no almacena datos de tarjeta.
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
                  {paymentRef || "Aún no generada"}
                </div>

                <div
                  style={{
                    color: "#94a3b8",
                    fontSize: "0.82rem",
                    marginTop: "0.8rem",
                    marginBottom: 6,
                  }}
                >
                  Confirmación
                </div>
                <div style={{ color: "white", fontWeight: 700 }}>
                  {paymentApprovedAt || (paymentStatus === "REDIRECTED" ? "En espera de validación" : "-")}
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
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.55rem",
                }}
              >
                <span>{paymentButtonLabel}</span>
                {paymentStatus !== "APPROVED" && <ExternalArrowIcon />}
              </button>

              {paymentStatus === "APPROVED" && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.55rem",
                    color: "#86efac",
                    fontWeight: 800,
                    fontSize: "0.9rem",
                  }}
                >
                  <CheckCircleIcon />
                  Estado visual completado
                </div>
              )}

              {(isBoldDemo || paymentStatus === "APPROVED" || paymentStatus === "REDIRECTED") && (
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
                  Reiniciar estado de pago
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
            disabled={loading || !canSubmit}
          >
            {loading
              ? "Enviando..."
              : isBoldDemo
              ? "Enviar Registro / Demo"
              : "Enviar Registro / Submit"}
          </button>
        </div>

        {isBoldDemo && (
          <div
            style={{
              marginTop: "0.85rem",
              textAlign: "center",
              color: "#fcd34d",
              fontSize: "0.86rem",
              lineHeight: 1.45,
            }}
          >
            Aviso: la pasarela de pago está en construcción. El flujo actual es visual y de pruebas.
          </div>
        )}

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
              maxWidth: 560,
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
              <BoldWordmark />
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
                marginBottom: "1rem",
                background: "rgba(245,158,11,0.12)",
                border: "1px solid rgba(245,158,11,0.28)",
                color: "#fde68a",
                borderRadius: "0.85rem",
                padding: "0.9rem",
                lineHeight: 1.5,
                fontSize: "0.9rem",
              }}
            >
              Esta pasarela está en construcción. El flujo actual es de demostración y no genera un cobro real todavía.
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
                <strong>{BOLD_BUSINESS_NAME}</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span style={{ color: "#cbd5e1" }}>Concepto</span>
                <strong style={{ textAlign: "right" }}>{paymentDescription}</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span style={{ color: "#cbd5e1" }}>Medio</span>
                <strong>Bold Demo</strong>
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
                onClick={markPendingConfirmation}
                disabled={processingPayment}
                style={{
                  flex: 1,
                  background: "#1d4ed8",
                  border: "none",
                  color: "white",
                  borderRadius: "0.75rem",
                  padding: "0.9rem 1rem",
                  cursor: processingPayment ? "not-allowed" : "pointer",
                  fontWeight: 900,
                }}
              >
                Dejar pendiente
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
                {processingPayment ? "Procesando..." : "Aprobar demo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}