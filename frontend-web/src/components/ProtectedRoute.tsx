import { Navigate } from "react-router-dom";
import type  { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export function ProtectedRoute({ children }: Props) {
  const usuario = localStorage.getItem("usuario");

  if (!usuario) {
    return <Navigate to="/" replace />;
  }

  return children;
}
