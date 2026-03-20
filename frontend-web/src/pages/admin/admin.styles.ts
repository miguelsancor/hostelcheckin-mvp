import React from "react";

export const loginContainer: React.CSSProperties = {
  background: "#000",
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

export const loginBox: React.CSSProperties = {
  background: "#020617",
  padding: "2rem",
  borderRadius: "1rem",
  textAlign: "center",
  color: "white",
  width: "300px",
};

export const btnLogin: React.CSSProperties = {
  marginTop: "1rem",
  background: "#2563eb",
  color: "white",
  border: "none",
  padding: "0.6rem",
  width: "100%",
  borderRadius: "0.5rem",
  cursor: "pointer",
};

export const container: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "#000",
  display: "flex",
  justifyContent: "flex-start",
  alignItems: "flex-start",
  padding: "1.5rem",
  overflowX: "hidden",
  overflowY: "auto",
  zIndex: 9999,
};

export const card: React.CSSProperties = {
  background: "transparent",
  padding: "1rem",
  width: "100%",
  color: "#fff",
};

export const input: React.CSSProperties = {
  padding: "0.7rem",
  borderRadius: "0.4rem",
  border: "1px solid #333",
  background: "#111",
  color: "#fff",
  width: "100%",
};

export const textarea: React.CSSProperties = {
  minHeight: "100px",
  padding: "0.7rem",
  borderRadius: "0.4rem",
  border: "1px solid #333",
  background: "#111",
  color: "#fff",
  width: "100%",
  resize: "vertical",
};

export const label: React.CSSProperties = {
  display: "block",
  marginBottom: "0.5rem",
  fontWeight: 700,
};

export const summaryBox: React.CSSProperties = {
  marginTop: "1rem",
  padding: "1rem",
  borderRadius: "0.8rem",
  background: "#0f172a",
  border: "1px solid #1f2937",
  display: "grid",
  gap: "0.4rem",
};

export const metricsGrid: React.CSSProperties = {
  display: "grid",
  gap: "1rem",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  marginBottom: "1rem",
};

export const metricCard: React.CSSProperties = {
  background: "#0f172a",
  padding: "1rem",
  borderRadius: "0.7rem",
  textAlign: "center",
};

export const tablaWrapper: React.CSSProperties = {
  overflowX: "auto",
  width: "100%",
  paddingBottom: "12px",
  border: "1px solid #1f2937",
  borderRadius: "0.8rem",
};

export const tabla: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: "1450px",
};

export const th: React.CSSProperties = {
  textAlign: "left",
  padding: "0.75rem",
  background: "#0f172a",
  borderBottom: "1px solid #1f2937",
  position: "sticky",
  top: 0,
  zIndex: 2,
  whiteSpace: "nowrap",
};

export const td: React.CSSProperties = {
  padding: "0.7rem",
  borderBottom: "1px solid #111827",
  color: "#fff",
  whiteSpace: "nowrap",
  fontSize: "0.95rem",
};

export const trEven: React.CSSProperties = { background: "#030712" };
export const trOdd: React.CSSProperties = { background: "#000000" };

export const link: React.CSSProperties = {
  color: "#60a5fa",
  textDecoration: "underline",
};

export const btnDelete: React.CSSProperties = {
  background: "#dc2626",
  color: "white",
  border: "none",
  padding: "0.3rem 0.6rem",
  borderRadius: "0.4rem",
  cursor: "pointer",
};

export const btnDeleteLarge: React.CSSProperties = {
  background: "#dc2626",
  color: "white",
  border: "none",
  padding: "0.7rem 1rem",
  borderRadius: "0.6rem",
  cursor: "pointer",
};

export const btnEye: React.CSSProperties = {
  background: "#2563eb",
  color: "white",
  border: "none",
  padding: "0.3rem 0.6rem",
  borderRadius: "0.4rem",
  cursor: "pointer",
};

export const btnTtlock: React.CSSProperties = {
  background: "#f59e0b",
  color: "white",
  border: "none",
  padding: "0.6rem 0.9rem",
  borderRadius: "0.5rem",
  cursor: "pointer",
};

export const btnAssign: React.CSSProperties = {
  background: "#16a34a",
  color: "white",
  border: "none",
  padding: "0.7rem 1rem",
  borderRadius: "0.6rem",
  cursor: "pointer",
};

export const btnMoney: React.CSSProperties = {
  background: "#16a34a",
  color: "white",
  border: "none",
  padding: "0.3rem 0.6rem",
  borderRadius: "0.4rem",
  cursor: "pointer",
};

export const btnExcel: React.CSSProperties = {
  background: "#16a34a",
  color: "white",
  border: "none",
  padding: "0.5rem 1rem",
  borderRadius: "0.6rem",
  cursor: "pointer",
};

export const btnLogout: React.CSSProperties = {
  background: "#991b1b",
  color: "white",
  border: "none",
  padding: "0.5rem 1rem",
  borderRadius: "0.6rem",
  cursor: "pointer",
};

export const btnToggle: React.CSSProperties = {
  background: "#334155",
  color: "white",
  border: "none",
  padding: "0.5rem 1rem",
  borderRadius: "0.6rem",
  cursor: "pointer",
};

export const btnScope: React.CSSProperties = {
  background: "#0b1220",
  color: "white",
  border: "1px solid #1f2937",
  padding: "0.5rem 1rem",
  borderRadius: "0.6rem",
  cursor: "pointer",
};

export const btnCloseSecondary: React.CSSProperties = {
  background: "#1e293b",
  color: "#fff",
  border: "1px solid #334155",
  padding: "0.75rem 1rem",
  borderRadius: "0.6rem",
  cursor: "pointer",
};

export const galeriaGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  gap: "1rem",
  width: "100%",
};

