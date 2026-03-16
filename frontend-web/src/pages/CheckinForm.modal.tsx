import React, { useEffect, useMemo, useRef, useState } from "react";
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
type TTLockStatus = "IDLE" | "CREATING" | "OK" | "ERROR";

/* =========================================================
   ✅ HELPERS FECHA / ZONA HORARIA BOGOTÁ
   - Colombia = UTC-5
   - Se genera epoch fijo en hora Bogotá
   - No depende del timezone del navegador/dispositivo
========================================================= */

function parseDateOnly(value?: string | null) {
  const s = String(value || "").trim();
  if (!s) return null;

  const onlyDate = s.includes("T") ? s.split("T")[0] : s;
  const parts = onlyDate.split("-").map(Number);

  if (parts.length !== 3) return null;

  const [year, month, day] = parts;
  if (!year || !month || !day) return null;

  return { year, month, day };
}

/**
 * Convierte una fecha/hora local de Bogotá a epoch ms UTC.
 * Bogotá = UTC-5 => UTC = horaBogota + 5
 */
function bogotaDateToEpoch(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute = 0,
  second = 0
) {
  return Date.UTC(year, month - 1, day, hour + 5, minute, second, 0);
}

/**
 * Regla del cliente:
 * - activa desde 10:00 AM del día de ingreso (Bogotá)
 * - vence a las 3:00 PM del día de salida (Bogotá)
 */
function buildTtlockWindowBogota(
  fechaIngreso?: string | null,
  fechaSalida?: string | null
) {
  const ingreso = parseDateOnly(fechaIngreso);
  const salida = parseDateOnly(fechaSalida);

  if (!ingreso || !salida) {
    throw new Error("Huésped sin fechas válidas para TTLock");
  }

  const startAt = bogotaDateToEpoch(
    ingreso.year,
    ingreso.month,
    ingreso.day,
    10,
    0,
    0
  );

  const endAt = bogotaDateToEpoch(
    salida.year,
    salida.month,
    salida.day,
    15,
    0,
    0
  );

  if (!Number.isFinite(startAt) || !Number.isFinite(endAt) || endAt <= startAt) {
    throw new Error("Ventana TTLock inválida");
  }

  return { startAt, endAt };
}

