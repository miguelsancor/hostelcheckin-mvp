import React from "react";
import {
  modalOverlay,
  modalBox,
  modalPre,
  btnPrimary,
  btnSecondary,
} from "./CheckinForm.styles";
import type { HuespedBD } from "./CheckinForm.types";

/* =========================================================
   MODAL RESULTADO
   ========================================================= */
type ResultModalProps = {
  show: boolean;
  message: string;
  onClose: () => void;
};

export function ResultModal({ show, message, onClose }: ResultModalProps) {
  if (!show) return null;

  return (
    <div style={modalOverlay}>
      <div style={modalBox}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
          Registro Completado
        </h2>

        <pre style={modalPre}>{message}</pre>

        <button onClick={onClose} style={btnPrimary}>
          Cerrar
        </button>

        <button
          onClick={() => (window.location.href = "/")}
          style={btnSecondary}
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   MODAL HUÉSPEDES HOY
   ========================================================= */
type GuestsTodayModalProps = {
  show: boolean;
  huespedes: HuespedBD[];
  onClose: () => void;
};

export function GuestsTodayModal({
  show,
  huespedes,
  onClose,
}: GuestsTodayModalProps) {
  if (!show) return null;

  return (
    <div style={modalOverlay}>
      <div
        style={{
          ...modalBox,
          maxWidth: "600px",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
          Huéspedes registrados hoy
        </h2>

        {huespedes.length === 0 ? (
          <p>No hay registros hoy.</p>
        ) : (
          <ul style={{ paddingLeft: "1rem", lineHeight: "1.8rem" }}>
            {huespedes.map((h) => (
              <li key={h.id}>
                <strong style={{ color: "#10b981" }}>{h.nombre}</strong>
                <br />
                {h.numeroReserva} —{" "}
                {new Date(h.creadoEn).toLocaleString()}
                <hr
                  style={{ borderColor: "#333", margin: "0.8rem 0" }}
                />
              </li>
            ))}
          </ul>
        )}

        <button onClick={onClose} style={btnPrimary}>
          Cerrar
        </button>

        <button
          onClick={() => (window.location.href = "/")}
          style={btnSecondary}
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
}
