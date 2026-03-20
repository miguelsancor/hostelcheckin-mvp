import React from "react";
import { useAdminAuth } from "./hooks/useAdminAuth";
import { useAdminDashboard } from "./hooks/useAdminDashboard";
import { btnLogout, card, container, galeriaGrid, loginBox, loginContainer } from "./admin.styles";
import { LoginView } from "./components/LoginView";
import { MetricsPanel } from "./components/MetricsPanel";
import { AdminToolbar } from "./components/AdminToolbar";
import { GalleryCard } from "./components/GalleryCard";
import { GuestsTable } from "./components/GuestsTable";
import { GuestDetailModal } from "./modals/GuestDetailModal";
import { TtlockModal } from "./modals/TtlockModal";
import { CobroModal } from "./modals/CobroModal";
import { ImageZoomModal } from "./modals/ImageZoomModal";
import { defaultCobro } from "./admin.utils";

export default function AdminDashboard() {
  const auth = useAdminAuth();

  const dashboard = useAdminDashboard(auth.autenticado, () => {
    auth.setAutenticado(false);
  });

  const handleLogout = async () => {
    await auth.logout();
    dashboard.resetDashboard();
  };

  if (auth.checkingSession) {
    return (
      <div style={loginContainer}>
        <div style={loginBox}>
          <h2>Validando sesión...</h2>
        </div>
      </div>
    );
  }

  if (!auth.autenticado) {
    return (
      <LoginView
        username={auth.username}
        password={auth.password}
        loginLoading={auth.loginLoading}
        onUsernameChange={auth.setUsername}
        onPasswordChange={auth.setPassword}
        onLogin={auth.login}
      />
    );
  }

  return (
    <div style={container}>
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <h1>Dashboard Administrativo</h1>
          <button onClick={handleLogout} style={btnLogout}>Salir</button>
        </div>

        <MetricsPanel metrics={dashboard.metrics} />

        <AdminToolbar
          vista={dashboard.vista}
          scope={dashboard.scope}
          filtro={dashboard.filtro}
          onExportExcel={dashboard.exportarExcel}
          onToggleVista={() =>
            dashboard.setVista(dashboard.vista === "tabla" ? "galeria" : "tabla")
          }
          onToggleScope={() =>
            dashboard.setScope(dashboard.scope === "hoy" ? "todos" : "hoy")
          }
          onFiltroChange={dashboard.setFiltro}
        />

        {dashboard.vista === "galeria" && (
          <div style={galeriaGrid}>
            {dashboard.filtrados.map((h) => {
              const cobro = dashboard.cobrosMap[h.numeroReserva];

              return (
                <GalleryCard
                  key={h.id}
                  h={h}
                  cobro={cobro}
                  onDetalle={(guest) => dashboard.setDetalle(guest as any)}
                  onCobro={dashboard.abrirModalCobro}
                  onTtlock={dashboard.abrirModalExtension}
                  onEliminar={dashboard.eliminar}
                  onZoom={dashboard.setImagenZoom}
                />
              );
            })}
          </div>
        )}

        {dashboard.vista === "tabla" && (
          <GuestsTable
            filtrados={dashboard.filtrados}
            cobrosMap={dashboard.cobrosMap}
            scope={dashboard.scope}
            onDetalle={dashboard.setDetalle}
            onCobro={dashboard.abrirModalCobro}
            onTtlock={dashboard.abrirModalExtension}
            onEliminar={dashboard.eliminar}
          />
        )}
      </div>

      <GuestDetailModal
        detalle={dashboard.detalle}
        onClose={() => dashboard.setDetalle(null)}
        onZoom={dashboard.setImagenZoom}
      />

      <TtlockModal
        huesped={dashboard.editTtlock}
        newTtlockEnd={dashboard.newTtlockEnd}
        setNewTtlockEnd={dashboard.setNewTtlockEnd}
        savingTtlock={dashboard.savingTtlock}
        guestPasscodes={dashboard.guestPasscodes}
        loadingGuestPasscodes={dashboard.loadingGuestPasscodes}
        selectedPasscodes={dashboard.selectedPasscodes}
        deletingSelectedPasscodes={dashboard.deletingSelectedPasscodes}
        loadingAllLocks={dashboard.loadingAllLocks}
        locksDisponiblesParaAgregar={dashboard.locksDisponiblesParaAgregar}
        selectedNewLocks={dashboard.selectedNewLocks}
        assigningLocks={dashboard.assigningLocks}
        newPinCode={dashboard.newPinCode}
        setNewPinCode={dashboard.setNewPinCode}
        onClose={dashboard.closeTtlockModal}
        onTogglePasscodeSelected={dashboard.togglePasscodeSelected}
        onToggleNewLockSelected={dashboard.toggleNewLockSelected}
        onGuardarExtension={dashboard.guardarExtensionTtlock}
        onEliminarSeleccionados={dashboard.eliminarPasscodesSeleccionados}
        onAsignarLocks={dashboard.asignarLocksSeleccionadas}
      />

      <CobroModal
        huesped={dashboard.editCobroHuesped}
        cobro={dashboard.editCobro}
        savingCobro={dashboard.savingCobro}
        setCobro={dashboard.setEditCobro}
        onClose={() => {
          dashboard.setEditCobroHuesped(null);
          dashboard.setEditCobro(defaultCobro());
        }}
        onRecalcularSaldo={dashboard.recalcularSaldo}
        onGuardar={dashboard.guardarCobro}
      />

      <ImageZoomModal
        imagenZoom={dashboard.imagenZoom}
        onClose={() => dashboard.setImagenZoom(null)}
      />
    </div>
  );
}