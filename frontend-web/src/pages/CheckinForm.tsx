import { useState } from "react";

type Huesped = {
  nombre: string;
  tipoDocumento: string;
  numeroDocumento: string;
  nacionalidad: string;
  direccion: string;
  lugarProcedencia: string;
  lugarDestino: string;
  telefono: string;
  email: string;
  motivoViaje: string;
  fechaIngreso: string;
  fechaSalida: string;
  docAnverso?: File;
  docReverso?: File;
  firmaBase64?: string;
};

export default function CheckinForm() {
  const [huespedes, setHuespedes] = useState<Huesped[]>([
    {
      nombre: "",
      tipoDocumento: "Cédula",
      numeroDocumento: "",
      nacionalidad: "Colombia",
      direccion: "",
      lugarProcedencia: "",
      lugarDestino: "",
      telefono: "",
      email: "",
      motivoViaje: "Turismo",
      fechaIngreso: "",
      fechaSalida: "",
    },
  ]);

  const handleChange = (index: number, field: keyof Huesped, value: any) => {
    const updated = [...huespedes];
    (updated[index][field] as any) = value;
    setHuespedes(updated);
  };

  const agregarHuesped = () => {
    setHuespedes([
      ...huespedes,
      {
        nombre: "",
        tipoDocumento: "Cédula",
        numeroDocumento: "",
        nacionalidad: "Colombia",
        direccion: "",
        lugarProcedencia: "",
        lugarDestino: "",
        telefono: "",
        email: "",
        motivoViaje: "Turismo",
        fechaIngreso: "",
        fechaSalida: "",
      },
    ]);
  };

  const enviarRegistro = async () => {
    try {
      const plainData = huespedes.map(({ docAnverso, docReverso, ...rest }) => ({
        ...rest,
      }));

      const res = await fetch("http://localhost:4000/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(plainData),
      });

      if (!res.ok) throw new Error("Error en el registro");

      alert("Check-in exitoso ✅");
    } catch (error) {
      console.error("❌ Error al enviar check-in:", error);
      alert("Error al enviar el check-in");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h2 className="text-3xl font-bold text-white">📝 Registro de Huéspedes</h2>

        {huespedes.map((h, index) => (
          <div key={index} className="p-6 bg-[#1a1a1a] rounded-xl border border-gray-700 space-y-4">
            <h3 className="text-xl font-semibold text-blue-400">Huésped #{index + 1}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input className="input" placeholder="Nombre completo" value={h.nombre} onChange={(e) => handleChange(index, "nombre", e.target.value)} />
              <select className="input" value={h.tipoDocumento} onChange={(e) => handleChange(index, "tipoDocumento", e.target.value)}>
                <option>Cédula</option>
                <option>Pasaporte</option>
              </select>
              <input className="input" placeholder="Número documento" value={h.numeroDocumento} onChange={(e) => handleChange(index, "numeroDocumento", e.target.value)} />
              <input className="input" placeholder="Nacionalidad" value={h.nacionalidad} onChange={(e) => handleChange(index, "nacionalidad", e.target.value)} />
              <input className="input" placeholder="Dirección" value={h.direccion} onChange={(e) => handleChange(index, "direccion", e.target.value)} />
              <input className="input" placeholder="Lugar procedencia" value={h.lugarProcedencia} onChange={(e) => handleChange(index, "lugarProcedencia", e.target.value)} />
              <input className="input" placeholder="Lugar destino" value={h.lugarDestino} onChange={(e) => handleChange(index, "lugarDestino", e.target.value)} />
              <input className="input" placeholder="Teléfono" value={h.telefono} onChange={(e) => handleChange(index, "telefono", e.target.value)} />
              <input className="input" placeholder="Email" value={h.email} onChange={(e) => handleChange(index, "email", e.target.value)} />
              <select className="input" value={h.motivoViaje} onChange={(e) => handleChange(index, "motivoViaje", e.target.value)}>
                <option>Turismo</option>
                <option>Negocios</option>
              </select>
              <input className="input" type="date" value={h.fechaIngreso} onChange={(e) => handleChange(index, "fechaIngreso", e.target.value)} />
              <input className="input" type="date" value={h.fechaSalida} onChange={(e) => handleChange(index, "fechaSalida", e.target.value)} />
              <input type="file" className="input" onChange={(e) => handleChange(index, "docAnverso", e.target.files?.[0])} />
              <input type="file" className="input" onChange={(e) => handleChange(index, "docReverso", e.target.files?.[0])} />
            </div>
          </div>
        ))}

        <div className="flex justify-between mt-4">
          <button onClick={agregarHuesped} className="px-4 py-2 bg-blue-600 rounded font-bold">
            ➕ Agregar Huésped
          </button>
          <button onClick={enviarRegistro} className="px-6 py-2 bg-green-600 rounded font-bold">
            ✅ Enviar Registro
          </button>
        </div>
      </div>
    </div>
  );
}
