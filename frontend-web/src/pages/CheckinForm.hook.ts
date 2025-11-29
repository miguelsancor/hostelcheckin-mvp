// frontend-web/src/pages/CheckinForm.hook.ts
import { useEffect, useState } from "react";
import type { Huesped, Reserva, LockItem, HuespedBD } from "./CheckinForm.types";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";
const DEFAULT_LOCK_ID = Number(import.meta.env.VITE_TTLOCK_LOCK_ID || "0");

// ======================= MAPA DE CERRADURAS POR room_id =======================
const ROOM_LOCK_MAP: Record<number, number> = {
  2457340: 101, // Kalpa
  2470380: 102, // Kusi
  2468950: 103, // Kanchi
  2465274: 104, // Allyn

  2463146: 201, // Pod in Wasi 1
  2496688: 202, // Pod in Wasi 2

  2457300: 301, // Bed in Wasi 1

  2457341: 401, // Suyana

  2502145: 105, // Allpa
  2502147: 106, // Unu
  2502148: 107, // Sonqo
  2502149: 108, // Inti
  2502150: 109, // Llampu

  2504850: 501, // Sami
  2512556: 505, // Pod in Sami 1
  2512557: 506, // Pod in Sami 2
};

// ======================= HELPERS =======================
function endOfDayEpochMs(date?: string) {
  if (!date) return null;
  return new Date(date + "T23:59:59.999").getTime();
}

async function createMcpPasscode(params: any) {
  const res = await fetch(`${API_BASE}/mcp/create-passcode`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok && json?.ok !== false, data: json };
}

function getQueryParams() {
  if (typeof window === "undefined") return { orderId: null as string | null };
  const params = new URLSearchParams(window.location.search);
  return {
    orderId: params.get("orderId") || params.get("reserva"),
  };
}

