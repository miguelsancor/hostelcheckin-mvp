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

  return (
    <div style={styles.card}>
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
          placeholder="Colombia"
          style={styles.input}
        />
      </div>

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

        {/** ❌ ELIMINADO b_extras */}
        {/* <input
          name="b_extras"
          value={data.b_extras || ""}
          onChange={handleChange}
          placeholder="Extras"
          style={styles.input}
        /> */}
      </div>

      {/** ❌ ELIMINADO b_smoking */}
      {/* 
      <div style={styles.row}>
        <input
          name="b_smoking"
          value={data.b_smoking || ""}
          onChange={handleChange}
          placeholder="Fumador"
          style={styles.input}
        />
      </div>
      */}

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

      <div>
        {/** ❌ ELIMINADO b_meal */}
        {/* 
        <textarea
          name="b_meal"
          value={data.b_meal || ""}
          onChange={handleChange}
          placeholder="Comidas incluidas"
          style={styles.input}
        />
        */}

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
