// ============================================================================
//  MAPPING COMPLETO PARA INTEGRAR NOBEDS + TTLOCK
//  order_id -> roomName
//  roomName -> lockId
// ============================================================================

// --------------------------
// 1) order_id → roomName
// --------------------------
export const roomMapping: { [roomId: string]: string } = {
    "2465274": "Allyn Room",
    "2468950": "Kanchi Room",
    "2504850": "Sami Room",
    "2512556": "Sami Pod 1",
    "2463146": "Wasi Cap Room",
    "2502147": "Unu",
    "2502145": "Allpa",
    "2457341": "Suyana Room",
    "2502149": "Llampu",
    "2470380": "Kusi Room",
    "2457340": "Kalpa Room",
    "2502144": "Inti",
    "2512557": "Sami Pod 2",
    "2502148": "Sonqo",
    "2457300": "Wasi Bed Room",
    "2496688": "Wasi Cap 2 Room"
  };
  
  
  // --------------------------
  // 2) roomName → lockId
  // --------------------------
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
  