// ======================= HOOK PRINCIPAL =======================
export function useCheckinForm() {
  const [formList, setFormList] = useState<Huesped[]>([]);
  const [reserva, setReserva] = useState<Reserva | null>(null);
  const [loading, setLoading] = useState(false);
  const [locks, setLocks] = useState<LockItem[]>([]);
  const [huespedesHoy, setHuespedesHoy] = useState<HuespedBD[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [showModalHoy, setShowModalHoy] = useState(false);

  // ======================= CARGA INICIAL (URL o localStorage) =======================
  useEffect(() => {
    const { orderId } = getQueryParams();

    if (orderId) {
      (async () => {
        try {
          const resp = await fetch(`${API_BASE}/api/nobeds/reserva/${orderId}`);
          const json = await resp.json();

          if (!json.ok || !json.reserva) {
            console.warn("No se encontró reserva en NoBeds para", orderId);
            fallbackFromLocalStorage();
            return;
          }

          const p = json.reserva;

          const autoLockId = ROOM_LOCK_MAP[p.room_id] || DEFAULT_LOCK_ID;

          const huesped: Huesped = {
            nombre: p.name || "",
            email: p.email || "",
            telefono: p.phone || "",
            fechaIngreso: p.checkin?.slice(0, 10),
            fechaSalida: p.checkout?.slice(0, 10),
            referral: p.referral,
            status: p.status,
            nights: p.nights,
            guests: p.guests,
            price: p.price,
            total: p.total,
            b_extras: p.b_extras,
            b_smoking: p.b_smoking,
            b_meal: p.b_meal,
            comment: p.comment,
          };

          setReserva({
            numeroReserva: String(p.order_id),
            nombre: p.name,
            email: p.email,
            telefono: p.phone,
            checkin: p.checkin,
            checkout: p.checkout,
            lockId: autoLockId,
            room_id: p.room_id,
          });

          setFormList([huesped]);

          const reservaToStore = {
            order_id: p.order_id,
            name: p.name,
            email: p.email,
            phone: p.phone,
            checkin: p.checkin,
            checkout: p.checkout,
            room_id: p.room_id,
            referral: p.referral,
            status: p.status,
            nights: p.nights,
            guests: p.guests,
            price: p.price,
            total: p.total,
            b_extras: p.b_extras,
            b_smoking: p.b_smoking,
            b_meal: p.b_meal,
            comment: p.comment,
          };
          localStorage.setItem("reserva", JSON.stringify(reservaToStore));
        } catch (err) {
          console.error("Error cargando reserva desde NoBeds:", err);
          fallbackFromLocalStorage();
        }
      })();

      return;
    }

    // 2) Si NO hay orderId en URL → usar localStorage
    fallbackFromLocalStorage();
  }, []);

  function fallbackFromLocalStorage() {
    const data = localStorage.getItem("reserva");
    if (data) {
      try {
        const parsed = JSON.parse(data);

        if (parsed?.order_id) {
          const autoLockId = ROOM_LOCK_MAP[parsed.room_id] || DEFAULT_LOCK_ID;

          const huesped: Huesped = {
            nombre: parsed.name || "",
            email: parsed.email || "",
            telefono: parsed.phone || "",
            fechaIngreso: parsed.checkin?.slice(0, 10),
            fechaSalida: parsed.checkout?.slice(0, 10),
            referral: parsed.referral,
            status: parsed.status,
            nights: parsed.nights,
            guests: parsed.guests,
            price: parsed.price,
            total: parsed.total,
            b_extras: parsed.b_extras,
            b_smoking: parsed.b_smoking,
            b_meal: parsed.b_meal,
            comment: parsed.comment,
          };

          setReserva({
            numeroReserva: String(parsed.order_id),
            nombre: parsed.name,
            email: parsed.email,
            telefono: parsed.phone,
            checkin: parsed.checkin,
            checkout: parsed.checkout,
            room_id: parsed.room_id,     // 🔥 FIX AÚN MÁS IMPORTANTE
            lockId: autoLockId,
          });

          setFormList([huesped]);
        } else {
          const arr = Array.isArray(parsed) ? parsed : [parsed];
          setFormList(arr.length ? arr : [{} as Huesped]);
          setReserva(arr[0] ?? null);
        }
        return;
      } catch {
        // ignore
      }
    }

    setFormList([{} as Huesped]);
    setReserva(null);
  }

  // Guarda reserva simplificada en localStorage cuando cambie
  useEffect(() => {
    if (reserva) localStorage.setItem("reserva", JSON.stringify(reserva));
  }, [reserva]);

  // ======================= TTLOCK: CARGAR CERRADURAS =======================
  useEffect(() => {
    fetch(`${API_BASE}/mcp/keys`)
      .then((res) => res.json())
      .then((json) => {
        if (Array.isArray(json?.list)) setLocks(json.list);
      })
      .catch(() => {});
  }, []);

  // ======================= HANDLERS DE FORM =======================
  const handleChange = (index: number, e: any) => {
    const updated = [...formList];
    updated[index] = { ...updated[index], [e.target.name]: e.target.value };
    setFormList(updated);
  };

  const handleFileChange = (index: number, e: any) => {
    if (!e.target.files?.length) return;
    const updated = [...formList];
    updated[index] = { ...updated[index], [e.target.name]: e.target.files[0] };
    setFormList(updated);
  };

  const handleAddGuest = () => setFormList((prev) => [...prev, {} as Huesped]);

  // ======================= HUESPEDES HOY =======================
  const cargarHuespedesHoy = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/checkin/hoy`);
      const json = await res.json();
      setHuespedesHoy(json.huespedes || []);
    } catch (err) {
      console.error("Error cargando huespedes de hoy:", err);
      setHuespedesHoy([]);
    } finally {
      setShowModalHoy(true);
    }
  };

  const cerrarModalHoy = () => setShowModalHoy(false);

  // ======================= SUBMIT =======================
  const handleSubmit = async () => {
    if (!formList.length) {
      alert("Agrega al menos un huésped.");
      return;
    }

    setLoading(true);

    try {
      const titular = formList[0];

      const fd = new FormData();
      fd.append(
        "data",
        JSON.stringify({
          huespedes: formList,
          fechaIngreso: titular.fechaIngreso || null,
          fechaSalida: titular.fechaSalida || null,
        })
      );

      const res = await fetch(`${API_BASE}/api/checkin`, {
        method: "POST",
        body: fd,
      });
      const json = await res.json();

      if (!json.ok) {
        alert("Error guardando en la base de datos.");
        return;
      }

      const numeroReserva = json.numeroReserva;

      setReserva((prev) => ({
        ...(prev || {}),
        numeroReserva,
      }));

      let msg = `Huéspedes registrados\nReserva: ${numeroReserva}\n`;

      const lockId =
        reserva?.lockId || (reserva?.room_id && ROOM_LOCK_MAP[reserva.room_id]) || DEFAULT_LOCK_ID;

      const endAt = endOfDayEpochMs(
        titular.fechaSalida || reserva?.checkout || ""
      );

      if (lockId && endAt) {
        const r = await createMcpPasscode({
          lockId,
          startAt: Date.now(),
          endAt,
          name: `Reserva-${numeroReserva}`,
        });

        if (r.ok) {
          const data = r.data?.result || {};
          const code = data.keyboardPwd || data.password || data.code;
          msg += "Passcode creado.\n";
          if (code) msg += "Código: " + code;
        } else {
          msg += "No se pudo crear passcode.";
        }
      } else {
        msg += "Cerradura o fecha inválida.";
      }

      setModalMessage(msg);
      setShowModal(true);
    } catch (err) {
      console.error("Error en handleSubmit:", err);
      alert("Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  return {
    formList,
    reserva,
    loading,
    locks,
    huespedesHoy,
    showModal,
    modalMessage,
    showModalHoy,
    handleChange,
    handleFileChange,
    handleAddGuest,
    handleSubmit,
    cargarHuespedesHoy,
    cerrarModalHoy,
    setShowModal,
  };
}
