const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json());
const upload = multer({ dest: "uploads/" });

function generarNumeroReserva() {
  const timestamp = Date.now().toString().slice(-8); // últimos 8 dígitos
  const random = crypto.randomBytes(3).toString("hex").toUpperCase(); // 6 caracteres
  return `${timestamp}-RES-${random}`;
}

app.post("/api/checkin", upload.fields([
  { name: "anverso" },
  { name: "reverso" },
  { name: "firma" },
]), async (req, res) => {
  const { huespedes, fechaIngreso, fechaSalida } = JSON.parse(req.body.data);
  const numeroReserva = generarNumeroReserva();

  try {
    for (const h of huespedes) {
      await prisma.huesped.create({
        data: {
          ...h,
          fechaIngreso: new Date(fechaIngreso),
          fechaSalida: new Date(fechaSalida),
          numeroReserva,
          creadoEn: new Date()
        }
      });
    }
    console.log("✅ Registro exitoso:", numeroReserva);
    res.json({ mensaje: "Check-in exitoso", numeroReserva });
  } catch (error) {
    console.error("❌ Error al registrar:", error);
    res.status(500).json({ error: "Error al registrar el check-in" });
  }
});

app.post("/api/checkin/buscar", async (req, res) => {
  const { codigoReserva } = req.body;
  try {
    const huespedes = await prisma.huesped.findMany({
      where: {
        numeroReserva: codigoReserva,
      },
    });

    if (huespedes.length === 0) {
      return res.status(404).json({ error: "Reserva no encontrada" });
    }

    res.json(huespedes);
  } catch (error) {
    console.error("❌ Error al buscar reserva:", error);
    res.status(500).json({ error: "Error al buscar reserva" });
  }
});

app.listen(4000, () => {
  console.log("✅ Backend corriendo en http://localhost:4000");
});
