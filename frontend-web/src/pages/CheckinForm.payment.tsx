import { useMemo, useRef, useState } from "react";
import type { PaymentConfig, PaymentStatus, PaymentCanal, PaymentIntent } from "./CheckinForm.payment.types";
import {
  type PaymentMethodId,
  type ExtendedPaymentStatus,
  type ManualPaymentInfo,
  type PaymentCalc,
  getPaymentMethods,
  calcPaymentAmount,
  DEFAULT_MANUAL_INFO,
} from "./CheckinForm.payment.config";

/* ── SVG Icons ── */
function WalletIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="6" width="16" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M15 12H18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="15" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}
function CashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 9V9.01M18 15V15.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function LinkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M14 5H19V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 14L19 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M19 14V18C19 18.55 18.55 19 18 19H6C5.45 19 5 18.55 5 18V6C5 5.45 5.45 5 6 5H10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function TerminalIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 7H15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="9" y="11" width="2" height="2" rx="0.5" fill="currentColor" />
      <rect x="13" y="11" width="2" height="2" rx="0.5" fill="currentColor" />
      <rect x="9" y="15" width="2" height="2" rx="0.5" fill="currentColor" />
      <rect x="13" y="15" width="2" height="2" rx="0.5" fill="currentColor" />
    </svg>
  );
}
function CheckCircleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8.7 12.3L10.8 14.4L15.5 9.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function UploadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 16V4M12 4L8 8M12 4L16 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 17V19C4 19.55 4.45 20 5 20H19C19.55 20 20 19.55 20 19V17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

const ICON_MAP: Record<string, React.ReactNode> = {
  wallet: <WalletIcon />,
  cash: <CashIcon />,
  link: <LinkIcon />,
  terminal: <TerminalIcon />,
};

/* ── Helpers ── */
function formatCOP(value: number) {
  try {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);
  } catch { return `$${value}`; }
}

/* ── Method Card ── */
function MethodCard({
  method,
  selected,
  onSelect,
}: {
  method: ReturnType<typeof getPaymentMethods>[0];
  selected: boolean;
  onSelect: (id: PaymentMethodId) => void;
}) {
  const isActive = method.enabled && !method.comingSoon;
  return (
    <button
      type="button"
      onClick={() => isActive && onSelect(method.id)}
      disabled={!isActive}
      style={{
        flex: 1,
        minWidth: 130,
        background: selected ? "rgba(37,99,235,0.18)" : "rgba(255,255,255,0.04)",
        border: selected ? "2px solid #3b82f6" : "1px solid rgba(255,255,255,0.10)",
        borderRadius: "0.85rem",
        padding: "0.9rem 0.7rem",
        cursor: isActive ? "pointer" : "not-allowed",
        opacity: isActive ? 1 : 0.45,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.45rem",
        color: "white",
        position: "relative",
        transition: "border-color 0.2s, background 0.2s",
      }}
    >
      <span style={{ color: selected ? "#60a5fa" : "#94a3b8" }}>{ICON_MAP[method.iconType]}</span>
      <span style={{ fontWeight: 800, fontSize: "0.88rem" }}>{method.label}</span>
      <span style={{ fontSize: "0.76rem", color: "#94a3b8" }}>{method.sublabel}</span>
      {method.comingSoon && (
        <span style={{
          position: "absolute", top: 6, right: 6,
          background: "rgba(245,158,11,0.20)", color: "#fbbf24",
          fontSize: "0.68rem", fontWeight: 800, padding: "2px 8px",
          borderRadius: 999, border: "1px solid rgba(245,158,11,0.30)",
        }}>
          Próximamente
        </span>
      )}
      {method.surchargeRate > 0 && !method.comingSoon && (
        <span style={{
          position: "absolute", bottom: 6, right: 6,
          fontSize: "0.66rem", color: "#fbbf24", fontWeight: 700,
        }}>
          +{Math.round(method.surchargeRate * 100)}%
        </span>
      )}
    </button>
  );
}

