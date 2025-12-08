import React, { useState } from "react";
import {
  modalOverlay,
  modalBox,
  modalPre,
  btnPrimary,
  btnSecondary,
} from "./CheckinForm.styles";
import type { HuespedBD } from "./CheckinForm.types";

/* =========================================================
   MODAL RESULTADO + CREACIÓN PASSCODE GLOBAL
   ========================================================= */
type ResultModalProps = {
  show: boolean;
  message: string;
  guest?: HuespedBD; // ✅ AHORA RECIBE EL HUÉSPED
  onClose: () => void;
};

export function ResultModal({
  show,
  message,
  guest,
  onClose,
}: ResultModalProps) {
  const [loading, setLoading] = useState(false);
  const [ttlockResult, setTtlockResult] = useState<any>(null);

  if (!show) return null;

  // ✅ FUNCIÓN REAL QUE CREA EL CÓDIGO EN TODAS LAS CERRADURAS
  async function crearCodigoGlobal() {
    if (!guest?.nombre || !guest?.fechaIngreso || !guest?.fechaSalida) {
      alert("Huésped sin fechas completas");
      return;
    }

    try {
      setLoading(true);

      const code = String(
        Math.floor(100000 + Math.random() * 900000)
      ); // 6 dígitos

      const payload = {
        code,
        startAt: new Date(guest.fechaIngreso).getTime(),
        endAt: new Date(guest.fechaSalida).getTime(),
        name: `Reserva - ${guest.nombre}`,
      };

      const res = await fetch(
        "http://localhost:4000/mcp/create-passcode-all",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      setTtlockResult({ ...data, code, payload });
    } catch (err) {
      console.error(err);
      alert("Error creando código en TTLock");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={modalOverlay}>
      <div style={{ ...modalBox, maxWidth: "680px" }}>
        <pre style={modalPre}>{message}</pre>

        {/* ✅ BOTÓN REAL DE CREACIÓN */}
        {guest && (
          <button
            style={btnPrimary}
            disabled={loading}
            onClick={crearCodigoGlobal}
          >
            {loading ? "Creando códigos..." : "Crear Código en TODAS las Puertas"}
          </button>
        )}

        {/* ✅ RESULTADO VISUAL COMPLETO */}
        {ttlockResult && (
          <pre style={modalPre}>
{`✅ CÓDIGO: ${ttlockResult.code}
👤 HUÉSPED: ${guest?.nombre}
📅 DESDE: ${guest?.fechaIngreso}
📅 HASTA: ${guest?.fechaSalida}

🔐 RESULTADOS POR PUERTA:
${ttlockResult.resultados
  .map(
    (r: any) =>
      `Puerta ${r.lockId}: ${
        r.ok ? "✅ OK" : "⚠ YA EXISTE"
      } | ID: ${r.result?.keyboardPwdId}`
  )
  .join("\n")}
`}
          </pre>
        )}

        <button onClick={onClose} style={btnPrimary}>
          Cerrar / Close
        </button>

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
  huespedes: HuespedBD[];
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
        <button onClick={onClose} style={btnPrimary}>
          Cerrar / Close
        </button>

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
