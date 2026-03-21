import { } from "react";
import { useAdminAuth } from "./hooks/useAdminAuth";
import { useAdminDashboard } from "./hooks/useAdminDashboard";
import {
  btnLogout,
  card,
  container,
  loginBox,
  loginContainer,
  modal,
  modalBox,
  btnToggle,
  btnMoney,
  input,
  label,
  textarea,
  summaryBox,
  zoomOverlay,
  zoomImage,
  ttlockBadge,
  paymentBadge,
} from "./admin.styles";
import { LoginView } from "./components/LoginView";
import { MetricsPanel } from "./components/MetricsPanel";
import { AdminToolbar } from "./components/AdminToolbar";
import { GuestsTable } from "./components/GuestsTable";
import { GuestDetailModal } from "./modals/GuestDetailModal";
import { TtlockModal } from "./modals/TtlockModal";
import { defaultCobro, formatMoney, ttlockText } from "./admin.utils";

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

        {dashboard.vista === "galeria" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "1rem",
              marginTop: "1rem",
            }}
          >
            {dashboard.filtrados.map((h) => {
              const cobro = dashboard.cobrosMap[h.numeroReserva];
              const thumb = h._thumbUrl;

              return (
                <div
                  key={h.id}
                  style={{
                    background: "#020617",
                    border: "1px solid #1e293b",
                    borderRadius: "1rem",
                    padding: "1rem",
                    color: "white",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={h.nombre}
                      onClick={() => dashboard.setImagenZoom(thumb)}
                      style={{
                        width: "100%",
                        height: "180px",
                        objectFit: "cover",
                        borderRadius: "0.75rem",
                        cursor: "zoom-in",
                        border: "1px solid #1f2937",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "180px",
                        borderRadius: "0.75rem",
                        background: "linear-gradient(135deg,#1e293b,#020617)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "2.2rem",
                        fontWeight: 700,
                        border: "1px solid #1f2937",
                      }}
                    >
                      {h.nombre?.trim()?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}

                  <h3 style={{ margin: 0, fontSize: "1rem" }}>{h.nombre}</h3>

                  <p style={{ margin: 0 }}>
                    <b>Documento:</b> {h.tipoDocumento} {h.numeroDocumento}
                  </p>
                  <p style={{ margin: 0 }}>
                    <b>Tel:</b> {h.telefono || "-"}
                  </p>
                  <p style={{ margin: 0 }}>
                    <b>Email:</b> {h.email || "-"}
                  </p>
                  <p style={{ margin: 0 }}>
                    <b>Ingreso:</b> {h.fechaIngreso || "-"}
                  </p>
                  <p style={{ margin: 0 }}>
                    <b>Salida:</b> {h.fechaSalida || "-"}
                  </p>
                  <p style={{ margin: 0 }}>
                    <b>Reserva:</b> {h.numeroReserva}
                  </p>
                  <p style={{ margin: 0 }}>
                    <b>TTLock:</b>{" "}
                    <span style={ttlockBadge}>{ttlockText(h.codigoTTLock)}</span>
                  </p>
                  <p style={{ margin: 0 }}>
                    <b>Total:</b> {formatMoney(cobro?.totalHospedaje, cobro?.moneda || "COP")}
                  </p>
                  <p style={{ margin: 0 }}>
                    <b>Saldo:</b> {formatMoney(cobro?.saldoPendiente, cobro?.moneda || "COP")}
                  </p>
                  <p style={{ margin: 0 }}>
                    <b>Estado:</b>{" "}
                    <span style={paymentBadge(cobro?.estadoPago || "PENDING")}>
                      {cobro?.estadoPago || "PENDING"}
                    </span>
                  </p>

                  {h.checkinUrl ? (
                    <a
                      href={h.checkinUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: "#38bdf8",
                        textDecoration: "underline",
                        marginTop: "0.25rem",
                        fontSize: "0.92rem",
                      }}
                    >
                      Abrir check-in
                    </a>
                  ) : (
                    <span style={{ opacity: 0.6, fontSize: "0.92rem" }}>Sin check-in</span>
                  )}

                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      marginTop: "0.75rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      style={{
                        background: "#2563eb",
                        color: "white",
                        border: "none",
                        padding: "0.4rem 0.7rem",
                        borderRadius: "0.45rem",
                        cursor: "pointer",
                      }}
                      onClick={() => dashboard.setDetalle(h)}
                      title="Ver detalle"
                    >
                      👁
                    </button>

                    <button
                      style={{
                        background: "#16a34a",
                        color: "white",
                        border: "none",
                        padding: "0.4rem 0.7rem",
                        borderRadius: "0.45rem",
                        cursor: "pointer",
                      }}
                      onClick={() => dashboard.abrirModalCobro(h)}
                      title="Editar cobro"
                    >
                      💰
                    </button>

                    <button
                      style={{
                        background: "#f59e0b",
                        color: "white",
                        border: "none",
                        padding: "0.4rem 0.7rem",
                        borderRadius: "0.45rem",
                        cursor: "pointer",
                      }}
                      onClick={() => dashboard.abrirModalExtension(h)}
                      title="Gestionar TTLock"
                    >
                      🔐
                    </button>

                    <button
                      style={{
                        background: "#dc2626",
                        color: "white",
                        border: "none",
                        padding: "0.4rem 0.7rem",
                        borderRadius: "0.45rem",
                        cursor: "pointer",
                      }}
                      onClick={() => dashboard.eliminar(h.id)}
                      title="Eliminar"
                    >
                      ❌
                    </button>
                  </div>
                </div>
              );
            })}

            {dashboard.filtrados.length === 0 && (
              <div
                style={{
                  gridColumn: "1 / -1",
                  padding: "1rem",
                  border: "1px dashed #334155",
                  borderRadius: "0.8rem",
                  color: "#94a3b8",
                  background: "#020617",
                }}
              >
                No hay registros para mostrar en galería.
              </div>
            )}
          </div>
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
        activeLockIds={dashboard.activeLockIds}
        lastAssignResults={dashboard.lastAssignResults}
        onClose={dashboard.closeTtlockModal}
        onTogglePasscodeSelected={dashboard.togglePasscodeSelected}
        onToggleNewLockSelected={dashboard.toggleNewLockSelected}
        onGuardarExtension={dashboard.guardarExtensionTtlock}
        onEliminarSeleccionados={dashboard.eliminarPasscodesSeleccionados}
        onAsignarLocks={dashboard.asignarLocksSeleccionadas}
      />

      {dashboard.editCobroHuesped && (
        <div style={modal}>
          <div style={modalBox}>
            <h3>Configurar cobro de hospedaje</h3>

            <p>
              <b>Huésped:</b> {dashboard.editCobroHuesped.nombre}
            </p>
            <p>
              <b>Reserva:</b> {dashboard.editCobroHuesped.numeroReserva}
            </p>

            <div style={{ marginTop: "1rem" }}>
              <label style={label}>Total hospedaje</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={dashboard.editCobro.totalHospedaje}
                onChange={(e) =>
                  dashboard.recalcularSaldo(
                    Number(e.target.value || 0),
                    dashboard.editCobro.anticipo
                  )
                }
                style={input}
              />
            </div>

            <div style={{ marginTop: "1rem" }}>
              <label style={label}>Anticipo</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={dashboard.editCobro.anticipo}
                onChange={(e) =>
                  dashboard.recalcularSaldo(
                    dashboard.editCobro.totalHospedaje,
                    Number(e.target.value || 0)
                  )
                }
                style={input}
              />
            </div>

            <div style={{ marginTop: "1rem" }}>
              <label style={label}>Saldo pendiente</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={dashboard.editCobro.saldoPendiente}
                onChange={(e) =>
                  dashboard.setEditCobro((prev) => ({
                    ...prev,
                    saldoPendiente: Number(e.target.value || 0),
                  }))
                }
                style={input}
              />
            </div>

            <div style={{ marginTop: "1rem" }}>
              <label style={label}>Moneda</label>
              <select
                value={dashboard.editCobro.moneda}
                onChange={(e) =>
                  dashboard.setEditCobro((prev) => ({
                    ...prev,
                    moneda: e.target.value,
                  }))
                }
                style={input}
              >
                <option value="COP">COP</option>
                <option value="USD">USD</option>
                <option value="BRL">BRL</option>
                <option value="EUR">EUR</option>
              </select>
            </div>

            <div style={{ marginTop: "1rem" }}>
              <label style={label}>Estado pago</label>
              <select
                value={dashboard.editCobro.estadoPago}
                onChange={(e) =>
                  dashboard.setEditCobro((prev) => ({
                    ...prev,
                    estadoPago: e.target.value as "PENDING" | "PARTIAL" | "APPROVED",
                  }))
                }
                style={input}
              >
                <option value="PENDING">PENDING</option>
                <option value="PARTIAL">PARTIAL</option>
                <option value="APPROVED">APPROVED</option>
              </select>
            </div>

            <div style={{ marginTop: "1rem" }}>
              <label style={label}>Observación</label>
              <textarea
                value={dashboard.editCobro.observacion || ""}
                onChange={(e) =>
                  dashboard.setEditCobro((prev) => ({
                    ...prev,
                    observacion: e.target.value,
                  }))
                }
                style={textarea}
              />
            </div>

            <div style={summaryBox}>
              <div>
                <b>Total:</b> {formatMoney(dashboard.editCobro.totalHospedaje, dashboard.editCobro.moneda)}
              </div>
              <div>
                <b>Anticipo:</b> {formatMoney(dashboard.editCobro.anticipo, dashboard.editCobro.moneda)}
              </div>
              <div>
                <b>Saldo:</b> {formatMoney(dashboard.editCobro.saldoPendiente, dashboard.editCobro.moneda)}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                marginTop: "1rem",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => {
                  dashboard.setEditCobroHuesped(null);
                  dashboard.setEditCobro(defaultCobro());
                }}
                style={btnToggle}
                disabled={dashboard.savingCobro}
              >
                Cancelar
              </button>

              <button
                onClick={dashboard.guardarCobro}
                style={btnMoney}
                disabled={dashboard.savingCobro}
              >
                {dashboard.savingCobro ? "Guardando..." : "Guardar cobro"}
              </button>
            </div>
          </div>
        </div>
      )}

      {dashboard.imagenZoom && (
        <div style={zoomOverlay} onClick={() => dashboard.setImagenZoom(null)}>
          <img
            src={dashboard.imagenZoom}
            style={zoomImage}
            alt="Zoom"
            loading="eager"
            decoding="async"
          />
        </div>
      )}
    </div>
  );
}
