import React from "react";
import { btnExcel, btnScope, btnToggle, input } from "../admin.styles";
import type { ScopeDashboard, VistaDashboard } from "../admin.types";

type Props = {
  vista: VistaDashboard;
  scope: ScopeDashboard;
  filtro: string;
  onExportExcel: () => void;
  onToggleVista: () => void;
  onToggleScope: () => void;
  onFiltroChange: (value: string) => void;
};

export function AdminToolbar({
  vista,
  scope,
  filtro,
  onExportExcel,
  onToggleVista,
  onToggleScope,
  onFiltroChange,
}: Props) {
  return (
    <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
      <button onClick={onExportExcel} style={btnExcel}>📥 Excel</button>

      <button onClick={onToggleVista} style={btnToggle}>
        {vista === "tabla" ? "📸 Galería" : "📋 Tabla"}
      </button>

      <button onClick={onToggleScope} style={btnScope} title="Cambiar alcance de datos">
        {scope === "hoy" ? "📅 Mostrando: HOY" : "🗂️ Mostrando: TODOS"}
      </button>

      <input
        placeholder="Buscar..."
        value={filtro}
        onChange={(e) => onFiltroChange(e.target.value)}
        style={input}
      />
    </div>
  );
}