import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

interface Props { children: ReactNode; }

export function ProtectedRoute({ children }: Props) {
  const usuario = localStorage.getItem("usuario");
  const rawReserva = localStorage.getItem("reserva");

  let hasReserva = false;
  if (rawReserva) {
    try {
      const parsed = JSON.parse(rawReserva);
      hasReserva = Array.isArray(parsed) ? parsed.length > 0 : !!parsed;
    } catch { /* ignore */ }
  }

  if (!usuario && !hasReserva) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
