import { } from "react";
import { metricCard, metricsGrid } from "../admin.styles";

export function MetricsPanel({ metrics }: { metrics: any }) {
  if (!metrics) return null;

  return (
    <div style={metricsGrid}>
      <div style={metricCard}><h4>Total</h4><p>{metrics.total}</p></div>
      <div style={metricCard}><h4>Hoy</h4><p>{metrics.hoy}</p></div>
      <div style={metricCard}><h4>Este mes</h4><p>{metrics.mes}</p></div>
      <div style={metricCard}><h4>Última reserva</h4><p>{metrics.ultimaReserva}</p></div>
    </div>
  );
}