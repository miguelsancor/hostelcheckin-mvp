export type Huesped = {
    nombre?: string;
    tipoDocumento?: string;
    numeroDocumento?: string;
    nacionalidad?: string;
    direccion?: string;
    lugarProcedencia?: string;
    lugarDestino?: string;
    telefono?: string;
    email?: string;
    motivoViaje?: string;
    fechaIngreso?: string;
    fechaSalida?: string;
    archivoAnverso?: File;
    archivoReverso?: File;
    archivoFirma?: File;
  
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
  
  export type Reserva = {
    numeroReserva?: string;
    lockId?: number;
    nombre?: string;
    email?: string;
    telefono?: string;
    checkin?: string;
    checkout?: string;
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
  