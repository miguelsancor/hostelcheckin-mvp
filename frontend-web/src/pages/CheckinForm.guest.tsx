import React, { useRef, useState } from "react";
import Tesseract from "tesseract.js";
import { styles } from "./CheckinForm.styles";
import type { Huesped } from "./CheckinForm.types";

type GuestCardProps = {
  data: Huesped;
  index: number;
  onChange: (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  onBatchUpdate: (index: number, fields: Record<string, string>) => void;
  onFile: (index: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove?: (index: number) => void;
};

const isMobile = typeof window !== "undefined" ? window.innerWidth <= 768 : false;

/* ── Icons ── */
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
function WandIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 4V2M15 16V14M8 9H10M20 9H22M17.8 11.8L19 13M17.8 6.2L19 5M12.2 11.8L11 13M12.2 6.2L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M2 22L13 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ── Field ── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{
      width: "100%", marginBottom: "0.9rem",
      display: "flex", flexDirection: isMobile ? "column" : "row",
      alignItems: isMobile ? "stretch" : "center", gap: isMobile ? "0.45rem" : "0.75rem",
      boxSizing: "border-box",
    }}>
      <label style={{
        color: "#9ca3af", fontSize: "0.82rem",
        textAlign: isMobile ? "left" : "right", whiteSpace: "normal",
        lineHeight: 1.35, minWidth: isMobile ? undefined : "180px",
        maxWidth: isMobile ? undefined : "220px", flexShrink: 0,
        wordBreak: "break-word",
      }}>
        {label}
      </label>
      <div style={{ width: "100%", minWidth: 0 }}>{children}</div>
    </div>
  );
}

/* ── Upload Field ── */
type UploadFieldProps = {
  label: string;
  inputName: string;
  fileValue?: File | null;
  onFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

function UploadField({ label, inputName, fileValue, onFile }: UploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <Field label={label}>
      <div style={{ width: "100%", minWidth: 0 }}>
        <div style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "1rem", padding: isMobile ? "0.85rem" : "0.95rem",
          boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0.7rem" }}>
            <button type="button" onClick={() => fileInputRef.current?.click()}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: "0.55rem", minHeight: "52px", width: "100%",
                borderRadius: "0.85rem", background: "linear-gradient(135deg, #1e293b, #334155)",
                color: "white", border: "1px solid rgba(255,255,255,0.10)",
                cursor: "pointer", fontWeight: 800, fontSize: "0.88rem",
              }}>
              <CameraIcon /> Usar cámara
            </button>
            <button type="button" onClick={() => cameraInputRef.current?.click()}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: "0.55rem", minHeight: "52px", width: "100%",
                borderRadius: "0.85rem", background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                color: "white", border: "none", cursor: "pointer",
                fontWeight: 800, fontSize: "0.88rem",
                boxShadow: "0 12px 24px rgba(59,130,246,0.18)",
              }}>
              <FileIcon /> Subir archivo
            </button>
          </div>
          <div style={{ marginTop: "0.7rem", color: "#94a3b8", fontSize: "0.78rem", lineHeight: 1.45 }}>
            Puedes elegir un archivo guardado o intentar tomar una foto. Según el navegador, puede aparecer primero el selector del dispositivo.
          </div>
          <div style={{
            marginTop: "0.8rem", minHeight: "38px", borderRadius: "0.8rem",
            border: fileValue ? "1px solid rgba(16,185,129,0.25)" : "1px dashed rgba(255,255,255,0.12)",
            background: fileValue ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.02)",
            display: "flex", alignItems: "center", gap: "0.55rem",
            padding: "0.7rem 0.85rem", color: fileValue ? "#34d399" : "#94a3b8",
            fontSize: "0.82rem", wordBreak: "break-word",
          }}>
            {fileValue ? (
              <><SuccessIcon /><span>{fileValue.name}</span></>
            ) : (
              <span>No has seleccionado ningún archivo todavía.</span>
            )}
          </div>
        </div>
        <input ref={fileInputRef} type="file" name={inputName} accept="image/*,.pdf" onChange={onFile} style={{ display: "none" }} />
        <input ref={cameraInputRef} type="file" name={inputName} accept="image/*" onChange={onFile} style={{ display: "none" }} />
      </div>
    </Field>
  );
}

const REASONS_TRIP = [
  "Tourism", "Medical check up", "Business", "Musical event",
  "Missed flight", "Family visit", "Sporting event", "Shopping",
  "Academic event", "Other",
];

