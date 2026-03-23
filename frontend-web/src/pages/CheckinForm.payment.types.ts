export type PaymentCanal = "BOLD" | "BILLETERO" | "DATAFONO";

export type PaymentStatus = "PENDING" | "REDIRECTED" | "PROCESSING" | "APPROVED" | "FAILED";

export type PaymentIntent = {
  id: number;
  estado: string;
  canal: string;
  monto: number;
  moneda: string;
  referencia: string | null;
};

export type PaymentConfig = {
  enabled: boolean;
  requirePayment: boolean;
  mockMode: boolean;
  businessName: string;
  publicLabel: string;
  channels: {
    bold: { enabled: boolean; checkoutUrl: string };
    billetero: { enabled: boolean };
    datafono: { enabled: boolean };
  };
};

export function loadPaymentConfig(): PaymentConfig {
  const env = (key: string, fallback: string) =>
    (import.meta.env[key] || fallback).toString().toLowerCase();

  const flag = (key: string, fallback = "false") => env(key, fallback) === "true";

  return {
    enabled: flag("VITE_PAYMENT_ENABLED") || flag("VITE_BOLD_ENABLED"),
    requirePayment: flag("VITE_PAYMENT_REQUIRE") || flag("VITE_BOLD_REQUIRE_PAYMENT"),
    mockMode: env("VITE_PAYMENT_MODE", env("VITE_BOLD_MODE", "demo")) !== "prod",
    businessName: (import.meta.env.VITE_BOLD_BUSINESS_NAME || "Kuyay Hostel"),
    publicLabel: (import.meta.env.VITE_PAYMENT_LABEL || import.meta.env.VITE_BOLD_PUBLIC_LABEL || "Pago seguro"),
    channels: {
      bold: {
        enabled: flag("VITE_CHANNEL_BOLD_ENABLED", "true"),
        checkoutUrl: (import.meta.env.VITE_BOLD_CHECKOUT_URL || ""),
      },
      billetero: {
        enabled: flag("VITE_CHANNEL_BILLETERO_ENABLED"),
      },
      datafono: {
        enabled: flag("VITE_CHANNEL_DATAFONO_ENABLED"),
      },
    },
  };
}
