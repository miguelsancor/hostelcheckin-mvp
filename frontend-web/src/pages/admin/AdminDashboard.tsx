import React from "react";
import { useAdminAuth } from "./hooks/useAdminAuth";
import { useAdminDashboard } from "./hooks/useAdminDashboard";
import {
  btnLogout,
  card,
  container,
  loginBox,
  loginContainer,
} from "./admin.styles";
import { LoginView } from "./components/LoginView";
import { MetricsPanel } from "./components/MetricsPanel";
import { AdminToolbar } from "./components/AdminToolbar";
import { GuestsTable } from "./components/GuestsTable";
import { GuestDetailModal } from "./modals/GuestDetailModal";
import { TtlockModal } from "./modals/TtlockModal";
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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <h1>Dashboard Administrativo</h1>
          <button onClick={handleLogout} style={btnLogout}>
            Salir
          </button>
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

        {/* Temporalmente dejamos solo la tabla, porque GalleryCard.tsx no existe aún */}
        <GuestsTable
          filtrados={dashboard.filtrados}
          cobrosMap={dashboard.cobrosMap}
          scope={dashboard.scope}
          onDetalle={dashboard.setDetalle}
          onCobro={dashboard.abrirModalCobro}
          onTtlock={dashboard.abrirModalExtension}
          onEliminar={dashboard.eliminar}
        />
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

      {/* Temporalmente desactivados porque esos archivos no existen todavía */}
      {dashboard.editCobroHuesped && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 10000,
          }}
        >
          <div
            style={{
              background: "#020617",
              padding: "2rem",
              borderRadius: "1rem",
              color: "white",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <h3>Configurar cobro de hospedaje</h3>

            <p><b>Huésped:</b> {dashboard.editCobroHuesped.nombre}</p>
            <p><b>Reserva:</b> {dashboard.editCobroHuesped.numeroReserva}</p>

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", flexWrap: "wrap" }}>
              <button
                onClick={() => {
                  dashboard.setEditCobroHuesped(null);
                  dashboard.setEditCobro(defaultCobro());
                }}
                style={{
                  background: "#334155",
                  color: "white",
                  border: "none",
                  padding: "0.5rem 1rem",
                  borderRadius: "0.6rem",
                  cursor: "pointer",
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {dashboard.imagenZoom && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.9)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 11000,
          }}
          onClick={() => dashboard.setImagenZoom(null)}
        >
          <img
            src={dashboard.imagenZoom}
            alt="Zoom"
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              borderRadius: "1rem",
              border: "2px solid #1d4ed8",
              objectFit: "contain",
            }}
          />
        </div>
      )}
    </div>
  );
}