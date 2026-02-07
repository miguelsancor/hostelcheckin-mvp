import { useEffect, useRef, useState } from "react";
import type { Huesped, Reserva, LockItem, HuespedBD } from "./CheckinForm.types";
import { roomMapping } from "./roomMapping";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

/* ======================= HELPERS ======================= */
function getQueryParams() {
  if (typeof window === "undefined") return { orderId: null as string | null, token: null as string | null };
  const params = new URLSearchParams(window.location.search);
  return {
    orderId: params.get("reserva"), // compat
    token: params.get("t"),         // ✅ nuevo
  };
}

// ✅ Convierte "2026-02-04T00:00:00" -> "2026-02-04"
function toDateInput(value?: string | null) {
  if (!value) return "";
  const s = String(value).trim();
  if (s.includes("T")) return s.split("T")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

/* ======================= CREAR HUESPED VACÍO CON ID ======================= */
function nuevoHuesped(): Huesped {
  return {
    _id: self.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2),
    nombre: "",
    tipoDocumento: "",
    numeroDocumento: "",
    nacionalidad: "",
    direccion: "",
    lugarProcedencia: "",
    lugarDestino: "",
    telefono: "",
    email: "",
    motivoViaje: "",
    fechaIngreso: "",
    fechaSalida: "",
    archivoCedula: null,
    archivoFirma: null,
    archivoPasaporte: null,
  };
}

// ✅ para guardar borrador: NO serializar Files
function stripFiles(h: Huesped) {
  const { archivoCedula, archivoFirma, archivoPasaporte, ...rest } = h as any;
  return rest;
}

