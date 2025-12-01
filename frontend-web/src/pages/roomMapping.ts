// ============================================================================
//  MAPPING COMPLETO PARA INTEGRAR NOBEDS + TTLOCK
//  order_id -> roomName
// ============================================================================

export const roomMapping: { [roomId: string]: string } = {
  "2457340": "KALPA",
  "2470380": "KUSI",
  "2488950": "KANCHI",
  "2468274": "ALLYN",
  "2463148": "no tiene cerradura eltronica",
  "2496888": "no tiene cerradura eltronica",
  "2457300": "no tiene cerradura eltronica",
  "2457341": "no tiene cerradura eltronica",
  "2502145": "no tiene cerradura eltronica",
  "2502147": "no tiene cerradura eltronica",
  "2502149": "no tiene cerradura eltronica",
  "2502150": "no tiene cerradura eltronica",
  "2502148": "no tiene cerradura eltronica",
  "2502146": "no tiene cerradura eltronica",
  "2502144": "no tiene cerradura eltronica",
  "2504850": "no tiene cerradura eltronica",
  "2504858": "no tiene cerradura eltronica",
  "2512556": "no tiene cerradura eltronica",
  "2512557": "no tiene cerradura eltronica",
};

// (roomToLockId lo dejamos de lado, ya no lo usamos)
export const roomToLockId: Record<string, number> = {
  "Allyn Room": 101,
  "Kanchi Room": 102,
  "Kalpa Room": 103,
  "Kusi Room": 104,
  "Wasi Cap Room": 201,
  "Wasi Bed Room": 202,
  "Suyana Room": 203,
  "Allpa": 204,
  "Inti": 205,
  "Unu": 206,
  "Sonqo": 207,
  "Llampu": 208,
  "Sami Room": 301,
  "Sami Pod 1": 302,
  "Sami Pod 2": 303,
};
