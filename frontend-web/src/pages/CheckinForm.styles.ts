import type React from "react";

/* ============================================================
   HELPERS RESPONSIVE
============================================================ */
const isMobile =
  typeof window !== "undefined" ? window.innerWidth <= 768 : false;

/* ============================================================
   MODALES
============================================================ */
export const modalOverlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0,0,0,0.75)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 99999,
  padding: isMobile ? "0.75rem" : "1rem",
  boxSizing: "border-box",
};

export const modalBox: React.CSSProperties = {
  background: "#1f2937",
  borderRadius: "1rem",
  width: "100%",
  maxWidth: isMobile ? "100%" : "500px",
  padding: isMobile ? "1rem" : "1.5rem",
  border: "1px solid #444",
  color: "white",
  boxSizing: "border-box",
};

export const modalPre: React.CSSProperties = {
  whiteSpace: "pre-wrap",
  background: "#111",
  padding: isMobile ? "0.85rem" : "1rem",
  borderRadius: "0.5rem",
  border: "1px solid #333",
  marginBottom: "1.5rem",
  fontSize: isMobile ? "0.85rem" : "0.9rem",
  lineHeight: 1.45,
};

export const btnPrimary: React.CSSProperties = {
  padding: "0.75rem 1rem",
  width: "100%",
  background: "#10b981",
  color: "white",
  borderRadius: "0.5rem",
  border: "none",
  fontWeight: "bold",
  cursor: "pointer",
  marginBottom: "1rem",
  fontSize: "1rem",
};

export const btnSecondary: React.CSSProperties = {
  padding: "0.75rem 1rem",
  width: "100%",
  background: "#2563eb",
  color: "white",
  borderRadius: "0.5rem",
  border: "none",
  fontWeight: "bold",
  cursor: "pointer",
  fontSize: "1rem",
};

/* ============================================================
   ESTILOS PRINCIPALES CHECKINFORM
============================================================ */
export const styles: { [key: string]: React.CSSProperties } = {
  container: {
    background: "#000",
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
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  },

  title: {
    fontSize: isMobile ? "1.9rem" : "2rem",
    marginBottom: "1rem",
    textAlign: "center",
    lineHeight: 1.15,
  },

  subTitle: {
    fontSize: isMobile ? "1rem" : "1.2rem",
    marginBottom: "1.5rem",
    textAlign: "center",
    lineHeight: 1.3,
  },

  card: {
    border: "1px solid #444",
    padding: isMobile ? "1rem" : "2rem",
    borderRadius: "1rem",
    backgroundColor: "rgba(0,0,0,0.7)",
    width: "100%",
    maxWidth: "900px",
    marginBottom: "2rem",
    boxSizing: "border-box",
    overflow: "hidden",
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
    padding: isMobile ? "0.8rem" : "0.75rem",
    borderRadius: "0.5rem",
    border: "1px solid #4b5563",
    backgroundColor: "#1f2937",
    color: "#f9fafb",
    fontSize: "1rem",
    boxSizing: "border-box",
  },

  fileInput: {
    width: "100%",
    minWidth: 0,
    padding: isMobile ? "0.65rem" : "0.55rem",
    borderRadius: "0.5rem",
    border: "1px solid #4b5563",
    backgroundColor: "#1f2937",
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
    padding: "0.85rem 1.2rem",
    border: "none",
    borderRadius: "0.5rem",
    backgroundColor: "#10b981",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "1rem",
    width: isMobile ? "100%" : "auto",
    maxWidth: isMobile ? "100%" : undefined,
    boxSizing: "border-box",
  },
};