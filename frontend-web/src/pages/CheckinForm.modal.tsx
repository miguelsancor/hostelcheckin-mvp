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
  guest?: any; 
  reserva?: any;
  onClose: () => void;
};

export function ResultModal({
  show,
  message,
  guest,
  reserva,
  onClose,
}: ResultModalProps) {
  const [loading, setLoading] = useState(false);
  const [ttlockResult, setTtlockResult] = useState<any>(null);

  if (!show) return null;

  // ✅ FUNCIÓN REAL QUE CREA EL CÓDIGO EN TODAS LAS CERRADURAS
  async function crearCodigoGlobal() {
    // ✅ fechas desde el formulario
    if (!guest?.fechaIngreso || !guest?.fechaSalida || !guest?.nombre) {
      alert("Huésped sin fechas completas (fechaIngreso/fechaSalida)");
      return;
    }
  
    // ✅ numeroReserva REAL desde backend
    if (!reserva?.numeroReserva) {
      alert("No hay numeroReserva (reserva del backend no llegó).");
      return;
    }
  
    try {
      setLoading(true);
  
      const code = String(Math.floor(100000 + Math.random() * 900000));
  
      // ✅ MILISEGUNDOS
      const startAt = new Date(guest.fechaIngreso + "T14:00:00").getTime();
      const endAt = new Date(guest.fechaSalida + "T12:00:00").getTime();
  
      const payload = {
        numeroReserva: reserva.numeroReserva, // ✅ este es el que existe en BD
        code,
        startAt,
        endAt,
        name: `Reserva - ${guest.nombre}`,
      };
  
      const res = await fetch("http://localhost:4000/mcp/create-passcode-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
  
      const data = await res.json();
  
      if (!res.ok || data?.ok === false) {
        console.error("Error TTLock/BD:", data);
        alert(data?.error || "Error creando códigos en TTLock/BD");
        return;
      }
  
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
  .map((r: any) =>
    `Puerta ${r.lockAlias ?? r.lockId}: ${
      r.ok ? "✅ OK" : "⚠ YA EXISTE"
    } | ID: ${r.result?.keyboardPwdId ?? r.result?.keyboardPwd?.keyboardPwdId}`
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
