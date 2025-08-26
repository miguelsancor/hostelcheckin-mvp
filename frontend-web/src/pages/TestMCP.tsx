// src/pages/TestMCP.tsx
import { useState } from "react";
import { mcpCreateKey, mcpOpenLock, mcpRevokeKey } from "../services/mcpClient";

export default function TestMCP() {
  // Estados para crear llave
  const [lockId, setLockId] = useState<number>(0);
  const [receiverUsername, setReceiverUsername] = useState<string>("");
  const [endAt, setEndAt] = useState<string>(""); // ISO local -> luego convertimos a epoch ms
  const [keyName, setKeyName] = useState<string>("GuestKey");
  const [remarks, setRemarks] = useState<string>("");

  // Estados para abrir cerradura
  const [openLockId, setOpenLockId] = useState<number>(0);

  // Estados para revocar llave
  const [keyId, setKeyId] = useState<number>(0);
  const [revokeRemarks, setRevokeRemarks] = useState<string>("");

  const [log, setLog] = useState<string>("");

  function appendLog(obj: any) {
    setLog((prev) => `${prev}\n${new Date().toLocaleString()}: ${JSON.stringify(obj, null, 2)}`);
  }

  function toEpochMs(localIso: string): number {
    // localIso ej: "2025-08-30T15:00"
    // Lo interpretamos como hora local del navegador
    const d = new Date(localIso);
    return d.getTime();
  }

  async function onCreateKey(e: React.FormEvent) {
    e.preventDefault();
    try {
      const endEpoch = toEpochMs(endAt);
      const r = await mcpCreateKey({
        lockId,
        receiverUsername,
        endAt: endEpoch,
        keyName,
        remarks,
        correlationId: `reserva-${lockId}-${Date.now()}`
      });
      appendLog(r);
    } catch (err) {
      appendLog({ error: String(err) });
    }
  }

  async function onOpenLock(e: React.FormEvent) {
    e.preventDefault();
    try {
      const r = await mcpOpenLock({
        lockId: openLockId,
        correlationId: `open-${openLockId}-${Date.now()}`
      });
      appendLog(r);
    } catch (err) {
      appendLog({ error: String(err) });
    }
  }

  async function onRevokeKey(e: React.FormEvent) {
    e.preventDefault();
    try {
      const r = await mcpRevokeKey({
        keyId,
        remarks: revokeRemarks,
        correlationId: `revoke-${keyId}-${Date.now()}`
      });
      appendLog(r);
    } catch (err) {
      appendLog({ error: String(err) });
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1>MCP Sandbox</h1>

      <section style={{ marginTop: 24, padding: 16, border: "1px solid #ddd", borderRadius: 8 }}>
        <h2>Crear Llave (TTLock)</h2>
        <form onSubmit={onCreateKey}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label>
              Lock ID
              <input type="number" value={lockId} onChange={(e) => setLockId(Number(e.target.value))} />
            </label>
            <label>
              Receiver (email/usuario TTLock)
              <input value={receiverUsername} onChange={(e) => setReceiverUsername(e.target.value)} />
            </label>
            <label>
              Fin de validez (local)
              <input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
              />
            </label>
            <label>
              Key Name
              <input value={keyName} onChange={(e) => setKeyName(e.target.value)} />
            </label>
            <label style={{ gridColumn: "1 / span 2" }}>
              Remarks
              <input value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            </label>
          </div>
          <button type="submit" style={{ marginTop: 12 }}>Crear</button>
        </form>
      </section>

      <section style={{ marginTop: 24, padding: 16, border: "1px solid #ddd", borderRadius: 8 }}>
        <h2>Abrir Cerradura</h2>
        <form onSubmit={onOpenLock}>
          <label>
            Lock ID
            <input type="number" value={openLockId} onChange={(e) => setOpenLockId(Number(e.target.value))} />
          </label>
          <button type="submit" style={{ marginLeft: 12 }}>Abrir</button>
        </form>
      </section>

      <section style={{ marginTop: 24, padding: 16, border: "1px solid #ddd", borderRadius: 8 }}>
        <h2>Revocar Llave</h2>
        <form onSubmit={onRevokeKey}>
          <label>
            Key ID
            <input type="number" value={keyId} onChange={(e) => setKeyId(Number(e.target.value))} />
          </label>
          <label style={{ marginLeft: 12 }}>
            Remarks
            <input value={revokeRemarks} onChange={(e) => setRevokeRemarks(e.target.value)} />
          </label>
          <button type="submit" style={{ marginLeft: 12 }}>Revocar</button>
        </form>
      </section>

      <section style={{ marginTop: 24 }}>
        <h3>Log</h3>
        <pre style={{ background: "#111", color: "#0f0", padding: 12, borderRadius: 8, maxHeight: 300, overflow: "auto" }}>
{log || "→ Aquí verás las respuestas del backend (/mcp/*)"}        
        </pre>
      </section>
    </div>
  );
}
