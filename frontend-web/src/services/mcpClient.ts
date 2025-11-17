// frontend-web/src/services/mcpClient.ts
const API_BASE = import.meta.env.VITE_API_BASE || "http://18.206.179.50:4000";

export type CreateKeyParams = {
  lockId: number;
  receiverUsername: string; // email o teléfono TTLock del huésped
  endAt: number;            // epoch ms
  keyName?: string;
  remarks?: string;
  startAt?: number;
  correlationId?: string;
};

async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  // @ts-ignore
  return data as T;
}

// === acciones MCP ===
export async function createGuestKey(params: CreateKeyParams) {
  return postJSON("/mcp/create-key", params);
}
export async function openLock(params: { lockId: number; correlationId?: string }) {
  return postJSON("/mcp/open-lock", params);
}
export async function revokeKey(params: { keyId: number; remarks?: string; correlationId?: string }) {
  return postJSON("/mcp/revoke-key", params);
}

// === listados (útil para debug) ===
export async function listMyKeys() {
  const res = await fetch(`${API_BASE}/mcp/keys`);
  return res.json();
}
export async function listLocks() {
  const res = await fetch(`${API_BASE}/mcp/locks`);
  return res.json();
}

// 👇 Aliases para que funcionen tus imports actuales en TestMCP.tsx
export const mcpCreateKey = createGuestKey;
export const mcpOpenLock = openLock;
export const mcpRevokeKey = revokeKey;

// (opcional) export default por si alguna vez importas por defecto
export default {
  createGuestKey,
  openLock,
  revokeKey,
  listMyKeys,
  listLocks,
  mcpCreateKey,
  mcpOpenLock,
  mcpRevokeKey,
};
