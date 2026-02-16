import React, { useEffect, useMemo, useState } from "react";
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
   + ✅ SEMÁFORO TRA
   ========================================================= */
type ResultModalProps = {
  show: boolean;
  message: string;
  guest?: any;
  reserva?: any;
  onClose: () => void;
};

type TraStatus = "OK" | "PENDING" | "ERROR";

export function ResultModal({
  show,
  message,
  guest,
  reserva,
  onClose,
}: ResultModalProps) {
  const [loading, setLoading] = useState(false);
  const [ttlockResult, setTtlockResult] = useState<any>(null);

  // ✅ TRA semaphore
  const [traLoading, setTraLoading] = useState(false);
  const [traStatus, setTraStatus] = useState<TraStatus | null>(null);
  const [traDetails, setTraDetails] = useState<any>(null);

  const numeroReserva = useMemo(() => {
    const nr =
      reserva?.numeroReserva ||
      reserva?.numero_reserva ||
      reserva?.codigoReserva ||
      "";
    return String(nr || "").trim();
  }, [reserva]);

  const apiBase = "http://localhost:4000";

  async function fetchTraStatus() {
    if (!numeroReserva) return;
    try {
      setTraLoading(true);
      const r = await fetch(`${apiBase}/api/tra/status/${encodeURIComponent(numeroReserva)}`);
      const j = await r.json();
      if (r.ok && j?.ok) {
        setTraStatus(j.status as TraStatus);
        setTraDetails(j.details || null);
      } else {
        setTraStatus("ERROR");
        setTraDetails({ lastError: j?.error || "No se pudo consultar estado TRA" });
      }
    } catch (e: any) {
      setTraStatus("ERROR");
      setTraDetails({ lastError: e?.message || "Error consultando TRA" });
    } finally {
      setTraLoading(false);
    }
  }

  async function retryTra() {
    if (!numeroReserva) return;
    try {
      setTraLoading(true);
      const r = await fetch(`${apiBase}/api/tra/retry/${encodeURIComponent(numeroReserva)}`, {
        method: "POST",
      });
      const j = await r.json();
      if (!r.ok || j?.ok === false) {
        alert(j?.message || j?.error || "No se pudo reintentar TRA");
        return;
      }
      // volvemos a consultar
      await fetchTraStatus();
    } catch (e: any) {
      alert(e?.message || "Error reintentando TRA");
    } finally {
      setTraLoading(false);
    }
  }

  // ✅ Polling automático cuando el modal abre y hay numeroReserva
  useEffect(() => {
    if (!show) return;
    if (!numeroReserva) return;

    // primera consulta inmediata
    fetchTraStatus();

    // polling corto (hasta 30s)
    const startedAt = Date.now();
    const t = setInterval(() => {
      // si ya está OK, paramos
      if (traStatus === "OK") return;

      const elapsed = Date.now() - startedAt;
      if (elapsed > 30000) {
        clearInterval(t);
        return;
      }
      fetchTraStatus();
    }, 2000);

    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, numeroReserva]);

  if (!show) return null;

  // ✅ UI semáforo (sin depender de librerías)
  const semaforo = (() => {
    if (!numeroReserva) return null;

    let label = "TRA: (sin estado)";
    let dot = "⚪";
    if (traLoading && !traStatus) {
      label = "TRA: consultando...";
      dot = "🟡";
    } else if (traStatus === "PENDING") {
      label = "TRA: pendiente";
      dot = "🟡";
    } else if (traStatus === "OK") {
      label = "TRA: enviado";
      dot = "🟢";
    } else if (traStatus === "ERROR") {
      label = "TRA: error";
      dot = "🔴";
    }

    return (
      <div
        style={{
          marginTop: 10,
          marginBottom: 10,
          padding: "10px 12px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ fontSize: 18 }}>{dot}</div>
          <div style={{ fontWeight: 700 }}>{label}</div>
          <div style={{ marginLeft: "auto", opacity: 0.8, fontSize: 12 }}>
            {numeroReserva}
          </div>
        </div>

        {/* detalles / error */}
        {traStatus === "ERROR" && (
          <div style={{ marginTop: 8, opacity: 0.9, fontSize: 12 }}>
            <div><b>Detalle:</b> {traDetails?.lastError || traDetails?.primaryError || "Revisa logs del backend"}</div>
            <button
              style={{ ...btnSecondary, marginTop: 10 }}
              disabled={traLoading}
              onClick={retryTra}
            >
              {traLoading ? "Reintentando..." : "Reintentar TRA"}
            </button>
          </div>
        )}
      </div>
    );
  })();

  // ✅ FUNCIÓN REAL QUE CREA EL CÓDIGO SOLO PARA LAS PUERTAS DEL ROOM (NO GLOBAL)
  async function crearCodigoPorHabitacion() {
    if (!guest?.fechaIngreso || !guest?.fechaSalida || !guest?.nombre) {
      alert("Huésped sin fechas completas (fechaIngreso/fechaSalida)");
      return;
    }

    if (!numeroReserva) {
      alert("No hay numeroReserva (reserva del backend no llegó).");
      return;
    }

    const rid = reserva?.room_id ?? reserva?.roomId ?? reserva?.roomID;
    if (!rid) {
      console.log("reserva recibida:", reserva);
      alert("No llegó room_id en la reserva. Revisa checkin-por-reserva (Network).");
      return;
    }

    try {
      setLoading(true);

      const startAt = new Date(guest.fechaIngreso + "T14:00:00").getTime();
      const endAt = new Date(guest.fechaSalida + "T12:00:00").getTime();

      const payload: any = {
        numeroReserva,
        room_id: String(rid),
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

        {/* ✅ SEMÁFORO TRA */}
        {semaforo}

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

    const status =
      id !== "N/A"
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
