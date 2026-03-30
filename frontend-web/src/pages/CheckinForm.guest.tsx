import { useRef, useState } from "react";
import { styles } from "./CheckinForm.styles";
import type { Huesped } from "./CheckinForm.types";
import { useLanguage } from "../i18n";

/* API_BASE: usar variable de entorno, soportando proxy /api sin duplicarlo */
function getApiBase(): string {
  const envBase = (import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "");
  if (envBase) return envBase;
  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:4000`;
  }
  return "";
}

function buildApiUrl(path: string): string {
  const base = getApiBase();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  if (!base) return cleanPath;
  if (base === "/api" && cleanPath.startsWith("/api/")) return cleanPath;

  return `${base}${cleanPath}`;
}

/**
 * OCR patch local:
 * - intenta primero por /api/document-reader/extract
 * - si responde 404, intenta /document-reader/extract
 * Esto evita tocar el resto de la app.
 */
function buildOcrCandidateUrls(): string[] {
  const urls = [
    buildApiUrl("/api/document-reader/extract"),
    buildApiUrl("/document-reader/extract"),
    "/api/document-reader/extract",
    "/document-reader/extract",
  ];

  return [...new Set(urls.filter(Boolean))];
}

type GuestCardProps = {
  data: Huesped;
  index: number;
  onChange: (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  onFile: (index: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove?: (index: number) => void;
  autoFilledFields?: string[];
  onAutoFill?: (fields: Record<string, string>, autoKeys: string[]) => void;
};

const isMobile = typeof window !== "undefined" ? window.innerWidth <= 768 : false;

/* ── Íconos ── */
function FileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 4.5L7.4 6.5H5.5C4.12 6.5 3 7.62 3 9V17.5C3 18.88 4.12 20 5.5 20H18.5C19.88 20 21 18.88 21 17.5V9C21 7.62 19.88 6.5 18.5 6.5H16.6L15 4.5H9Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function SuccessIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ScanIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Field wrapper ── */
function Field({
  label,
  children,
  highlight,
}: {
  label: string;
  children: React.ReactNode;
  highlight?: "auto" | "review" | null;
}) {
  const borderColor =
    highlight === "auto"
      ? "rgba(16,185,129,0.35)"
      : highlight === "review"
      ? "rgba(251,191,36,0.35)"
      : undefined;

  return (
    <div
      style={{
        width: "100%",
        marginBottom: "0.9rem",
        display: "flex",
        flexDirection: isMobile ? ("column" as const) : ("row" as const),
        alignItems: isMobile ? "stretch" : "center",
        gap: isMobile ? "0.45rem" : "0.75rem",
        boxSizing: "border-box",
        ...(borderColor
          ? {
              borderLeft: `3px solid ${borderColor}`,
              paddingLeft: "0.6rem",
              borderRadius: "0.25rem",
            }
          : {}),
      }}
    >
      <label
        style={{
          color: "#9ca3af",
          fontSize: "0.82rem",
          textAlign: isMobile ? "left" : "right",
          whiteSpace: "normal",
          lineHeight: 1.35,
          minWidth: isMobile ? undefined : "180px",
          maxWidth: isMobile ? undefined : "220px",
          flexShrink: 0,
          wordBreak: "break-word" as const,
        }}
      >
        {label}
      </label>
      <div style={{ width: "100%", minWidth: 0 }}>{children}</div>
    </div>
  );
}

/* ── Upload field compacto ── */
type UploadFieldProps = {
  label: string;
  inputName: string;
  fileValue?: File | null;
  onFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOcrFile?: (file: File) => void;
};

function UploadField({ label, inputName, fileValue, onFile, onOcrFile }: UploadFieldProps) {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileWithOcr = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    onFile(e);
    if (file && onOcrFile) {
      console.log("[OCR] Archivo capturado para OCR:", file.name, file.type, file.size);
      onOcrFile(file);
    }
  };

  return (
    <div style={{ width: "100%", marginBottom: "0.75rem" }}>
      <div style={{ color: "#9ca3af", fontSize: "0.82rem", marginBottom: "0.4rem", fontWeight: 600 }}>
        {label}
      </div>
      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "1rem",
          padding: isMobile ? "0.75rem" : "0.85rem",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: "0.6rem",
          }}
        >
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: "0.55rem", minHeight: "48px", width: "100%", borderRadius: "0.85rem",
              background: "linear-gradient(135deg, #1e293b, #334155)",
              color: "white", border: "1px solid rgba(255,255,255,0.10)",
              cursor: "pointer", fontWeight: 800, fontSize: "0.86rem",
            }}
          >
            <CameraIcon />
            {t("guest.btnCamera")}
          </button>

          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: "0.55rem", minHeight: "48px", width: "100%", borderRadius: "0.85rem",
              background: "linear-gradient(135deg, #2563eb, #7c3aed)",
              color: "white", border: "none", cursor: "pointer",
              fontWeight: 800, fontSize: "0.86rem",
              boxShadow: "0 8px 20px rgba(59,130,246,0.18)",
            }}
          >
            <FileIcon />
            {t("guest.btnFile")}
          </button>
        </div>

        <div
          style={{
            marginTop: "0.6rem", minHeight: "36px", borderRadius: "0.8rem",
            border: fileValue ? "1px solid rgba(16,185,129,0.25)" : "1px dashed rgba(255,255,255,0.12)",
            background: fileValue ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.02)",
            display: "flex", alignItems: "center", gap: "0.55rem",
            padding: "0.55rem 0.75rem",
            color: fileValue ? "#34d399" : "#94a3b8", fontSize: "0.8rem", wordBreak: "break-word",
          }}
        >
          {fileValue ? (
            <><SuccessIcon /><span>{fileValue.name}</span></>
          ) : (
            <span>{t("guest.noFile")}</span>
          )}
        </div>
      </div>

      <input ref={fileInputRef} type="file" name={inputName} accept="image/*,.pdf" onChange={handleFileWithOcr} style={{ display: "none" }} />
      <input ref={cameraInputRef} type="file" name={inputName} accept="image/*" onChange={handleFileWithOcr} style={{ display: "none" }} />
    </div>
  );
}

/* ── Motivos de viaje ── */
const REASONS_TRIP = [
  "Tourism", "Medical check up", "Business", "Musical event",
  "Missed flight", "Family visit", "Sporting event", "Shopping",
  "Academic event", "Other",
];

/* ── OCR Error reasons ── */
const OCR_REASON_MAP: Record<string, string> = {
  IMAGE_TOO_BLURRY: "docReader.blurry",
  LOW_RESOLUTION: "docReader.lowRes",
  DOCUMENT_CROPPED: "docReader.cropped",
  GLARE_DETECTED: "docReader.glare",
  TOO_DARK: "docReader.dark",
  IMAGE_ROTATED: "docReader.rotated",
  NOT_A_DOCUMENT: "docReader.readFail",
  NO_FILE: "docReader.readFail",
  PARSE_ERROR: "docReader.readFail",
  RATE_LIMITED: "docReader.readFail",
  INTERNAL_ERROR: "docReader.readFail",
  SERVICE_UNAVAILABLE: "docReader.readFail",
};

/* ══════════════════════════════════════════
   GuestCard PRINCIPAL
   ══════════════════════════════════════════ */
export function GuestCard({
  data,
  index,
  onChange,
  onFile,
  onRemove,
  autoFilledFields = [],
  onAutoFill,
}: GuestCardProps) {
  const { t } = useLanguage();
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrMessage, setOcrMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  /* Estado del flujo documento-primero (solo titular) */
  const [entryMode, setEntryMode] = useState<"choose" | "scan" | "manual" | null>(null);
  const [scanDocType, setScanDocType] = useState<"Cédula" | "Pasaporte" | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => onChange(index, e);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFile(index, e);
    e.target.value = "";
  };

  /* ── OCR: enviar imagen al backend con fallback local ── */
  const handleOcrFile = async (file: File) => {
    console.log("[OCR] handleOcrFile llamado", { name: file.name, type: file.type, size: file.size, index });

    if (!file || !file.type.startsWith("image/")) {
      console.warn("[OCR] Archivo ignorado: no es imagen", file.type);
      return;
    }

    if (index !== 0) {
      console.warn("[OCR] Ignorado: no es titular (index=", index, ")");
      return;
    }

    setOcrLoading(true);
    setOcrMessage({ type: "info", text: t("docReader.reading") });

    try {
      const urls = buildOcrCandidateUrls();
      let lastJson: any = null;
      let matchedResponse: Response | null = null;

      for (const url of urls) {
        try {
          console.log("[OCR] Probando endpoint:", url);

          const fd = new FormData();
          fd.append("documento", file);

          const resp = await fetch(url, {
            method: "POST",
            body: fd,
          });

          let json: any = null;
          try {
            json = await resp.json();
          } catch {
            json = null;
          }

          console.log("[OCR] Respuesta", url, "status:", resp.status, "json:", json);

          if (resp.status === 404) {
            lastJson = json;
            continue;
          }

          matchedResponse = resp;
          lastJson = json;
          break;
        } catch (innerErr) {
          console.warn("[OCR] Falló endpoint:", url, innerErr);
        }
      }

      if (!matchedResponse) {
        setOcrMessage({ type: "error", text: t("docReader.readFail") });
        setOcrLoading(false);
        return;
      }

      const json = lastJson;

      if (!json?.ok) {
        const reasonKey = OCR_REASON_MAP[json?.reason] || "docReader.readFail";
        setOcrMessage({ type: "error", text: t(reasonKey) });
        setOcrLoading(false);
        return;
      }

      const fields: Record<string, string> = {};
      const autoKeys: string[] = [];
      const reviewKeys: string[] = [];

      if (json.fields) {
        for (const [key, val] of Object.entries(json.fields)) {
          const { value, confidence } = val as { value: string; confidence: number };
          if (confidence >= 0.9) {
            fields[key] = value;
            autoKeys.push(key);
          } else if (confidence >= 0.7) {
            fields[key] = value;
            reviewKeys.push(key);
          }
        }
      }

      console.log("[OCR] Campos extraídos:", fields, "autoKeys:", autoKeys, "reviewKeys:", reviewKeys);

      if (Object.keys(fields).length > 0 && onAutoFill) {
        onAutoFill(fields, [...autoKeys, ...reviewKeys]);
        setOcrMessage({
          type: "success",
          text: `✅ ${t("docReader.verifyInfo")} (${Object.keys(fields).length} campos)`,
        });
      } else {
        setOcrMessage({ type: "error", text: t("docReader.readFail") });
      }
    } catch (err) {
      console.error("[OCR] Error:", err);
      setOcrMessage({
        type: "error",
        text: `${t("docReader.readFail")} — ${getApiBase() ? "Error de conexión" : "API no configurada"}`,
      });
    } finally {
      setOcrLoading(false);
    }
  };

  /* Cuando el titular elige tipo doc para escanear, setear en el form */
  const handleSelectScanDocType = (tipo: "Cédula" | "Pasaporte") => {
    setScanDocType(tipo);
    const syntheticEvent = {
      target: { name: "tipoDocumento", value: tipo },
    } as React.ChangeEvent<HTMLSelectElement>;
    onChange(index, syntheticEvent);
  };

  const esCedula = data.tipoDocumento === "Cédula";
  const esPasaporte = data.tipoDocumento === "Pasaporte";
  const esTitular = index === 0;

  /* Determinar modo efectivo */
  const effectiveMode = esTitular ? (entryMode || "choose") : "manual";
  /* Si ya escaneó y tiene autoFilledFields, mostrar form también */
  const showForm = effectiveMode === "manual" || (effectiveMode === "scan" && scanDocType !== null) || !esTitular;

  const getHighlight = (fieldName: string): "auto" | "review" | null => {
    if (autoFilledFields.includes(fieldName)) return "auto";
    return null;
  };

  const lockedInputStyle: React.CSSProperties = {
    ...styles.input,
    opacity: 0.9,
    cursor: "not-allowed",
    backgroundColor: "#0f172a",
    color: "#e5e7eb",
    border: "1px solid rgba(255,255,255,0.12)",
  };

  return (
    <div style={styles.card}>
      {ocrMessage && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.85rem 1rem",
            borderRadius: "0.85rem",
            display: "flex",
            alignItems: "center",
            gap: "0.65rem",
            fontSize: "0.9rem",
            fontWeight: 700,
            background:
              ocrMessage.type === "success"
                ? "rgba(16,185,129,0.15)"
                : ocrMessage.type === "error"
                ? "rgba(239,68,68,0.15)"
                : "rgba(59,130,246,0.15)",
            border:
              ocrMessage.type === "success"
                ? "1px solid rgba(16,185,129,0.35)"
                : ocrMessage.type === "error"
                ? "1px solid rgba(239,68,68,0.35)"
                : "1px solid rgba(59,130,246,0.35)",
            color:
              ocrMessage.type === "success"
                ? "#86efac"
                : ocrMessage.type === "error"
                ? "#fca5a5"
                : "#93c5fd",
          }}
        >
          {ocrLoading ? (
            <span style={{ animation: "spin 1s linear infinite", display: "inline-block", fontSize: "1.1rem" }}>⟳</span>
          ) : ocrMessage.type === "success" ? (
            <SuccessIcon />
          ) : (
            <ScanIcon />
          )}
          <span>{ocrMessage.text}</span>
        </div>
      )}

      {esTitular && effectiveMode === "choose" && (
        <div style={{ marginBottom: "1.25rem" }}>
          <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
            <h3 style={{ color: "white", fontSize: "1.15rem", marginBottom: "0.45rem", fontWeight: 900 }}>
              {t("guest.docSectionTitle")}
            </h3>
            <p
              style={{ color: "#94a3b8", fontSize: "0.88rem", lineHeight: 1.5, margin: 0 }}
              dangerouslySetInnerHTML={{ __html: t("guest.docSectionDesc") }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: "0.85rem",
            }}
          >
            <button
              type="button"
              onClick={() => setEntryMode("scan")}
              style={{
                background: "linear-gradient(135deg, rgba(37,99,235,0.15), rgba(124,58,237,0.12))",
                border: "2px solid rgba(59,130,246,0.35)",
                borderRadius: "1.15rem",
                padding: "1.5rem 1.25rem",
                cursor: "pointer",
                textAlign: "center",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ fontSize: "2.2rem", marginBottom: "0.6rem" }}>📷</div>
              <div style={{ color: "white", fontWeight: 900, fontSize: "1rem", marginBottom: "0.35rem" }}>
                {t("guest.btnScanDoc")}
              </div>
              <div style={{ color: "#94a3b8", fontSize: "0.82rem", lineHeight: 1.4 }}>
                {t("guest.btnScanDocDesc")}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setEntryMode("manual")}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "2px solid rgba(255,255,255,0.12)",
                borderRadius: "1.15rem",
                padding: "1.5rem 1.25rem",
                cursor: "pointer",
                textAlign: "center",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ fontSize: "2.2rem", marginBottom: "0.6rem" }}>✍️</div>
              <div style={{ color: "white", fontWeight: 900, fontSize: "1rem", marginBottom: "0.35rem" }}>
                {t("guest.btnManual")}
              </div>
              <div style={{ color: "#94a3b8", fontSize: "0.82rem", lineHeight: 1.4 }}>
                {t("guest.btnManualDesc")}
              </div>
            </button>
          </div>
        </div>
      )}

      {esTitular && effectiveMode === "scan" && !scanDocType && (
        <div style={{ marginBottom: "1.25rem" }}>
          <div style={{ textAlign: "center", marginBottom: "1rem" }}>
            <h3 style={{ color: "white", fontSize: "1.05rem", marginBottom: "0.35rem", fontWeight: 900 }}>
              {t("guest.scanDocTypeTitle")}
            </h3>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: "0.75rem",
            }}
          >
            <button
              type="button"
              onClick={() => handleSelectScanDocType("Cédula")}
              style={{
                background: "linear-gradient(135deg, #1e293b, #334155)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "1rem",
                padding: "1.15rem",
                cursor: "pointer",
                color: "white",
                fontWeight: 800,
                fontSize: "0.95rem",
              }}
            >
              🪪 {t("guest.scanDocBtnCedula")}
            </button>
            <button
              type="button"
              onClick={() => handleSelectScanDocType("Pasaporte")}
              style={{
                background: "linear-gradient(135deg, #1e293b, #334155)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "1rem",
                padding: "1.15rem",
                cursor: "pointer",
                color: "white",
                fontWeight: 800,
                fontSize: "0.95rem",
              }}
            >
              🛂 {t("guest.scanDocBtnPasaporte")}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setEntryMode("choose")}
            style={{
              marginTop: "0.85rem",
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              fontSize: "0.82rem",
              textDecoration: "underline",
              width: "100%",
              textAlign: "center",
            }}
          >
            ← {t("form.termsModalBack")}
          </button>
        </div>
      )}

      {esTitular && effectiveMode === "scan" && scanDocType && (
        <div style={{ marginBottom: "1.25rem" }}>
          <div style={{ textAlign: "center", marginBottom: "0.85rem" }}>
            <h3 style={{ color: "white", fontSize: "1rem", marginBottom: "0.3rem", fontWeight: 900 }}>
              {t("guest.scanStepUpload")}
            </h3>
            <p style={{ color: "#94a3b8", fontSize: "0.84rem", lineHeight: 1.45, margin: 0 }}>
              {t("guest.scanStepUploadDesc")}
            </p>
          </div>

          {scanDocType === "Cédula" && (
            <>
              <UploadField
                label={t("guest.uploadIdFront")}
                inputName="archivoCedula"
                fileValue={(data as any).archivoCedula || null}
                onFile={handleFile}
                onOcrFile={handleOcrFile}
              />
              <UploadField
                label={t("guest.uploadIdBack")}
                inputName="archivoFirma"
                fileValue={(data as any).archivoFirma || null}
                onFile={handleFile}
              />
            </>
          )}

          {scanDocType === "Pasaporte" && (
            <UploadField
              label={t("guest.uploadPassport")}
              inputName="archivoPasaporte"
              fileValue={(data as any).archivoPasaporte || null}
              onFile={handleFile}
              onOcrFile={handleOcrFile}
            />
          )}

          <button
            type="button"
            onClick={() => { setScanDocType(null); setEntryMode("choose"); }}
            style={{
              marginTop: "0.5rem",
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              fontSize: "0.82rem",
              textDecoration: "underline",
              width: "100%",
              textAlign: "center",
            }}
          >
            ← {t("form.termsModalBack")}
          </button>
        </div>
      )}

      {showForm && (
        <>
          {esTitular && (
            <div style={{
              textAlign: "center",
              marginBottom: "1rem",
              paddingBottom: "0.75rem",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}>
              <h3 style={{ color: "white", fontSize: "1.05rem", marginBottom: "0.2rem", fontWeight: 900 }}>
                {t("guest.formSectionTitle")}
              </h3>
              <p style={{ color: "#94a3b8", fontSize: "0.84rem", margin: 0 }}>
                {t("guest.formSectionDesc")}
              </p>
            </div>
          )}

          <div style={styles.row}>
            <Field label={t("guest.name")} highlight={getHighlight("nombre")}>
              <input name="nombre" value={data.nombre || ""} onChange={handleChange} placeholder={t("guest.placeholderName")} style={styles.input} />
            </Field>

            <Field label={t("guest.docType")} highlight={getHighlight("tipoDocumento")}>
              <select name="tipoDocumento" value={data.tipoDocumento || ""} onChange={handleChange} style={styles.input}>
                <option value="">{t("guest.select")}</option>
                <option value="Cédula">{t("guest.cedula")}</option>
                <option value="Pasaporte">{t("guest.passport")}</option>
              </select>
            </Field>

            <Field label={t("guest.docNumber")} highlight={getHighlight("numeroDocumento")}>
              <input name="numeroDocumento" value={data.numeroDocumento || ""} onChange={handleChange} placeholder={t("guest.placeholderNumber")} style={styles.input} />
            </Field>

            <Field label={t("guest.nationality")} highlight={getHighlight("nacionalidad")}>
              <input name="nacionalidad" value={data.nacionalidad || ""} onChange={handleChange} placeholder={t("guest.placeholderNationality")} style={styles.input} />
            </Field>
          </div>

          <div style={styles.row}>
            <Field label={t("guest.birthDate")} highlight={getHighlight("fechaNacimiento")}>
              <input type="date" name="fechaNacimiento" value={data.fechaNacimiento || ""} onChange={handleChange} style={styles.input} />
            </Field>

            <Field label={t("guest.phone")}>
              <input name="telefono" value={data.telefono || ""} onChange={handleChange} style={styles.input} />
            </Field>

            <Field label={t("guest.email")}>
              <input name="email" value={data.email || ""} onChange={handleChange} style={styles.input} />
            </Field>
          </div>

          {esTitular && (
            <>
              <div style={{ marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={styles.row}>
                  <Field label={t("guest.residenceCity")} highlight={getHighlight("ciudadResidencia")}>
                    <input name="ciudadResidencia" value={(data as any).ciudadResidencia || ""} onChange={handleChange} placeholder={t("guest.placeholderResidence")} style={styles.input} />
                  </Field>

                  <Field label={t("guest.originCity")} highlight={getHighlight("ciudadProcedencia")}>
                    <input name="ciudadProcedencia" value={(data as any).ciudadProcedencia || ""} onChange={handleChange} placeholder={t("guest.placeholderOrigin")} style={styles.input} />
                  </Field>

                  <Field label={t("guest.destinationCity")} highlight={getHighlight("ciudadDestino")}>
                    <input name="ciudadDestino" value={(data as any).ciudadDestino || ""} onChange={handleChange} placeholder={t("guest.placeholderDestination")} style={styles.input} />
                  </Field>

                  {esPasaporte && (
                    <>
                      <Field label={t("guest.originPlace")}>
                        <input name="lugarProcedencia" value={(data as any).lugarProcedencia || ""} onChange={handleChange} placeholder={t("guest.placeholderOriginPlace")} style={styles.input} />
                      </Field>

                      <Field label={t("guest.destinationPlace")}>
                        <input name="lugarDestino" value={(data as any).lugarDestino || ""} onChange={handleChange} placeholder={t("guest.placeholderDestinationPlace")} style={styles.input} />
                      </Field>
                    </>
                  )}

                  <Field label={t("guest.tripReason")}>
                    <select name="motivoViaje" value={data.motivoViaje || ""} onChange={handleChange} style={styles.input}>
                      <option value="">{t("guest.select")}</option>
                      {REASONS_TRIP.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label={t("guest.address")} highlight={getHighlight("direccion")}>
                    <input name="direccion" value={data.direccion || ""} onChange={handleChange} placeholder={t("guest.placeholderAddress")} style={styles.input} />
                  </Field>
                </div>

                <div style={styles.row}>
                  <Field label={t("guest.checkin")}>
                    <input type="date" name="fechaIngreso" value={data.fechaIngreso || ""} onChange={handleChange} style={lockedInputStyle} disabled readOnly />
                  </Field>

                  <Field label={t("guest.checkout")}>
                    <input type="date" name="fechaSalida" value={data.fechaSalida || ""} onChange={handleChange} style={lockedInputStyle} disabled readOnly />
                  </Field>
                </div>

                {!esPasaporte && (
                  <div style={{ width: "100%", color: "#9ca3af", fontSize: "0.85rem", textAlign: "center", marginTop: "0.25rem", lineHeight: 1.4 }}>
                    {t("guest.foreignOnlyHint")}
                  </div>
                )}
              </div>

              {effectiveMode === "manual" && (
                <div style={{ marginTop: "1.35rem", paddingTop: "1.25rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ textAlign: "center", marginBottom: "1rem" }}>
                    <h3 style={{ color: "white", fontSize: "1.05rem", marginBottom: "0.3rem" }}>
                      {t("guest.docSectionTitle").replace("📄 ", "")}
                    </h3>
                    <p
                      style={{ color: "#94a3b8", fontSize: "0.86rem", lineHeight: 1.45, margin: 0 }}
                      dangerouslySetInnerHTML={{ __html: t("guest.docSectionDesc") }}
                    />
                  </div>

                  <div style={styles.row}>
                    {esCedula && (
                      <>
                        <UploadField
                          label={t("guest.uploadIdFront")}
                          inputName="archivoCedula"
                          fileValue={(data as any).archivoCedula || null}
                          onFile={handleFile}
                          onOcrFile={handleOcrFile}
                        />
                        <UploadField
                          label={t("guest.uploadIdBack")}
                          inputName="archivoFirma"
                          fileValue={(data as any).archivoFirma || null}
                          onFile={handleFile}
                        />
                      </>
                    )}

                    {esPasaporte && (
                      <UploadField
                        label={t("guest.uploadPassport")}
                        inputName="archivoPasaporte"
                        fileValue={(data as any).archivoPasaporte || null}
                        onFile={handleFile}
                        onOcrFile={handleOcrFile}
                      />
                    )}

                    {!esCedula && !esPasaporte && (
                      <div style={{ width: "100%", color: "#9ca3af", fontSize: "0.85rem", textAlign: "center", padding: "0.75rem 0", lineHeight: 1.4 }}>
                        {t("guest.selectDocHint")}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {!esTitular && (
        <div style={{ textAlign: isMobile ? "center" : "right", marginTop: "0.75rem" }}>
          <button
            type="button"
            onClick={() => onRemove?.(index)}
            style={{
              background: "#dc2626", color: "white", border: "none",
              padding: "0.7rem 1rem", borderRadius: "0.45rem",
              cursor: "pointer", fontSize: "0.85rem", fontWeight: 700,
              width: isMobile ? "100%" : "auto",
            }}
          >
            {t("guest.btnRemove")}
          </button>
        </div>
      )}
    </div>
  );
}