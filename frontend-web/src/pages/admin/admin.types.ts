export type Huesped = {
  id: number;
  nombre: string;
  tipoDocumento: string;
  numeroDocumento: string;
  nacionalidad: string;
  direccion: string;
  lugarProcedencia: string;
  lugarDestino: string;
  telefono: string;
  email: string;
  motivoViaje: string;
  fechaIngreso: string;
  fechaSalida: string;
  numeroReserva: string;
  creadoEn: string;
  checkinUrl?: string | null;
  codigoTTLock?: string | null;
  archivoPasaporte?: string | null;
  archivoCedula?: string | null;
  archivoFirma?: string | null;
};

export type ReservaCobro = {
  id?: number;
  numeroReserva: string;
  huespedId?: number | null;
  totalHospedaje: number;
  anticipo: number;
  saldoPendiente: number;
  moneda: string;
  estadoPago: "PENDING" | "PARTIAL" | "APPROVED";
  observacion?: string | null;
  creadoEn?: string;
  actualizadoEn?: string;
};

export type HuespedEnriquecido = Huesped & {
  _searchText: string;
  _thumbUrl: string | null;
  _pasaporteUrl: string | null;
  _cedulaUrl: string | null;
  _firmaUrl: string | null;
};

export type GuestPasscode = {
  id: number;
  lockId: number;
  lockAlias?: string | null;
  codigo?: string | null;
  keyboardPwdId?: number | null;
  tipo?: string;
  estado?: string;
  ttlockOk?: boolean;
  ttlockMessage?: string | null;
  startDate?: number | null;
  endDate?: number | null;
  creadoEn?: string;
};

export type LockItem = {
  lockId: number;
  lockAlias?: string | null;
  electricQuantity?: number;
  keyboardPwdVersion?: number;
  specialValue?: number;
};

export type AssignLockResult = {
  lockId: number;
  lockAlias?: string | null;
  ok: boolean;
  skipped?: boolean;
  status: "asignada" | "ya_existia" | "reasignada" | "error_reasignar" | "error";
  message?: string;
  codigo?: string;
};

export type VistaDashboard = "tabla" | "galeria";
export type ScopeDashboard = "hoy" | "todos";