/* ── Parser de texto OCR para documentos de identidad ── */
function parseDocumentText(text: string, _esCedula: boolean, _esPasaporte: boolean): Record<string, string> {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const joined = lines.join(" ");
  const result: Record<string, string> = {};

  /* Número de documento: buscar secuencias numéricas largas */
  const numMatch = joined.match(/\b(\d[\d.,]{5,15}\d)\b/);
  if (numMatch) {
    result.numeroDocumento = numMatch[1].replace(/[.,]/g, "");
  }

  /* Nombre: buscar APELLIDOS + NOMBRES en cédulas colombianas */
  const apellidoMatch = joined.match(/APELLIDOS?\s*[:\s]*([A-ZÁÉÍÓÚÑ\s]+?)(?=\s*NOMBRES?\b)/i);
  const nombreMatch = joined.match(/NOMBRES?\s*[:\s]*([A-ZÁÉÍÓÚÑ\s]+?)(?=\s*(?:FIRMA|FECHA|$|\d))/i);
  if (apellidoMatch && nombreMatch) {
    const apellidos = apellidoMatch[1].trim();
    const nombres = nombreMatch[1].trim();
    if (apellidos.length > 1 && nombres.length > 1) {
      result.nombre = `${nombres} ${apellidos}`.replace(/\s{2,}/g, " ").trim();
    }
  }

  /* Fecha de nacimiento: buscar patrones de fecha */
  const datePatterns = [
    /(\d{4}[-/.]\d{2}[-/.]\d{2})/,
    /(\d{2}[-/.]\d{2}[-/.]\d{4})/,
    /(\d{2}\s+[A-Z]{3}\s+\d{4})/i,
  ];
  for (const pat of datePatterns) {
    const m = joined.match(pat);
    if (m) {
      let dateStr = m[1].replace(/[/.]/g, "-");
      const parts = dateStr.split("-");
      if (parts.length === 3 && parts[2].length === 4) {
        dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      result.fechaNacimiento = dateStr;
      break;
    }
  }

  /* Nacionalidad */
  if (/COLOMBIA|COLOMBIAN[OA]?/i.test(joined)) {
    result.nacionalidad = "Colombia";
  } else {
    const natMatch = joined.match(/(?:NATIONALITY|NACIONALIDAD|NAC)[:\s]+([A-Za-zÁÉÍÓÚÑáéíóúñ\s]+)/i);
    if (natMatch) result.nacionalidad = natMatch[1].trim();
  }

  /* Tipo de documento (confirmar) */
  if (/REPÚBLICA\s+DE\s+COLOMBIA|CÉDULA\s+DE\s+CIUDADANÍA|CEDULA/i.test(joined)) {
    result.tipoDocumento = "Cédula";
  } else if (/PASSPORT|PASAPORTE/i.test(joined)) {
    result.tipoDocumento = "Pasaporte";
  }

  /* Ciudad / dirección */
  const cityMatch = joined.match(/(?:LUGAR\s+DE\s+(?:NACIMIENTO|EXPEDICIÓN)|BIRTH\s*PLACE|CITY)[:\s]+([A-Za-zÁÉÍÓÚÑáéíóúñ\s]+)/i);
  if (cityMatch) {
    result.ciudadResidencia = cityMatch[1].trim().substring(0, 40);
  }

  return result;
}

/* ── GuestCard ── */
export function GuestCard({ data, index, onChange, onBatchUpdate, onFile, onRemove }: GuestCardProps) {
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<string | null>(null);
  const [ocrProgress, setOcrProgress] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => onChange(index, e);
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFile(index, e);
    e.target.value = "";
  };

  const esCedula = data.tipoDocumento === "Cédula";
  const esPasaporte = data.tipoDocumento === "Pasaporte";
  const esTitular = index === 0;

  /* Detect if a primary document has been uploaded */
  const docFile = esCedula ? (data as any).archivoCedula : esPasaporte ? (data as any).archivoPasaporte : null;
  const tieneDoc = !!docFile;

  /* ── OCR client-side con Tesseract.js ── */
  const handleOcrClick = async () => {
    if (!docFile || ocrLoading) return;
    setOcrLoading(true);
    setOcrResult(null);
    setOcrProgress(0);

    try {
      /* Leer archivo como dataURL */
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(docFile);
      });

      /* Ejecutar OCR con Tesseract.js */
      const result = await Tesseract.recognize(dataUrl, "spa+eng", {
        logger: (m: any) => {
          if (m.status === "recognizing text" && typeof m.progress === "number") {
            setOcrProgress(Math.round(m.progress * 100));
          }
        },
      });

      const rawText = (result?.data?.text || "").trim();
      if (!rawText || rawText.length < 5) {
        setOcrResult("No se encontró texto legible en el documento");
        return;
      }

      /* Parsear campos del documento de identidad */
      const autoFill = parseDocumentText(rawText, esCedula, esPasaporte);

      /* Filtrar solo campos con valor */
      const validFields: Record<string, string> = {};
      for (const [name, value] of Object.entries(autoFill)) {
        if (value) validFields[name] = value;
      }

      /* Aplicar todos los campos de una sola vez */
      if (Object.keys(validFields).length > 0) {
        onBatchUpdate(index, validFields);
      }

      const count = Object.keys(validFields).length;
      setOcrResult(count > 0 ? `✓ ${count} campos completados automáticamente` : "No se encontraron datos legibles");
    } catch (err) {
      console.error("OCR error:", err);
      setOcrResult("Error procesando el documento");
    } finally {
      setOcrLoading(false);
      setOcrProgress(0);
    }
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
      <div style={styles.row}>
        <Field label="Nombre / Name">
          <input name="nombre" value={data.nombre || ""} onChange={handleChange} placeholder="Nombre completo" style={styles.input} />
        </Field>
        <Field label="Tipo documento / Document type">
          <select name="tipoDocumento" value={data.tipoDocumento || ""} onChange={handleChange} style={styles.input}>
            <option value="">Seleccione / Select</option>
            <option value="Cédula">Cédula</option>
            <option value="Pasaporte">Pasaporte</option>
          </select>
        </Field>
        <Field label="Número documento / Document number">
          <input name="numeroDocumento" value={data.numeroDocumento || ""} onChange={handleChange} placeholder="Número" style={styles.input} />
        </Field>
        <Field label="Nacionalidad / Nationality">
          <input name="nacionalidad" value={data.nacionalidad || ""} onChange={handleChange} placeholder="Nacionalidad" style={styles.input} />
        </Field>
      </div>

      <div style={styles.row}>
        <Field label="Fecha nacimiento / Birth date">
          <input type="date" name="fechaNacimiento" value={data.fechaNacimiento || ""} onChange={handleChange} style={styles.input} />
        </Field>
        <Field label="Teléfono / Phone">
          <input name="telefono" value={data.telefono || ""} onChange={handleChange} style={styles.input} />
        </Field>
        <Field label="Email">
          <input name="email" value={data.email || ""} onChange={handleChange} style={styles.input} />
        </Field>
      </div>

      {esTitular && (
        <>
          <div style={{ marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={styles.row}>
              <Field label="Ciudad residencia / Residence city">
                <input name="ciudadResidencia" value={(data as any).ciudadResidencia || ""} onChange={handleChange} placeholder="Ciudad de residencia" style={styles.input} />
              </Field>
              <Field label="Ciudad procedencia / Origin city">
                <input name="ciudadProcedencia" value={(data as any).ciudadProcedencia || ""} onChange={handleChange} placeholder="Ciudad de procedencia" style={styles.input} />
              </Field>
              <Field label="Ciudad destino / Destination city">
                <input name="ciudadDestino" value={(data as any).ciudadDestino || ""} onChange={handleChange} placeholder="Ciudad de destino" style={styles.input} />
              </Field>

              {esPasaporte && (
                <>
                  <Field label="Lugar procedencia / Origin place">
                    <input name="lugarProcedencia" value={(data as any).lugarProcedencia || ""} onChange={handleChange} placeholder="Lugar procedencia" style={styles.input} />
                  </Field>
                  <Field label="Lugar destino / Destination place">
                    <input name="lugarDestino" value={(data as any).lugarDestino || ""} onChange={handleChange} placeholder="Lugar destino" style={styles.input} />
                  </Field>
                </>
              )}

              <Field label="Motivo viaje / Trip reason">
                <select name="motivoViaje" value={data.motivoViaje || ""} onChange={handleChange} style={styles.input}>
                  <option value="">Seleccione / Select</option>
                  {REASONS_TRIP.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>

              <Field label="Dirección / Address (opcional)">
                <input name="direccion" value={data.direccion || ""} onChange={handleChange} placeholder="Dirección" style={styles.input} />
              </Field>
            </div>

            <div style={styles.row}>
              <Field label="Ingreso / Check-in">
                <input type="date" name="fechaIngreso" value={data.fechaIngreso || ""} onChange={handleChange} style={lockedInputStyle} disabled readOnly />
              </Field>
              <Field label="Salida / Check-out">
                <input type="date" name="fechaSalida" value={data.fechaSalida || ""} onChange={handleChange} style={lockedInputStyle} disabled readOnly />
              </Field>
            </div>

            {!esPasaporte && (
              <div style={{ width: "100%", color: "#9ca3af", fontSize: "0.85rem", textAlign: "center", marginTop: "0.25rem", lineHeight: 1.4 }}>
                Lugar de procedencia y destino aplican solo para extranjeros (Pasaporte).
              </div>
            )}
          </div>

          {/* Document upload section */}
          <div style={{ marginTop: "1.35rem", paddingTop: "1.25rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ textAlign: "center", marginBottom: "1rem" }}>
              <h3 style={{ color: "white", fontSize: "1.05rem", marginBottom: "0.3rem" }}>
                Documentos del titular
              </h3>
              <p style={{ color: "#94a3b8", fontSize: "0.86rem", lineHeight: 1.45, margin: 0 }}>
                Sube tu documento de identidad para agilizar tu registro.
                Este paso es <strong style={{ color: "#fbbf24" }}>muy recomendado</strong> para una mejor experiencia.
              </p>
            </div>

            <div style={styles.row}>
              {esCedula && (
                <>
                  <UploadField label="Foto cédula frente / ID front (recomendado)" inputName="archivoCedula" fileValue={(data as any).archivoCedula || null} onFile={handleFile} />
                  <UploadField label="Foto cédula atrás / ID back" inputName="archivoFirma" fileValue={(data as any).archivoFirma || null} onFile={handleFile} />
                </>
              )}
              {esPasaporte && (
                <UploadField label="Foto pasaporte / Passport photo (recomendado)" inputName="archivoPasaporte" fileValue={(data as any).archivoPasaporte || null} onFile={handleFile} />
              )}
              {!esCedula && !esPasaporte && (
                <div style={{ width: "100%", color: "#9ca3af", fontSize: "0.85rem", textAlign: "center", padding: "0.75rem 0", lineHeight: 1.4 }}>
                  Selecciona el tipo de documento (Cédula o Pasaporte) para habilitar la carga.
                </div>
              )}
            </div>

            {/* ── OCR Button: sutil pero llamativo ── */}
            {tieneDoc && (
              <div style={{ marginTop: "0.75rem", textAlign: "center" }}>
                <button
                  type="button"
                  onClick={handleOcrClick}
                  disabled={ocrLoading}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.65rem 1.2rem",
                    background: ocrLoading
                      ? "rgba(139,92,246,0.10)"
                      : "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.15))",
                    border: "1px solid rgba(139,92,246,0.45)",
                    borderRadius: "0.75rem",
                    color: "#c4b5fd",
                    cursor: ocrLoading ? "wait" : "pointer",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    transition: "all 0.2s ease",
                    boxShadow: "0 4px 16px rgba(139,92,246,0.15)",
                    animation: ocrLoading ? undefined : "ocrPulse 2.5s ease-in-out infinite",
                  }}
                >
                  <WandIcon />
                  {ocrLoading ? `Escaneando documento... ${ocrProgress}%` : "✨ Rellenar datos con el documento adjunto"}
                </button>

                {/* Barra de progreso sutil durante escaneo */}
                {ocrLoading && (
                  <div style={{
                    marginTop: "0.5rem",
                    maxWidth: "260px",
                    marginLeft: "auto",
                    marginRight: "auto",
                  }}>
                    <div style={{
                      height: "4px",
                      background: "rgba(139,92,246,0.15)",
                      borderRadius: "999px",
                      overflow: "hidden",
                    }}>
                      <div style={{
                        height: "100%",
                        width: `${ocrProgress}%`,
                        background: "linear-gradient(90deg, #8b5cf6, #3b82f6)",
                        borderRadius: "999px",
                        transition: "width 0.3s ease",
                      }} />
                    </div>
                  </div>
                )}

                {ocrResult && !ocrLoading && (
                  <div style={{
                    marginTop: "0.5rem",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    color: ocrResult.startsWith("✓") ? "#34d399" : "#fbbf24",
                    lineHeight: 1.4,
                  }}>
                    {ocrResult}
                  </div>
                )}

                <style>{`
                  @keyframes ocrPulse {
                    0%, 100% { box-shadow: 0 4px 16px rgba(139,92,246,0.15); }
                    50% { box-shadow: 0 4px 24px rgba(139,92,246,0.35); }
                  }
                `}</style>
              </div>
            )}
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
            Eliminar huésped
          </button>
        </div>
      )}
    </div>
  );
}
