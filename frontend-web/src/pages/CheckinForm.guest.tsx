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
};

export function GuestCard({ data, index, onChange, onFile }: GuestCardProps) {
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => onChange(index, e);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) =>
    onFile(index, e);

  /* =========================================================
     FORMATEO DE MONEDA
     ========================================================= */
  const formatCurrency = (value: number | string | null | undefined) => {
    if (!value) return "";
    const num = Number(value);
    if (isNaN(num)) return "";
    return num.toLocaleString("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    });
  };

  const handleCurrencyChange = (
    field: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    const parsed = raw === "" ? "" : Number(raw);

    handleChange({
      target: {
        name: field,
        value: parsed,
      },
    } as any);
  };

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

      {/* ===================== FECHA DE NACIMIENTO ===================== */}
      <div style={styles.row}>
        <div style={{ width: "100%" }}>
          <label style={{ color: "white", fontSize: "0.85rem" }}>
            Fecha de nacimiento :  
          </label>
          <input
            type="date"
            name="fechaNacimiento"
            value={data.fechaNacimiento || ""}
            onChange={handleChange}
            style={styles.input}
          />
        </div>
      </div>

      {/* ===================== ORIGEN / DESTINO ===================== */}
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

      {/* ===================== PRECIO / TOTAL ===================== */}
      <div style={styles.row}>
        <input
          name="price"
          value={formatCurrency(data.price)}
          onChange={(e) => handleCurrencyChange("price", e)}
          placeholder="Precio noche"
          style={styles.input}
        />

        <input
          name="total"
          value={formatCurrency(data.total)}
          onChange={(e) => handleCurrencyChange("total", e)}
          placeholder="Total"
          style={styles.input}
        />


      </div>



      {/* ===================== TELÉFONO / EMAIL / MOTIVO GENERAL ===================== */}
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
        <input
          type="file"
          name="archivoAnverso"
          onChange={handleFile}
          style={styles.input}
        />
        <input
          type="file"
          name="archivoReverso"
          onChange={handleFile}
          style={styles.input}
        />
        <input
          type="file"
          name="archivoFirma"
          onChange={handleFile}
          style={styles.input}
        />
      </div>


    </div>
  );
}
