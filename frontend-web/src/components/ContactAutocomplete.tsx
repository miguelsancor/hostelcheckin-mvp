import { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://18.206.179.50:4000";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSelectSuggestion?: (v: string) => void;
}

export default function ContactAutocomplete({
  value,
  onChange,
  onSelectSuggestion,
}: Props) {
  const [sugerencias, setSugerencias] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!value || value.length < 2) {
      setSugerencias([]);
      setShow(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);

        const res = await fetch(
          `${API_BASE}/api/checkin/contactos?query=${encodeURIComponent(value)}`
        );

        if (res.ok) {
          const data = await res.json();
          setSugerencias(data);
          setShow(true);
        } else {
          setSugerencias([]);
        }
      } catch {
        setSugerencias([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [value]);

  const seleccionar = (item: any) => {
    const texto = item.email || item.telefono || item.nombre || "";
    onChange(texto);
    setShow(false);

    if (onSelectSuggestion) onSelectSuggestion(texto);
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        placeholder="Email o Teléfono"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => sugerencias.length > 0 && setShow(true)}
        style={{
          width: "100%",
          padding: "0.75rem",
          borderRadius: "0.5rem",
          border: "1px solid #4b5563",
          backgroundColor: "#fff",
          color: "#333",
        }}
      />

      {/* LISTA DE SUGERENCIAS */}
      {show && sugerencias.length > 0 && (
        <ul
          style={{
            position: "absolute",
            top: "50px",
            width: "100%",
            background: "white",
            borderRadius: "10px",
            border: "1px solid #ccc",
            maxHeight: "220px",
            overflowY: "auto",
            padding: 0,
            margin: 0,
            zIndex: 99999,
            boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
          }}
        >
          {sugerencias.map((s, index) => {
            const nombre =
              s.nombre && s.nombre.trim().length > 0
                ? s.nombre
                : "[Sin nombre]";

            const subtexto = s.email || s.telefono || "";

            return (
              <li
                key={index}
                onClick={() => seleccionar(s)}
                style={{
                  padding: "12px",
                  cursor: "pointer",
                  listStyle: "none",
                  borderBottom: "1px solid #eee",
                  color: "#111",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#e5e7eb")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "white")
                }
              >
                <div style={{ fontWeight: "600", fontSize: "0.95rem" }}>
                  {nombre}
                </div>
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "#555",
                    marginTop: "3px",
                  }}
                >
                  {subtexto}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {loading && (
        <div style={{ color: "#999", marginTop: "4px", fontSize: "0.85rem" }}>
          Buscando...
        </div>
      )}
    </div>
  );
}