/* ======================= HOOK PRINCIPAL ======================= */
export function useCheckinForm() {
  const [formList, setFormList] = useState<Huesped[]>([nuevoHuesped()]);
  const [reserva, setReserva] = useState<Reserva | null>(null);
  const [loading, setLoading] = useState(false);
  const [locks, setLocks] = useState<LockItem[]>([]);
  const [huespedesHoy, setHuespedesHoy] = useState<HuespedBD[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [showModalHoy, setShowModalHoy] = useState(false);

  // ✅ token compartible
  const [sessionToken, setSessionToken] = useState<string>("");

  // autosave debounce
  const saveTimer = useRef<any>(null);

  // ✅ helper: crear sesión y reemplazar URL (sin recargar)
  const ensureSession = async (reservaObj: Reserva, list: Huesped[]) => {
    try {
      // si ya hay token, no hagas nada
      if (sessionToken && sessionToken.trim().length > 10) return;

      const resp = await fetch(`${API_BASE}/api/checkin/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reserva: reservaObj,
          formList: list.map(stripFiles),
        }),
      });

      const json = await resp.json();

      if (json?.ok && json?.token) {
        const t = String(json.token);
        setSessionToken(t);

        // 🔥 cambia la URL actual a /checkin?t=... sin recargar
        window.history.replaceState({}, "", `/checkin?t=${encodeURIComponent(t)}`);
      }
    } catch {
      // silencioso: si backend no está, no rompemos el flujo
    }
  };

  /* ======================= CARGA INICIAL ======================= */
  useEffect(() => {
    const { orderId, token } = getQueryParams();

    // ✅ 1) Si viene token, hidratar desde backend
    if (token && token.trim().length > 10) {
      setSessionToken(token);

      (async () => {
        try {
          setLoading(true);

          const resp = await fetch(`${API_BASE}/api/checkin/session/${encodeURIComponent(token)}`);
          const json = await resp.json();

          if (!json?.ok) {
            fallbackFromLocalStorage(true);
            return;
          }

          const rsv: Reserva | null = json?.reserva || null;
          const list: any[] = Array.isArray(json?.formList) ? json.formList : [];

          const normalized: Huesped[] = (list.length ? list : [nuevoHuesped()]).map((h: any) => ({
            ...nuevoHuesped(),
            ...h,
            fechaIngreso: toDateInput(h?.fechaIngreso || ""),
            fechaSalida: toDateInput(h?.fechaSalida || ""),
            archivoCedula: null,
            archivoFirma: null,
            archivoPasaporte: null,
          }));

          if (rsv) {
            setReserva({
              ...rsv,
              checkin: toDateInput((rsv as any).checkin),
              checkout: toDateInput((rsv as any).checkout),
            });
          } else {
            setReserva(null);
          }

          setFormList(normalized);
        } catch {
          fallbackFromLocalStorage(true);
        } finally {
          setLoading(false);
        }
      })();

      return;
    }

    // ✅ 2) Si viene ?reserva=..., cargar y luego crear token y reemplazar URL
    if (orderId) {
      (async () => {
        try {
          setLoading(true);

          const resp = await fetch(`${API_BASE}/api/checkin/por-reserva/${orderId}`);
          const json = await resp.json();

          if (!json.ok || !json.data) {
            fallbackFromLocalStorage(true);
            return;
          }

          const p = json.data;

          const huesped: Huesped = {
            ...nuevoHuesped(),
            nombre: p.nombre || "",
            tipoDocumento: p.tipoDocumento || "",
            numeroDocumento: p.numeroDocumento || "",
            nacionalidad: p.nacionalidad || "",
            direccion: p.direccion || "",
            lugarProcedencia: p.lugarProcedencia || "",
            lugarDestino: p.lugarDestino || "",
            telefono: p.phone || "",
            email: p.email || "",
            motivoViaje: p.motivoViaje || "",
            fechaIngreso: toDateInput(p.checkin),
            fechaSalida: toDateInput(p.checkout),
          };

          const reservaObj: Reserva = {
            numeroReserva: p.numeroReserva,
            nombre: p.nombre,
            email: p.email,
            telefono: p.telefono,
            checkin: toDateInput(p.checkin),
            checkout: toDateInput(p.checkout),
            room_id: null,
            lockId: undefined,
          };

          setReserva(reservaObj);
          setFormList([huesped]);

          // compat rollback
          localStorage.setItem("reserva", JSON.stringify(p));

          // ✅ crea token aunque vengas por ?reserva
          await ensureSession(reservaObj, [huesped]);
        } catch {
          fallbackFromLocalStorage(true);
        } finally {
          setLoading(false);
        }
      })();

      return;
    }

    // ✅ 3) si entras a /checkin (sin query), usar LS y AÚN ASÍ crear token
    fallbackFromLocalStorage(true);
  }, []);

  /* ======================= FALLBACK LOCAL STORAGE ======================= */
  function fallbackFromLocalStorage(createTokenIfPossible: boolean) {
    const data = localStorage.getItem("reserva");
    if (data) {
      try {
        const parsed = JSON.parse(data);

        const checkin = toDateInput(parsed.checkin);
        const checkout = toDateInput(parsed.checkout);

        const huesped: Huesped = {
          ...nuevoHuesped(),
          nombre: parsed.nombre || parsed.name || "",
          tipoDocumento: parsed.tipoDocumento || "",
          numeroDocumento: parsed.numeroDocumento || "",
          nacionalidad: parsed.nacionalidad || "",
          direccion: parsed.direccion || "",
          lugarProcedencia: parsed.lugarProcedencia || "",
          lugarDestino: parsed.lugarDestino || "",
          telefono: parsed.phone || parsed.telefono || "",
          email: parsed.email || "",
          motivoViaje: parsed.motivoViaje || "",
          fechaIngreso: checkin,
          fechaSalida: checkout,
        };

        const reservaObj: Reserva = {
          numeroReserva: parsed.numeroReserva || "",
          nombre: parsed.nombre || "",
          email: parsed.email || "",
          telefono: parsed.telefono || "",
          checkin,
          checkout,
          room_id: null,
          lockId: undefined,
        };

        setReserva(reservaObj);
        setFormList([huesped]);

        // ✅ AQUÍ está el fix: aunque entres a /checkin sin query, igual generamos ?t=...
        if (createTokenIfPossible && reservaObj?.numeroReserva) {
          void ensureSession(reservaObj, [huesped]);
        }

        return;
      } catch {}
    }

    setFormList([nuevoHuesped()]);
    setReserva(null);
  }

  /* ======================= TTLOCK ======================= */
  useEffect(() => {
    fetch(`${API_BASE}/mcp/keys`)
      .then((res) => res.json())
      .then((json) => {
        if (Array.isArray(json?.list)) setLocks(json.list);
      })
      .catch(() => {});
  }, []);

  /* ======================= AUTOSAVE BORRADOR POR TOKEN ======================= */
  useEffect(() => {
    if (!sessionToken || sessionToken.trim().length <= 10) return;
    if (!formList || formList.length === 0) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(async () => {
      try {
        await fetch(`${API_BASE}/api/checkin/session/${encodeURIComponent(sessionToken)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reserva,
            formList: formList.map(stripFiles),
          }),
        });
      } catch {
        // silencioso
      }
    }, 650);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [sessionToken, reserva, formList]);

  /* ======================= HANDLERS ======================= */
  const handleChange = (index: number, e: any) => {
    setFormList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [e.target.name]: e.target.value };
      return updated;
    });
  };

  const handleFileChange = (index: number, e: any) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];

    setFormList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [e.target.name]: file };
      return updated;
    });
  };

  const handleAddGuest = () => setFormList((prev) => [...prev, nuevoHuesped()]);

  const removeGuestByIndex = (index: number) => {
    setFormList((prev) => {
      if (!Array.isArray(prev) || prev.length <= 1) return prev;
      if (index <= 0) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  /* ======================= HOY ======================= */
  const cargarHuespedesHoy = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/checkin/hoy`);
      const json = await res.json();
      setHuespedesHoy(json.huespedes || []);
    } catch {
      setHuespedesHoy([]);
    } finally {
      setShowModalHoy(true);
    }
  };

  const cerrarModalHoy = () => setShowModalHoy(false);

  /* ======================= SUBMIT FINAL ======================= */
  const handleSubmit = async (motivoViaje?: string) => {
    if (!formList.length) {
      alert("Agrega al menos un huésped.");
      return;
    }

    const listaConMotivo: Huesped[] = formList.map((h) => ({
      ...h,
      motivoViaje: motivoViaje || h.motivoViaje || "",
    }));

    setLoading(true);

    try {
      const titular = listaConMotivo[0];

      // ✅ URL real construida en el navegador (sin IP)
      const checkinUrl = `${window.location.protocol}//${window.location.host}/checkin${
        sessionToken ? `?t=${encodeURIComponent(sessionToken)}` : ""
      }`;

      const fd = new FormData();

      fd.append(
        "data",
        JSON.stringify({
          huespedes: listaConMotivo.map((h) => ({
            ...h,
            archivoCedula: undefined,
            archivoFirma: undefined,
            archivoPasaporte: undefined,
          })),
          motivoViaje: motivoViaje || titular.motivoViaje || null,
          fechaIngreso: titular.fechaIngreso || null,
          fechaSalida: titular.fechaSalida || null,
          checkinUrl,
          sessionToken: sessionToken || null,
        })
      );

      listaConMotivo.forEach((h, idx) => {
        if (h.archivoCedula) fd.append(`archivoCedula_${idx}`, h.archivoCedula);
        if (h.archivoFirma) fd.append(`archivoFirma_${idx}`, h.archivoFirma);
        if (h.archivoPasaporte) fd.append(`archivoPasaporte_${idx}`, h.archivoPasaporte);
      });

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

      const msg = `✅ Huéspedes registrados\nReserva: ${numeroReserva}`;
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
    removeGuestByIndex,
    handleSubmit,

    cargarHuespedesHoy,
    cerrarModalHoy,
    setShowModal,
  };
}
