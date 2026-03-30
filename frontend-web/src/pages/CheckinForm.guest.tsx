import React, { useRef, useState } from "react";
import { styles } from "./CheckinForm.styles";
import type { Huesped } from "./CheckinForm.types";
import { useLanguage } from "../i18n";

const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "");

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

/* ── Upload field con OCR ── */
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
    onFile(e);
    const file = e.target.files?.[0];
    if (file && onOcrFile) {
      onOcrFile(file);
    }
  };

  return (
    <Field label={label}>
      <div style={{ width: "100%", minWidth: 0 }}>
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "1rem",
            padding: isMobile ? "0.85rem" : "0.95rem",
            boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: "0.7rem",
            }}
          >
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: "0.55rem", minHeight: "52px", width: "100%", borderRadius: "0.85rem",
                background: "linear-gradient(135deg, #1e293b, #334155)",
                color: "white", border: "1px solid rgba(255,255,255,0.10)",
                cursor: "pointer", fontWeight: 800, fontSize: "0.88rem",
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
                gap: "0.55rem", minHeight: "52px", width: "100%", borderRadius: "0.85rem",
                background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                color: "white", border: "none", cursor: "pointer",
                fontWeight: 800, fontSize: "0.88rem",
                boxShadow: "0 12px 24px rgba(59,130,246,0.18)",
              }}
            >
              <FileIcon />
              {t("guest.btnFile")}
            </button>
          </div>

          <div style={{ marginTop: "0.7rem", color: "#94a3b8", fontSize: "0.78rem", lineHeight: 1.45 }}>
            {t("guest.uploadHint")}
          </div>

          <div
            style={{
              marginTop: "0.8rem", minHeight: "38px", borderRadius: "0.8rem",
              border: fileValue ? "1px solid rgba(16,185,129,0.25)" : "1px dashed rgba(255,255,255,0.12)",
              background: fileValue ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.02)",
              display: "flex", alignItems: "center", gap: "0.55rem",
              padding: "0.7rem 0.85rem",
              color: fileValue ? "#34d399" : "#94a3b8", fontSize: "0.82rem", wordBreak: "break-word",
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
    </Field>
  );
}

/* ── Motivos de viaje ── */
const REASONS_TRIP = [
  "Tourism", "Medical check up", "Business", "Musical event",
  "Missed flight", "Family visit", "Sporting event", "Shopping",
  "Academic event", "Other",
];

/* ── Reason map for i18n (keys stay in English for backend) ── */

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => onChange(index, e);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFile(index, e);
    e.target.value = "";
  };

  /* ── OCR: enviar imagen al backend ── */
  const handleOcrFile = async (file: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    if (index !== 0) return; // Solo titular

    setOcrLoading(true);
    setOcrMessage({ type: "info", text: t("docReader.reading") });

    try {
      const fd = new FormData();
      fd.append("documento", file);

      const resp = await fetch(`${API_BASE}/api/document-reader/extract`, {
        method: "POST",
        body: fd,
      });

      const json = await resp.json();

      if (!json.ok) {
        const reasonKey = OCR_REASON_MAP[json.reason] || "docReader.readFail";
        setOcrMessage({ type: "error", text: t(reasonKey) });
        return;
      }

      // Aplicar campos con confidence scoring
      const fields: Record<string, string> = {};
      const autoKeys: string[] = [];
      const reviewKeys: string[] = [];

      if (json.fields) {
        for (const [key, val] of Object.entries(json.fields)) {
          const { value, confidence } = val as { value: string; confidence: number };
          if (confidence >= 0.90) {
            fields[key] = value;
            autoKeys.push(key);
          } else if (confidence >= 0.70) {
            fields[key] = value;
            reviewKeys.push(key);
          }
          // < 0.70: no llenar
        }
      }

      if (Object.keys(fields).length > 0 && onAutoFill) {
        onAutoFill(fields, [...autoKeys, ...reviewKeys]);
        setOcrMessage({ type: "success", text: t("docReader.verifyInfo") });
      } else {
        setOcrMessage({ type: "error", text: t("docReader.readFail") });
      }
    } catch {
      setOcrMessage({ type: "error", text: t("docReader.readFail") });
    } finally {
      setOcrLoading(false);
      setTimeout(() => setOcrMessage(null), 8000);
    }
  };

  const esCedula = data.tipoDocumento === "Cédula";
  const esPasaporte = data.tipoDocumento === "Pasaporte";
  const esTitular = index === 0;

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
      {/* OCR Status */}
      {ocrMessage && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.75rem 1rem",
            borderRadius: "0.75rem",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            fontSize: "0.88rem",
            fontWeight: 700,
            background:
              ocrMessage.type === "success"
                ? "rgba(16,185,129,0.12)"
                : ocrMessage.type === "error"
                ? "rgba(239,68,68,0.12)"
                : "rgba(59,130,246,0.12)",
            border:
              ocrMessage.type === "success"
                ? "1px solid rgba(16,185,129,0.25)"
                : ocrMessage.type === "error"
                ? "1px solid rgba(239,68,68,0.25)"
                : "1px solid rgba(59,130,246,0.25)",
            color:
              ocrMessage.type === "success"
                ? "#86efac"
                : ocrMessage.type === "error"
                ? "#fca5a5"
                : "#93c5fd",
          }}
        >
          {ocrLoading ? (
            <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span>
          ) : (
            <ScanIcon />
          )}
          {ocrMessage.text}
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

          <div style={{ marginTop: "1.35rem", paddingTop: "1.25rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ textAlign: "center", marginBottom: "1rem" }}>
              <h3 style={{ color: "white", fontSize: "1.05rem", marginBottom: "0.3rem" }}>
                {t("guest.docSectionTitle")}
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
                    onOcrFile={esTitular ? handleOcrFile : undefined}
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
                  onOcrFile={esTitular ? handleOcrFile : undefined}
                />
              )}

              {!esCedula && !esPasaporte && (
                <div style={{ width: "100%", color: "#9ca3af", fontSize: "0.85rem", textAlign: "center", padding: "0.75rem 0", lineHeight: 1.4 }}>
                  {t("guest.selectDocHint")}
                </div>
              )}
            </div>
          </div>
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
