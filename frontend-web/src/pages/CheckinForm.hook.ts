import { useEffect, useState } from "react";
import type { Huesped, Reserva, LockItem, HuespedBD } from "./CheckinForm.types";
import { roomMapping } from "./roomMapping";

const API_BASE = import.meta.env.VITE_API_BASE || "http://18.206.179.50:4000";

/* ======================= HELPERS ======================= */
function getQueryParams() {
  if (typeof window === "undefined") return { orderId: null as string | null };
  const params = new URLSearchParams(window.location.search);
  return {
    orderId: params.get("reserva"),
  };
}

function normalizeName(name?: string | null) {
  return (name || "").trim().toUpperCase();
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

  /* ======================= CARGA INICIAL ======================= */
  useEffect(() => {
    const { orderId } = getQueryParams();

    if (orderId) {
      (async () => {
        try {
          const resp = await fetch(`${API_BASE}/api/checkin/por-reserva/${orderId}`);
          const json = await resp.json();

          if (!json.ok || !json.data) {
            fallbackFromLocalStorage();
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
            telefono: p.phone  || "",
            email: p.email || "",
            motivoViaje: p.motivoViaje || "",
            fechaIngreso: p.fechaIngreso || "",
            fechaSalida: p.fechaSalida || "",
          };

          setReserva({
            numeroReserva: p.numeroReserva,
            nombre: p.nombre,
            email: p.email,
            telefono: p.telefono,
            checkin: p.fechaIngreso,
            checkout: p.fechaSalida,
            room_id: null,
            lockId: undefined,
          });

          setFormList([huesped]);
          localStorage.setItem("reserva", JSON.stringify(p));
        } catch {
          fallbackFromLocalStorage();
        }
      })();
      return;
    }

    fallbackFromLocalStorage();
  }, []);

  /* ======================= FALLBACK LOCAL STORAGE ======================= */
  function fallbackFromLocalStorage() {
    const data = localStorage.getItem("reserva");
    if (data) {
      try {
        const parsed = JSON.parse(data);

        const huesped: Huesped = {
          ...nuevoHuesped(),
          nombre: parsed.nombre || parsed.name || "",
          tipoDocumento: "",
          numeroDocumento: "",
          nacionalidad: "",
          direccion: "",
          lugarProcedencia: "",
          lugarDestino: "",
          telefono: parsed.phone  || "",
          email: parsed.email || "",
          motivoViaje: parsed.motivoViaje || "",
          fechaIngreso: parsed.fechaIngreso || "",
          fechaSalida: parsed.fechaSalida || "",
        };

        setReserva({
          numeroReserva: parsed.numeroReserva || "",
          nombre: parsed.nombre || "",
          email: parsed.email || "",
          telefono: parsed.telefono || "",
          checkin: parsed.fechaIngreso,
          checkout: parsed.fechaSalida,
          room_id: null,
          lockId: undefined,
        });

        setFormList([huesped]);
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

  const handleAddGuest = () =>
    setFormList((prev) => [...prev, nuevoHuesped()]);

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
  
      const checkinUrl =
        `${window.location.protocol}//${window.location.host}/checkin?reserva=${reserva?.numeroReserva || ""}`;
  
      const fd = new FormData();
  
      // ==========================================
      // 🔥 1. Agregamos los datos en JSON
      // ==========================================
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
        })
      );
  
      // ==========================================
      // 🔥 2. AGREGAR LOS ARCHIVOS REALES AL FORM DATA
      // ==========================================
      listaConMotivo.forEach((h, idx) => {
        if (h.archivoCedula)
          fd.append(`archivoCedula_${idx}`, h.archivoCedula);
  
        if (h.archivoFirma)
          fd.append(`archivoFirma_${idx}`, h.archivoFirma);
  
        if (h.archivoPasaporte)
          fd.append(`archivoPasaporte_${idx}`, h.archivoPasaporte);
      });
  
      // ==========================================
      // 🔥 3. Enviar el FormData completo
      // ==========================================
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
  

  /* ======================= RETORNO ======================= */
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
