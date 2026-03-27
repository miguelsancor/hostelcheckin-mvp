const prisma = require("../utils/prismaClient");

/**
 * Kuyay Operations Assistant — Fase 1
 * Interpreta consultas operativas y responde con datos reales del sistema.
 * Reutiliza Prisma directamente (mismos modelos que admin/checkin/mcp).
 */

/* =======================================================================
   UTILIDADES INTERNAS
   ======================================================================= */

/** Detecta intención de la consulta */
function detectarIntencion(query) {
  const q = query.toLowerCase().trim();

  // Cerraduras / locks
  if (/cerraduras?\s*(disponibles|libres|todas)/i.test(q)) return "locks_disponibles";
  if (/cerraduras?|locks?|pin|código|codigo|ttlock/i.test(q)) return "buscar_huesped";

  // Check-in / sesión
  if (/sesi[oó]n|check.?in|estado/i.test(q)) return "buscar_huesped";

  // Métricas
  if (/m[eé]tricas?|estad[ií]sticas?|resumen|dashboard|hoy cu[aá]ntos/i.test(q)) return "metricas";

  // Huéspedes hoy
  if (/hu[eé]spedes?\s*hoy|check.?in\s*hoy|llegadas?\s*hoy/i.test(q)) return "huespedes_hoy";

  // Búsqueda general (default si hay texto útil)
  if (q.length >= 2) return "buscar_huesped";

  return "desconocido";
}

/** Extrae el término de búsqueda limpio */
function extraerTermino(query) {
  // Eliminar frases comunes para quedarse con el valor de búsqueda
  return query
    .replace(/buscar?\s*(hu[eé]sped|reserva|cliente|persona)?/gi, "")
    .replace(/estado\s*(de|del)?\s*(check.?in|sesi[oó]n)?/gi, "")
    .replace(/cerraduras?\s*(de|del|para|asignadas?\s*a)?/gi, "")
    .replace(/pin\s*(de|del|para)?/gi, "")
    .replace(/c[oó]digo\s*(de|del|para|ttlock)?/gi, "")
    .replace(/mu[eé]strame|dime|cu[aá]l\s*es|ver|mostrar|consultar?/gi, "")
    .trim();
}

/* =======================================================================
   BÚSQUEDA DE HUÉSPED (multicriterio)
   ======================================================================= */
async function buscarHuesped(termino) {
  if (!termino || termino.length < 2) return null;

  const raw = termino.trim();
  const q = raw.toLowerCase();
  const qDigits = raw.replace(/[^\d]/g, "");

  // 1) Exacta por número de reserva
  const porReserva = await prisma.huesped.findFirst({
    where: { numeroReserva: raw },
  });
  if (porReserva) return porReserva;

  // 2) Exacta por documento
  const porDoc = await prisma.huesped.findFirst({
    where: { numeroDocumento: raw },
  });
  if (porDoc) return porDoc;

  // 3) Por email exacto
  const porEmail = await prisma.huesped.findFirst({
    where: { email: q },
  });
  if (porEmail) return porEmail;

  // 4) Por teléfono
  if (qDigits.length >= 4) {
    const porTel = await prisma.huesped.findFirst({
      where: { telefono: { contains: qDigits } },
    });
    if (porTel) return porTel;
  }

  // 5) Por nombre (contiene)
  const porNombre = await prisma.huesped.findFirst({
    where: { nombre: { contains: raw } },
    orderBy: { creadoEn: "desc" },
  });
  if (porNombre) return porNombre;

  return null;
}

/* =======================================================================
   ENRIQUECER DATOS DEL HUÉSPED
   ======================================================================= */
