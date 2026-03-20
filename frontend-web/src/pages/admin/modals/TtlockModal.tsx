import React from "react";
import type { GuestPasscode, Huesped, LockItem } from "../admin.types";
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
  onClose: () => void;
  onTogglePasscodeSelected: (pc: GuestPasscode) => void;
  onToggleNewLockSelected: (lockId: number) => void;
  onGuardarExtension: () => void;
  onEliminarSeleccionados: () => void;
  onAsignarLocks: () => void;
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
  onClose,
  onTogglePasscodeSelected,
  onToggleNewLockSelected,
  onGuardarExtension,
  onEliminarSeleccionados,
  onAsignarLocks,
}: Props) {
  if (!huesped) return null;

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

                return (
                  <label key={key} style={passcodeRow}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", flex: 1 }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onTogglePasscodeSelected(pc)}
                        style={{ marginTop: "0.25rem" }}
                      />

                      <div style={{ flex: 1 }}>
                        <div style={passcodeTitle}>{pc.lockAlias || `Lock ${pc.lockId}`}</div>
                        <div style={passcodeMeta}>
                          <span><b>lockId:</b> {pc.lockId}</span>
                          <span><b>keyboardPwdId:</b> {pc.keyboardPwdId ?? "-"}</span>
                          <span><b>código:</b> {pc.codigo || "-"}</span>
                        </div>
                        <div style={passcodeMeta}>
                          <span><b>inicio:</b> {formatDateTimeLocal(pc.startDate)}</span>
                          <span><b>fin:</b> {formatDateTimeLocal(pc.endDate)}</span>
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
              No hay más cerraduras disponibles para agregar a este huésped.
            </div>
          ) : (
            <div style={passcodesList}>
              {locksDisponiblesParaAgregar.map((lock) => {
                const checked = selectedNewLocks.includes(lock.lockId);

                return (
                  <label key={lock.lockId} style={passcodeRow}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", flex: 1 }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggleNewLockSelected(lock.lockId)}
                        style={{ marginTop: "0.25rem" }}
                      />

                      <div style={{ flex: 1 }}>
                        <div style={passcodeTitle}>{lock.lockAlias || `Lock ${lock.lockId}`}</div>
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
              onClick={onAsignarLocks}
              style={btnAssign}
              disabled={assigningLocks || selectedNewLocks.length === 0}
            >
              {assigningLocks
                ? "Asignando..."
                : `Asignar cerraduras seleccionadas (${selectedNewLocks.length})`}
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", flexWrap: "wrap" }}>
          <button onClick={onClose} style={btnCloseSecondary}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}