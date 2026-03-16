import React, { useRef } from "react";
import { styles } from "./CheckinForm.styles";
import type { Huesped } from "./CheckinForm.types";

type GuestCardProps = {
  data: Huesped;
  index: number;
  onChange: (
    index: number,
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => void;
  onFile: (index: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove?: (index: number) => void;
};

const isMobile =
  typeof window !== "undefined" ? window.innerWidth <= 768 : false;

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        width: "100%",
        marginBottom: "0.9rem",
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "220px 1fr",
        alignItems: isMobile ? "stretch" : "center",
        gap: isMobile ? "0.45rem" : "0.75rem",
        boxSizing: "border-box",
      }}
    >
      <label
        style={{
          color: "#9ca3af",
          fontSize: "0.82rem",
          textAlign: isMobile ? "left" : "right",
          whiteSpace: isMobile ? "normal" : "nowrap",
          lineHeight: 1.35,
        }}
      >
        {label}
      </label>
      <div style={{ width: "100%", minWidth: 0 }}>{children}</div>
    </div>
  );
}

type UploadFieldProps = {
  label: string;
  inputName: string;
  fileValue?: File | null;
  onFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

function UploadField({
  label,
  inputName,
  fileValue,
  onFile,
}: UploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <Field label={label}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          minWidth: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            flexWrap: "wrap",
            gap: "0.55rem",
            alignItems: "stretch",
            width: "100%",
          }}
        >
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: "#334155",
              color: "white",
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: "0.5rem",
              padding: "0.72rem 0.95rem",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "0.85rem",
              minHeight: "44px",
              width: isMobile ? "100%" : "auto",
            }}
          >
            Escoger archivo
          </button>

          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            style={{
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              padding: "0.72rem 0.95rem",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "0.85rem",
              minHeight: "44px",
              width: isMobile ? "100%" : "auto",
            }}
          >
            Tomar foto
          </button>
        </div>

        <div
          style={{
            color: "#9ca3af",
            fontSize: "0.78rem",
            marginTop: "0.45rem",
            lineHeight: 1.35,
          }}
        >
          Opcional: puedes subir un archivo existente o tomar una foto en este momento.
        </div>

        {fileValue && (
          <span
            style={{
              color: "#10b981",
              fontSize: "0.8rem",
              marginTop: "0.45rem",
              wordBreak: "break-word",
            }}
          >
            {fileValue.name}
          </span>
        )}

        <input
          ref={fileInputRef}
          type="file"
          name={inputName}
          accept="image/*,.pdf"
          onChange={onFile}
          style={{ display: "none" }}
        />

        <input
          ref={cameraInputRef}
          type="file"
          name={inputName}
          accept="image/*"
          capture="environment"
          onChange={onFile}
          style={{ display: "none" }}
        />
      </div>
    </Field>
  );
}

const REASONS_TRIP = [
  "Tourism",
  "Medical check up",
  "Business",
  "Musical event",
  "Missed flight",
  "Family visit",
  "Sporting event",
  "Shopping",
  "Academic event",
  "Other",
];