async function enriquecerHuesped(huesped) {
  const resultado = {
    huesped,
    sesionActiva: null,
    passcodes: [],
    cobro: null,
  };

  // Sesión de check-in activa
  try {
    const sesion = await prisma.checkinSession.findFirst({
      where: { numeroReserva: huesped.numeroReserva },
      orderBy: { creadoEn: "desc" },
    });

    if (sesion) {
      const expirada = sesion.expiracion && new Date(sesion.expiracion).getTime() < Date.now();
      resultado.sesionActiva = {
        token: sesion.token,
        expiracion: sesion.expiracion,
        usada: !!sesion.usadoEn,
        expirada,
        activa: !expirada && !sesion.usadoEn,
      };
    }
  } catch (e) {
    console.error("agent: error sesión:", e.message);
  }

  // Passcodes TTLock
  try {
    const passcodes = await prisma.passcode.findMany({
      where: { huespedId: huesped.id, estado: "ACTIVO" },
      orderBy: { creadoEn: "desc" },
    });
    resultado.passcodes = passcodes.map((p) => ({
      id: p.id,
      lockId: p.lockId,
      lockAlias: p.lockAlias,
      codigo: p.codigo,
      estado: p.estado,
      ttlockOk: p.ttlockOk,
      inicio: p.startDate ? Number(p.startDate) : null,
      fin: p.endDate ? Number(p.endDate) : null,
    }));
  } catch (e) {
    console.error("agent: error passcodes:", e.message);
  }

  // Cobro
  try {
    const cobro = await prisma.reservaCobro.findFirst({
      where: { numeroReserva: huesped.numeroReserva },
    });
    if (cobro) {
      resultado.cobro = {
        totalHospedaje: cobro.totalHospedaje,
        anticipo: cobro.anticipo,
        saldoPendiente: cobro.saldoPendiente,
        moneda: cobro.moneda,
      };
    }
  } catch (e) {
    console.error("agent: error cobro:", e.message);
  }

  return resultado;
}

/* =======================================================================
   MÉTRICAS RÁPIDAS
   ======================================================================= */
async function obtenerMetricas() {
  const total = await prisma.huesped.count();

  const hoyInicio = new Date();
  hoyInicio.setHours(0, 0, 0, 0);
  const hoyFin = new Date();
  hoyFin.setHours(23, 59, 59, 999);

  const hoy = await prisma.huesped.count({
    where: { creadoEn: { gte: hoyInicio, lte: hoyFin } },
  });

  const mesInicio = new Date();
  mesInicio.setDate(1);
  mesInicio.setHours(0, 0, 0, 0);

  const mes = await prisma.huesped.count({
    where: { creadoEn: { gte: mesInicio } },
  });

  const passcodesActivos = await prisma.passcode.count({
    where: { estado: "ACTIVO" },
  });

  return { total, hoy, mes, passcodesActivos };
}

/* =======================================================================
   HUÉSPEDES HOY
   ======================================================================= */
async function obtenerHuespedesHoy() {
  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);
  const fin = new Date();
  fin.setHours(23, 59, 59, 999);

  return prisma.huesped.findMany({
    where: { creadoEn: { gte: inicio, lte: fin } },
    orderBy: { creadoEn: "desc" },
    select: {
      id: true,
      nombre: true,
      numeroReserva: true,
      telefono: true,
      email: true,
      fechaIngreso: true,
      fechaSalida: true,
      codigoTTLock: true,
    },
  });
}

/* =======================================================================
   CERRADURAS DISPONIBLES (desde BD — passcodes activos vs todas)
   ======================================================================= */
async function obtenerLocksDisponibles() {
  // Obtener lockIds con passcodes activos
  const activos = await prisma.passcode.findMany({
    where: { estado: "ACTIVO" },
    select: { lockId: true, lockAlias: true },
    distinct: ["lockId"],
  });

  return {
    locksConPascodesActivos: activos.map((p) => ({
      lockId: p.lockId,
      lockAlias: p.lockAlias,
    })),
    totalActivos: activos.length,
  };
}

/* =======================================================================
   FORMATEAR RESPUESTA PARA EL FRONTEND
   ======================================================================= */
