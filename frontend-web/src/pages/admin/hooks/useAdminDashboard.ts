import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  apiAssignLocks,
  apiDeleteHuesped,
  apiDeleteSelectedPasscodes,
  apiExtendPasscode,
  apiGetCobroByReserva,
  apiGetCobros,
  apiGetGuestPasscodes,
  apiGetHuespedes,
  apiGetLocks,
  apiGetMetrics,
  apiSaveCobro,
} from "../admin.api";
import type {
  GuestPasscode,
  Huesped,
  HuespedEnriquecido,
  LockItem,
  ReservaCobro,
  ScopeDashboard,
  VistaDashboard,
} from "../admin.types";
import {
  buildSearchText,
  defaultCobro,
  getSecureUploadUrl,
  getTodayString,
  normalizarFecha,
} from "../admin.utils";

export function useAdminDashboard(autenticado: boolean, onUnauthorized: () => void) {
  const [huespedes, setHuespedes] = useState<Huesped[]>([]);
  const [filtro, setFiltro] = useState("");
  const [metrics, setMetrics] = useState<any>(null);
  const [detalle, setDetalle] = useState<HuespedEnriquecido | null>(null);
  const [vista, setVista] = useState<VistaDashboard>("tabla");
  const [scope, setScope] = useState<ScopeDashboard>("todos");
  const [imagenZoom, setImagenZoom] = useState<string | null>(null);

  const [editTtlock, setEditTtlock] = useState<Huesped | null>(null);
  const [newTtlockEnd, setNewTtlockEnd] = useState("");
  const [savingTtlock, setSavingTtlock] = useState(false);

  const [guestPasscodes, setGuestPasscodes] = useState<GuestPasscode[]>([]);
  const [loadingGuestPasscodes, setLoadingGuestPasscodes] = useState(false);
  const [selectedPasscodes, setSelectedPasscodes] = useState<string[]>([]);
  const [deletingSelectedPasscodes, setDeletingSelectedPasscodes] = useState(false);

  const [allLocks, setAllLocks] = useState<LockItem[]>([]);
  const [loadingAllLocks, setLoadingAllLocks] = useState(false);
  const [selectedNewLocks, setSelectedNewLocks] = useState<number[]>([]);
  const [assigningLocks, setAssigningLocks] = useState(false);
  const [newPinCode, setNewPinCode] = useState("");

  const [cobrosMap, setCobrosMap] = useState<Record<string, ReservaCobro>>({});
  const [editCobroHuesped, setEditCobroHuesped] = useState<Huesped | null>(null);
  const [editCobro, setEditCobro] = useState<ReservaCobro>(defaultCobro());
  const [savingCobro, setSavingCobro] = useState(false);

  const resetDashboard = () => {
    setHuespedes([]);
    setMetrics(null);
    setDetalle(null);
    setCobrosMap({});
    setGuestPasscodes([]);
    setSelectedPasscodes([]);
    setAllLocks([]);
    setSelectedNewLocks([]);
    setEditTtlock(null);
    setEditCobroHuesped(null);
    setEditCobro(defaultCobro());
    setImagenZoom(null);
  };

  const cargarHuespedes = async () => {
    try {
      const lista = await apiGetHuespedes();
      setHuespedes(lista);
    } catch (e: any) {
      console.error(e);
      if (e?.message === "UNAUTHORIZED") {
        onUnauthorized();
        return;
      }
      alert("Error cargando huéspedes.");
      setHuespedes([]);
    }
  };

  const cargarMetrics = async () => {
    try {
      const json = await apiGetMetrics();
      setMetrics(json);
    } catch (e: any) {
      console.error(e);
      if (e?.message === "UNAUTHORIZED") {
        onUnauthorized();
        return;
      }
      setMetrics(null);
    }
  };

  const cargarCobros = async () => {
    try {
      const lista = await apiGetCobros();
      const map: Record<string, ReservaCobro> = {};

      for (const item of lista) {
        if (item?.numeroReserva) {
          map[item.numeroReserva] = item;
        }
      }

      setCobrosMap(map);
    } catch (e: any) {
      console.error(e);
      if (e?.message === "UNAUTHORIZED") {
        onUnauthorized();
        return;
      }
      setCobrosMap({});
    }
  };

  const cargarPasscodesGuest = async (huespedId: number) => {
    try {
      setLoadingGuestPasscodes(true);
      const list = await apiGetGuestPasscodes(huespedId);
      setGuestPasscodes(list);
    } catch (e: any) {
      console.error(e);
      setGuestPasscodes([]);
      alert(e?.message || "Error cargando passcodes del huésped.");
    } finally {
      setLoadingGuestPasscodes(false);
    }
  };

  const cargarTodasLasLocks = async () => {
    try {
      setLoadingAllLocks(true);
      const locks = await apiGetLocks();
      setAllLocks(locks);
    } catch (e) {
      console.error(e);
      setAllLocks([]);
      alert("Error cargando cerraduras TTLock.");
    } finally {
      setLoadingAllLocks(false);
    }
  };

  useEffect(() => {
    if (autenticado) {
      cargarHuespedes();
      cargarMetrics();
      cargarCobros();
    } else {
      resetDashboard();
    }
  }, [autenticado]);

  const huespedesPreparados = useMemo<HuespedEnriquecido[]>(() => {
    return huespedes.map((h) => {
      const cobro = cobrosMap[h.numeroReserva];
      const pasaporteUrl = getSecureUploadUrl(h.archivoPasaporte);
      const cedulaUrl = getSecureUploadUrl(h.archivoCedula);
      const firmaUrl = getSecureUploadUrl(h.archivoFirma);

      return {
        ...h,
        _searchText: buildSearchText(h, cobro),
        _pasaporteUrl: pasaporteUrl,
        _cedulaUrl: cedulaUrl,
        _firmaUrl: firmaUrl,
        _thumbUrl: pasaporteUrl || cedulaUrl || firmaUrl || null,
      };
    });
  }, [huespedes, cobrosMap]);

  const filtrados = useMemo(() => {
    let base = huespedesPreparados;

    if (scope === "hoy") {
      const hoyStr = getTodayString();
      base = base.filter((h) => normalizarFecha(h.fechaIngreso) === hoyStr);
    }

    const f = filtro.toLowerCase().trim();
    if (!f) return base;

    return base.filter((h) => h._searchText.includes(f));
  }, [huespedesPreparados, filtro, scope]);

  const activeLockIds = useMemo(() => {
    return new Set(guestPasscodes.map((x) => Number(x.lockId)));
  }, [guestPasscodes]);

  const locksDisponiblesParaAgregar = useMemo(() => {
    return allLocks.filter((lock) => !activeLockIds.has(Number(lock.lockId)));
  }, [allLocks, activeLockIds]);

  const eliminar = async (id: number) => {
    if (!confirm("¿Eliminar huésped?")) return;

    const res = await apiDeleteHuesped(id);
    if (res.status === 401) {
      onUnauthorized();
      return;
    }

    await Promise.all([cargarHuespedes(), cargarMetrics(), cargarCobros()]);
  };

  const exportarExcel = () => {
    const data = filtrados.map((h) => {
      const cobro = cobrosMap[h.numeroReserva];
      return {
        ID: h.id,
        Nombre: h.nombre,
        Documento: `${h.tipoDocumento} ${h.numeroDocumento}`,
        Nacionalidad: h.nacionalidad,
        Dirección: h.direccion,
        Procedencia: h.lugarProcedencia,
        Destino: h.lugarDestino,
        Teléfono: h.telefono,
        Email: h.email,
        Motivo: h.motivoViaje,
        Ingreso: h.fechaIngreso,
        Salida: h.fechaSalida,
        Reserva: h.numeroReserva,
        Checkin_URL: h.checkinUrl ?? "",
        TTLock: h.codigoTTLock ?? "",
        TotalHospedaje: cobro?.totalHospedaje ?? 0,
        Anticipo: cobro?.anticipo ?? 0,
        SaldoPendiente: cobro?.saldoPendiente ?? 0,
        Moneda: cobro?.moneda ?? "COP",
        EstadoPago: cobro?.estadoPago ?? "PENDING",
        ObservacionCobro: cobro?.observacion ?? "",
        Creado: h.creadoEn,
        Pasaporte: h.archivoPasaporte ?? "",
        Cedula: h.archivoCedula ?? "",
        Firma: h.archivoFirma ?? "",
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Huespedes");
    XLSX.writeFile(wb, `huespedes_${Date.now()}.xlsx`);
  };

  const abrirModalExtension = async (h: Huesped) => {
    setEditTtlock(h);
    setGuestPasscodes([]);
    setSelectedPasscodes([]);
    setSelectedNewLocks([]);
    setNewPinCode(h.codigoTTLock || "");

    const baseDate = normalizarFecha(h.fechaSalida || "") || normalizarFecha(h.fechaIngreso || "");
    const defaultValue = baseDate ? `${baseDate}T12:00` : "";
    setNewTtlockEnd(defaultValue);

    await Promise.all([cargarPasscodesGuest(h.id), cargarTodasLasLocks()]);
  };

  const closeTtlockModal = () => {
    setEditTtlock(null);
    setNewTtlockEnd("");
    setGuestPasscodes([]);
    setSelectedPasscodes([]);
    setAllLocks([]);
    setSelectedNewLocks([]);
    setNewPinCode("");
  };

  const togglePasscodeSelected = (pc: GuestPasscode) => {
    const key = `${pc.lockId}_${pc.keyboardPwdId}`;
    setSelectedPasscodes((prev) =>
      prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]
    );
  };

  const toggleNewLockSelected = (lockId: number) => {
    setSelectedNewLocks((prev) =>
      prev.includes(lockId) ? prev.filter((x) => x !== lockId) : [...prev, lockId]
    );
  };

  const guardarExtensionTtlock = async () => {
    if (!editTtlock) return;

    if (!newTtlockEnd?.trim()) {
      alert("Debes seleccionar una nueva fecha/hora.");
      return;
    }

    try {
      setSavingTtlock(true);

      const { res, json } = await apiExtendPasscode(editTtlock.id, newTtlockEnd);

      if (!res.ok || !json?.ok) {
        alert(json?.error || "No se pudo extender el código TTLock.");
        return;
      }

      alert(`TTLock actualizado. Cerraduras actualizadas: ${json?.updated || 0}`);
      await cargarPasscodesGuest(editTtlock.id);
      await cargarHuespedes();
    } catch (e) {
      console.error(e);
      alert("Error actualizando TTLock.");
    } finally {
      setSavingTtlock(false);
    }
  };

  const asignarLocksSeleccionadas = async () => {
    if (!editTtlock) return;

    if (!selectedNewLocks.length) {
      alert("Debes seleccionar al menos una cerradura para asignar.");
      return;
    }

    if (!newTtlockEnd?.trim()) {
      alert("Debes indicar la fecha fin del código.");
      return;
    }

    try {
      setAssigningLocks(true);

      const startAt = Date.now();
      const endAt = new Date(newTtlockEnd).getTime();

      if (!Number.isFinite(endAt) || endAt <= startAt) {
        alert("La fecha fin debe ser mayor a la fecha actual.");
        return;
      }

      const { res, json } = await apiAssignLocks({
        huespedId: editTtlock.id,
        lockIds: selectedNewLocks,
        startAt,
        endAt,
        code: newPinCode?.trim() || undefined,
        name: `RES-${editTtlock.numeroReserva}`,
      });

      if (!res.ok || !json?.ok) {
        alert(json?.error || "No se pudieron asignar las cerraduras.");
        return;
      }

      alert(
        `Proceso completado. Asignadas: ${json?.asignadas || 0}. Ya existentes: ${json?.yaExistian || 0}. PIN: ${json?.pin || "-"}`
      );

      setNewPinCode(json?.pin || "");
      setSelectedNewLocks([]);

      await Promise.all([
        cargarPasscodesGuest(editTtlock.id),
        cargarTodasLasLocks(),
        cargarHuespedes(),
      ]);
    } catch (e) {
      console.error(e);
      alert("Error asignando cerraduras.");
    } finally {
      setAssigningLocks(false);
    }
  };

  const eliminarPasscodesSeleccionados = async () => {
    if (!editTtlock) return;

    const items = selectedPasscodes
      .map((key) => {
        const [lockId, keyboardPwdId] = key.split("_");
        return {
          lockId: Number(lockId),
          keyboardPwdId: Number(keyboardPwdId),
        };
      })
      .filter((x) => x.lockId && x.keyboardPwdId);

    if (!items.length) {
      alert("Debes seleccionar al menos una cerradura/passcode.");
      return;
    }

    if (!confirm(`¿Eliminar ${items.length} passcode(s) seleccionados de TTLock?`)) {
      return;
    }

    try {
      setDeletingSelectedPasscodes(true);

      const { res, json } = await apiDeleteSelectedPasscodes({
        huespedId: editTtlock.id,
        items,
      });

      if (!res.ok || !json?.ok) {
        alert(json?.error || "No se pudieron eliminar los passcodes seleccionados.");
        return;
      }

      alert(`Passcodes eliminados correctamente: ${json?.deleted || 0}`);
      setSelectedPasscodes([]);

      await Promise.all([
        cargarPasscodesGuest(editTtlock.id),
        cargarTodasLasLocks(),
        cargarHuespedes(),
      ]);
    } catch (e) {
      console.error(e);
      alert("Error eliminando passcodes seleccionados.");
    } finally {
      setDeletingSelectedPasscodes(false);
    }
  };

  const abrirModalCobro = async (h: Huesped) => {
    try {
      setEditCobroHuesped(h);

      const local = cobrosMap[h.numeroReserva];
      if (local) {
        setEditCobro({
          ...defaultCobro(h),
          ...local,
          numeroReserva: h.numeroReserva,
          huespedId: h.id,
        });
        return;
      }

      const { res, json } = await apiGetCobroByReserva(h.numeroReserva);

      if (res.status === 401) {
        onUnauthorized();
        return;
      }

      const cobro = json?.cobro;

      setEditCobro({
        ...defaultCobro(h),
        ...(cobro || {}),
        numeroReserva: h.numeroReserva,
        huespedId: h.id,
      });
    } catch (e) {
      console.error(e);
      setEditCobro(defaultCobro(h));
    }
  };

  const recalcularSaldo = (nextTotal?: number, nextAnticipo?: number) => {
    const total = Number(nextTotal ?? editCobro.totalHospedaje ?? 0);
    const anticipo = Number(nextAnticipo ?? editCobro.anticipo ?? 0);
    const saldo = Math.max(0, total - anticipo);

    setEditCobro((prev) => ({
      ...prev,
      totalHospedaje: total,
      anticipo,
      saldoPendiente: saldo,
      estadoPago: saldo <= 0 ? "APPROVED" : anticipo > 0 ? "PARTIAL" : "PENDING",
    }));
  };

  const guardarCobro = async () => {
    try {
      if (!editCobroHuesped) return;

      if (!editCobro.numeroReserva.trim()) {
        alert("La reserva es obligatoria.");
        return;
      }

      setSavingCobro(true);

      const payload: ReservaCobro = {
        numeroReserva: editCobro.numeroReserva.trim(),
        huespedId: editCobroHuesped.id,
        totalHospedaje: Number(editCobro.totalHospedaje || 0),
        anticipo: Number(editCobro.anticipo || 0),
        saldoPendiente: Number(editCobro.saldoPendiente || 0),
        moneda: editCobro.moneda || "COP",
        estadoPago: editCobro.estadoPago || "PENDING",
        observacion: editCobro.observacion || "",
      };

      const { res, json } = await apiSaveCobro(payload);

      if (!res.ok || !json?.ok) {
        alert(json?.error || "No se pudo guardar el cobro.");
        return;
      }

      alert("Cobro guardado correctamente.");

      setCobrosMap((prev) => ({
        ...prev,
        [payload.numeroReserva]: json.cobro,
      }));

      setEditCobroHuesped(null);
      setEditCobro(defaultCobro());
      await cargarCobros();
    } catch (e) {
      console.error(e);
      alert("Error guardando cobro.");
    } finally {
      setSavingCobro(false);
    }
  };

  return {
    huespedes,
    filtro,
    setFiltro,
    metrics,
    detalle,
    setDetalle,
    vista,
    setVista,
    scope,
    setScope,
    imagenZoom,
    setImagenZoom,
    cobrosMap,
    filtrados,
    eliminar,
    exportarExcel,

    editTtlock,
    newTtlockEnd,
    setNewTtlockEnd,
    savingTtlock,
    guestPasscodes,
    loadingGuestPasscodes,
    selectedPasscodes,
    deletingSelectedPasscodes,
    allLocks,
    loadingAllLocks,
    selectedNewLocks,
    assigningLocks,
    newPinCode,
    setNewPinCode,
    locksDisponiblesParaAgregar,
    abrirModalExtension,
    closeTtlockModal,
    togglePasscodeSelected,
    toggleNewLockSelected,
    guardarExtensionTtlock,
    asignarLocksSeleccionadas,
    eliminarPasscodesSeleccionados,

    editCobroHuesped,
    editCobro,
    setEditCobro,
    savingCobro,
    abrirModalCobro,
    recalcularSaldo,
    guardarCobro,
    setEditCobroHuesped,
    cargarHuespedes,
    cargarMetrics,
    cargarCobros,
    resetDashboard,
  };
}