export function GuestCard({
  data,
  index,
  onChange,
  onFile,
  onRemove,
}: GuestCardProps) {
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => onChange(index, e);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFile(index, e);
    e.target.value = "";
  };

  const esCedula = data.tipoDocumento === "Cédula";
  const esPasaporte = data.tipoDocumento === "Pasaporte";
  const esTitular = index === 0;

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
          <input
            name="nombre"
            value={data.nombre || ""}
            onChange={handleChange}
            placeholder="Nombre completo"
            style={styles.input}
          />
        </Field>

        <Field label="Tipo documento / Document type">
          <select
            name="tipoDocumento"
            value={data.tipoDocumento || ""}
            onChange={handleChange}
            style={styles.input}
          >
            <option value="">Seleccione / Select</option>
            <option value="Cédula">Cédula</option>
            <option value="Pasaporte">Pasaporte</option>
          </select>
        </Field>

        <Field label="Número documento / Document number">
          <input
            name="numeroDocumento"
            value={data.numeroDocumento || ""}
            onChange={handleChange}
            placeholder="Número"
            style={styles.input}
          />
        </Field>

        <Field label="Nacionalidad / Nationality">
          <input
            name="nacionalidad"
            value={data.nacionalidad || ""}
            onChange={handleChange}
            placeholder="Nacionalidad"
            style={styles.input}
          />
        </Field>
      </div>

      <div style={styles.row}>
        <Field label="Fecha nacimiento / Birth date">
          <input
            type="date"
            name="fechaNacimiento"
            value={data.fechaNacimiento || ""}
            onChange={handleChange}
            style={styles.input}
          />
        </Field>

        <Field label="Teléfono / Phone">
          <input
            name="telefono"
            value={data.telefono || ""}
            onChange={handleChange}
            style={styles.input}
          />
        </Field>

        <Field label="Email">
          <input
            name="email"
            value={data.email || ""}
            onChange={handleChange}
            style={styles.input}
          />
        </Field>
      </div>

      {esTitular && (
        <>
          <div
            style={{
              marginTop: "1.25rem",
              paddingTop: "1.25rem",
              borderTop: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div style={styles.row}>
              <Field label="Ciudad residencia / Residence city">
                <input
                  name="ciudadResidencia"
                  value={(data as any).ciudadResidencia || ""}
                  onChange={handleChange}
                  placeholder="Ciudad de residencia"
                  style={styles.input}
                />
              </Field>

              <Field label="Ciudad procedencia / Origin city">
                <input
                  name="ciudadProcedencia"
                  value={(data as any).ciudadProcedencia || ""}
                  onChange={handleChange}
                  placeholder="Ciudad de procedencia"
                  style={styles.input}
                />
              </Field>

              <Field label="Ciudad destino / Destination city">
                <input
                  name="ciudadDestino"
                  value={(data as any).ciudadDestino || ""}
                  onChange={handleChange}
                  placeholder="Ciudad de destino"
                  style={styles.input}
                />
              </Field>

              {esPasaporte && (
                <>
                  <Field label="Lugar procedencia / Origin place">
                    <input
                      name="lugarProcedencia"
                      value={(data as any).lugarProcedencia || ""}
                      onChange={handleChange}
                      placeholder="Lugar procedencia"
                      style={styles.input}
                    />
                  </Field>

                  <Field label="Lugar destino / Destination place">
                    <input
                      name="lugarDestino"
                      value={(data as any).lugarDestino || ""}
                      onChange={handleChange}
                      placeholder="Lugar destino"
                      style={styles.input}
                    />
                  </Field>
                </>
              )}

              <Field label="Motivo viaje / Trip reason">
                <select
                  name="motivoViaje"
                  value={data.motivoViaje || ""}
                  onChange={handleChange}
                  style={styles.input}
                >
                  <option value="">Seleccione / Select</option>
                  {REASONS_TRIP.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Dirección / Address (opcional)">
                <input
                  name="direccion"
                  value={data.direccion || ""}
                  onChange={handleChange}
                  placeholder="Dirección"
                  style={styles.input}
                />
              </Field>
            </div>

            <div style={styles.row}>
              <Field label="Ingreso / Check-in">
                <input
                  type="date"
                  name="fechaIngreso"
                  value={data.fechaIngreso || ""}
                  onChange={handleChange}
                  style={lockedInputStyle}
                  disabled
                  readOnly
                />
              </Field>

              <Field label="Salida / Check-out">
                <input
                  type="date"
                  name="fechaSalida"
                  value={data.fechaSalida || ""}
                  onChange={handleChange}
                  style={lockedInputStyle}
                  disabled
                  readOnly
                />
              </Field>
            </div>

            {!esPasaporte && (
              <div
                style={{
                  width: "100%",
                  color: "#9ca3af",
                  fontSize: "0.85rem",
                  textAlign: "center",
                  marginTop: "0.25rem",
                  lineHeight: 1.4,
                }}
              >
                Lugar de procedencia y destino aplican solo para extranjeros
                (Pasaporte).
              </div>
            )}
          </div>

          <div
            style={{
              marginTop: "1.25rem",
              paddingTop: "1.25rem",
              borderTop: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <h3
              style={{
                color: "white",
                fontSize: "1rem",
                marginBottom: "0.35rem",
                textAlign: "center",
              }}
            >
              Documentos
            </h3>

            <p
              style={{
                color: "#9ca3af",
                fontSize: "0.85rem",
                textAlign: "center",
                marginBottom: "1rem",
                lineHeight: 1.4,
              }}
            >
              Solo debes agregar el documento del titular de la reserva
            </p>

            <div style={styles.row}>
              {esCedula && (
                <>
                  <UploadField
                    label="Foto cédula frente / ID front"
                    inputName="archivoCedula"
                    fileValue={(data as any).archivoCedula || null}
                    onFile={handleFile}
                  />

                  <UploadField
                    label="Foto cédula atrás / ID back"
                    inputName="archivoFirma"
                    fileValue={(data as any).archivoFirma || null}
                    onFile={handleFile}
                  />
                </>
              )}

              {esPasaporte && (
                <UploadField
                  label="Foto pasaporte / Passport photo"
                  inputName="archivoPasaporte"
                  fileValue={(data as any).archivoPasaporte || null}
                  onFile={handleFile}
                />
              )}

              {!esCedula && !esPasaporte && (
                <div
                  style={{
                    width: "100%",
                    color: "#9ca3af",
                    fontSize: "0.85rem",
                    textAlign: "center",
                    padding: "0.75rem 0",
                    lineHeight: 1.4,
                  }}
                >
                  Selecciona el tipo de documento (Cédula o Pasaporte) para
                  habilitar la carga.
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {!esTitular && (
        <div
          style={{
            textAlign: isMobile ? "center" : "right",
            marginTop: "0.75rem",
          }}
        >
          <button
            type="button"
            onClick={() => onRemove?.(index)}
            style={{
              background: "#dc2626",
              color: "white",
              border: "none",
              padding: "0.7rem 1rem",
              borderRadius: "0.45rem",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 700,
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