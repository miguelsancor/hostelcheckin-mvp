import { useEffect, useState } from "react";
import '../App.css';

type Rutina = {
  id: number;
  nombre: string;
  tipo: string;
  ejercicios: string[];
  dias: string[];
};

type Progreso = {
  rutinaId: number;
  completado: boolean;
};

type Alumno = {
  id: number;
  nombre: string;
  email: string;
  rutinas?: Rutina[];
  progreso?: Progreso[];
};

const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export default function InstructorDashboard() {
  const usuario = JSON.parse(localStorage.getItem("usuario")!);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [alumnoId, setAlumnoId] = useState("");
  const [nombreRutina, setNombreRutina] = useState("");
  const [tipo, setTipo] = useState("Funcional");
  const [ejercicios, setEjercicios] = useState("");
  const [diasSeleccionados, setDiasSeleccionados] = useState<string[]>([]);
  const [alumnoExpandido, setAlumnoExpandido] = useState<number | null>(null);

  const camposCompletos =
    alumnoId && nombreRutina && ejercicios && diasSeleccionados.length > 0;

  useEffect(() => {
    const cargarDatos = async () => {
      const alumnosRes = await fetch("http://localhost:4000/usuarios?rol=alumno");
      const alumnosData = await alumnosRes.json();

      const alumnosCompletos = await Promise.all(
        alumnosData.map(async (alumno: Alumno) => {
          const rutinasRes = await fetch(`http://localhost:4000/rutinas/${alumno.id}`);
          const progresoRes = await fetch(`http://localhost:4000/progreso/${alumno.id}`);
          const rutinas = await rutinasRes.json();
          const progreso = await progresoRes.json();
          return { ...alumno, rutinas, progreso };
        })
      );

      setAlumnos(alumnosCompletos);
    };

    cargarDatos();
  }, []);

  const toggleDia = (dia: string) => {
    setDiasSeleccionados((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]
    );
  };

  const asignarRutina = async () => {
    if (!camposCompletos) return;

    await fetch("http://localhost:4000/rutinas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: nombreRutina,
        tipo,
        ejercicios: ejercicios.split(",").map((e) => e.trim()),
        usuarioId: parseInt(alumnoId),
        dias: diasSeleccionados,
      }),
    });

    setNombreRutina("");
    setEjercicios("");
    setDiasSeleccionados([]);
    alert("✅ Rutina asignada con éxito");
    window.location.reload();
  };

  const eliminarRutina = async (rutinaId: number) => {
    await fetch(`http://localhost:4000/rutinas/${rutinaId}`, {
      method: "DELETE",
    });
    alert("❌ Rutina eliminada");
    window.location.reload();
  };

  const obtenerEmbedYoutube = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  const toggleExpandirAlumno = (id: number) => {
    setAlumnoExpandido(prev => (prev === id ? null : id));
  };

  return (
    <div style={{ width: "100%", padding: "2rem", display: "flex", justifyContent: "center" }}>
      <div style={{
        width: "100%",
        maxWidth: "1024px",
        backgroundColor: "#1a1a1a",
        borderRadius: "16px",
        padding: "2rem",
        boxShadow: "0 0 25px rgba(0,0,0,0.2)"
      }}>
        <h2 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
          👨‍🏫 Instructor: <span style={{ color: "#60a5fa" }}>{usuario.nombre}</span>
        </h2>
        <p style={{ color: "#9ca3af", marginBottom: "1.5rem" }}>Asignar rutina a alumno</p>

        <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "1fr 1fr" }}>
          <select value={alumnoId} onChange={(e) => setAlumnoId(e.target.value)} className="form-select">
            <option value="">Selecciona un alumno</option>
            {alumnos.map((a) => (
              <option key={a.id} value={a.id}>{a.nombre} ({a.email})</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Nombre de la rutina"
            value={nombreRutina}
            onChange={(e) => setNombreRutina(e.target.value)}
            className="form-input"
          />

          <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="form-select">
            <option value="Funcional">Funcional</option>
            <option value="Fuerza">Fuerza</option>
            <option value="Cardio">Cardio</option>
            <option value="Hipertrofia">Hipertrofia</option>
            <option value="Carrera">Carrera</option>
          </select>

          <textarea
            placeholder="Pegue enlace del ejercicio"
            value={ejercicios}
            onChange={(e) => setEjercicios(e.target.value)}
            className="form-textarea"
            style={{ gridColumn: "1 / span 2" }}
          />

          <div style={{ gridColumn: "1 / span 2", marginTop: "0.5rem" }}>
            <label style={{ fontWeight: "bold" }}>Días:</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
              {DIAS_SEMANA.map((dia) => (
                <button
                  key={dia}
                  onClick={() => toggleDia(dia)}
                  className={`day-btn ${diasSeleccionados.includes(dia) ? "selected" : ""}`}
                >
                  {dia}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={asignarRutina}
            disabled={!camposCompletos}
            className={`btn ${!camposCompletos ? "btn-disabled" : ""}`}
            style={{ gridColumn: "1 / span 2" }}
          >
            Asignar rutina
          </button>
        </div>

        <div className="section">
          <h3 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>📋 Alumnos y sus rutinas</h3>
          {alumnos.map((alumno) => {
            const completadas = alumno.progreso?.filter((p) => p.completado).length || 0;
            const total = alumno.rutinas?.length || 0;

            return (
              <div key={alumno.id} style={{ marginBottom: "1.5rem" }}>
                <h4
                  style={{ color: "#60a5fa", cursor: "pointer" }}
                  onClick={() => toggleExpandirAlumno(alumno.id)}
                >
                  {alumno.nombre} ({alumno.email})
                </h4>

                {alumnoExpandido === alumno.id && (
                  <>
                    {total > 0 && (
                      <p style={{ color: "#22c55e" }}>
                        ✅ Progreso: {completadas} de {total} completadas (
                        {Math.round((completadas / total) * 100)}%)
                      </p>
                    )}
                    {alumno.rutinas?.length ? (
                      <ul style={{ marginTop: "0.5rem", paddingLeft: "1rem" }}>
                        {alumno.rutinas.map((r) => {
                          const completado = alumno.progreso?.some(
                            (p) => p.rutinaId === r.id && p.completado
                          );
                          return (
                            <li key={r.id}>
                              <strong>{r.nombre}</strong> ({r.tipo}){" "}
                              <span style={{ fontSize: "0.8rem", color: "#c084fc" }}>
                                [{r.dias.join(", ")}]
                              </span>
                              {completado && (
                                <span style={{ marginLeft: "0.5rem", color: "#22c55e" }}>
                                  ✅ Completado
                                </span>
                              )}
                              <div style={{ marginTop: "0.5rem" }}>
                                {r.ejercicios.map((e, i) => {
                                  const embed = obtenerEmbedYoutube(e);
                                  return embed ? (
                                    <a
                                      key={i}
                                      href={e}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <iframe
                                        src={embed}
                                        className="iframe"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                      />
                                    </a>
                                  ) : (
                                    <p key={i} style={{ color: "#d1d5db" }}>{e}</p>
                                  );
                                })}
                              </div>
                              <button
                                style={{ marginTop: "0.5rem", color: "#ef4444", fontSize: "0.8rem" }}
                                onClick={() => eliminarRutina(r.id)}
                              >
                                Eliminar
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p style={{ color: "#9ca3af" }}>Sin rutinas asignadas</p>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
