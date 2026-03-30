import { useState, useCallback, useMemo } from "react";
import type { PaymentCanal, PaymentStatus, PaymentIntent, PaymentConfig } from "./CheckinForm.payment.types";
import { loadPaymentConfig } from "./CheckinForm.payment.types";

const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "");

function buildUrl(path: string) {
  return `${API_BASE}${path}`;
}

export function usePayment(numeroReserva: string, monto: number, descripcion: string) {
  const config = useMemo<PaymentConfig>(() => loadPaymentConfig(), []);

  const [status, setStatus] = useState<PaymentStatus>("PENDING");
  const [error, setError] = useState("");
  const [intent, setIntent] = useState<PaymentIntent | null>(null);
  const [selectedCanal, setSelectedCanal] = useState<PaymentCanal>("BOLD");
  const [processing, setProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState("");

  const isApproved = status === "APPROVED";
  const canProceed = !config.requirePayment || isApproved;

  /** Create a payment intent on the backend */
  const createIntent = useCallback(async (canal: PaymentCanal) => {
    setError("");
    setProcessing(true);
    try {
      const resp = await fetch(buildUrl("/api/payments/create-intent"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numeroReserva, monto, canal, descripcion }),
      });
      const json = await resp.json();
      if (!json.ok) throw new Error(json.message || "Error creando intención de pago");

      setIntent(json.payment);
      if (json.checkoutUrl) setCheckoutUrl(json.checkoutUrl);
      return json;
    } catch (err: any) {
      setError(err.message || "Error de conexión");
      return null;
    } finally {
      setProcessing(false);
    }
  }, [numeroReserva, monto, descripcion]);

  /** Confirm a payment (mock or real) */
  const confirmPayment = useCallback(async (paymentId?: number) => {
    const id = paymentId || intent?.id;
    if (!id) { setError("No hay intención de pago"); return null; }

    setError("");
    setProcessing(true);
    setStatus("PROCESSING");
    try {
      const resp = await fetch(buildUrl("/api/payments/confirm"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: id }),
      });
      const json = await resp.json();
      if (!json.ok) throw new Error(json.message || "Error confirmando pago");

      setIntent(json.payment);
      setStatus("APPROVED");
      return json;
    } catch (err: any) {
      setStatus("PENDING");
      setError(err.message || "Error confirmando");
      return null;
    } finally {
      setProcessing(false);
    }
  }, [intent]);

  /** Check payment status */
  const checkStatus = useCallback(async (paymentId?: number) => {
    const id = paymentId || intent?.id;
    if (!id) return;

    try {
      const resp = await fetch(buildUrl(`/api/payments/status/${id}`));
      const json = await resp.json();
      if (json.ok && json.payment) {
        setIntent(json.payment);
        if (json.payment.estado === "APPROVED") setStatus("APPROVED");
      }
    } catch { /* silent */ }
  }, [intent]);

  /** Open Bold payment flow */
  const openBoldPayment = useCallback(async () => {
    setError("");
    setSelectedCanal("BOLD");

    if (!config.enabled) {
      setError("La pasarela aún no está habilitada.");
      return;
    }

    if (config.mockMode) {
      const result = await createIntent("BOLD");
      if (result) setShowModal(true);
      return;
    }

    const result = await createIntent("BOLD");
    if (!result) return;

    if (result.checkoutUrl) {
      setStatus("REDIRECTED");
      window.open(result.checkoutUrl, "_blank", "noopener,noreferrer");
    } else {
      setError("No se pudo generar el enlace de pago.");
    }
  }, [config, createIntent]);

  /** Mock flow: confirm demo payment */
  const confirmMockPayment = useCallback(async () => {
    setProcessing(true);
    setStatus("PROCESSING");
    await new Promise((r) => setTimeout(r, 1500));
    await confirmPayment();
    setShowModal(false);
  }, [confirmPayment]);

  /** Mark as pending confirmation */
  const markPending = useCallback(() => {
    setShowModal(false);
    setStatus("REDIRECTED");
  }, []);

  /** Reset payment state */
  const reset = useCallback(() => {
    setStatus("PENDING");
    setIntent(null);
    setError("");
    setCheckoutUrl("");
  }, []);

  return {
    config,
    status,
    error,
    intent,
    selectedCanal,
    setSelectedCanal,
    processing,
    showModal,
    setShowModal,
    checkoutUrl,
    isApproved,
    canProceed,

    openBoldPayment,
    confirmMockPayment,
    markPending,
    createIntent,
    confirmPayment,
    checkStatus,
    reset,
  };
}
