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
   MODAL RESULTADO + CREACIÓN PASSCODE (POR ROOM_ID)
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

  // ✅ FUNCIÓN REAL QUE CREA EL CÓDIGO SOLO PARA LAS PUERTAS DEL ROOM (NO GLOBAL)
  async function crearCodigoPorHabitacion() {
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

    // ✅ room_id viene del checkin-por-reserva (reserva del backend)
    const rid = reserva?.room_id ?? reserva?.roomId ?? reserva?.roomID;
    if (!rid) {
      console.log("reserva recibida:", reserva);
      alert(
        "No llegó room_id en la reserva. Revisa checkin-por-reserva (Network)."
      );
      return;
    }

    try {
      setLoading(true);

      // ✅ MILISEGUNDOS
      const startAt = new Date(guest.fechaIngreso + "T14:00:00").getTime();
      const endAt = new Date(guest.fechaSalida + "T12:00:00").getTime();

      // ✅ IMPORTANTE:
      // - NO mandamos 'code' => el backend genera 1 PIN único por registro
      // - Mandamos room_id => backend mapea a Door 1/2 correspondientes
      const payload: any = {
        numeroReserva: reserva.numeroReserva,
        room_id: String(rid),
        startAt,
        endAt,
        name: `Reserva - ${guest.nombre}`,
        // pinDigits: 6, // opcional (6..9)
      };

      const res = await fetch("http://18.206.179.50:4000/mcp/create-passcode-all", {
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

      // ✅ el backend devuelve 'pin'
      setTtlockResult({ ...data, payload });
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

        {/* ✅ BOTÓN REAL DE CREACIÓN (POR HABITACIÓN) */}
        {guest && (
          <button
            style={btnPrimary}
            disabled={loading}
            onClick={crearCodigoPorHabitacion}
          >
            {loading ? "Creando códigos..." : "Crear Código para la Habitación"}
          </button>
        )}

        {/* ✅ RESULTADO VISUAL COMPLETO */}
        {ttlockResult && (
          <pre style={modalPre}>
{`✅ CÓDIGO: ${ttlockResult.pin ?? ttlockResult.code}
👤 HUÉSPED: ${guest?.nombre}
📅 DESDE: ${guest?.fechaIngreso}
📅 HASTA: ${guest?.fechaSalida}
🏷️ ROOM_ID: ${ttlockResult.room_id ?? "(sin room_id)"}
🏠 ROOM: ${ttlockResult.room ?? "(sin nombre)"}

🔐 RESULTADOS POR PUERTA:
${(ttlockResult.resultados || [])
  .map((r: any) => {
    const id =
      r.result?.keyboardPwdId ??
      r.result?.keyboardPwd?.keyboardPwdId ??
      "N/A";

    // Si hay ID, lo tratamos como creado/registrado aunque ok venga false
    const status = id !== "N/A"
      ? "✅ REGISTRADO"
      : (r.ok ? "✅ OK" : "⚠ REVISAR");

    return `Puerta ${r.lockAlias ?? r.lockId}: ${status} | ID: ${id}`;
  })
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

export function GuestsTodayModal({ show, onClose }: GuestsTodayModalProps) {
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
