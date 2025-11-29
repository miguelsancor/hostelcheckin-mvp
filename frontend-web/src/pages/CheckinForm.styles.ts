import type React from "react";

export const modalOverlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0,0,0,0.75)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 99999,
  padding: "2rem",
};

export const modalBox: React.CSSProperties = {
  background: "#1f2937",
  borderRadius: "1rem",
  width: "100%",
  maxWidth: "500px",
  padding: "2rem",
  border: "1px solid #444",
  color: "white",
};

export const modalPre: React.CSSProperties = {
  whiteSpace: "pre-wrap",
  background: "#111",
  padding: "1rem",
  borderRadius: "0.5rem",
  border: "1px solid #333",
  marginBottom: "1.5rem",
  fontSize: "0.9rem",
};

export const btnPrimary: React.CSSProperties = {
  padding: "0.75rem 2rem",
  width: "100%",
  background: "#10b981",
  color: "white",
  borderRadius: "0.5rem",
  border: "none",
  fontWeight: "bold",
  cursor: "pointer",
  marginBottom: "1rem",
};

export const btnSecondary: React.CSSProperties = {
  padding: "0.75rem 2rem",
  width: "100%",
  background: "#2563eb",
  color: "white",
  borderRadius: "0.5rem",
  border: "none",
  fontWeight: "bold",
  cursor: "pointer",
};

export const styles: { [key: string]: React.CSSProperties } = {
  container: {
    background: "#000",
    color: "#fff",
    minHeight: "100vh",
    padding: "2rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  title: { fontSize: "2rem", marginBottom: "0.5rem" },
  subTitle: { fontSize: "1.2rem", marginBottom: "2rem" },
  card: {
    border: "1px solid #444",
    padding: "2rem",
    borderRadius: "1rem",
    backgroundColor: "#111",
    maxWidth: "90%",
    width: "1100px",
    marginBottom: "2rem",
  },
  row: {
    display: "flex",
    flexWrap: "wrap",
    gap: "1rem",
    marginBottom: "1rem",
  },
  input: {
    flex: "1",
    minWidth: "180px",
    padding: "0.75rem",
    borderRadius: "0.5rem",
    border: "1px solid #4b5563",
    backgroundColor: "#1f2937",
    color: "#f9fafb",
  },
  actions: { marginTop: "1.5rem", textAlign: "center" },
  button: {
    padding: "0.75rem 2rem",
    border: "none",
    borderRadius: "0.5rem",
    backgroundColor: "#10b981",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "1rem",
  },
};