export const galeriaCard: React.CSSProperties = {
  background: "#0f172a",
  padding: "1rem",
  borderRadius: "0.8rem",
  color: "white",
  display: "flex",
  flexDirection: "column",
  gap: "0.3rem",
};

export const imagenGaleria: React.CSSProperties = {
  width: "100%",
  height: "200px",
  objectFit: "cover",
  borderRadius: "0.6rem",
  cursor: "zoom-in",
  marginBottom: "0.5rem",
  border: "1px solid #1f2937",
};

export const imagenPlaceholder: React.CSSProperties = {
  width: "100%",
  height: "200px",
  borderRadius: "0.6rem",
  background: "linear-gradient(135deg,#1e293b,#020617)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "3rem",
  fontWeight: 700,
};

export const galeriaLink: React.CSSProperties = {
  background: "#2563eb",
  padding: "0.3rem 0.5rem",
  color: "white",
  textAlign: "center",
  borderRadius: "0.3rem",
  marginTop: "0.5rem",
};

export const modal: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.8)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 10000,
};

export const modalBox: React.CSSProperties = {
  background: "#020617",
  padding: "2rem",
  borderRadius: "1rem",
  color: "white",
  maxWidth: "600px",
  width: "100%",
  maxHeight: "90vh",
  overflowY: "auto",
};

export const btnClose: React.CSSProperties = {
  marginTop: "1rem",
  background: "#2563eb",
  color: "white",
  width: "100%",
  border: "none",
  padding: "0.6rem",
  borderRadius: "0.6rem",
  cursor: "pointer",
};

export const imagenesDetalleGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "1rem",
  marginTop: "1rem",
};

export const imagenDetalle: React.CSSProperties = {
  width: "100%",
  height: "200px",
  objectFit: "cover",
  borderRadius: "0.6rem",
  border: "1px solid #1f2937",
  cursor: "zoom-in",
};

export const zoomOverlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.9)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 11000,
};

export const zoomImage: React.CSSProperties = {
  maxWidth: "90vw",
  maxHeight: "90vh",
  borderRadius: "1rem",
  border: "2px solid #1d4ed8",
  objectFit: "contain",
};

export const ttlockBadge: React.CSSProperties = {
  display: "inline-block",
  padding: "0.2rem 0.55rem",
  borderRadius: "0.45rem",
  background: "#451a03",
  color: "#facc15",
  border: "1px solid #92400e",
  fontWeight: 700,
  letterSpacing: "0.03em",
};

export const paymentBadge = (status: string): React.CSSProperties => {
  const normalized = String(status || "PENDING").toUpperCase();

  if (normalized === "APPROVED") {
    return {
      display: "inline-block",
      padding: "0.2rem 0.55rem",
      borderRadius: "0.45rem",
      background: "#052e16",
      color: "#86efac",
      border: "1px solid #166534",
      fontWeight: 700,
    };
  }

  if (normalized === "PARTIAL") {
    return {
      display: "inline-block",
      padding: "0.2rem 0.55rem",
      borderRadius: "0.45rem",
      background: "#3f2a00",
      color: "#facc15",
      border: "1px solid #a16207",
      fontWeight: 700,
    };
  }

  return {
    display: "inline-block",
    padding: "0.2rem 0.55rem",
    borderRadius: "0.45rem",
    background: "#3f0d0d",
    color: "#fca5a5",
    border: "1px solid #991b1b",
    fontWeight: 700,
  };
};

export const imageShell: React.CSSProperties = {
  position: "relative",
  overflow: "hidden",
  background: "#020617",
};

export const imageSkeleton: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  borderRadius: "inherit",
  background:
    "linear-gradient(90deg, rgba(15,23,42,1) 0%, rgba(30,41,59,1) 50%, rgba(15,23,42,1) 100%)",
  backgroundSize: "200% 100%",
  animation: "adminShimmer 1.2s ease-in-out infinite",
  zIndex: 1,
};

export const imageFallbackText: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: "0.9rem",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  width: "100%",
  height: "100%",
};

export const sectionBox: React.CSSProperties = {
  marginTop: "1rem",
  padding: "1rem",
  borderRadius: "0.85rem",
  background: "#0b1220",
  border: "1px solid #1f2937",
};

export const ttlockInfoGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "0.75rem",
};

export const infoCard: React.CSSProperties = {
  background: "#0f172a",
  border: "1px solid #1f2937",
  borderRadius: "0.75rem",
  padding: "0.9rem",
};

export const infoLabel: React.CSSProperties = {
  fontSize: "0.8rem",
  color: "#94a3b8",
  marginBottom: "0.35rem",
};

export const infoValue: React.CSSProperties = {
  fontSize: "0.95rem",
  fontWeight: 700,
  color: "#fff",
  wordBreak: "break-word",
};

export const passcodesList: React.CSSProperties = {
  display: "grid",
  gap: "0.75rem",
  marginTop: "0.75rem",
};

export const passcodeRow: React.CSSProperties = {
  display: "flex",
  gap: "0.75rem",
  padding: "0.9rem",
  borderRadius: "0.75rem",
  background: "#020617",
  border: "1px solid #1f2937",
  cursor: "pointer",
};

export const passcodeTitle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: "1rem",
  color: "#fff",
  marginBottom: "0.35rem",
};

export const passcodeMeta: React.CSSProperties = {
  display: "flex",
  gap: "1rem",
  flexWrap: "wrap",
  fontSize: "0.88rem",
  color: "#cbd5e1",
  marginTop: "0.2rem",
};

export const emptyPasscodesBox: React.CSSProperties = {
  marginTop: "0.75rem",
  padding: "1rem",
  borderRadius: "0.75rem",
  background: "#020617",
  border: "1px dashed #334155",
  color: "#94a3b8",
};