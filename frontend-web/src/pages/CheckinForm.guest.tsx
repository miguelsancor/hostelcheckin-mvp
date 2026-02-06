import React from "react";
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
        marginBottom: "0.8rem",
        display: "grid",
        gridTemplateColumns: "220px 1fr",
        alignItems: "center",
        gap: "0.75rem",
      }}
    >
      <label
        style={{
          color: "#9ca3af",
          fontSize: "0.8rem",
          textAlign: "right",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </label>
      {children}
    </div>
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
      {/* ===================== DATOS PERSONALES (ÚNICA SECCIÓN) ===================== */}
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

      {/* =========================================================
          ✅ CAMPOS DE VIAJE MOVIDOS AQUÍ (SOLO TITULAR)
          - Lugar Procedencia (solo pasaporte)
          - Lugar Destino (solo pasaporte)
          - Motivo viaje
          - Dirección (no obligatorio)
      ========================================================= */}
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
              {/* ✅ SOLO EXTRANJEROS (PASAPORTE) */}
              {esPasaporte && (
                <>
                  <Field label="Lugar procedencia / Origin place">
                    <input
                      name="lugarProcedencia"
                      value={data.lugarProcedencia || ""}
                      onChange={handleChange}
                      placeholder="Lugar procedencia"
                      style={styles.input}
                    />
                  </Field>

                  <Field label="Lugar destino / Destination place">
                    <input
                      name="lugarDestino"
                      value={data.lugarDestino || ""}
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

            {/* ✅ FECHAS BLOQUEADAS (NO EDITABLES) */}
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
                }}
              >
                Lugar de procedencia y destino aplican solo para extranjeros
                (Pasaporte).
              </div>
            )}
          </div>

          {/* ===================== DOCUMENTOS (SOLO TITULAR) ===================== */}
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
              }}
            >
              Solo debes agregar el documento del titular de la reserva
            </p>

            <div style={styles.row}>
              {esCedula && (
                <>
                  <Field label="Foto cédula frente / ID front">
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <input
                        type="file"
                        name="archivoCedula"
                        onChange={handleFile}
                        style={styles.fileInput}
                      />
                      {data.archivoCedula && (
                        <span style={{ color: "#10b981", fontSize: "0.8rem" }}>
                          {(data.archivoCedula as File).name}
                        </span>
                      )}
                    </div>
                  </Field>

                  <Field label="Foto cédula atrás / ID back">
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <input
                        type="file"
                        name="archivoFirma"
                        onChange={handleFile}
                        style={styles.fileInput}
                      />
                      {data.archivoFirma && (
                        <span style={{ color: "#10b981", fontSize: "0.8rem" }}>
                          {(data.archivoFirma as File).name}
                        </span>
                      )}
                    </div>
                  </Field>
                </>
              )}

              {esPasaporte && (
                <Field label="Foto pasaporte / Passport photo">
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <input
                      type="file"
                      name="archivoPasaporte"
                      onChange={handleFile}
                      style={styles.fileInput}
                    />
                    {data.archivoPasaporte && (
                      <span style={{ color: "#10b981", fontSize: "0.8rem" }}>
                        {(data.archivoPasaporte as File).name}
                      </span>
                    )}
                  </div>
                </Field>
              )}

              {!esCedula && !esPasaporte && (
                <div
                  style={{
                    width: "100%",
                    color: "#9ca3af",
                    fontSize: "0.85rem",
                    textAlign: "center",
                    padding: "0.75rem 0",
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

      {/* ✅ BOTÓN ELIMINAR (solo desde el huésped 2 en adelante) */}
      {!esTitular && (
        <div style={{ textAlign: "right", marginTop: "0.75rem" }}>
          <button
            type="button"
            onClick={() => onRemove?.(index)}
            style={{
              background: "#dc2626",
              color: "white",
              border: "none",
              padding: "0.55rem 1rem",
              borderRadius: "0.45rem",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 700,
            }}
          >
            Eliminar huésped
          </button>
        </div>
      )}
    </div>
  );
}
