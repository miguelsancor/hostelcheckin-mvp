const prisma = require("../utils/prismaClient");
const axios = require("axios");

/**
 * Kuyay Operations Assistant — Fase 1 + LLM (Groq)
 * Interpreta consultas operativas con lenguaje natural vía Groq,
 * y responde con datos reales del sistema + tarjetas estructuradas.
 */

/* =======================================================================
   GROQ LLM — Respuesta en lenguaje natural
   ======================================================================= */

const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `Eres el asistente operativo del hotel Kuyay. Tu nombre es Kuyay Assistant.
Respondes en español, de forma breve, profesional y amigable.
Tu trabajo es ayudar al personal de recepción a consultar datos de huéspedes, reservas, check-ins, cerraduras TTLock y pagos.

Reglas:
- Responde siempre en español colombiano informal pero profesional.
- Sé conciso: máximo 2-3 oraciones para el mensaje principal.
- Si recibes datos del sistema, resúmelos de forma clara y útil.
- Si no hay datos, sugiere qué buscar (reserva, documento, nombre, email).
- Nunca inventes datos. Solo usa la información proporcionada.
- Si te preguntan algo fuera del ámbito del hotel, indica amablemente que solo manejas operaciones hoteleras.`;

/**
 * Genera respuesta natural con Groq.
 * Si GROQ_API_KEY no está configurada, retorna el mensaje original (fallback).
 */
async function generarRespuestaLLM(query, datosContexto, mensajeFallback) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn("agent: GROQ_API_KEY no configurada, usando respuesta estática");
    return mensajeFallback;
  }

  try {
    const contextStr = datosContexto
      ? `\n\nDatos del sistema:\n${JSON.stringify(datosContexto, null, 2)}`
      : "\n\nNo se encontraron datos relevantes en el sistema.";

    const res = await axios.post(
      GROQ_URL,
      {
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Consulta del recepcionista: "${query}"${contextStr}\n\nResponde de forma natural y breve.`,
          },
        ],
        temperature: 0.4,
        max_tokens: 300,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    const respuesta = res.data?.choices?.[0]?.message?.content;
    return respuesta || mensajeFallback;
  } catch (err) {
    console.error("agent: error Groq LLM:", err.response?.data || err.message);
    return mensajeFallback;
  }
}

/* =======================================================================
   UTILIDADES INTERNAS
   ======================================================================= */

/** Detecta intención de la consulta */
function detectarIntencion(query) {
  const q = query.toLowerCase().trim();

  if (/cerraduras?\s*(disponibles|libres|todas)/i.test(q)) return "locks_disponibles";
  if (/cerraduras?|locks?|pin|código|codigo|ttlock/i.test(q)) return "buscar_huesped";
  if (/sesi[oó]n|check.?in|estado/i.test(q)) return "buscar_huesped";
  if (/m[eé]tricas?|estad[ií]sticas?|resumen|dashboard|hoy cu[aá]ntos/i.test(q)) return "metricas";
  if (/hu[eé]spedes?\s*hoy|check.?in\s*hoy|llegadas?\s*hoy/i.test(q)) return "huespedes_hoy";
  if (q.length >= 2) return "buscar_huesped";

  return "desconocido";
}

/** Extrae el término de búsqueda limpio */
function extraerTermino(query) {
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

  const porReserva = await prisma.huesped.findFirst({ where: { numeroReserva: raw } });
  if (porReserva) return porReserva;

  const porDoc = await prisma.huesped.findFirst({ where: { numeroDocumento: raw } });
  if (porDoc) return porDoc;

  const porEmail = await prisma.huesped.findFirst({ where: { email: q } });
  if (porEmail) return porEmail;

  if (qDigits.length >= 4) {
    const porTel = await prisma.huesped.findFirst({ where: { telefono: { contains: qDigits } } });
    if (porTel) return porTel;
  }

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
  const resultado = { huesped, sesionActiva: null, passcodes: [], cobro: null };

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
   CERRADURAS DISPONIBLES
   ======================================================================= */
async function obtenerLocksDisponibles() {
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
        tarjetas: [{ tipo: "metricas", titulo: "Métricas del Hotel", datos }],
      };
    }

    case "huespedes_hoy": {
      return {
        tipo: "huespedes_hoy",
        mensaje: `Hay ${datos.length} huésped(es) registrados hoy`,
        tarjetas: [
          { tipo: "lista_huespedes", titulo: `Huéspedes hoy (${datos.length})`, datos: { huespedes: datos } },
        ],
      };
    }

    case "locks_disponibles": {
      return {
        tipo: "locks_disponibles",
        mensaje: `${datos.totalActivos} cerradura(s) con passcodes activos en el sistema`,
        tarjetas: [{ tipo: "locks", titulo: "Cerraduras con passcodes activos", datos }],
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

    // Generar mensaje natural con Groq (o fallback estático)
    const mensajeNatural = await generarRespuestaLLM(query, datos, respuesta.mensaje);

    return res.json({ ok: true, ...respuesta, mensaje: mensajeNatural });
  } catch (e) {
    console.error("agent/query error:", e);
    return res.status(500).json({
      ok: false,
      error: "Error procesando la consulta. Intenta de nuevo.",
    });
  }
}

module.exports = { handleQuery };
