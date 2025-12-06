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
        <pre style={modalPre}>{message}</pre>

        <button onClick={onClose} style={btnPrimary}>
          Cerrar / Close
        </button>

        {/* ✅ AHORA SÍ VUELVE AL LOGIN */}
        <button
          onClick={() => (window.location.href = "/")}
          style={btnSecondary}
        >
          Volver / Back
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   MODAL HUÉSPEDES HOY (LIMPIO + VOLVER AL LOGIN)
   ========================================================= */
type GuestsTodayModalProps = {
  show: boolean;
  huespedes: HuespedBD[]; // se deja por compatibilidad
  onClose: () => void;
};

export function GuestsTodayModal({
  show,
  onClose,
}: GuestsTodayModalProps) {
  if (!show) return null;

  return (
    <div style={modalOverlay}>
      <div
        style={{
          ...modalBox,
          maxWidth: "480px",
          textAlign: "center",
        }}
      >
        {/* ✅ MODAL TOTALMENTE LIMPIO */}

        <button onClick={onClose} style={btnPrimary}>
          Cerrar / Close
        </button>

        {/* ✅ ESTE YA REDIRIGE AL LOGIN */}
        <button
          onClick={() => (window.location.href = "/")}
          style={btnSecondary}
        >
          Volver / Back
        </button>
      </div>
    </div>
  );
}
