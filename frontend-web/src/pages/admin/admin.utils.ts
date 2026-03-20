import type { Huesped, ReservaCobro } from "./admin.types";

export const API_BASE = "/api";

export const defaultCobro = (huesped?: Huesped | null): ReservaCobro => ({
  numeroReserva: huesped?.numeroReserva || "",
  huespedId: huesped?.id ?? null,
  totalHospedaje: 0,
  anticipo: 0,
  saldoPendiente: 0,
  moneda: "COP",
  estadoPago: "PENDING",
  observacion: "",
});

export function formatMoney(value?: number, currency = "COP") {
  const n = Number(value || 0);
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${currency} ${n}`;
  }
}

export function normalizarFecha(value?: string | null) {
  if (!value) return "";
  const s = String(value).trim();
  if (!s) return "";
  if (s.includes("T")) return s.split("T")[0];
  return s.slice(0, 10);
}

export function formatDateTimeLocal(value?: number | null) {
  if (!value) return "-";
  const d = new Date(Number(value));
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("es-CO");
}

export function getSecureUploadUrl(file?: string | null) {
  if (!file) return null;
  return `${API_BASE}/uploads/${encodeURIComponent(file)}`;
}

export function ttlockText(value?: string | null) {
  const v = String(value || "").trim();
  return v || "-";
}

export function buildSearchText(h: Huesped, cobro?: ReservaCobro) {
  return `
    ${h.nombre}
    ${h.numeroDocumento}
    ${h.telefono}
    ${h.email}
    ${h.numeroReserva}
    ${h.codigoTTLock ?? ""}
    ${cobro?.estadoPago ?? ""}
    ${cobro?.moneda ?? ""}
  `
    .toLowerCase()
    .trim();
}

export function getTodayString() {
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, "0");
  const dd = String(hoy.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}