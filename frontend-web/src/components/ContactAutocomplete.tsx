import { useState, useEffect, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http:///api";

export type ContactSuggestion = {
  id?: number | string;
  nombre?: string;
  email?: string;
  telefono?: string;
  numeroReserva?: string;
  fechaIngreso?: string | null;
  fechaSalida?: string | null;
  [key: string]: any;
};

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSelectSuggestion?: (item: ContactSuggestion) => void;
}

function normalizePhone(raw: string) {
  return String(raw || "").replace(/[^\d]/g, "");
}

function normalizeEmail(raw: string) {
  return String(raw || "").trim().toLowerCase();
}

function formatShortDate(value?: string | null) {
  if (!value) return "";
  const raw = String(value).trim();
  const onlyDate = raw.includes("T") ? raw.split("T")[0] : raw;
  const parts = onlyDate.split("-");
  if (parts.length !== 3) return onlyDate;

  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

export default function ContactAutocomplete({
  value,
  onChange,
  onSelectSuggestion,
}: Props) {
  const [sugerencias, setSugerencias] = useState<ContactSuggestion[]>([]);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(event.target as Node)) {
        setShow(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const raw = String(value || "").trim();

    if (!raw || raw.length < 2) {
      setSugerencias([]);
      setShow(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);

        const query = raw.includes("@")
          ? normalizeEmail(raw)
          : normalizePhone(raw) || raw;

        const res = await fetch(
          `${API_BASE}/api/checkin/contactos?query=${encodeURIComponent(query)}`
        );

        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : [];
          setSugerencias(list);
          setShow(list.length > 0);
        } else {
          setSugerencias([]);
          setShow(false);
        }
      } catch {
        setSugerencias([]);
        setShow(false);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [value]);

  const seleccionar = (item: ContactSuggestion) => {
    const textoVisible =
      item.telefono?.trim() ||
      item.email?.trim() ||
      item.nombre?.trim() ||
      item.numeroReserva?.trim() ||
      "";

    onChange(textoVisible);
    setShow(false);

    if (onSelectSuggestion) onSelectSuggestion(item);
  };

  return (
    <div ref={wrapRef} style={{ position: "relative", width: "100%" }}>
      <input
        type="text"
        placeholder="Teléfono, email o nombre"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          if (!show) setShow(true);
        }}
        onFocus={() => sugerencias.length > 0 && setShow(true)}
        style={{
          width: "100%",
          padding: "0.75rem",
          borderRadius: "0.75rem",
          border: "1px solid #4b5563",
          backgroundColor: "#fff",
          color: "#333",
          outline: "none",
          fontSize: "14px",
        }}
      />

      {show && sugerencias.length > 0 && (
        <ul
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: "calc(100% + 8px)",
            top: "auto",
            width: "100%",
            background: "white",
            borderRadius: "12px",
            border: "1px solid #d1d5db",
            maxHeight: "260px",
            overflowY: "auto",
            padding: 0,
            margin: 0,
            zIndex: 99999,
            boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
            listStyle: "none",
          }}
        >
          {sugerencias.slice(0, 5).map((s, index) => {
            const telefono =
              s.telefono && String(s.telefono).trim().length > 0
                ? String(s.telefono).trim()
                : "[Sin teléfono]";

            const fechaIngreso = formatShortDate(s.fechaIngreso);
            const fechaSalida = formatShortDate(s.fechaSalida);
            const rangoFechas =
              fechaIngreso && fechaSalida
                ? `${fechaIngreso} → ${fechaSalida}`
                : fechaIngreso || fechaSalida || "";

            const sublinea = [
              s.nombre,
              s.email,
              s.numeroReserva ? `Reserva ${s.numeroReserva}` : "",
              rangoFechas,
            ]
              .filter(Boolean)
              .join(" · ");

            return (
              <li
                key={`${s.numeroReserva || "sin-reserva"}-${index}`}
                onMouseDown={() => seleccionar(s)}
                style={{
                  padding: "12px 14px",
                  cursor: "pointer",
                  borderBottom:
                    index !== Math.min(sugerencias.length, 5) - 1
                      ? "1px solid #f1f5f9"
                      : "none",
                  color: "#111",
                  backgroundColor: "white",
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {telefono}
                </div>

                <div
                  style={{
                    fontSize: "0.83rem",
                    color: "#6b7280",
                    marginTop: "4px",
                    lineHeight: 1.35,
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                  }}
                >
                  {sublinea || "Sin más datos"}
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