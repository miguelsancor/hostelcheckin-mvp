import { useMemo } from "react";
import type { PaymentConfig, PaymentStatus, PaymentCanal, PaymentIntent } from "./CheckinForm.payment.types";

/* ── SVG Icons ── */
function CardPayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 9H21" stroke="currentColor" strokeWidth="1.8" />
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

function LockSecureIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 10V8a5 5 0 0 1 10 0v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="15" r="1.2" fill="currentColor" />
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

function AlertTriangleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 4L20 18H4L12 4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
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

/* ── Helpers ── */
function formatCOP(value: number) {
  try {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);
  } catch { return `$${value}`; }
}

/* ── Channel Card ── */
function ChannelCard({
  canal,
  label,
  sublabel,
  icon,
  enabled,
  selected,
  comingSoon,
  onSelect,
}: {
  canal: PaymentCanal;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  enabled: boolean;
  selected: boolean;
  comingSoon: boolean;
  onSelect: (c: PaymentCanal) => void;
}) {
  const isActive = enabled && !comingSoon;
  return (
    <button
      type="button"
      onClick={() => isActive && onSelect(canal)}
      disabled={!isActive}
      style={{
        flex: 1,
        minWidth: 120,
        background: selected ? "rgba(37,99,235,0.18)" : "rgba(255,255,255,0.04)",
        border: selected ? "2px solid #3b82f6" : "1px solid rgba(255,255,255,0.10)",
        borderRadius: "0.85rem",
        padding: "0.9rem 0.7rem",
        cursor: isActive ? "pointer" : "not-allowed",
        opacity: isActive ? 1 : 0.5,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.45rem",
        color: "white",
        position: "relative",
        transition: "border-color 0.2s, background 0.2s",
      }}
    >
      <span style={{ color: selected ? "#60a5fa" : "#94a3b8" }}>{icon}</span>
      <span style={{ fontWeight: 800, fontSize: "0.88rem" }}>{label}</span>
      <span style={{ fontSize: "0.76rem", color: "#94a3b8" }}>{sublabel}</span>
      {comingSoon && (
        <span style={{
          position: "absolute", top: 6, right: 6,
          background: "rgba(245,158,11,0.20)", color: "#fbbf24",
          fontSize: "0.68rem", fontWeight: 800, padding: "2px 8px",
          borderRadius: 999, border: "1px solid rgba(245,158,11,0.30)",
        }}>
          Próximamente
        </span>
      )}
    </button>
  );
}

/* ── Props ── */
type PaymentStepProps = {
  config: PaymentConfig;
  status: PaymentStatus;
  error: string;
  intent: PaymentIntent | null;
  selectedCanal: PaymentCanal;
  processing: boolean;
  amount: number;
  description: string;
  isMobile: boolean;
  onSelectCanal: (c: PaymentCanal) => void;
  onPayBold: () => void;
  onReset: () => void;
};

