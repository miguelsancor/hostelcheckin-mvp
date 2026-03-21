import { } from "react";
import type { AssignLockResult, GuestPasscode, Huesped, LockItem } from "../admin.types";
import { formatDateTimeLocal, ttlockText } from "../admin.utils";
import {
  btnAssign,
  btnCloseSecondary,
  btnDeleteLarge,
  btnTtlock,
  emptyPasscodesBox,
  infoCard,
  infoLabel,
  infoValue,
  input,
  label,
  modal,
  modalBox,
  passcodeMeta,
  passcodeRow,
  passcodesList,
  passcodeTitle,
  sectionBox,
  ttlockBadge,
  ttlockInfoGrid,
} from "../admin.styles";

type Props = {
  huesped: Huesped | null;
  newTtlockEnd: string;
  setNewTtlockEnd: (value: string) => void;
  savingTtlock: boolean;
  guestPasscodes: GuestPasscode[];
  loadingGuestPasscodes: boolean;
  selectedPasscodes: string[];
  deletingSelectedPasscodes: boolean;
  loadingAllLocks: boolean;
  locksDisponiblesParaAgregar: LockItem[];
  selectedNewLocks: number[];
  assigningLocks: boolean;
  newPinCode: string;
  setNewPinCode: (value: string) => void;
  activeLockIds: Set<number>;
  lastAssignResults: AssignLockResult[];
  onClose: () => void;
  onTogglePasscodeSelected: (pc: GuestPasscode) => void;
  onToggleNewLockSelected: (lockId: number) => void;
  onGuardarExtension: () => void;
  onEliminarSeleccionados: () => void;
  onAsignarLocks: (reassign?: boolean) => void;
};

const statusColors: Record<string, string> = {
  asignada: "#16a34a",
  reasignada: "#2563eb",
  ya_existia: "#f59e0b",
  error_reasignar: "#dc2626",
  error: "#dc2626",
};

const statusLabels: Record<string, string> = {
  asignada: "✅ Asignada",
  reasignada: "🔄 Reasignada",
  ya_existia: "⚠️ Ya existía",
  error_reasignar: "❌ Error reasignar",
  error: "❌ Error",
};