/* ── Manual Payment Instructions ── */
function ManualInstructions({
  info,
  proofFile,
  onProofChange,
  reference,
  onReferenceChange,
}: {
  info: ManualPaymentInfo;
  proofFile: File | null;
  onProofChange: (f: File | null) => void;
  reference: string;
  onReferenceChange: (v: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "0.9rem",
      padding: "1rem",
      display: "flex", flexDirection: "column", gap: "0.75rem",
    }}>
      <div style={{ color: "#93c5fd", fontWeight: 800, fontSize: "0.84rem", textTransform: "uppercase", letterSpacing: "0.03em" }}>
        Instrucciones de pago
      </div>
      <div style={{ color: "#cbd5e1", fontSize: "0.88rem", lineHeight: 1.5 }}>
        {info.instructionsText}
      </div>

      {/* Datos de transferencia */}
      <div style={{
        background: "rgba(0,0,0,0.25)", borderRadius: "0.75rem", padding: "0.85rem",
        border: "1px solid rgba(255,255,255,0.06)", display: "grid", gap: "0.5rem",
        fontSize: "0.85rem",
      }}>
        <InfoRow label="Nequi" value={info.nequiNumber} />
        <InfoRow label="Daviplata" value={info.daviplataNumber} />
        <InfoRow label="Llave" value={info.keyLabel} />
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "0.25rem 0" }} />
        <InfoRow label="Banco" value={info.bankName} />
        <InfoRow label="Tipo cuenta" value={info.accountType} />
        <InfoRow label="Cuenta" value={info.accountNumber} />
        <InfoRow label="Titular" value={info.beneficiaryName} />
        <InfoRow label="Documento" value={info.beneficiaryDocument} />
      </div>

      {/* Referencia */}
      <div>
        <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: 4 }}>
          Referencia / Observación (opcional)
        </label>
        <input
          type="text"
          value={reference}
          onChange={(e) => onReferenceChange(e.target.value)}
          placeholder="Ej: nombre del titular"
          style={{
            width: "100%", boxSizing: "border-box",
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "0.65rem", padding: "0.7rem 0.85rem",
            color: "white", fontSize: "0.88rem",
          }}
        />
      </div>

      {/* Comprobante */}
      <div>
        <label style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block", marginBottom: 4 }}>
          Comprobante de pago (imagen o PDF)
        </label>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          style={{
            width: "100%",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.55rem",
            background: proofFile ? "rgba(16,185,129,0.15)" : "linear-gradient(135deg, #1e293b, #334155)",
            border: proofFile ? "1px solid rgba(16,185,129,0.30)" : "1px solid rgba(255,255,255,0.10)",
            borderRadius: "0.75rem", padding: "0.8rem",
            color: proofFile ? "#34d399" : "white",
            cursor: "pointer", fontWeight: 700, fontSize: "0.88rem",
          }}
        >
          {proofFile ? (
            <>
              <CheckCircleIcon />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>
                {proofFile.name}
              </span>
            </>
          ) : (
            <>
              <UploadIcon />
              Subir comprobante
            </>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => {
            const f = e.target.files?.[0] || null;
            onProofChange(f);
            e.target.value = "";
          }}
          style={{ display: "none" }}
        />
      </div>
    </div>
  );
}

/* ── Cash Instructions ── */
function CashInstructions() {
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "0.9rem", padding: "1rem",
      display: "flex", flexDirection: "column", gap: "0.6rem",
    }}>
      <div style={{ color: "#93c5fd", fontWeight: 800, fontSize: "0.84rem", textTransform: "uppercase", letterSpacing: "0.03em" }}>
        Pago en efectivo
      </div>
      <div style={{ color: "#cbd5e1", fontSize: "0.88rem", lineHeight: 1.5 }}>
        El pago se realizará al momento del check-in en la recepción del hostal.
        No se requiere comprobante previo.
      </div>
      <div style={{
        background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.25)",
        borderRadius: "0.75rem", padding: "0.75rem 0.85rem",
        color: "#86efac", fontSize: "0.85rem", fontWeight: 700,
      }}>
        ✓ Tu registro quedará como pendiente de pago presencial
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
      <span style={{ color: "#94a3b8" }}>{label}</span>
      <strong style={{ color: "white", textAlign: "right" }}>{value}</strong>
    </div>
  );
}

function SummaryRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
      <span style={{ color: "#cbd5e1" }}>{label}</span>
      <strong style={{ color: highlight ? "#10b981" : "white", fontSize: highlight ? "1.25rem" : undefined }}>{value}</strong>
    </div>
  );
}

/* ── Props ── */
export type ManualPaymentData = {
  methodId: PaymentMethodId;
  status: ExtendedPaymentStatus;
  proofFile: File | null;
  reference: string;
  calc: PaymentCalc;
};

type PaymentStepProps = {
  config: PaymentConfig;
  status: PaymentStatus;
  error: string;
  intent: PaymentIntent | null;
  selectedCanal: PaymentCanal;
  processing: boolean;
  amount: number;
  balance?: number;
  total?: number;
  description: string;
  isMobile: boolean;
  onSelectCanal: (c: PaymentCanal) => void;
  onPayBold: () => void;
  onReset: () => void;
  /* New: manual payment data */
  onManualConfirm?: (data: ManualPaymentData) => void;
};

/* ── Main Component ── */
export function PaymentStep({
  config,
  status,
  error,
  intent: _intent,
  processing: _processing,
  amount: _amount,
  balance,
  total,
  description,
  isMobile,
  onReset: _onReset,
  onManualConfirm,
}: PaymentStepProps) {
  const methods = useMemo(() => getPaymentMethods(), []);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodId>("NEQUI_DAVIPLATA");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [reference, setReference] = useState("");
  const [manualStatus, setManualStatus] = useState<ExtendedPaymentStatus | null>(null);

  const calc = useMemo(
    () => calcPaymentAmount(balance, total, selectedMethod),
    [balance, total, selectedMethod]
  );

  const currentMethod = methods.find((m) => m.id === selectedMethod)!;
  const showManualInstructions = selectedMethod === "NEQUI_DAVIPLATA" && currentMethod.enabled;
  const showCashInstructions = selectedMethod === "EFECTIVO" && currentMethod.enabled;

  const effectiveStatus = manualStatus || (status === "APPROVED" ? "APPROVED" : "PENDING");

  const statusLabel = useMemo(() => {
    if (effectiveStatus === "APPROVED") return "Pago confirmado";
    if (effectiveStatus === "PROOF_UPLOADED") return "Comprobante enviado";
    if (effectiveStatus === "PAY_AT_PROPERTY") return "Pago presencial";
    if (effectiveStatus === "PENDING_MANUAL_VALIDATION") return "Pendiente validación";
    if (effectiveStatus === "PROCESSING") return "Procesando";
    return "Pendiente";
  }, [effectiveStatus]);

  const statusColor = useMemo(() => {
    if (effectiveStatus === "APPROVED") return "#10b981";
    if (effectiveStatus === "PROOF_UPLOADED" || effectiveStatus === "PENDING_MANUAL_VALIDATION") return "#f59e0b";
    if (effectiveStatus === "PAY_AT_PROPERTY") return "#38bdf8";
    return "#ef4444";
  }, [effectiveStatus]);

  const handleManualConfirm = () => {
    let newStatus: ExtendedPaymentStatus;
    if (selectedMethod === "NEQUI_DAVIPLATA") {
      newStatus = proofFile ? "PROOF_UPLOADED" : "PENDING_MANUAL_VALIDATION";
    } else if (selectedMethod === "EFECTIVO") {
      newStatus = "PAY_AT_PROPERTY";
    } else {
      newStatus = "PENDING";
    }
    setManualStatus(newStatus);
    onManualConfirm?.({ methodId: selectedMethod, status: newStatus, proofFile, reference, calc });
  };

  const canConfirmManual =
    currentMethod.enabled &&
    !currentMethod.comingSoon &&
    (selectedMethod === "EFECTIVO" || selectedMethod === "NEQUI_DAVIPLATA");

  return (
    <div
      style={{
        marginTop: "1.5rem",
        background: "linear-gradient(135deg, rgba(14,165,233,0.12), rgba(37,99,235,0.14), rgba(124,58,237,0.12))",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: "1rem",
        padding: isMobile ? "1rem" : "1.1rem",
        boxShadow: "0 16px 40px rgba(0,0,0,0.20)",
      }}
    >
      {/* Header */}
      <div style={{
        display: "flex", flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "flex-start" : "center", gap: "0.9rem", marginBottom: "1rem",
      }}>
        <div style={{
          minWidth: 64, height: 56, borderRadius: 16, padding: "0 16px",
          background: "linear-gradient(135deg, #111827, #1f2937)",
          border: "1px solid rgba(255,255,255,0.10)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          color: "white", fontWeight: 900, fontSize: "1rem", letterSpacing: "0.08em",
          boxShadow: "0 14px 30px rgba(0,0,0,0.24)",
        }}>
          PAGOS
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: "white", fontWeight: 900, fontSize: "1rem", marginBottom: "0.2rem" }}>
            {config.publicLabel}
          </div>
          <div style={{ color: "#cbd5e1", fontSize: "0.88rem", lineHeight: 1.45 }}>
            Selecciona tu método de pago preferido.
          </div>
        </div>
        <div style={{
          padding: "0.45rem 0.8rem", borderRadius: 999,
          background: `${statusColor}22`, border: `1px solid ${statusColor}66`,
          color: statusColor, fontWeight: 800, fontSize: "0.84rem", whiteSpace: "nowrap",
        }}>
          {statusLabel}
        </div>
      </div>

      {/* Method selector */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
        gap: "0.65rem", marginBottom: "1rem",
      }}>
        {methods.map((m) => (
          <MethodCard
            key={m.id}
            method={m}
            selected={selectedMethod === m.id}
            onSelect={setSelectedMethod}
          />
        ))}
      </div>

      {/* Content grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1.1fr 0.9fr",
        gap: "1rem",
      }}>
        {/* Summary */}
        <div style={{
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "0.9rem", padding: "1rem",
        }}>
          <div style={{
            color: "#93c5fd", fontWeight: 800, fontSize: "0.84rem",
            letterSpacing: "0.03em", textTransform: "uppercase", marginBottom: "0.75rem",
          }}>
            Resumen del cobro
          </div>
          <div style={{ display: "grid", gap: "0.7rem", color: "white" }}>
            <SummaryRow label="Comercio" value={config.businessName} />
            <SummaryRow label="Concepto" value={description} />
            <SummaryRow label="Moneda" value="COP" />
            <SummaryRow label="Monto base" value={formatCOP(calc.montoBase)} />
            {calc.tieneRecargo && (
              <SummaryRow label={`Recargo (${Math.round(currentMethod.surchargeRate * 100)}%)`} value={formatCOP(calc.recargo)} />
            )}
            {!calc.tieneRecargo && (
              <SummaryRow label="Recargo" value="$0" />
            )}
            <div style={{
              display: "flex", justifyContent: "space-between", gap: "1rem",
              alignItems: "center", paddingTop: "0.35rem",
              borderTop: "1px solid rgba(255,255,255,0.08)",
            }}>
              <span style={{ color: "#cbd5e1" }}>Total a pagar</span>
              <strong style={{ fontSize: "1.25rem", color: "#10b981" }}>{formatCOP(calc.montoFinal)}</strong>
            </div>
          </div>
        </div>

        {/* Right panel: instructions based on method */}
        {showManualInstructions && (
          <ManualInstructions
            info={DEFAULT_MANUAL_INFO}
            proofFile={proofFile}
            onProofChange={setProofFile}
            reference={reference}
            onReferenceChange={setReference}
          />
        )}

        {showCashInstructions && <CashInstructions />}

        {!showManualInstructions && !showCashInstructions && (
          <div style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "0.9rem", padding: "1rem",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: "0.6rem", color: "#94a3b8", textAlign: "center",
          }}>
            <span style={{ fontSize: "2rem" }}>🚧</span>
            <span style={{ fontWeight: 700 }}>Este método estará disponible próximamente</span>
            <span style={{ fontSize: "0.85rem" }}>Selecciona Nequi/Daviplata o Efectivo para continuar.</span>
          </div>
        )}
      </div>

      {/* Confirm manual payment button */}
      {canConfirmManual && !manualStatus && (
        <button
          type="button"
          onClick={handleManualConfirm}
          style={{
            width: "100%", marginTop: "1rem",
            background: "linear-gradient(135deg, #0ea5e9, #2563eb, #7c3aed)",
            border: "none", color: "white", borderRadius: "0.75rem",
            padding: "0.95rem 1rem", cursor: "pointer",
            fontWeight: 900, fontSize: "0.96rem",
            boxShadow: "0 14px 30px rgba(37,99,235,0.25)",
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.55rem",
          }}
        >
          {selectedMethod === "EFECTIVO" ? "Confirmar pago presencial" : proofFile ? "Enviar comprobante" : "Confirmar sin comprobante"}
        </button>
      )}

      {/* Success state */}
      {manualStatus && (
        <div style={{
          marginTop: "1rem", padding: "0.85rem 1rem",
          background: manualStatus === "PROOF_UPLOADED" ? "rgba(16,185,129,0.12)" : "rgba(56,189,248,0.12)",
          border: `1px solid ${manualStatus === "PROOF_UPLOADED" ? "rgba(16,185,129,0.30)" : "rgba(56,189,248,0.30)"}`,
          borderRadius: "0.85rem",
          display: "flex", alignItems: "center", gap: "0.7rem",
          color: manualStatus === "PROOF_UPLOADED" ? "#86efac" : "#7dd3fc",
          fontWeight: 800, fontSize: "0.9rem",
        }}>
          <CheckCircleIcon />
          {manualStatus === "PROOF_UPLOADED" && "Comprobante enviado — pendiente de validación"}
          {manualStatus === "PAY_AT_PROPERTY" && "Registrado — pago presencial al llegar"}
          {manualStatus === "PENDING_MANUAL_VALIDATION" && "Registrado — pendiente de validación manual"}
        </div>
      )}

      {error && (
        <div style={{ marginTop: "0.9rem", color: "#fca5a5", fontSize: "0.9rem" }}>{error}</div>
      )}
    </div>
  );
}

