import React from "react";
import { styles } from "./CheckinForm.styles";
import type { Huesped } from "./CheckinForm.types";

type GuestCardProps = {
  data: Huesped;
  index: number;
  activeTab: string;
  onChange: (
    index: number,
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => void;
  onFile: (index: number, e: React.ChangeEvent<HTMLInputElement>) => void;
};

/* ✅ Field fuera del componente: NO se recrea en cada tecla */
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

export function GuestCard({
  data,
  index,
  activeTab,
  onChange,
  onFile,
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

  // ✅ Titular = primer huésped
  const esTitular = index === 0;

  return (
    <div style={styles.card}>
      {/* ===================== TAB: DATOS PERSONALES ===================== */}
      {activeTab === "personal" && (
        <>
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

          {/* ===================== SUBSECCIÓN: DOCUMENTOS (SOLO TITULAR) ===================== */}
          {esTitular && (
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
              </div>
            </div>
          )}
        </>
      )}

      {/* ===================== TAB: VIAJE ===================== */}
      {activeTab === "viaje" && (
        <>
          <div style={styles.row}>
            <Field label="País origen / Country of origin">
              <input
                name="paisOrigen"
                value={data.paisOrigen || ""}
                onChange={handleChange}
                placeholder="País origen"
                style={styles.input}
              />
            </Field>

            <Field label="País destino / Destination country">
              <input
                name="paisDestino"
                value={data.paisDestino || ""}
                onChange={handleChange}
                placeholder="País destino"
                style={styles.input}
              />
            </Field>

            <Field label="Dirección / Address">
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
                style={styles.input}
              />
            </Field>

            <Field label="Salida / Check-out">
              <input
                type="date"
                name="fechaSalida"
                value={data.fechaSalida || ""}
                onChange={handleChange}
                style={styles.input}
              />
            </Field>
          </div>
        </>
      )}
    </div>
  );
}
