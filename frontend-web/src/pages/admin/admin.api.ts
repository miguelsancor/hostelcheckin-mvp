import { API_BASE } from "./admin.utils";
import type { GuestPasscode, Huesped, LockItem, ReservaCobro } from "./admin.types";

async function parseJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function apiCheckSession() {
  const res = await fetch(`${API_BASE}/admin/auth/session`, {
    method: "GET",
    credentials: "include",
  });
  const json = await parseJson(res);
  return { res, json };
}

export async function apiLogin(username: string, password: string) {
  const res = await fetch(`${API_BASE}/admin/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const json = await parseJson(res);
  return { res, json };
}

export async function apiLogout() {
  return fetch(`${API_BASE}/admin/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
}

export async function apiGetHuespedes(): Promise<Huesped[]> {
  const res = await fetch(`${API_BASE}/admin/huespedes`, { credentials: "include" });
  const json = await parseJson(res);

  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  return (
    (json && Array.isArray(json.huespedes) && json.huespedes) ||
    (json && Array.isArray(json.data) && json.data) ||
    (Array.isArray(json) ? json : [])
  );
}

export async function apiGetMetrics() {
  const res = await fetch(`${API_BASE}/admin/metrics`, { credentials: "include" });
  const json = await parseJson(res);

  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  return json;
}

export async function apiDeleteHuesped(id: number) {
  return fetch(`${API_BASE}/admin/huespedes/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
}

export async function apiGetCobros(): Promise<ReservaCobro[]> {
  const res = await fetch(`${API_BASE}/admin/cobros`, { credentials: "include" });
  const json = await parseJson(res);

  if (res.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  return Array.isArray(json?.cobros) ? json.cobros : [];
}

export async function apiGetCobroByReserva(numeroReserva: string) {
  const res = await fetch(`${API_BASE}/admin/cobros/${encodeURIComponent(numeroReserva)}`, {
    credentials: "include",
  });
  const json = await parseJson(res);
  return { res, json };
}

export async function apiSaveCobro(payload: ReservaCobro) {
  const res = await fetch(`${API_BASE}/admin/cobros`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await parseJson(res);
  return { res, json };
}

export async function apiGetGuestPasscodes(huespedId: number): Promise<GuestPasscode[]> {
  const res = await fetch(`${API_BASE}/mcp/guest-passcodes/${huespedId}`, {
    credentials: "include",
  });
  const json = await parseJson(res);

  if (!res.ok || !json?.ok) {
    throw new Error(json?.error || "No se pudieron cargar los passcodes del huésped.");
  }

  return Array.isArray(json?.passcodes) ? json.passcodes : [];
}

export async function apiGetLocks(): Promise<LockItem[]> {
  const res = await fetch(`${API_BASE}/mcp/locks`, {
    credentials: "include",
  });
  const json = await parseJson(res);

  const lista = Array.isArray(json?.list) ? json.list : [];
  return lista.map((x: any) => ({
    lockId: Number(x.lockId),
    lockAlias: x.lockAlias || null,
    electricQuantity: x.electricQuantity,
    keyboardPwdVersion: x.keyboardPwdVersion,
    specialValue: x.specialValue,
  }));
}

export async function apiExtendPasscode(huespedId: number, newEndDate: string) {
  const res = await fetch(`${API_BASE}/mcp/passcode/extend/${huespedId}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ newEndDate }),
  });
  const json = await parseJson(res);
  return { res, json };
}

export async function apiAssignLocks(payload: {
  huespedId: number;
  lockIds: number[];
  startAt: number;
  endAt: number;
  code?: string;
  name: string;
  reassign?: boolean;
}) {
  const res = await fetch(`${API_BASE}/mcp/assign-locks-to-guest`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await parseJson(res);
  return { res, json };
}

export async function apiDeleteSelectedPasscodes(payload: {
  huespedId: number;
  items: { lockId: number; keyboardPwdId: number }[];
}) {
  const res = await fetch(`${API_BASE}/mcp/delete-passcodes-selected`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await parseJson(res);
  return { res, json };
}