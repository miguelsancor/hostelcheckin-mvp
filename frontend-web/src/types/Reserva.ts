export type Reserva = {
  id: number;
  codigoReserva: string;
  fechaLlegada: string;
  fechaSalida: string;
  estado: string;
  huespedes: Huesped[];
};

export type Huesped = {
  id: number;
  nombreCompleto: string;
  tipoDocumento: string;
  numeroDocumento: string;
  nacionalidad: string;
  direccion: string;
  telefono: string;
  email?: string;
  lugarProcedencia: string;
  lugarDestino: string;
  fechaLlegada: string;
  fechaSalida: string;
  motivoViaje: string;
};
