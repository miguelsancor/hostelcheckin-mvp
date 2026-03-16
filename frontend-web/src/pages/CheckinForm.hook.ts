import { useEffect, useRef, useState } from "react";
import type { Huesped, Reserva, LockItem, HuespedBD } from "./CheckinForm.types";
import { roomMapping } from "./roomMapping";

const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "");

/* ======================= HELPERS ======================= */
function getQueryParams() {
  if (typeof window === "undefined") {
    return { orderId: null as string | null, token: null as string | null };
  }

  const params = new URLSearchParams(window.location.search);

  return {
    orderId: params.get("reserva"),
    token: params.get("t"),
  };
}

function toDateInput(value?: string | null) {
  if (!value) return "";
  const s = String(value).trim();
  if (s.includes("T")) return s.split("T")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";

  return d.toISOString().slice(0, 10);
}

function nuevoHuesped(): Huesped {
  return {
    _id: globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2),
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

function stripFiles(h: Huesped) {
  const { archivoCedula, archivoFirma, archivoPasaporte, ...rest } = h as any;
  return rest;
}

function buildUrl(path: string) {
  return `${API_BASE}${path}`;
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

  const [sessionToken, setSessionToken] = useState<string>("");

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ensureSession = async (reservaObj: Reserva, list: Huesped[]) => {
    try {
      if (sessionToken && sessionToken.trim().length > 10) return;

      const resp = await fetch(buildUrl("/api/checkin/session"), {
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
        window.history.replaceState({}, "", `/checkin?t=${encodeURIComponent(t)}`);
      }
    } catch {
      // silencioso
    }
  };

  useEffect(() => {
    const { orderId, token } = getQueryParams();

    if (token && token.trim().length > 10) {
      setSessionToken(token);

      (async () => {
        try {
          setLoading(true);

          const resp = await fetch(
            buildUrl(`/api/checkin/session/${encodeURIComponent(token)}`)
          );
          const json = await resp.json();

          if (!json?.ok) {
            fallbackFromLocalStorage(true);
            return;
          }

          const rsv: Reserva | null = json?.reserva || null;
          const list: any[] = Array.isArray(json?.formList) ? json.formList : [];

          const normalized: Huesped[] = (list.length ? list : [nuevoHuesped()]).map(
            (h: any) => ({
              ...nuevoHuesped(),
              ...h,
              fechaIngreso: toDateInput(h?.fechaIngreso || ""),
              fechaSalida: toDateInput(h?.fechaSalida || ""),
              archivoCedula: null,
              archivoFirma: null,
              archivoPasaporte: null,
            })
          );

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

    if (orderId) {
      (async () => {
        try {
          setLoading(true);

          const resp = await fetch(buildUrl(`/api/checkin/por-reserva/${orderId}`));
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
            telefono: p.phone || p.telefono || "",
            email: p.email || "",
            motivoViaje: p.motivoViaje || "",
            fechaIngreso: toDateInput(p.checkin),
            fechaSalida: toDateInput(p.checkout),
          };

          const reservaObj: Reserva = {
            numeroReserva: p.numeroReserva,
            nombre: p.nombre,
            email: p.email,
            telefono: p.telefono || p.phone || "",
            checkin: toDateInput(p.checkin),
            checkout: toDateInput(p.checkout),
            room_id: p.room_id ?? null,
            lockId: p.lockId ?? undefined,
          };

          setReserva(reservaObj);
          setFormList([huesped]);

          localStorage.setItem("reserva", JSON.stringify(p));

          await ensureSession(reservaObj, [huesped]);
        } catch {
          fallbackFromLocalStorage(true);
        } finally {
          setLoading(false);
        }
      })();

      return;
    }

    fallbackFromLocalStorage(true);
  }, []);

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
          nombre: parsed.nombre || parsed.name || "",
          email: parsed.email || "",
          telefono: parsed.telefono || parsed.phone || "",
          checkin,
          checkout,
          room_id: parsed.room_id ?? null,
          lockId: parsed.lockId ?? undefined,
        };

        setReserva(reservaObj);
        setFormList([huesped]);

        if (createTokenIfPossible && reservaObj?.numeroReserva) {
          void ensureSession(reservaObj, [huesped]);
        }

        return;
      } catch {
        // ignora parse error
      }
    }

    setFormList([nuevoHuesped()]);
    setReserva(null);
  }

  useEffect(() => {
    fetch(buildUrl("/mcp/keys"))
      .then((res) => res.json())
      .then((json) => {
        if (Array.isArray(json?.list)) setLocks(json.list);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!sessionToken || sessionToken.trim().length <= 10) return;
    if (!formList || formList.length === 0) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(async () => {
      try {
        await fetch(buildUrl(`/api/checkin/session/${encodeURIComponent(sessionToken)}`), {
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

  const handleChange = (
    index: number,
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setFormList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [name]: value };
      return updated;
    });
  };

  const handleFileChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const input = e.target;
    const { name, files } = input;

    if (!files || files.length === 0) return;

    const file = files[0];

    setFormList((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [name]: file,
      };
      return updated;
    });

    input.value = "";
  };

  const handleAddGuest = () => {
    setFormList((prev) => [...prev, nuevoHuesped()]);
  };

  const removeGuestByIndex = (index: number) => {
    setFormList((prev) => {
      if (!Array.isArray(prev) || prev.length <= 1) return prev;
      if (index <= 0) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const cargarHuespedesHoy = async () => {
    try {
      const res = await fetch(buildUrl("/api/checkin/hoy"));
      const json = await res.json();
      setHuespedesHoy(json.huespedes || []);
    } catch {
      setHuespedesHoy([]);
    } finally {
      setShowModalHoy(true);
    }
  };

  const cerrarModalHoy = () => setShowModalHoy(false);

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
        if (h.archivoPasaporte) {
          fd.append(`archivoPasaporte_${idx}`, h.archivoPasaporte);
        }
      });

      const res = await fetch(buildUrl("/api/checkin"), {
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

      setModalMessage(`✅ Huéspedes registrados\nReserva: ${numeroReserva}`);
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