export function ResultModal({
  show,
  message,
  guest,
  reserva,
  onClose,
}: ResultModalProps) {
  const [loading, setLoading] = useState(false);
  const [ttlockResult, setTtlockResult] = useState<any>(null);
  const [ttlockStatus, setTtlockStatus] = useState<TTLockStatus>("IDLE");
  const [ttlockError, setTtlockError] = useState<string | null>(null);

  const [traLoading, setTraLoading] = useState(false);
  const [traStatus, setTraStatus] = useState<TraStatus | null>(null);
  const [traDetails, setTraDetails] = useState<any>(null);

  const ttlockTriggeredRef = useRef(false);

  const apiBase = "/api";

  const numeroReserva = useMemo(() => {
    const nr =
      reserva?.numeroReserva ||
      reserva?.numero_reserva ||
      reserva?.codigoReserva ||
      "";
    return String(nr || "").trim();
  }, [reserva]);

  async function fetchTraStatus() {
    if (!numeroReserva) return;

    try {
      setTraLoading(true);

      const r = await fetch(
        `${apiBase}/api/tra/status/${encodeURIComponent(numeroReserva)}`
      );

      const j = await r.json();

      if (r.ok && j?.ok) {
        setTraStatus(j.status as TraStatus);
        setTraDetails(j.details || null);
      } else {
        setTraStatus("ERROR");
        setTraDetails({
          lastError: j?.error || "No se pudo consultar estado TRA",
        });
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

      const r = await fetch(
        `${apiBase}/api/tra/retry/${encodeURIComponent(numeroReserva)}`,
        { method: "POST" }
      );

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

  async function crearCodigoPorHabitacion() {
    if (!guest?.fechaIngreso || !guest?.fechaSalida || !guest?.nombre) {
      setTtlockStatus("ERROR");
      setTtlockError("Huésped sin fechas completas");
      return;
    }

    if (!numeroReserva) {
      setTtlockStatus("ERROR");
      setTtlockError("No hay numeroReserva.");
      return;
    }

    const rid = reserva?.room_id ?? reserva?.roomId ?? reserva?.roomID;
    if (!rid) {
      setTtlockStatus("ERROR");
      setTtlockError("No llegó room_id.");
      return;
    }

    try {
      setLoading(true);
      setTtlockStatus("CREATING");
      setTtlockError(null);

      const { startAt, endAt } = buildTtlockWindowBogota(
        guest.fechaIngreso,
        guest.fechaSalida
      );

      const payload: any = {
        numeroReserva,
        room_id: String(rid),
        startAt,
        endAt,
        name: `Reserva - ${guest.nombre}`,
      };

      const res = await fetch("/api/mcp/create-passcode-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || data?.ok === false) {
        const msg = data?.error || "Error creando códigos";
        setTtlockStatus("ERROR");
        setTtlockError(msg);
        return;
      }

      setTtlockResult({ ...data, payload });
      setTtlockStatus("OK");
    } catch (e: any) {
      setTtlockStatus("ERROR");
      setTtlockError(e?.message || "Error creando código");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!show) return;

    setLoading(false);
    setTtlockResult(null);
    setTtlockStatus("IDLE");
    setTtlockError(null);
    ttlockTriggeredRef.current = false;

    setTraStatus(null);
    setTraDetails(null);
  }, [show]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, numeroReserva]);

  useEffect(() => {
    if (!show) return;
    if (ttlockResult) return;
    if (ttlockTriggeredRef.current) return;
    if (traStatus !== "OK") return;
    if (!guest || !reserva) return;

    ttlockTriggeredRef.current = true;
    crearCodigoPorHabitacion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, traStatus, guest, reserva, ttlockResult]);

  function renderTraLine() {
    if (!numeroReserva) return null;

    const label =
      traStatus === "OK"
        ? "🟢 Enviado"
        : traStatus === "PENDING"
        ? "🟡 Pendiente"
        : traStatus === "ERROR"
        ? "🔴 Error"
        : "Consultando...";

    return (
      <div
        style={{
          marginBottom: 10,
          padding: 10,
          borderRadius: 12,
          background: "rgba(0,0,0,0.25)",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <div>
            <b>TRA:</b> {label}
          </div>

          {traStatus === "ERROR" && (
            <button
              onClick={retryTra}
              disabled={traLoading}
              style={{ ...btnSecondary, padding: "8px 12px", width: "auto" }}
            >
              {traLoading ? "Reintentando..." : "Reintentar TRA"}
            </button>
          )}
        </div>

        {traStatus === "ERROR" && traDetails?.lastError && (
          <div style={{ marginTop: 8, opacity: 0.85, fontSize: "0.9rem" }}>
            {String(traDetails.lastError)}
          </div>
        )}
      </div>
    );
  }

  function renderTTLockLine() {
    const shouldShow =
      traStatus === "OK" ||
      ttlockStatus === "CREATING" ||
      ttlockStatus === "ERROR" ||
      ttlockStatus === "OK";

    if (!shouldShow) return null;

    const label =
      ttlockStatus === "OK"
        ? "🟢 Código generado"
        : ttlockStatus === "CREATING"
        ? "🟡 Generando código..."
        : ttlockStatus === "ERROR"
        ? "🔴 Error generando código"
        : "Listo para generar";

    return (
      <div
        style={{
          marginBottom: 15,
          padding: 10,
          borderRadius: 12,
          background: "rgba(0,0,0,0.25)",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <div>
            <b>TTLOCK:</b> {label}
          </div>

          {ttlockStatus === "ERROR" && (
            <button
              onClick={() => {
                ttlockTriggeredRef.current = false;
                crearCodigoPorHabitacion();
              }}
              disabled={loading}
              style={{ ...btnSecondary, padding: "8px 12px", width: "auto" }}
            >
              {loading ? "Reintentando..." : "Reintentar TTLock"}
            </button>
          )}
        </div>

        {ttlockStatus === "ERROR" && ttlockError && (
          <div style={{ marginTop: 8, opacity: 0.85, fontSize: "0.9rem" }}>
            {ttlockError}
          </div>
        )}
      </div>
    );
  }

  const pin = ttlockResult?.pin ?? ttlockResult?.code;
  const roomName = ttlockResult?.room ?? reserva?.room ?? "Tu habitación";

  if (!show) return null;

  return (
    <div style={modalOverlay}>
      <div style={{ ...modalBox, maxWidth: "520px", textAlign: "center" }}>
        {!ttlockResult && (
          <>
            <pre style={modalPre}>{message}</pre>
            {renderTraLine()}
            {renderTTLockLine()}
          </>
        )}

        {ttlockResult && (
          <>
            <h2 style={{ marginBottom: 10 }}>🎉 Check-in completado</h2>

            <p style={{ opacity: 0.8 }}>Tu clave digital es:</p>

            <div
              style={{
                fontSize: "3.5rem",
                fontWeight: 800,
                letterSpacing: 6,
                background: "#2563eb",
                padding: "20px 0",
                borderRadius: 16,
                marginBottom: 20,
              }}
            >
              {pin}#
            </div>

            <div style={{ marginBottom: 20, fontSize: "1.1rem" }}>
              📍 Habitación: <strong>{roomName}</strong>
            </div>

            <div
              style={{
                textAlign: "left",
                fontSize: "0.9rem",
                opacity: 0.85,
                marginBottom: 20,
              }}
            >
              <ul>
                <li>⏰ Activa de 10:00 AM a 3:00 PM del día siguiente (hora Bogotá)</li>
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