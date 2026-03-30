/**
 * Selector de idioma compacto para Kuyay.
 * Se renderiza como pills/segmented control.
 */
import { type Lang, LANG_FLAGS } from "../i18n";

type Props = {
  language: Lang;
  onChange: (lang: Lang) => void;
};

const langs: Lang[] = ["es", "en", "pt"];

export default function LanguageSelector({ language, onChange }: Props) {
  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        justifyContent: "center",
        marginBottom: 14,
      }}
    >
      {langs.map((l) => {
        const active = l === language;
        return (
          <button
            key={l}
            type="button"
            onClick={() => onChange(l)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "7px 14px",
              borderRadius: 10,
              border: active
                ? "1px solid rgba(59,130,246,0.5)"
                : "1px solid rgba(255,255,255,0.10)",
              background: active
                ? "linear-gradient(135deg, rgba(59,130,246,0.22), rgba(124,58,237,0.14))"
                : "rgba(255,255,255,0.04)",
              color: "#fff",
              fontWeight: active ? 800 : 600,
              cursor: "pointer",
              fontSize: 13,
              transition: "all 0.2s ease",
              boxShadow: active ? "0 4px 16px rgba(59,130,246,0.12)" : "none",
            }}
          >
            <span style={{ fontSize: 16 }}>{LANG_FLAGS[l]}</span>
            <span>{l.toUpperCase()}</span>
          </button>
        );
      })}
    </div>
  );
}
