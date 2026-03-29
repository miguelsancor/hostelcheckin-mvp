import type React from "react";

/* ============================================================
   HELPERS RESPONSIVE
============================================================ */
const isMobile =
  typeof window !== "undefined" ? window.innerWidth <= 768 : false;

/* ============================================================
   MODALES — Estilo 2026
============================================================ */
export const modalOverlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0,0,0,0.78)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 99999,
  padding: isMobile ? "0.75rem" : "1rem",
  boxSizing: "border-box",
  backdropFilter: "blur(8px)",
};

export const modalBox: React.CSSProperties = {
  background: "linear-gradient(165deg, #1e293b, #0f172a)",
  borderRadius: "1.25rem",
  width: "100%",
  maxWidth: isMobile ? "100%" : "520px",
  padding: isMobile ? "1.15rem" : "1.75rem",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "white",
  boxSizing: "border-box",
  boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset",
};

export const modalPre: React.CSSProperties = {
  whiteSpace: "pre-wrap",
  background: "rgba(0,0,0,0.35)",
  padding: isMobile ? "0.85rem" : "1rem",
  borderRadius: "0.75rem",
  border: "1px solid rgba(255,255,255,0.06)",
  marginBottom: "1.5rem",
  fontSize: isMobile ? "0.85rem" : "0.9rem",
  lineHeight: 1.5,
};

export const btnPrimary: React.CSSProperties = {
  padding: "0.8rem 1rem",
  width: "100%",
  background: "linear-gradient(135deg, #10b981, #059669)",
  color: "white",
  borderRadius: "0.75rem",
  border: "none",
  fontWeight: 800,
  cursor: "pointer",
  marginBottom: "1rem",
  fontSize: "1rem",
  boxShadow: "0 8px 24px rgba(16,185,129,0.22)",
  transition: "transform 0.15s ease",
};

export const btnSecondary: React.CSSProperties = {
  padding: "0.8rem 1rem",
  width: "100%",
  background: "linear-gradient(135deg, #2563eb, #7c3aed)",
  color: "white",
  borderRadius: "0.75rem",
  border: "none",
  fontWeight: 800,
  cursor: "pointer",
  fontSize: "1rem",
  boxShadow: "0 8px 24px rgba(37,99,235,0.22)",
  transition: "transform 0.15s ease",
};

/* ============================================================
   ESTILOS PRINCIPALES CHECKINFORM — 2026
============================================================ */
export const styles: { [key: string]: React.CSSProperties } = {
  container: {
    background: "transparent",
    color: "#fff",
    minHeight: "100vh",
    width: "100%",
    maxWidth: "100%",
    padding: isMobile ? "1rem" : "2rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    boxSizing: "border-box",
    overflowX: "hidden",
  },

  title: {
    fontSize: isMobile ? "2rem" : "2.2rem",
    marginBottom: "1rem",
    textAlign: "center",
    lineHeight: 1.1,
    fontWeight: 900,
    letterSpacing: "-0.02em",
    background: "linear-gradient(135deg, #fff 60%, #93c5fd)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },

  subTitle: {
    fontSize: isMobile ? "1rem" : "1.15rem",
    marginBottom: "1.5rem",
    textAlign: "center",
    lineHeight: 1.35,
    color: "#cbd5e1",
  },

  card: {
    border: "1px solid rgba(255,255,255,0.06)",
    padding: isMobile ? "1.15rem" : "2rem",
    borderRadius: "1.25rem",
    background: "linear-gradient(165deg, rgba(15,23,42,0.85), rgba(2,6,23,0.92))",
    width: "100%",
    maxWidth: "900px",
    marginBottom: "2rem",
    boxSizing: "border-box",
    overflow: "hidden",
    boxShadow: "0 16px 48px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.03) inset",
    backdropFilter: "blur(16px)",
  },

  row: {
    display: "flex",
    flexDirection: "column",
    gap: "0.2rem",
    marginBottom: "1rem",
    width: "100%",
  },

  input: {
    width: "100%",
    minWidth: 0,
    padding: isMobile ? "0.85rem" : "0.8rem",
    borderRadius: "0.75rem",
    border: "1px solid rgba(255,255,255,0.10)",
    backgroundColor: "rgba(15,23,42,0.75)",
    color: "#f1f5f9",
    fontSize: "1rem",
    boxSizing: "border-box",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
    outline: "none",
  },

  fileInput: {
    width: "100%",
    minWidth: 0,
    padding: isMobile ? "0.7rem" : "0.6rem",
    borderRadius: "0.75rem",
    border: "1px solid rgba(255,255,255,0.10)",
    backgroundColor: "rgba(15,23,42,0.75)",
    color: "#fff",
    cursor: "pointer",
    fontSize: "1rem",
    boxSizing: "border-box",
  },

  actions: {
    marginTop: "1.5rem",
    textAlign: "center",
    width: "100%",
  },

  button: {
    padding: "0.9rem 1.4rem",
    border: "none",
    borderRadius: "0.85rem",
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
    fontSize: "1rem",
    width: isMobile ? "100%" : "auto",
    maxWidth: isMobile ? "100%" : undefined,
    boxSizing: "border-box",
    boxShadow: "0 8px 28px rgba(16,185,129,0.22)",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
    letterSpacing: "0.01em",
  },
};
