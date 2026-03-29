import { useState } from "react";
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

const PAGE_SIZE = 10;

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
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const paged = filtrados.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset page when filter changes
  const prevLen = useState(filtrados.length);
  if (prevLen[0] !== filtrados.length) {
    prevLen[0] = filtrados.length;
    if (page >= totalPages) setPage(0);
  }

  const maxVisible = 7;
  const pageNumbers: (number | "...")[] = [];
  if (totalPages <= maxVisible) {
    for (let i = 0; i < totalPages; i++) pageNumbers.push(i);
  } else {
    pageNumbers.push(0);
    if (page > 3) pageNumbers.push("...");
    const start = Math.max(1, page - 1);
    const end = Math.min(totalPages - 2, page + 1);
    for (let i = start; i <= end; i++) pageNumbers.push(i);
    if (page < totalPages - 4) pageNumbers.push("...");
    pageNumbers.push(totalPages - 1);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
      {/* Contador */}
      <div style={paginationInfo}>
        <span>
          Mostrando <strong>{paged.length}</strong> de <strong>{filtrados.length}</strong> registros
        </span>
        <span style={{ color: "#64748b", fontSize: "0.8rem" }}>
          Página {page + 1} de {totalPages}
        </span>
      </div>

      <div style={tablaWrapper}>
        <table style={tabla}>
          <thead>
            <tr>
              <th style={thModern}>ID</th>
              <th style={thModern}>Nombre</th>
              <th style={thModern}>Documento</th>
              <th style={thModern}>Teléfono</th>
              <th style={thModern}>Email</th>
              <th style={thModern}>Ingreso</th>
              <th style={thModern}>Salida</th>
              <th style={thModern}>Reserva</th>
              <th style={thModern}>Cobro</th>
              <th style={thModern}>Saldo</th>
              <th style={thModern}>Estado Pago</th>
              <th style={thModern}>Checkin</th>
              <th style={thModern}>TTLock</th>
              <th style={thModern}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((h, idx) => {
              const cobro = cobrosMap[h.numeroReserva];
              const globalIdx = page * PAGE_SIZE + idx;

              return (
                <tr key={h.id} style={globalIdx % 2 === 0 ? trEvenModern : trOddModern}>
                  <td style={tdModern}>{h.id}</td>
                  <td style={{ ...tdModern, fontWeight: 600 }}>{h.nombre}</td>
                  <td style={tdModern}>
                    <span style={docBadge}>{h.tipoDocumento}</span> {h.numeroDocumento}
                  </td>
                  <td style={tdModern}>{h.telefono}</td>
                  <td style={{ ...tdModern, maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {h.email}
                  </td>
                  <td style={tdModern}>{h.fechaIngreso}</td>
                  <td style={tdModern}>{h.fechaSalida}</td>
                  <td style={tdModern}>
                    <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>{h.numeroReserva}</span>
                  </td>
                  <td style={tdModern}>{formatMoney(cobro?.totalHospedaje, cobro?.moneda || "COP")}</td>
                  <td style={tdModern}>{formatMoney(cobro?.saldoPendiente, cobro?.moneda || "COP")}</td>
                  <td style={tdModern}>
                    <span style={paymentBadge(cobro?.estadoPago || "PENDING")}>
                      {cobro?.estadoPago || "PENDING"}
                    </span>
                  </td>
                  <td style={tdModern}>
                    {h.checkinUrl ? (
                      <a href={h.checkinUrl} target="_blank" rel="noreferrer" style={linkModern}>
                        abrir
                      </a>
                    ) : (
                      <span style={{ color: "#475569" }}>—</span>
                    )}
                  </td>
                  <td style={{ ...tdModern, fontWeight: 700, color: "#facc15" }}>
                    {ttlockText(h.codigoTTLock)}
                  </td>
                  <td style={{ ...tdModern, display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    <button style={btnAction("#3b82f6")} onClick={() => onDetalle(h)} title="Ver detalle">👁</button>
                    <button style={btnAction("#16a34a")} onClick={() => onCobro(h)} title="Editar cobro">💰</button>
                    <button style={btnAction("#f59e0b")} onClick={() => onTtlock(h)} title="Gestionar TTLock">🔐</button>
                    <button style={btnAction("#dc2626")} onClick={() => onEliminar(h.id)} title="Eliminar">✕</button>
                  </td>
                </tr>
              );
            })}

            {filtrados.length === 0 && (
              <tr>
                <td style={{ ...tdModern, padding: "2rem", textAlign: "center", color: "#64748b" }} colSpan={14}>
                  No hay registros para mostrar (scope: {scope}).
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div style={paginationBar}>
          <button
            style={page === 0 ? paginationBtnDisabled : paginationBtn}
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
          >
            ‹ Anterior
          </button>

          <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap", justifyContent: "center" }}>
            {pageNumbers.map((n, i) =>
              n === "..." ? (
                <span key={`e${i}`} style={{ color: "#64748b", padding: "0.4rem 0.5rem", fontSize: "0.85rem" }}>
                  …
                </span>
              ) : (
                <button
                  key={n}
                  style={n === page ? paginationBtnActive : paginationBtn}
                  onClick={() => setPage(n)}
                >
                  {n + 1}
                </button>
              )
            )}
          </div>

          <button
            style={page >= totalPages - 1 ? paginationBtnDisabled : paginationBtn}
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
          >
            Siguiente ›
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Estilos modernos 2026 ─── */

const thModern: React.CSSProperties = {
  ...th,
  background: "linear-gradient(180deg, #0f172a 0%, #0a101e 100%)",
  fontSize: "0.78rem",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "#64748b",
  fontWeight: 600,
  padding: "0.85rem 0.75rem",
  borderBottom: "2px solid #1e293b",
};

const tdModern: React.CSSProperties = {
  ...td,
  fontSize: "0.88rem",
  padding: "0.65rem 0.75rem",
  borderBottom: "1px solid rgba(30,41,59,0.5)",
  transition: "background 0.15s",
};

const trEvenModern: React.CSSProperties = {
  background: "rgba(15,23,42,0.4)",
  transition: "background 0.15s",
};

const trOddModern: React.CSSProperties = {
  background: "rgba(2,6,23,0.6)",
  transition: "background 0.15s",
};

const docBadge: React.CSSProperties = {
  display: "inline-block",
  padding: "0.1rem 0.4rem",
  borderRadius: "0.3rem",
  background: "#1e293b",
  color: "#94a3b8",
  fontSize: "0.72rem",
  fontWeight: 600,
  marginRight: "0.3rem",
};

const linkModern: React.CSSProperties = {
  color: "#38bdf8",
  textDecoration: "none",
  fontWeight: 600,
  fontSize: "0.85rem",
  borderBottom: "1px dashed #38bdf8",
  paddingBottom: "1px",
};

const btnAction = (bg: string): React.CSSProperties => ({
  background: "transparent",
  color: "#fff",
  border: `1px solid ${bg}`,
  padding: "0.3rem 0.55rem",
  borderRadius: "0.4rem",
  cursor: "pointer",
  fontSize: "0.85rem",
  transition: "all 0.15s",
  lineHeight: 1,
});

const paginationInfo: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "0.6rem 0.75rem",
  fontSize: "0.85rem",
  color: "#94a3b8",
  background: "linear-gradient(180deg, #0c1322 0%, #0a0f1a 100%)",
  borderRadius: "0.8rem 0.8rem 0 0",
  border: "1px solid #1e293b",
  borderBottom: "none",
};

const paginationBar: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: "0.75rem",
  padding: "0.75rem",
  background: "linear-gradient(180deg, #0a0f1a 0%, #0c1322 100%)",
  borderRadius: "0 0 0.8rem 0.8rem",
  border: "1px solid #1e293b",
  borderTop: "none",
  flexWrap: "wrap",
};

const paginationBtn: React.CSSProperties = {
  background: "#1e293b",
  color: "#e2e8f0",
  border: "1px solid #334155",
  padding: "0.4rem 0.75rem",
  borderRadius: "0.45rem",
  cursor: "pointer",
  fontSize: "0.82rem",
  fontWeight: 500,
  transition: "all 0.15s",
};

const paginationBtnActive: React.CSSProperties = {
  background: "linear-gradient(135deg, #2563eb, #3b82f6)",
  color: "#fff",
  border: "1px solid #3b82f6",
  padding: "0.4rem 0.75rem",
  borderRadius: "0.45rem",
  cursor: "pointer",
  fontSize: "0.82rem",
  fontWeight: 700,
  boxShadow: "0 0 12px rgba(59,130,246,0.3)",
};

const paginationBtnDisabled: React.CSSProperties = {
  background: "#0f172a",
  color: "#334155",
  border: "1px solid #1e293b",
  padding: "0.4rem 0.75rem",
  borderRadius: "0.45rem",
  cursor: "not-allowed",
  fontSize: "0.82rem",
  fontWeight: 500,
};
