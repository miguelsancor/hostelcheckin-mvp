import React from "react";
import type { HuespedEnriquecido } from "../admin.types";
import {
  btnClose,
  imagenDetalle,
  imagenesDetalleGrid,
  modal,
  modalBox,
  ttlockBadge,
} from "../admin.styles";
import { ttlockText } from "../admin.utils";
import { SmartImage } from "../components/SmartImage";

type Props = {
  detalle: HuespedEnriquecido | null;
  onClose: () => void;
  onZoom: (src: string) => void;
};

export function GuestDetailModal({ detalle, onClose, onZoom }: Props) {
  if (!detalle) return null;

  return (
    <div style={modal}>
      <div style={modalBox}>
        <h3>Detalle del Huésped</h3>

        <p><b>Nombre:</b> {detalle.nombre}</p>
        <p><b>Documento:</b> {detalle.tipoDocumento} {detalle.numeroDocumento}</p>
        <p><b>Nacionalidad:</b> {detalle.nacionalidad}</p>
        <p><b>Dirección:</b> {detalle.direccion}</p>
        <p><b>Procedencia:</b> {detalle.lugarProcedencia}</p>
        <p><b>Destino:</b> {detalle.lugarDestino}</p>
        <p><b>Motivo:</b> {detalle.motivoViaje}</p>
        <p><b>Email:</b> {detalle.email}</p>
        <p><b>Teléfono:</b> {detalle.telefono}</p>
        <p><b>Ingreso:</b> {detalle.fechaIngreso}</p>
        <p><b>Salida:</b> {detalle.fechaSalida}</p>
        <p><b>Reserva:</b> {detalle.numeroReserva}</p>
        <p><b>Checkin URL:</b> {detalle.checkinUrl ?? "-"}</p>
        <p>
          <b>Código TTLock:</b>{" "}
          <span style={ttlockBadge}>{ttlockText(detalle.codigoTTLock)}</span>
        </p>

        <div style={imagenesDetalleGrid}>
          {detalle._pasaporteUrl && (
            <SmartImage
              src={detalle._pasaporteUrl}
              style={imagenDetalle}
              alt="Pasaporte"
              onClick={() => onZoom(detalle._pasaporteUrl as string)}
            />
          )}
          {detalle._cedulaUrl && (
            <SmartImage
              src={detalle._cedulaUrl}
              style={imagenDetalle}
              alt="Cédula"
              onClick={() => onZoom(detalle._cedulaUrl as string)}
            />
          )}
          {detalle._firmaUrl && (
            <SmartImage
              src={detalle._firmaUrl}
              style={imagenDetalle}
              alt="Firma"
              onClick={() => onZoom(detalle._firmaUrl as string)}
            />
          )}
        </div>

        <button onClick={onClose} style={btnClose}>Cerrar</button>
      </div>
    </div>
  );
}