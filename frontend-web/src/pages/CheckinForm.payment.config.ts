/**
 * Configuración centralizada del módulo de pagos.
 * Métodos, datos bancarios, lógica de recargo y cálculo de monto.
 */

/* ── Tipos de método de pago ── */
export type PaymentMethodId = "NEQUI_DAVIPLATA" | "EFECTIVO" | "LINK_PAGO" | "DATAFONO";

export type ExtendedPaymentStatus =
  | "PENDING"
  | "PENDING_MANUAL_VALIDATION"
  | "PAY_AT_PROPERTY"
  | "PROOF_UPLOADED"
  | "APPROVED"
  | "REJECTED"
  | "PROCESSING"
  | "REDIRECTED";

export interface PaymentMethodDef {
  id: PaymentMethodId;
  label: string;
  sublabel: string;
  enabled: boolean;
  comingSoon: boolean;
  /** El recargo se aplica solo a este método */
  surchargeRate: number;
  /** Requiere comprobante */
  requiresProof: boolean;
  /** Icono identificador */
  iconType: "wallet" | "cash" | "link" | "terminal";
}

/* ── Datos bancarios / transferencia (configurables) ── */
export interface ManualPaymentInfo {
  bankName: string;
  accountType: string;
  accountNumber: string;
  beneficiaryName: string;
  beneficiaryDocument: string;
  nequiNumber: string;
  daviplataNumber: string;
  keyLabel: string;
  instructionsText: string;
}

/* ── Config por defecto (reemplazable por backend/CMS) ── */
export const DEFAULT_MANUAL_INFO: ManualPaymentInfo = {
  bankName: "Bancolombia",
  accountType: "Ahorros",
  accountNumber: "XXX-XXXXXX-XX",
  beneficiaryName: "Kuyay Hostel S.A.S",
  beneficiaryDocument: "NIT 900.XXX.XXX-X",
  nequiNumber: "3XX XXX XXXX",
  daviplataNumber: "3XX XXX XXXX",
  keyLabel: "kuyayhostel@correo.com",
  instructionsText:
    "Realiza la transferencia o pago al número/cuenta indicado y sube el comprobante para validación.",
};

/* ── Métodos de pago en orden de prioridad ── */
export function getPaymentMethods(): PaymentMethodDef[] {
  return [
    {
      id: "NEQUI_DAVIPLATA",
      label: "Nequi / Daviplata",
      sublabel: "Transferencia / Llaves",
      enabled: true,
      comingSoon: false,
      surchargeRate: 0,
      requiresProof: true,
      iconType: "wallet",
    },
    {
      id: "EFECTIVO",
      label: "Efectivo",
      sublabel: "Pago presencial",
      enabled: true,
      comingSoon: false,
      surchargeRate: 0,
      requiresProof: false,
      iconType: "cash",
    },
    {
      id: "LINK_PAGO",
      label: "Link de pago",
      sublabel: "Tarjetas / PSE",
      enabled: false,
      comingSoon: true,
      surchargeRate: 0.05,
      requiresProof: false,
      iconType: "link",
    },
    {
      id: "DATAFONO",
      label: "Datáfono",
      sublabel: "Pago con tarjeta física",
      enabled: false,
      comingSoon: true,
      surchargeRate: 0.05,
      requiresProof: false,
      iconType: "terminal",
    },
  ];
}

/* ── Cálculo centralizado del monto ── */
export interface PaymentCalc {
  montoBase: number;
  recargo: number;
  montoFinal: number;
  tieneRecargo: boolean;
}

/**
 * Calcula el monto a cobrar según las reglas del negocio:
 * - Si balance > 0 → cobrar balance
 * - Si no → cobrar total
 * - Link de pago y Datáfono suman 5%
 */
export function calcPaymentAmount(
  balance: number | undefined | null,
  total: number | undefined | null,
  methodId: PaymentMethodId
): PaymentCalc {
  const bal = Number(balance) || 0;
  const tot = Number(total) || 0;
  const montoBase = bal > 0 ? bal : tot;

  const methods = getPaymentMethods();
  const method = methods.find((m) => m.id === methodId);
  const rate = method?.surchargeRate ?? 0;

  const recargo = Math.round(montoBase * rate);
  const montoFinal = montoBase + recargo;

  return { montoBase, recargo, montoFinal, tieneRecargo: recargo > 0 };
}