/* ── Main Component ── */
export function PaymentStep({
  config,
  status,
  error,
  intent,
  selectedCanal,
  processing,
  amount,
  description,
  isMobile,
  onSelectCanal,
  onPayBold,
  onReset,
}: PaymentStepProps) {
  const statusLabel = useMemo(() => {
    if (status === "APPROVED") return "Pago confirmado";
    if (status === "PROCESSING") return "Procesando";
    if (status === "REDIRECTED") return "Pendiente de confirmación";
    return "Pendiente";
  }, [status]);

  const statusColor = useMemo(() => {
    if (status === "APPROVED") return "#10b981";
    if (status === "PROCESSING") return "#f59e0b";
    if (status === "REDIRECTED") return "#38bdf8";
    return "#ef4444";
  }, [status]);

  const helperText = useMemo(() => {
    if (!config.enabled) return "La integración de pago se encuentra en preparación. El flujo de registro sigue operando normalmente.";
    if (config.mockMode) return "Modo demo activo. No se realizan cobros reales.";
    if (status === "APPROVED") return "Pago confirmado exitosamente.";
    if (status === "REDIRECTED") return "Esperando confirmación del proveedor de pago.";
    return "Selecciona un canal de pago para continuar.";
  }, [config, status]);

  const payButtonLabel = useMemo(() => {
    if (!config.enabled) return "Próximamente";
    if (status === "APPROVED") return "Pago confirmado";
    if (selectedCanal === "BOLD" && config.mockMode) return "Probar flujo demo";
    if (selectedCanal === "BOLD") return "Pagar con Bold";
    if (selectedCanal === "BILLETERO") return "Pagar con Billetero";
    if (selectedCanal === "DATAFONO") return "Pagar con Datáfono";
    return "Pagar";
  }, [config, status, selectedCanal]);

  const canClickPay = config.enabled && status !== "APPROVED" && !processing;

  const showBlock = config.enabled || config.channels.bold.enabled || config.channels.billetero.enabled || config.channels.datafono.enabled;
  if (!showBlock) return null;

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

      {/* Info banner */}
      <div style={{
        marginBottom: "1rem",
        background: !config.enabled || config.mockMode ? "rgba(245,158,11,0.10)" : "rgba(59,130,246,0.10)",
        border: !config.enabled || config.mockMode ? "1px solid rgba(245,158,11,0.30)" : "1px solid rgba(59,130,246,0.26)",
        color: !config.enabled || config.mockMode ? "#fde68a" : "#dbeafe",
        borderRadius: "0.9rem", padding: "0.9rem 1rem",
        display: "flex", alignItems: "flex-start", gap: "0.7rem",
        lineHeight: 1.5, fontSize: "0.92rem",
      }}>
        <span style={{ marginTop: 2, display: "inline-flex" }}><AlertTriangleIcon /></span>
        <div>
          <strong style={{ display: "block", marginBottom: 4 }}>
            {!config.enabled ? "Pasarela en preparación" : config.mockMode ? "Modo demostración" : "Flujo conectado"}
          </strong>
          <span>{helperText}</span>
        </div>
      </div>

      {/* Channel selector */}
      <div style={{
        display: "flex", flexDirection: isMobile ? "column" : "row",
        gap: "0.65rem", marginBottom: "1rem",
      }}>
        <ChannelCard
          canal="BOLD"
          label="Bold"
          sublabel="Tarjetas / PSE / Nequi"
          icon={<CardPayIcon />}
          enabled={config.channels.bold.enabled}
          selected={selectedCanal === "BOLD"}
          comingSoon={false}
          onSelect={onSelectCanal}
        />
        <ChannelCard
          canal="BILLETERO"
          label="Billetero"
          sublabel="Transferencia / QR"
          icon={<WalletPayIcon />}
          enabled={config.channels.billetero.enabled}
          selected={selectedCanal === "BILLETERO"}
          comingSoon={!config.channels.billetero.enabled}
          onSelect={onSelectCanal}
        />
        <ChannelCard
          canal="DATAFONO"
          label="Datáfono"
          sublabel="Pago presencial"
          icon={<TerminalIcon />}
          enabled={config.channels.datafono.enabled}
          selected={selectedCanal === "DATAFONO"}
          comingSoon={!config.channels.datafono.enabled}
          onSelect={onSelectCanal}
        />
      </div>

      {/* Payment details grid */}
      <div style={{
        display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.1fr 0.9fr", gap: "1rem",
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
            <SummaryRow label="Canal" value={selectedCanal} />
            <SummaryRow label="Concepto" value={description} align="right" />
            <SummaryRow label="Moneda" value="COP" />
            <div style={{
              display: "flex", justifyContent: "space-between", gap: "1rem",
              alignItems: "center", paddingTop: "0.35rem",
              borderTop: "1px solid rgba(255,255,255,0.08)",
            }}>
              <span style={{ color: "#cbd5e1" }}>Total a pagar</span>
              <strong style={{ fontSize: "1.25rem", color: "#10b981" }}>{formatCOP(amount)}</strong>
            </div>
          </div>
        </div>

        {/* Action panel */}
        <div style={{
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "0.9rem", padding: "1rem",
          display: "flex", flexDirection: "column", gap: "0.8rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", color: "white", fontWeight: 800 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 28, height: 28, borderRadius: 999,
              background: "rgba(255,255,255,0.08)", color: "#93c5fd",
            }}>
              <LockSecureIcon />
            </span>
            Pago seguro
          </div>

          <div style={{ color: "#cbd5e1", fontSize: "0.9rem", lineHeight: 1.45 }}>
            Tu pago se procesa de forma segura. Este formulario no almacena datos de tarjeta.
          </div>

          {/* Ref / status */}
          <div style={{
            borderRadius: "0.75rem", background: "rgba(0,0,0,0.2)",
            padding: "0.8rem", border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{ color: "#94a3b8", fontSize: "0.82rem", marginBottom: 6 }}>Referencia</div>
            <div style={{ color: "white", fontWeight: 800 }}>
              {intent?.referencia || "Aún no generada"}
            </div>
            <div style={{ color: "#94a3b8", fontSize: "0.82rem", marginTop: "0.8rem", marginBottom: 6 }}>Estado</div>
            <div style={{ color: statusColor, fontWeight: 700 }}>{statusLabel}</div>
          </div>

          {/* Pay button */}
          <button
            type="button"
            onClick={onPayBold}
            disabled={!canClickPay}
            style={{
              width: "100%",
              background: !canClickPay
                ? (status === "APPROVED" ? "#065f46" : "#475569")
                : "linear-gradient(135deg, #0ea5e9, #2563eb, #7c3aed)",
              border: "none", color: "white", borderRadius: "0.75rem",
              padding: "0.95rem 1rem",
              cursor: canClickPay ? "pointer" : "not-allowed",
              fontWeight: 900, fontSize: "0.96rem",
              opacity: canClickPay ? 1 : 0.9,
              boxShadow: canClickPay ? "0 14px 30px rgba(37,99,235,0.25)" : "none",
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.55rem",
            }}
          >
            <span>{processing ? "Procesando..." : payButtonLabel}</span>
            {canClickPay && <ExternalArrowIcon />}
          </button>

          {status === "APPROVED" && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", color: "#86efac", fontWeight: 800, fontSize: "0.9rem" }}>
              <CheckCircleIcon /> Pago confirmado
            </div>
          )}

          {(config.mockMode || status === "APPROVED" || status === "REDIRECTED") && config.enabled && (
            <button
              type="button"
              onClick={onReset}
              style={{
                width: "100%", background: "transparent",
                border: "1px solid rgba(255,255,255,0.16)",
                color: "white", borderRadius: "0.75rem",
                padding: "0.8rem 1rem", cursor: "pointer", fontWeight: 800,
              }}
            >
              Reiniciar estado de pago
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ marginTop: "0.9rem", color: "#fca5a5", fontSize: "0.9rem" }}>{error}</div>
      )}
    </div>
  );
}

/* ── Summary Row ── */
function SummaryRow({ label, value, align }: { label: string; value: string; align?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
      <span style={{ color: "#cbd5e1" }}>{label}</span>
      <strong style={{ textAlign: (align as any) || "left" }}>{value}</strong>
    </div>
  );
}

/* ── Payment Demo Modal ── */
export function PaymentDemoModal({
  show,
  processing,
  config,
  amount,
  description,
  selectedCanal,
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
            {selectedCanal}
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
          <SummaryRow label="Concepto" value={description} align="right" />
          <SummaryRow label="Canal" value={selectedCanal} />
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
