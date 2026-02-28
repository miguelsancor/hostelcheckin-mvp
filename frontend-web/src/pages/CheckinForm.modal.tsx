import React, { useEffect, useMemo, useState } from "react";
import {
  modalOverlay,
  modalBox,
  modalPre,
  btnPrimary,
  btnSecondary,
} from "./CheckinForm.styles";
import type { HuespedBD } from "./CheckinForm.types";

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

  const apiBase = "http://18.206.179.50:4000";

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
      await fetchTraStatus();
    } catch (e: any) {
      alert(e?.message || "Error reintentando TRA");
    } finally {
      setTraLoading(false);
    }
  }

  useEffect(() => {
    if (!show) return;
    if (!numeroReserva) return;

    fetchTraStatus();

    const startedAt = Date.now();
    const t = setInterval(() => {
      if (traStatus === "OK") return;
      const elapsed = Date.now() - startedAt;
      if (elapsed > 30000) {
        clearInterval(t);
        return;
      }
      fetchTraStatus();
    }, 2000);

    return () => clearInterval(t);
  }, [show, numeroReserva]);

  if (!show) return null;

  async function crearCodigoPorHabitacion() {
    if (!guest?.fechaIngreso || !guest?.fechaSalida || !guest?.nombre) {
      alert("Huésped sin fechas completas");
      return;
    }

    if (!numeroReserva) {
      alert("No hay numeroReserva.");
      return;
    }

    const rid = reserva?.room_id ?? reserva?.roomId ?? reserva?.roomID;
    if (!rid) {
      alert("No llegó room_id.");
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

      const res = await fetch("http://18.206.179.50:4000/mcp/create-passcode-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || data?.ok === false) {
        alert(data?.error || "Error creando códigos");
        return;
      }

      setTtlockResult({ ...data, payload });
    } catch {
      alert("Error creando código");
    } finally {
      setLoading(false);
    }
  }

  const pin = ttlockResult?.pin ?? ttlockResult?.code;
  const roomName = ttlockResult?.room ?? reserva?.room ?? "Tu habitación";

  return (
    <div style={modalOverlay}>
      <div style={{ ...modalBox, maxWidth: "520px", textAlign: "center" }}>

        {!ttlockResult && (
          <>
            <pre style={modalPre}>{message}</pre>

            {numeroReserva && (
              <div style={{
                marginBottom: 15,
                padding: 10,
                borderRadius: 12,
                background: "rgba(0,0,0,0.25)"
              }}>
                <b>TRA:</b> {traStatus === "OK" ? "🟢 Enviado" :
                             traStatus === "PENDING" ? "🟡 Pendiente" :
                             traStatus === "ERROR" ? "🔴 Error" :
                             "Consultando..."}
              </div>
            )}

            {guest && (
              <button
                style={btnPrimary}
                disabled={loading}
                onClick={crearCodigoPorHabitacion}
              >
                {loading ? "Creando código..." : "Crear Código para la Habitación"}
              </button>
            )}
          </>
        )}

        {/* 🎯 NUEVA PANTALLA LIMPIA FINAL */}
        {ttlockResult && (
          <>
            <h2 style={{ marginBottom: 10 }}>🎉 Check-in completado</h2>

            <p style={{ opacity: 0.8 }}>
              Tu clave digital es:
            </p>

            <div style={{
              fontSize: "3.5rem",
              fontWeight: 800,
              letterSpacing: 6,
              background: "#2563eb",
              padding: "20px 0",
              borderRadius: 16,
              marginBottom: 20
            }}>
              {pin}
            </div>

            <div style={{ marginBottom: 20, fontSize: "1.1rem" }}>
              📍 Habitación: <strong>{roomName}</strong>
            </div>

            <div style={{
              textAlign: "left",
              fontSize: "0.9rem",
              opacity: 0.85,
              marginBottom: 20
            }}>
              <ul>
                <li>⏰ Check-out: 11:00 AM</li>
                <li>🔒 No compartas tu código</li>
                <li>🚪 Cierra la puerta completamente al salir</li>
              </ul>
            </div>
          </>
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

/* ========================================================= */

type GuestsTodayModalProps = {
  show: boolean;
  huespedes: HuespedBD[];
  onClose: () => void;
};

export function GuestsTodayModal({ show, onClose }: GuestsTodayModalProps) {
  if (!show) return null;

  return (
    <div style={modalOverlay}>
      <div style={{ ...modalBox, maxWidth: "480px", textAlign: "center" }}>
        <button onClick={onClose} style={btnPrimary}>
          Cerrar
        </button>

        <button
          onClick={() => (window.location.href = "/")}
          style={btnSecondary}
        >
          Volver
        </button>
      </div>
    </div>
  );
}