export function TtlockModal({
  huesped,
  newTtlockEnd,
  setNewTtlockEnd,
  savingTtlock,
  guestPasscodes,
  loadingGuestPasscodes,
  selectedPasscodes,
  deletingSelectedPasscodes,
  loadingAllLocks,
  locksDisponiblesParaAgregar,
  selectedNewLocks,
  assigningLocks,
  newPinCode,
  setNewPinCode,
  activeLockIds,
  lastAssignResults,
  onClose,
  onTogglePasscodeSelected,
  onToggleNewLockSelected,
  onGuardarExtension,
  onEliminarSeleccionados,
  onAsignarLocks,
}: Props) {
  if (!huesped) return null;

  const hasActiveSelected = selectedNewLocks.some((id) => activeLockIds.has(id));

  return (
    <div style={modal}>
      <div style={{ ...modalBox, maxWidth: "980px" }}>
        <h3>Gestión TTLock</h3>

        <div style={ttlockInfoGrid}>
          <div style={infoCard}>
            <div style={infoLabel}>Huésped</div>
            <div style={infoValue}>{huesped.nombre}</div>
          </div>
          <div style={infoCard}>
            <div style={infoLabel}>Reserva</div>
            <div style={infoValue}>{huesped.numeroReserva}</div>
          </div>
          <div style={infoCard}>
            <div style={infoLabel}>Código visible</div>
            <div style={infoValue}>
              <span style={ttlockBadge}>{ttlockText(huesped.codigoTTLock)}</span>
            </div>
          </div>
          <div style={infoCard}>
            <div style={infoLabel}>Salida actual</div>
            <div style={infoValue}>{huesped.fechaSalida ?? "-"}</div>
          </div>
        </div>

        <div style={sectionBox}>
          <h4 style={{ marginTop: 0 }}>Configuración de PIN y vigencia</h4>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={label}>PIN a usar</label>
              <input
                type="text"
                value={newPinCode}
                onChange={(e) => setNewPinCode(e.target.value.replace(/\D/g, "").slice(0, 9))}
                style={input}
                placeholder="Ej: 2462"
              />
            </div>

            <div>
              <label style={label}>Fecha / hora fin</label>
              <input
                type="datetime-local"
                value={newTtlockEnd}
                onChange={(e) => setNewTtlockEnd(e.target.value)}
                style={input}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", flexWrap: "wrap" }}>
            <button onClick={onGuardarExtension} style={btnTtlock} disabled={savingTtlock}>
              {savingTtlock ? "Guardando..." : "Extender activas"}
            </button>
          </div>
        </div>

        <div style={sectionBox}>
          <h4 style={{ marginTop: 0 }}>Cerraduras activas del huésped</h4>

          {loadingGuestPasscodes ? (
            <div style={emptyPasscodesBox}>Cargando cerraduras activas...</div>
          ) : guestPasscodes.length === 0 ? (
            <div style={emptyPasscodesBox}>Este huésped no tiene cerraduras activas.</div>
          ) : (
            <div style={passcodesList}>
              {guestPasscodes.map((pc) => {
                const key = `${pc.lockId}_${pc.keyboardPwdId}`;
                const checked = selectedPasscodes.includes(key);
                const verified = pc.ttlockVerified;

                return (
                  <label
                    key={key}
                    style={{
                      ...passcodeRow,
                      borderColor: verified === true
                        ? "#16a34a"
                        : verified === false
                        ? "#dc2626"
                        : undefined,
                      borderWidth: verified !== null && verified !== undefined ? "2px" : undefined,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", flex: 1 }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onTogglePasscodeSelected(pc)}
                        style={{ marginTop: "0.25rem" }}
                      />

                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={passcodeTitle}>{pc.lockAlias || `Lock ${pc.lockId}`}</span>
                          {verified === true && (
                            <span
                              style={{
                                background: "#16a34a",
                                color: "#fff",
                                fontSize: "0.65rem",
                                padding: "0.1rem 0.4rem",
                                borderRadius: "0.3rem",
                                fontWeight: 700,
                              }}
                            >
                              ✓ VERIFICADA EN TTLOCK
                            </span>
                          )}
                          {verified === false && (
                            <span
                              style={{
                                background: "#dc2626",
                                color: "#fff",
                                fontSize: "0.65rem",
                                padding: "0.1rem 0.4rem",
                                borderRadius: "0.3rem",
                                fontWeight: 700,
                              }}
                            >
                              ✗ NO ENCONTRADA EN TTLOCK
                            </span>
                          )}
                        </div>
                        <div style={passcodeMeta}>
                          <span><b>lockId:</b> {pc.lockId}</span>
                          <span><b>keyboardPwdId:</b> {pc.keyboardPwdId ?? "-"}</span>
                          <span><b>código:</b> {pc.codigo || "-"}</span>
                        </div>
                        <div style={passcodeMeta}>
                          <span><b>inicio:</b> {formatDateTimeLocal(pc.startDate)}</span>
                          <span><b>fin:</b> {formatDateTimeLocal(pc.endDate)}</span>
                        </div>
                        {pc.ttlockLiveData && (
                          <div style={{ ...passcodeMeta, color: "#6b7280", fontSize: "0.75rem" }}>
                            <span><b>TTLock PIN:</b> {pc.ttlockLiveData.keyboardPwd || "-"}</span>
                            <span><b>TTLock fin:</b> {formatDateTimeLocal(pc.ttlockLiveData.endDate)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", flexWrap: "wrap" }}>
            <button
              onClick={onEliminarSeleccionados}
              style={btnDeleteLarge}
              disabled={deletingSelectedPasscodes || selectedPasscodes.length === 0}
            >
              {deletingSelectedPasscodes
                ? "Eliminando..."
                : `Eliminar activas seleccionadas (${selectedPasscodes.length})`}
            </button>
          </div>
        </div>

        <div style={sectionBox}>
          <h4 style={{ marginTop: 0 }}>Todas las cerraduras disponibles para agregar</h4>

          {loadingAllLocks ? (
            <div style={emptyPasscodesBox}>Cargando todas las cerraduras...</div>
          ) : locksDisponiblesParaAgregar.length === 0 ? (
            <div style={emptyPasscodesBox}>
              No hay cerraduras disponibles.
            </div>
          ) : (
            <div style={passcodesList}>
              {locksDisponiblesParaAgregar.map((lock) => {
                const checked = selectedNewLocks.includes(lock.lockId);
                const isActive = activeLockIds.has(lock.lockId);

                return (
                  <label
                    key={lock.lockId}
                    style={{
                      ...passcodeRow,
                      borderColor: isActive ? "#16a34a" : undefined,
                      borderWidth: isActive ? "2px" : undefined,
                      position: "relative" as const,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", flex: 1 }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggleNewLockSelected(lock.lockId)}
                        style={{ marginTop: "0.25rem" }}
                      />

                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={passcodeTitle}>{lock.lockAlias || `Lock ${lock.lockId}`}</span>
                          {isActive && (
                            <span
                              style={{
                                background: "#16a34a",
                                color: "#fff",
                                fontSize: "0.7rem",
                                padding: "0.15rem 0.5rem",
                                borderRadius: "0.35rem",
                                fontWeight: 700,
                              }}
                            >
                              ASIGNADA
                            </span>
                          )}
                        </div>
                        <div style={passcodeMeta}>
                          <span><b>lockId:</b> {lock.lockId}</span>
                          <span><b>batería:</b> {lock.electricQuantity ?? "-"}</span>
                          <span><b>kbdVersion:</b> {lock.keyboardPwdVersion ?? "-"}</span>
                        </div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", flexWrap: "wrap" }}>
            <button
              onClick={() => onAsignarLocks(false)}
              style={btnAssign}
              disabled={assigningLocks || selectedNewLocks.length === 0}
            >
              {assigningLocks
                ? "Asignando..."
                : `Asignar cerraduras (${selectedNewLocks.length})`}
            </button>

            {hasActiveSelected && (
              <button
                onClick={() => onAsignarLocks(true)}
                style={{
                  ...btnAssign,
                  background: "#2563eb",
                }}
                disabled={assigningLocks}
              >
                {assigningLocks ? "Reasignando..." : `Mover / Reasignar (${selectedNewLocks.filter((id) => activeLockIds.has(id)).length})`}
              </button>
            )}
          </div>
        </div>

        {lastAssignResults.length > 0 && (
          <div style={sectionBox}>
            <h4 style={{ marginTop: 0 }}>Resultado última asignación</h4>
            <div style={passcodesList}>
              {lastAssignResults.map((r, idx) => (
                <div
                  key={`result-${idx}`}
                  style={{
                    ...passcodeRow,
                    borderColor: statusColors[r.status] || "#334155",
                    borderWidth: "2px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={passcodeTitle}>{r.lockAlias || `Lock ${r.lockId}`}</span>
                        <span
                          style={{
                            background: statusColors[r.status] || "#334155",
                            color: "#fff",
                            fontSize: "0.7rem",
                            padding: "0.15rem 0.5rem",
                            borderRadius: "0.35rem",
                            fontWeight: 700,
                          }}
                        >
                          {statusLabels[r.status] || r.status}
                        </span>
                      </div>
                      {r.message && (
                        <div style={passcodeMeta}>
                          <span>{r.message}</span>
                        </div>
                      )}
                      {r.codigo && (
                        <div style={passcodeMeta}>
                          <span><b>PIN:</b> {r.codigo}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", flexWrap: "wrap" }}>
          <button onClick={onClose} style={btnCloseSecondary}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