function formatearRespuesta(intencion, datos) {
  switch (intencion) {
    case "buscar_huesped": {
      if (!datos) {
        return {
          tipo: "no_encontrado",
          mensaje: "No encontré ningún huésped con ese criterio. Intenta con número de reserva, documento, email o teléfono.",
          tarjetas: [],
        };
      }

      const { huesped, sesionActiva, passcodes, cobro } = datos;
      const tarjetas = [];

      // Tarjeta huésped
      tarjetas.push({
        tipo: "huesped",
        titulo: huesped.nombre,
        datos: {
          id: huesped.id,
          documento: `${huesped.tipoDocumento} ${huesped.numeroDocumento}`,
          telefono: huesped.telefono || "-",
          email: huesped.email || "-",
          nacionalidad: huesped.nacionalidad || "-",
          reserva: huesped.numeroReserva,
          ingreso: huesped.fechaIngreso,
          salida: huesped.fechaSalida,
          motivoViaje: huesped.motivoViaje || "-",
        },
      });

      // Tarjeta sesión check-in
      const estadoCheckin = sesionActiva
        ? sesionActiva.activa
          ? "Sesión activa"
          : sesionActiva.usada
          ? "Check-in completado"
          : "Sesión expirada"
        : "Sin sesión de check-in";

      tarjetas.push({
        tipo: "checkin",
        titulo: "Estado de Check-in",
        datos: {
          estado: estadoCheckin,
          activa: sesionActiva?.activa || false,
          usada: sesionActiva?.usada || false,
          expiracion: sesionActiva?.expiracion || null,
          checkinUrl: huesped.checkinUrl || null,
        },
      });

      // Tarjeta cerraduras
      if (passcodes.length > 0) {
        tarjetas.push({
          tipo: "cerraduras",
          titulo: `Cerraduras asignadas (${passcodes.length})`,
          datos: {
            passcodes: passcodes.map((p) => ({
              lockId: p.lockId,
              lockAlias: p.lockAlias || `Lock ${p.lockId}`,
              codigo: p.codigo || "-",
              estado: p.estado,
              verificado: p.ttlockOk,
              inicio: p.inicio,
              fin: p.fin,
            })),
          },
        });
      } else {
        tarjetas.push({
          tipo: "cerraduras",
          titulo: "Cerraduras asignadas",
          datos: { passcodes: [], mensaje: "No tiene cerraduras asignadas" },
        });
      }

      // Tarjeta cobro
      if (cobro) {
        tarjetas.push({
          tipo: "cobro",
          titulo: "Estado de Pago",
          datos: cobro,
        });
      }

      return {
        tipo: "huesped_encontrado",
        mensaje: `Encontré a ${huesped.nombre} (Reserva: ${huesped.numeroReserva})`,
        tarjetas,
      };
    }

    case "metricas": {
      return {
        tipo: "metricas",
        mensaje: "Resumen operativo actual del hotel",
        tarjetas: [
          {
            tipo: "metricas",
            titulo: "Métricas del Hotel",
            datos,
          },
        ],
      };
    }

    case "huespedes_hoy": {
      return {
        tipo: "huespedes_hoy",
        mensaje: `Hay ${datos.length} huésped(es) registrados hoy`,
        tarjetas: [
          {
            tipo: "lista_huespedes",
            titulo: `Huéspedes hoy (${datos.length})`,
            datos: { huespedes: datos },
          },
        ],
      };
    }

    case "locks_disponibles": {
      return {
        tipo: "locks_disponibles",
        mensaje: `${datos.totalActivos} cerradura(s) con passcodes activos en el sistema`,
        tarjetas: [
          {
            tipo: "locks",
            titulo: "Cerraduras con passcodes activos",
            datos,
          },
        ],
      };
    }

    default:
      return {
        tipo: "ayuda",
        mensaje:
          "Puedo ayudarte con:\n• Buscar huésped (por reserva, documento, email o teléfono)\n• Estado de check-in\n• Cerraduras asignadas y códigos TTLock\n• Métricas del hotel\n• Huéspedes de hoy\n\nEscribe tu consulta.",
        tarjetas: [],
      };
  }
}

/* =======================================================================
   ENDPOINT PRINCIPAL: POST /api/agent/query
   ======================================================================= */
async function handleQuery(req, res) {
  try {
    const { query } = req.body;

    if (!query || typeof query !== "string" || query.trim().length < 1) {
      return res.status(400).json({
        ok: false,
        error: "Escribe una consulta para que pueda ayudarte.",
      });
    }

    const intencion = detectarIntencion(query);
    const termino = extraerTermino(query);

    let datos = null;

    switch (intencion) {
      case "buscar_huesped": {
        const huesped = await buscarHuesped(termino || query.trim());
        if (huesped) {
          datos = await enriquecerHuesped(huesped);
        }
        break;
      }

      case "metricas":
        datos = await obtenerMetricas();
        break;

      case "huespedes_hoy":
        datos = await obtenerHuespedesHoy();
        break;

      case "locks_disponibles":
        datos = await obtenerLocksDisponibles();
        break;

      case "desconocido":
      default:
        break;
    }

    const respuesta = formatearRespuesta(intencion, datos);

    return res.json({ ok: true, ...respuesta });
  } catch (e) {
    console.error("agent/query error:", e);
    return res.status(500).json({
      ok: false,
      error: "Error procesando la consulta. Intenta de nuevo.",
    });
  }
}

module.exports = { handleQuery };
