type Props = {
    data: any;
    onClose: () => void;
  };
  
  export default function AdminGuestModal({ data, onClose }: Props) {
    return (
      <div style={overlay}>
        <div style={box}>
          <h2>Detalle del Huésped</h2>
  
          <pre style={pre}>{JSON.stringify(data, null, 2)}</pre>
  
          <button onClick={onClose} style={btn}>
            Cerrar
          </button>
        </div>
      </div>
    );
  }
  
  const overlay: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.8)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  };
  
  const box: React.CSSProperties = {
    background: "#111",
    padding: "2rem",
    borderRadius: "1rem",
    width: "90%",
    maxWidth: "600px",
    color: "white",
  };
  
  const pre: React.CSSProperties = {
    background: "#000",
    padding: "1rem",
    maxHeight: "400px",
    overflow: "auto",
  };
  
  const btn: React.CSSProperties = {
    width: "100%",
    marginTop: "1rem",
    padding: "0.7rem",
    background: "#10b981",
    border: "none",
    borderRadius: "6px",
    fontWeight: "bold",
  };
  