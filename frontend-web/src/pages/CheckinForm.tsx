import { useEffect, useMemo, useState } from "react";
import { useCheckinForm } from "./CheckinForm.hook";
import { GuestCard } from "./CheckinForm.guest";
import { ResultModal, GuestsTodayModal } from "./CheckinForm.modal";
import { styles } from "./CheckinForm.styles";
import TERMS_TEXT from "./terminoscondiciones.txt?raw";
import { PaymentDemoModal, PaymentGateModal } from "./CheckinForm.payment";
import { usePayment } from "./CheckinForm.payment.hook";

/* ── Icons ── */
function CameraHintIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 4.5L7.4 6.5H5.5C4.12 6.5 3 7.62 3 9V17.5C3 18.88 4.12 20 5.5 20H18.5C19.88 20 21 18.88 21 17.5V9C21 7.62 19.88 6.5 18.5 6.5H16.6L15 4.5H9Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

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
  const [paymentGatePassed, setPaymentGatePassed] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* ── Payment ── */
  const paymentAmount = useMemo(() => {
    const r = reserva as any;
    const raw = r?.saldoPendiente ?? r?.saldo ?? r?.montoPendiente ?? r?.totalPendiente ?? r?.total ?? 50000;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 50000;
  }, [reserva]);

  const paymentDescription = useMemo(() => {
    const r = reserva as any;
    const room = r?.room || r?.roomName || r?.habitacion || r?.nombreHabitacion || "Reserva de hospedaje";
    const nr = r?.numeroReserva || r?.numero_reserva || r?.codigoReserva || "SIN-RESERVA";
    return `${room} · ${nr}`;
  }, [reserva]);

  const payment = usePayment(
    (reserva as any)?.numeroReserva || "SIN-RESERVA",
    paymentAmount,
    paymentDescription
  );

  const canSubmit = useMemo(() => {
    if (!acceptTerms) return false;
    return payment.canProceed;
  }, [acceptTerms, payment.canProceed]);

  const onSubmitClick = () => {
    if (!payment.canProceed) {
      return;
    }
    if (!acceptTerms) {
      setTermsError("Debes aceptar los términos y condiciones para continuar.");
      return;
    }
    setTermsError("");
    handleSubmit(titular?.motivoViaje || "");
  };

  /* ── Payment gate: show full-screen modal if any payment channel exists and not yet passed ── */
  const showPaymentGate = !paymentGatePassed && !loading && (
    payment.config.enabled ||
    payment.config.channels.bold.enabled ||
    payment.config.channels.billetero.enabled ||
    payment.config.channels.datafono.enabled
  );

  return (
    <>
      {showPaymentGate && (
        <PaymentGateModal
          config={payment.config}
          status={payment.status}
          error={payment.error}
          intent={payment.intent}
          selectedCanal={payment.selectedCanal}
          processing={payment.processing}
          amount={paymentAmount}
          description={paymentDescription}
          isMobile={isMobile}
          onSelectCanal={payment.setSelectedCanal}
          onPayBold={payment.openBoldPayment}
          onReset={payment.reset}
          onSkip={() => setPaymentGatePassed(true)}
          requirePayment={payment.config.requirePayment}
        />
      )}
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

      <PaymentDemoModal
        show={payment.showModal}
        processing={payment.processing}
        config={payment.config}
        amount={paymentAmount}
        description={paymentDescription}
        selectedCanal={payment.selectedCanal}
        isMobile={isMobile}
        onCancel={() => payment.setShowModal(false)}
        onPending={payment.markPending}
        onConfirm={payment.confirmMockPayment}
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

        <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.25rem" }}>
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

        {/* Camera hint */}
        <div
          style={{
            marginBottom: "1.2rem",
            background: "linear-gradient(135deg, rgba(37,99,235,0.18), rgba(139,92,246,0.14))",
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
              width: "42px", height: "42px", minWidth: "42px",
              borderRadius: "0.85rem", display: "flex",
              alignItems: "center", justifyContent: "center",
              color: "#93c5fd", background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <CameraHintIcon />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: "white", fontWeight: 800, fontSize: "0.96rem", marginBottom: "0.25rem" }}>
              Puedes subir documentos o usar la cámara de tu dispositivo
            </div>
            <div style={{ color: "#cbd5e1", fontSize: "0.84rem", lineHeight: 1.5 }}>
              En celulares compatibles el sistema intentará abrir la cámara.
              Algunos navegadores muestran primero el selector del dispositivo.
              El documento sigue siendo opcional.
            </div>
          </div>
        </div>

        {/* Guest cards */}
        {formList.map((formData, index) => (
          <GuestCard
            key={(formData as any)._id ?? index}
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

        {/* Payment inline summary (only if gate was passed with approved payment) */}
        {payment.status === "APPROVED" && (
          <div style={{
            marginTop: "1.5rem", padding: "0.9rem 1rem",
            background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.30)",
            borderRadius: "0.85rem", display: "flex", alignItems: "center", gap: "0.7rem",
            color: "#86efac", fontWeight: 800, fontSize: "0.92rem",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M8.7 12.3L10.8 14.4L15.5 9.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Pago confirmado — {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(paymentAmount)}
          </div>
        )}

        {/* Terms */}
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
                style={{ transform: "scale(1.2)", cursor: "pointer", flexShrink: 0 }}
              />
              <label htmlFor="acceptTerms" style={{ color: "white", cursor: "pointer", fontWeight: 700, lineHeight: 1.35 }}>
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
                color: "white", borderRadius: "0.5rem",
                padding: "0.65rem 0.8rem", cursor: "pointer", fontWeight: 700,
              }}
            >
              Ver términos
            </button>
          </div>
          {termsError && (
            <div style={{ marginTop: "0.75rem", color: "#fca5a5", fontSize: "0.9rem" }}>{termsError}</div>
          )}
        </div>

        {/* Submit */}
        <div style={{ ...styles.actions, marginTop: "1.5rem", display: "flex", justifyContent: "center" }}>
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
            {loading ? "Enviando..." : "Enviar Registro / Submit"}
          </button>
        </div>

        {payment.config.enabled && payment.config.mockMode && (
          <div style={{ marginTop: "0.85rem", textAlign: "center", color: "#fcd34d", fontSize: "0.86rem", lineHeight: 1.45 }}>
            Aviso: la pasarela de pago está en modo demo. El flujo de registro sigue operando sin bloquear.
          </div>
        )}

        <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end" }}>
          <a
            href="https://cheking.kuyay.co/admin"
            target="_blank"
            rel="noreferrer"
            style={{
              fontSize: "0.72rem", color: "rgba(255,255,255,0.38)",
              textDecoration: "none", letterSpacing: "0.02em", transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.62)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.38)"; }}
          >
            Acceso interno
          </a>
        </div>
      </div>

      {/* Terms Modal */}
      {showTermsModal && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 99999, padding: isMobile ? "0.75rem" : "1rem",
          }}
          onClick={() => setShowTermsModal(false)}
        >
          <div
            style={{
              background: "#111827", padding: isMobile ? "1rem" : "1.25rem",
              borderRadius: "0.75rem", width: "100%",
              maxWidth: isMobile ? "100%" : "860px",
              color: "white", border: "1px solid rgba(255,255,255,0.12)", boxSizing: "border-box",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", gap: "1rem" }}>
              <h2 style={{ margin: 0, fontSize: isMobile ? "1rem" : "1.1rem", lineHeight: 1.3 }}>
                Términos y Condiciones del servicio
              </h2>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                style={{
                  marginLeft: isMobile ? 0 : "auto", background: "#2563eb",
                  border: "none", borderRadius: "0.5rem", color: "white",
                  padding: "0.55rem 0.9rem", fontWeight: 800, cursor: "pointer",
                  width: isMobile ? "100%" : "auto",
                }}
              >
                Cerrar
              </button>
            </div>
            <div
              style={{
                marginTop: "1rem", maxHeight: isMobile ? "55vh" : "60vh",
                overflowY: "auto", padding: isMobile ? "0.85rem" : "1rem",
                background: "rgba(255,255,255,0.04)", borderRadius: "0.65rem",
                whiteSpace: "pre-wrap", lineHeight: 1.45,
                fontSize: isMobile ? "0.9rem" : "0.95rem",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {TERMS_TEXT}
            </div>
            <div style={{ marginTop: "1rem", display: "flex", flexDirection: isMobile ? "column" : "row", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => { setAcceptTerms(true); setTermsError(""); setShowTermsModal(false); }}
                style={{
                  flex: 1, background: "#10b981", border: "none", borderRadius: "0.5rem",
                  color: "white", padding: "0.75rem", fontWeight: 900, cursor: "pointer",
                }}
              >
                Acepto los términos
              </button>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                style={{
                  flex: 1, background: "transparent", border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: "0.5rem", color: "white", padding: "0.75rem",
                  fontWeight: 800, cursor: "pointer",
                }}
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
