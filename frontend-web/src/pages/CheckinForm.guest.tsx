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

  // 🔥 NUEVO: props para usar el modal de motivos
  motivoDetallado: string;
  onOpenMotivoModal: () => void;
};

export function GuestCard({
  data,
  index,
  onChange,
  onFile,
  motivoDetallado,
  onOpenMotivoModal,
}: GuestCardProps) {
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => onChange(index, e);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) =>
    onFile(index, e);

  return (
    <div style={styles.card}>
      {/* ===================== DATOS BÁSICOS ===================== */}
      <div style={styles.row}>
        <input
          name="nombre"
          value={data.nombre || ""}
          onChange={handleChange}
          placeholder="Nombre completo"
          style={styles.input}
        />
        <select
          name="tipoDocumento"
          value={data.tipoDocumento || "Cédula"}
          onChange={handleChange}
          style={styles.input}
        >
          <option value="Cédula">Cédula</option>
          <option value="Pasaporte">Pasaporte</option>
        </select>
        <input
          name="numeroDocumento"
          value={data.numeroDocumento || ""}
          onChange={handleChange}
          placeholder="Número documento"
          style={styles.input}
        />
        <input
          name="nacionalidad"
          value={data.nacionalidad || ""}
          onChange={handleChange}
          placeholder="Nacionalidad"
          style={styles.input}
        />
      </div>

      {/* ===================== NUEVO: FECHA NACIMIENTO ===================== */}
      <div style={styles.row}>
        <input
          type="date"
          name="fechaNacimiento"
          value={data.fechaNacimiento || ""}
          onChange={handleChange}
          style={styles.input}
        />
      </div>

      {/* ===================== ORIGEN Y DESTINO ===================== */}
      <div style={styles.row}>
        <input
          name="paisOrigen"
          value={data.paisOrigen || ""}
          onChange={handleChange}
          placeholder="País de origen"
          style={styles.input}
        />
        <input
          name="paisDestino"
          value={data.paisDestino || ""}
          onChange={handleChange}
          placeholder="País de destino"
          style={styles.input}
        />
      </div>

      {/* ===================== DIRECCIONES ===================== */}
      <div style={styles.row}>
        <input
          name="direccion"
          value={data.direccion || ""}
          onChange={handleChange}
          placeholder="Dirección"
          style={styles.input}
        />
        <input
          name="lugarProcedencia"
          value={data.lugarProcedencia || ""}
          onChange={handleChange}
          placeholder="Lugar procedencia"
          style={styles.input}
        />
        <input
          name="lugarDestino"
          value={data.lugarDestino || ""}
          onChange={handleChange}
          placeholder="Lugar destino"
          style={styles.input}
        />
      </div>

      {/* ===================== RESERVA ===================== */}
      <div style={styles.row}>
        <input
          name="referral"
          value={data.referral || ""}
          onChange={handleChange}
          placeholder="Origen reserva"
          style={styles.input}
        />
        <input
          name="status"
          value={data.status || ""}
          onChange={handleChange}
          placeholder="Estado"
          style={styles.input}
        />
        <input
          name="nights"
          type="number"
          value={data.nights ?? ""}
          onChange={handleChange}
          placeholder="Noches"
          style={styles.input}
        />
        <input
          name="guests"
          type="number"
          value={data.guests ?? ""}
          onChange={handleChange}
          placeholder="Huéspedes"
          style={styles.input}
        />
      </div>

      {/* ===================== PRECIOS ===================== */}
      <div style={styles.row}>
        <input
          name="price"
          type="number"
          value={data.price ?? ""}
          onChange={handleChange}
          placeholder="Precio noche"
          style={styles.input}
        />
        <input
          name="total"
          type="number"
          value={data.total ?? ""}
          onChange={handleChange}
          placeholder="Total"
          style={styles.input}
        />
        <input
          name="b_extras"
          value={data.b_extras || ""}
          onChange={handleChange}
          placeholder="Extras"
          style={styles.input}
        />
      </div>

      {/* ===================== FUMADOR ===================== */}
      <div style={styles.row}>
        <input
          name="b_smoking"
          value={data.b_smoking || ""}
          onChange={handleChange}
          placeholder="Fumador"
          style={styles.input}
        />
      </div>

      {/* ===================== TELÉFONO / EMAIL ===================== */}
      <div style={styles.row}>
        <input
          name="telefono"
          value={data.telefono || ""}
          onChange={handleChange}
          placeholder="Teléfono"
          style={styles.input}
        />
        <input
          name="email"
          value={data.email || ""}
          onChange={handleChange}
          placeholder="Email"
          style={styles.input}
        />
        <select
          name="motivoViaje"
          value={data.motivoViaje || "Turismo"}
          onChange={handleChange}
          style={styles.input}
        >
          <option value="Turismo">Turismo</option>
          <option value="Negocios">Negocios</option>
        </select>
      </div>

      {/* ===================== MOTIVO DETALLADO (USAR MODAL) ===================== */}
      <div style={{ marginTop: "1rem" }}>
        <label style={{ color: "white", fontWeight: "bold" }}>
          Motivo detallado:
        </label>

        <div
          onClick={onOpenMotivoModal}
          style={{
            marginTop: "0.5rem",
            background: "#1f2937",
            padding: "0.75rem",
            borderRadius: "0.5rem",
            cursor: "pointer",
            color: motivoDetallado ? "#10b981" : "#9ca3af",
          }}
        >
          {motivoDetallado || "Seleccionar"}
        </div>
      </div>

      {/* ===================== FECHAS ===================== */}
      <div style={styles.row}>
        <input
          type="date"
          name="fechaIngreso"
          value={data.fechaIngreso || ""}
          onChange={handleChange}
          style={styles.input}
        />
        <input
          type="date"
          name="fechaSalida"
          value={data.fechaSalida || ""}
          onChange={handleChange}
          style={styles.input}
        />
      </div>

      {/* ===================== ARCHIVOS ===================== */}
      <div style={styles.row}>
        <input type="file" name="archivoAnverso" onChange={handleFile} style={styles.input} />
        <input type="file" name="archivoReverso" onChange={handleFile} style={styles.input} />
        <input type="file" name="archivoFirma" onChange={handleFile} style={styles.input} />
      </div>

      {/* ===================== COMENTARIOS ===================== */}
      <div>
        <textarea
          name="comment"
          value={data.comment || ""}
          onChange={handleChange}
          placeholder="Comentarios"
          style={styles.input}
        />
      </div>
    </div>
  );
}
