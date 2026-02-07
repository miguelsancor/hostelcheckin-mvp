import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export function ProtectedRoute({ children }: Props) {
  const location = useLocation();

  // ✅ NUEVO: si viene token en la URL, dejamos pasar (link compartible)
  const params = new URLSearchParams(location.search);
  const token = params.get("t");
  const hasToken = !!token && token.trim().length > 10;

  // ✅ Mantener compatibilidad con tu rollback (localStorage)
  const usuario = localStorage.getItem("usuario");
  const rawReserva = localStorage.getItem("reserva");

  let hasReserva = false;
  if (rawReserva) {
    try {
      const parsed = JSON.parse(rawReserva);
      hasReserva = Array.isArray(parsed) ? parsed.length > 0 : !!parsed;
    } catch {
      /* ignore */
    }
  }

  // ✅ Regla final:
  // - Entra si hay usuario, o hay reserva en LS, o hay token en URL
  if (!usuario && !hasReserva && !hasToken) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