/* ── Payment Demo Modal (kept for backward compat) ── */
export function PaymentDemoModal({
  show,
  processing,
  config,
  amount,
  description,
  selectedCanal: _selectedCanal,
  isMobile,
  onCancel,
  onPending,
  onConfirm,
}: {
  show: boolean;
  processing: boolean;
  config: PaymentConfig;
  amount: number;
  description: string;
  selectedCanal: PaymentCanal;
  isMobile: boolean;
  onCancel: () => void;
  onPending: () => void;
  onConfirm: () => void;
}) {
  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 100000, padding: isMobile ? "0.8rem" : "1rem",
      }}
      onClick={() => { if (!processing) onCancel(); }}
    >
      <div
        style={{
          width: "100%", maxWidth: 560, background: "#0f172a", color: "white",
          borderRadius: "1rem", padding: isMobile ? "1rem" : "1.25rem",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.40)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", marginBottom: "1rem" }}>
          <div style={{
            minWidth: 64, height: 56, borderRadius: 16, padding: "0 16px",
            background: "linear-gradient(135deg, #111827, #1f2937)",
            border: "1px solid rgba(255,255,255,0.10)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            color: "white", fontWeight: 900, fontSize: "1rem", letterSpacing: "0.08em",
          }}>
            DEMO
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: "1.05rem" }}>Checkout Demo</div>
            <div style={{ color: "#cbd5e1", fontSize: "0.88rem" }}>Simulación visual — sin cobro real</div>
          </div>
        </div>

        <div style={{
          marginBottom: "1rem", background: "rgba(245,158,11,0.12)",
          border: "1px solid rgba(245,158,11,0.28)", color: "#fde68a",
          borderRadius: "0.85rem", padding: "0.9rem", lineHeight: 1.5, fontSize: "0.9rem",
        }}>
          Modo demostración activo. No se genera un cobro real.
        </div>

        <div style={{
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "0.85rem", padding: "1rem", display: "grid", gap: "0.7rem", marginBottom: "1rem",
        }}>
          <SummaryRow label="Comercio" value={config.businessName} />
          <SummaryRow label="Concepto" value={description} />
          <div style={{
            display: "flex", justifyContent: "space-between", gap: 12,
            paddingTop: "0.55rem", borderTop: "1px solid rgba(255,255,255,0.08)",
          }}>
            <span style={{ color: "#cbd5e1" }}>Total</span>
            <strong style={{ color: "#10b981", fontSize: "1.2rem" }}>{formatCOP(amount)}</strong>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "0.75rem" }}>
          <button type="button" onClick={onCancel} disabled={processing}
            style={{
              flex: 1, background: "transparent", border: "1px solid rgba(255,255,255,0.16)",
              color: "white", borderRadius: "0.75rem", padding: "0.9rem 1rem",
              cursor: processing ? "not-allowed" : "pointer", fontWeight: 800,
            }}>
            Cancelar
          </button>
          <button type="button" onClick={onPending} disabled={processing}
            style={{
              flex: 1, background: "#1d4ed8", border: "none", color: "white",
              borderRadius: "0.75rem", padding: "0.9rem 1rem",
              cursor: processing ? "not-allowed" : "pointer", fontWeight: 900,
            }}>
            Dejar pendiente
          </button>
          <button type="button" onClick={onConfirm} disabled={processing}
            style={{
              flex: 1, background: "linear-gradient(135deg, #0ea5e9, #2563eb, #7c3aed)",
              border: "none", color: "white", borderRadius: "0.75rem", padding: "0.9rem 1rem",
              cursor: processing ? "not-allowed" : "pointer", fontWeight: 900,
              boxShadow: "0 14px 30px rgba(37,99,235,0.25)",
            }}>
            {processing ? "Procesando..." : "Aprobar demo"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Full-Screen Payment Gate Modal ── */
export function PaymentGateModal({
  config,
  status,
  error,
  intent,
  selectedCanal,
  processing,
  amount,
  balance,
  total,
  description,
  isMobile,
  onSelectCanal,
  onPayBold,
  onReset,
  onSkip,
  requirePayment,
  onManualConfirm,
}: PaymentStepProps & { onSkip: () => void; requirePayment: boolean }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "linear-gradient(135deg, #0b1120 0%, #111827 40%, #0f172a 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: isMobile ? "1rem" : "2rem",
        overflow: "auto",
      }}
    >
      <div style={{ width: "100%", maxWidth: 780, animation: "fadeInUp 0.5s ease-out" }}>
        <PaymentStep
          config={config}
          status={status}
          error={error}
          intent={intent}
          selectedCanal={selectedCanal}
          processing={processing}
          amount={amount}
          balance={balance}
          total={total}
          description={description}
          isMobile={isMobile}
          onSelectCanal={onSelectCanal}
          onPayBold={onPayBold}
          onReset={onReset}
          onManualConfirm={onManualConfirm}
        />

        {/* Action buttons below payment step */}
        <div style={{
          marginTop: "1.2rem",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: "0.75rem",
          justifyContent: "center",
        }}>
          {status === "APPROVED" && (
            <button
              type="button"
              onClick={onSkip}
              style={{
                flex: isMobile ? undefined : "0 0 auto",
                width: isMobile ? "100%" : undefined,
                background: "linear-gradient(135deg, #059669, #10b981)",
                border: "none",
                color: "white",
                borderRadius: "0.75rem",
                padding: "1rem 2.5rem",
                cursor: "pointer",
                fontWeight: 900,
                fontSize: "1.05rem",
                boxShadow: "0 14px 30px rgba(16,185,129,0.30)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.6rem",
              }}
            >
              <CheckCircleIcon /> Continuar al registro
            </button>
          )}

          {!requirePayment && status !== "APPROVED" && (
            <button
              type="button"
              onClick={onSkip}
              style={{
                flex: isMobile ? undefined : "0 0 auto",
                width: isMobile ? "100%" : undefined,
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.18)",
                color: "#94a3b8",
                borderRadius: "0.75rem",
                padding: "0.9rem 2rem",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "0.95rem",
              }}
            >
              Saltar pago y continuar al registro →
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
