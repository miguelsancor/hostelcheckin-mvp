const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

/** -------------------- AUTENTICACIÓN -------------------- **/

app.post("/register", async (req, res) => {
  const { nombre, email, nivel, rol } = req.body;
  try {
    const usuario = await prisma.usuario.create({
      data: {
        nombre,
        email,
        nivel,
        rol: rol || "alumno",
        suscripcion: false,
      },
    });
    res.json(usuario);
  } catch (err) {
    res.status(400).json({ error: "Ya existe o error al registrar." });
  }
});

app.post("/login", async (req, res) => {
  const { email, rol } = req.body;
  if (!email || !rol) {
    return res.status(400).json({ error: "Email y rol son requeridos" });
  }
  try {
    const usuario = await prisma.usuario.findFirst({ where: { email, rol } });
    if (!usuario) {
      return res.status(401).json({ error: "Usuario o rol incorrectos" });
    }
    res.json(usuario);
  } catch (err) {
    res.status(500).json({ error: "Error al buscar usuario" });
  }
});

/** -------------------- USUARIOS -------------------- **/

app.get("/usuarios", async (req, res) => {
  const { rol } = req.query;
  const where = rol ? { rol } : {};
  try {
    const usuarios = await prisma.usuario.findMany({
      where,
      orderBy: { nombre: "asc" },
    });
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

app.put("/suscripcion/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const actualizado = await prisma.usuario.update({
      where: { id: parseInt(id) },
      data: { suscripcion: true },
    });
    res.json(actualizado);
  } catch (err) {
    res.status(500).json({ error: "No se pudo actualizar suscripción" });
  }
});

/** -------------------- RUTINAS -------------------- **/

app.post("/rutinas", async (req, res) => {
  const { nombre, tipo, ejercicios, dias, usuarioId } = req.body;
  try {
    const rutina = await prisma.rutina.create({
      data: {
        nombre,
        tipo,
        ejercicios: JSON.stringify(ejercicios),
        dias: JSON.stringify(dias),
        usuarioId,
      },
    });
    res.json(rutina);
  } catch (err) {
    res.status(400).json({ error: "Error al crear rutina" });
  }
});

app.get("/rutinas/:usuarioId", async (req, res) => {
  const { usuarioId } = req.params;
  try {
    const rutinas = await prisma.rutina.findMany({
      where: { usuarioId: parseInt(usuarioId) },
    });
    const result = rutinas.map((r) => ({
      ...r,
      ejercicios: JSON.parse(r.ejercicios),
      dias: JSON.parse(r.dias),
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener rutinas" });
  }
});

app.get("/rutinas", async (req, res) => {
  try {
    const rutinas = await prisma.rutina.findMany();
    const result = rutinas.map((r) => ({
      ...r,
      ejercicios: JSON.parse(r.ejercicios),
      dias: JSON.parse(r.dias),
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener rutinas" });
  }
});

app.delete("/rutinas/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.rutina.delete({
      where: { id: parseInt(id) },
    });
    res.json({ mensaje: "Rutina eliminada correctamente" });
  } catch (err) {
    res.status(500).json({ error: "No se pudo eliminar la rutina" });
  }
});

/** -------------------- PROGRESO -------------------- **/

app.post("/progreso", async (req, res) => {
  const { usuarioId, rutinaId, completado } = req.body;

  try {
    const progreso = await prisma.progreso.upsert({
      where: {
        usuarioId_rutinaId: {
          usuarioId,
          rutinaId,
        },
      },
      update: {
        completado,
        fecha: new Date(),
      },
      create: {
        usuarioId,
        rutinaId,
        completado,
      },
    });
    res.json(progreso);
  } catch (err) {
    res.status(500).json({ error: "Error al guardar progreso" });
  }
});

app.get("/progreso/:usuarioId", async (req, res) => {
  const { usuarioId } = req.params;
  try {
    const progreso = await prisma.progreso.findMany({
      where: { usuarioId: parseInt(usuarioId) },
    });
    res.json(progreso);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener progreso" });
  }
});

app.get("/progreso", async (req, res) => {
  try {
    const progreso = await prisma.progreso.findMany();
    res.json(progreso);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener progreso global" });
  }
});

app.delete("/progreso/:usuarioId/:rutinaId", async (req, res) => {
  const { usuarioId, rutinaId } = req.params;
  try {
    await prisma.progreso.delete({
      where: {
        usuarioId_rutinaId: {
          usuarioId: parseInt(usuarioId),
          rutinaId: parseInt(rutinaId),
        },
      },
    });
    res.json({ mensaje: "Progreso eliminado" });
  } catch (err) {
    res.status(500).json({ error: "No se pudo eliminar el progreso" });
  }
});

/** -------------------- HUESPEDES -------------------- **/

app.post("/checkin", async (req, res) => {
  try {
    const {
      tipoDocumento,
      numeroDocumento,
      nacionalidad,
      direccion,
      lugarProcedencia,
      lugarDestino,
      telefono,
      email,
      motivoViaje,
      fechaIngreso,
      fechaSalida,
    } = req.body;

    const nuevo = await prisma.huesped.create({
      data: {
        tipoDocumento,
        numeroDocumento,
        nacionalidad,
        direccion,
        lugarProcedencia,
        lugarDestino,
        telefono,
        email,
        motivoViaje,
        fechaIngreso: new Date(fechaIngreso),
        fechaSalida: new Date(fechaSalida),
      },
    });

    res.status(200).json({ mensaje: "Check-in exitoso", huesped: nuevo });
  } catch (err) {
    console.error("❌ Error en /checkin:", err);
    res.status(500).json({ error: "Error al registrar huésped" });
  }
});

app.get("/huespedes", async (req, res) => {
  const lista = await prisma.huesped.findMany({
    orderBy: { creadoEn: "desc" },
  });
  res.json(lista);
});

/** -------------------- INICIAR -------------------- **/

app.listen(4000, () => {
  console.log("✅ Backend corriendo en http://localhost:4000");
});
