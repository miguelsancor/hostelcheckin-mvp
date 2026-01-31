export type Huesped = {
  // ============================
  // DATOS PERSONALES
  // ============================
  nombre?: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
  nacionalidad?: string;
  fechaNacimiento?: string;

  telefono?: string;
  email?: string;

  // ============================
  // INFORMACIÓN DEL VIAJE
  // ============================
  direccion?: string;
  lugarProcedencia?: string;
  lugarDestino?: string;
  paisOrigen?: string;
  paisDestino?: string;

  motivoViaje?: string;

  fechaIngreso?: string;
  fechaSalida?: string;

  // ============================
  // DOCUMENTOS
  // ============================
  archivoCedula?: File;
  archivoFirma?: File;
  archivoPasaporte?: File;

  // ============================
  // DATOS DE RESERVA (YA NO EN TAB)
  // ============================
  referral?: string;
  status?: string;
  nights?: number;
  guests?: number;
  price?: number;
  total?: number;
  b_extras?: string;
  b_smoking?: string;
  b_meal?: string;
  comment?: string;
};


  // ============================
  // CAMPOS NUEVOS (AGREGADOS)
  // ============================
  fechaNacimiento?: string;
  paisOrigen?: string;
  paisDestino?: string;
};

export type Reserva = {
  numeroReserva?: string;
  lockId?: number;
  nombre?: string;
  email?: string;
  telefono?: string;
  checkin?: string;
  checkout?: string;
  room_id?: number;
};

export type LockItem = {
  lockId: number;
  lockAlias?: string;
  keyName?: string;
  lockName?: string;
};

export type HuespedBD = {
  id: number;
  nombre: string;
  numeroReserva: string;
  creadoEn: string;
};
