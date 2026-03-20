import React from "react";
import type { Huesped, HuespedEnriquecido, ReservaCobro, ScopeDashboard } from "../admin.types";
import { formatMoney, ttlockText } from "../admin.utils";
import {
  btnDelete,
  btnEye,
  btnMoney,
  btnTtlock,
  link,
  paymentBadge,
  tabla,
  tablaWrapper,
  td,
  th,
  trEven,
  trOdd,
} from "../admin.styles";

type Props = {
  filtrados: HuespedEnriquecido[];
  cobrosMap: Record<string, ReservaCobro>;
  scope: ScopeDashboard;
  onDetalle: (h: HuespedEnriquecido) => void;
  onCobro: (h: Huesped) => void;
  onTtlock: (h: Huesped) => void;
  onEliminar: (id: number) => void;
};

export function GuestsTable({
  filtrados,
  cobrosMap,
  scope,
  onDetalle,
  onCobro,
  onTtlock,
  onEliminar,
}: Props) {
  return (
    <div style={tablaWrapper}>
      <table style={tabla}>
        <thead>
          <tr>
            <th style={th}>ID</th>
            <th style={th}>Nombre</th>
            <th style={th}>Documento</th>
            <th style={th}>Teléfono</th>
            <th style={th}>Email</th>
            <th style={th}>Ingreso</th>
            <th style={th}>Salida</th>
            <th style={th}>Reserva</th>
            <th style={th}>Cobro</th>
            <th style={th}>Saldo</th>
            <th style={th}>Estado Pago</th>
            <th style={th}>Checkin</th>
            <th style={th}>TTLock</th>
            <th style={th}>Acción</th>
          </tr>
        </thead>
        <tbody>
          {filtrados.map((h, idx) => {
            const cobro = cobrosMap[h.numeroReserva];

            return (
              <tr key={h.id} style={idx % 2 === 0 ? trEven : trOdd}>
                <td style={td}>{h.id}</td>
                <td style={td}>{h.nombre}</td>
                <td style={td}>{h.tipoDocumento} - {h.numeroDocumento}</td>
                <td style={td}>{h.telefono}</td>
                <td style={td}>{h.email}</td>
                <td style={td}>{h.fechaIngreso}</td>
                <td style={td}>{h.fechaSalida}</td>
                <td style={td}>{h.numeroReserva}</td>
                <td style={td}>{formatMoney(cobro?.totalHospedaje, cobro?.moneda || "COP")}</td>
                <td style={td}>{formatMoney(cobro?.saldoPendiente, cobro?.moneda || "COP")}</td>
                <td style={td}>
                  <span style={paymentBadge(cobro?.estadoPago || "PENDING")}>
                    {cobro?.estadoPago || "PENDING"}
                  </span>
                </td>
                <td style={td}>
                  {h.checkinUrl ? (
                    <a href={h.checkinUrl} target="_blank" rel="noreferrer" style={link}>
                      abrir
                    </a>
                  ) : "-"}
                </td>
                <td style={{ ...td, fontWeight: 700, color: "#facc15" }}>
                  {ttlockText(h.codigoTTLock)}
                </td>
                <td style={{ ...td, display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <button style={btnEye} onClick={() => onDetalle(h)}>👁</button>
                  <button style={btnMoney} onClick={() => onCobro(h)} title="Editar cobro">💰</button>
                  <button style={btnTtlock} onClick={() => onTtlock(h)} title="Gestionar TTLock">🔐</button>
                  <button style={btnDelete} onClick={() => onEliminar(h.id)}>❌</button>
                </td>
              </tr>
            );
          })}

          {filtrados.length === 0 && (
            <tr>
              <td style={{ ...td, padding: "1rem" }} colSpan={14}>
                No hay registros para mostrar (scope: {scope}).
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}