// backend/src/tra/tra.service.js
const axios = require("axios");
const prisma = require("../utils/prismaClient");
const { toStr, toDateStr } = require("../utils/helpers");

/**
 * ============================================================
 * TRA - Service (NO rompe check-in)
 * - Crea registros TraRegistro (PENDING)
 * - Procesa /one (PRIMARY) y /two (SECONDARY)
 * - Guarda request/response y status SENT/ERROR
 * - Semáforo por numeroReserva
 * ============================================================
 */

const processingLocks = new Map(); // numeroReserva -> boolean

function env(name) {
  return String(process.env[name] || "").trim();
}

function getRnt() {
  return env("TRA_RNT_ESTABLECIMIENTO") || env("TRA_RNT");
}

function getNombreEstablecimiento() {
  return env("TRA_NOMBRE_ESTABLECIMIENTO") || env("TRA_NOMBRE");
}

function assertTraEnv() {
  const baseUrl = env("TRA_BASE_URL");
  const token = env("TRA_TOKEN");
  const rnt = getRnt();
  const nombre = getNombreEstablecimiento();

  const numeroHabitacion = env("TRA_NUMERO_HABITACION");
  const tipoAcomodacion = env("TRA_TIPO_ACOMODACION");
  const costo = env("TRA_COSTO");

  const missing = [];
  if (!baseUrl) missing.push("TRA_BASE_URL");
  if (!token) missing.push("TRA_TOKEN");
  if (!rnt) missing.push("TRA_RNT_ESTABLECIMIENTO (o TRA_RNT)");
  if (!nombre) missing.push("TRA_NOMBRE_ESTABLECIMIENTO");
  if (!numeroHabitacion) missing.push("TRA_NUMERO_HABITACION");
  if (!tipoAcomodacion) missing.push("TRA_TIPO_ACOMODACION");
  if (!costo) missing.push("TRA_COSTO");

  return { ok: missing.length === 0, missing };
}

function traClient() {
  return axios.create({
    baseURL: env("TRA_BASE_URL"),
    timeout: 25000,
    headers: {
      Authorization: `token ${env("TRA_TOKEN")}`,
      "Content-Type": "application/json",
    },
  });
}

/* =========================
   Helpers robustos
   ========================= */
function pick(obj, keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return "";
}

function splitNombreCompleto(fullName) {
  const clean = toStr(fullName).replace(/\s+/g, " ").trim();
  if (!clean) return { nombres: "NA", apellidos: "NA" };

  const parts = clean.split(" ");
  if (parts.length === 1) return { nombres: parts[0], apellidos: "NA" };

  const apellidos = parts.slice(-1).join(" ");
  const nombres = parts.slice(0, -1).join(" ");
  return { nombres, apellidos };
}

/**
 * ✅ IMPORTANTÍSIMO:
 * TRA (tu endpoint) está validando campos con typo: "cuidad_*"
 * Entonces mandamos:
 * - cuidad_residencia/procedencia/destino  ✅ (lo que TRA exige)
 * - ciudad_residencia/procedencia/destino ✅ (por compatibilidad)
 */
function buildPrimaryPayloadTRA(guest, ctx) {
  const now = new Date();

  const tipoDoc = toStr(
    pick(guest, [
      "tipoDocumento",
      "tipo_documento",
      "tipo_identificacion",
      "tipoIdentificacion",
    ])
  );

  const numDoc = toStr(
    pick(guest, [
      "numeroDocumento",
      "numero_documento",
      "numero_identificacion",
      "numeroIdentificacion",
    ])
  );

  // ✅ check_in / check_out
  const rawIn =
    pick(guest, ["fechaIngreso", "check_in", "checkin", "fecha_ingreso"]) ||
    ctx.fechaIngreso;
  const rawOut =
    pick(guest, ["fechaSalida", "check_out", "checkout", "fecha_salida"]) ||
    ctx.fechaSalida;

  const check_in = toDateStr(rawIn, now);
  const check_out = toDateStr(rawOut, now);

  const nombreCompleto = pick(guest, ["nombre", "fullName", "nombres", "name"]);
  const { nombres, apellidos } = splitNombreCompleto(nombreCompleto);

  const motivo =
    toStr(
      pick(guest, ["motivoViaje", "motivo", "motivoDetallado", "motivo_detallado"])
    ) ||
    toStr(ctx.motivoViaje) ||
    "Other";

  const numeroAcompanantes = Math.max(0, Number(ctx.numeroAcompanantes || 0));

  const safeTipoDoc = tipoDoc || "CC";
  const safeNumDoc = numDoc || "0";

  // ==========================
  // ✅ CIUDADES: FORM > ENV > fallback
  // ==========================
  const ciudadResidencia =
    toStr(pick(guest, ["ciudadResidencia", "ciudad_residencia"])) ||
    env("TRA_CIUDAD_RESIDENCIA") ||
    env("TRA_CIUDAD_RESIDENCIA_DEFAULT") ||
    "NA";

  const ciudadProcedencia =
    toStr(pick(guest, ["ciudadProcedencia", "ciudad_procedencia"])) ||
    env("TRA_CIUDAD_PROCEDENCIA") ||
    env("TRA_CIUDAD_PROCEDENCIA_DEFAULT") ||
    ciudadResidencia ||
    "NA";

  const ciudadDestino =
    toStr(pick(guest, ["ciudadDestino", "ciudad_destino"])) ||
    env("TRA_CIUDAD_DESTINO") ||
    env("TRA_CIUDAD_DESTINO_DEFAULT") ||
    "NA";

  return {
    // establecimiento
    rnt_establecimiento: getRnt(),
    nombre_establecimiento: getNombreEstablecimiento(),

    // huésped
    tipo_identificacion: safeTipoDoc,
    numero_identificacion: safeNumDoc,
    nombres: toStr(nombres) || "NA",
    apellidos: toStr(apellidos) || "NA",

    // ✅ LO QUE TRA TE ESTÁ PIDIENDO (con typo)
    cuidad_residencia: ciudadResidencia,
    cuidad_procedencia: ciudadProcedencia,
    cuidad_destino: ciudadDestino,

    // ✅ Compatibilidad (por si cambia o hay otro validador)
    ciudad_residencia: ciudadResidencia,
    ciudad_procedencia: ciudadProcedencia,
    ciudad_destino: ciudadDestino,

    // alojamiento (env)
    numero_habitacion: env("TRA_NUMERO_HABITACION"),
    tipo_acomodacion: env("TRA_TIPO_ACOMODACION"),
    costo: env("TRA_COSTO"),

    // viaje
    motivo,
    numero_acompanantes: String(numeroAcompanantes),

    // fechas
    check_in,
    check_out,
  };
}

function buildSecondaryPayloadTRA(guest, ctx, padreCode) {
  const base = buildPrimaryPayloadTRA(guest, ctx);
  return { ...base, padre: Number(padreCode) };
}

/* =========================
   CRUD interno de registros
   ========================= */
async function createTraRegistrosFromGuests({ huespedId, numeroReserva, guests, ctx }) {
  const list = Array.isArray(guests) ? guests : [];
  if (!list.length) return [];

  const rows = [];
  for (let i = 0; i < list.length; i++) {
    const g = list[i];
    rows.push({
      huespedId,
      numeroReserva,
      role: i === 0 ? "PRIMARY" : "SECONDARY",
      endpoint: i === 0 ? "/one" : "/two",
      padreCode: null,
      code: null,
      status: "PENDING",
      attempts: 0,
      lastAttemptAt: null,
      requestPayload: { guestIndex: i, guest: g, ctx },
      responsePayload: null,
      errorMessage: null,
    });
  }

  const created = [];
  for (const data of rows) {
    const r = await prisma.traRegistro.create({ data });
    created.push(r);
  }
  return created;
}

async function markRegistroAttempt(id, data) {
  return prisma.traRegistro.update({
    where: { id },
    data: {
      attempts: { increment: 1 },
      lastAttemptAt: new Date(),
      ...data,
    },
  });
}

/* =========================
   Procesamiento TRA
   ========================= */
async function processTraForReserva(numeroReserva) {
  if (processingLocks.get(numeroReserva)) return { ok: true, skipped: true };
  processingLocks.set(numeroReserva, true);

  try {
    const envCheck = assertTraEnv();
    if (!envCheck.ok) {
      const regs = await prisma.traRegistro.findMany({ where: { numeroReserva } });
      for (const r of regs) {
        if (r.status !== "SENT") {
          await prisma.traRegistro.update({
            where: { id: r.id },
            data: {
              status: "ERROR",
              errorMessage: `Faltan variables ENV para TRA: ${envCheck.missing.join(", ")}`,
              lastAttemptAt: new Date(),
            },
          });
        }
      }
      return { ok: false, missing: envCheck.missing };
    }

    const client = traClient();

    const regs = await prisma.traRegistro.findMany({
      where: { numeroReserva },
      orderBy: [{ role: "asc" }, { id: "asc" }],
    });

    const primary = regs.find((r) => r.role === "PRIMARY");
    if (!primary) return { ok: false, error: "No existe PRIMARY" };

    const ctx = primary.requestPayload?.ctx || {};
    const primaryGuest = primary.requestPayload?.guest || {};

    if (typeof ctx.numeroAcompanantes === "undefined") {
      const totalGuests = regs.filter((r) => r.role === "PRIMARY" || r.role === "SECONDARY").length;
      ctx.numeroAcompanantes = Math.max(0, totalGuests - 1);
    }

    let padreCode = primary.code;

    // 1) /one
    if (primary.status !== "SENT") {
      const payloadOne = buildPrimaryPayloadTRA(primaryGuest, ctx);

      try {
        await markRegistroAttempt(primary.id, {
          requestPayload: { ...primary.requestPayload, built: payloadOne },
        });

        const resp = await client.post("/one/", payloadOne);

        const code = resp?.data?.code ?? resp?.data?.codigo ?? resp?.data?.id ?? null;
        if (!code) {
          await prisma.traRegistro.update({
            where: { id: primary.id },
            data: {
              status: "ERROR",
              responsePayload: resp?.data ?? null,
              errorMessage: "TRA respondió sin code",
            },
          });
          return { ok: false, error: "Respuesta sin code" };
        }

        await prisma.traRegistro.update({
          where: { id: primary.id },
          data: {
            status: "SENT",
            code: Number(code),
            responsePayload: resp?.data ?? null,
            errorMessage: null,
          },
        });

        padreCode = Number(code);
      } catch (err) {
        const msg = err?.response?.data
          ? JSON.stringify(err.response.data)
          : err?.message || "Error enviando /one";

        await prisma.traRegistro.update({
          where: { id: primary.id },
          data: {
            status: "ERROR",
            responsePayload: err?.response?.data ?? null,
            errorMessage: msg,
          },
        });
        return { ok: false, error: "Falló /one", details: msg };
      }
    }

    // 2) /two
    const secondaries = regs.filter((r) => r.role === "SECONDARY");
    for (const s of secondaries) {
      if (s.status === "SENT") continue;

      const guest = s.requestPayload?.guest || {};
      const ctx2 = s.requestPayload?.ctx || ctx;

      const payloadTwo = buildSecondaryPayloadTRA(guest, ctx2, padreCode);

      try {
        await markRegistroAttempt(s.id, {
          padreCode: padreCode,
          requestPayload: { ...s.requestPayload, built: payloadTwo },
        });

        const resp = await client.post("/two/", payloadTwo);

        await prisma.traRegistro.update({
          where: { id: s.id },
          data: {
            status: "SENT",
            padreCode: padreCode,
            responsePayload: resp?.data ?? null,
            errorMessage: null,
          },
        });
      } catch (err) {
        const msg = err?.response?.data
          ? JSON.stringify(err.response.data)
          : err?.message || "Error enviando /two";

        await prisma.traRegistro.update({
          where: { id: s.id },
          data: {
            status: "ERROR",
            padreCode: padreCode,
            responsePayload: err?.response?.data ?? null,
            errorMessage: msg,
          },
        });
      }
    }

    return { ok: true };
  } finally {
    processingLocks.delete(numeroReserva);
  }
}

/* =========================
   Status (semaforo)
   ========================= */
async function getTraStatus(numeroReserva) {
  const regs = await prisma.traRegistro.findMany({
    where: { numeroReserva },
    orderBy: { id: "asc" },
  });

  if (!regs.length) {
    return {
      numeroReserva,
      status: "PENDING",
      details: {
        primary: "NONE",
        primaryError: null,
        secondaries: { SENT: 0, PENDING: 0, ERROR: 0 },
        lastAttemptAt: null,
        lastError: null,
      },
    };
  }

  const primary = regs.find((r) => r.role === "PRIMARY");
  const seconds = regs.filter((r) => r.role === "SECONDARY");

  const counts = { SENT: 0, PENDING: 0, ERROR: 0 };
  for (const r of seconds) counts[r.status] = (counts[r.status] || 0) + 1;

  const lastAttemptMs = regs
    .map((r) => (r.lastAttemptAt ? new Date(r.lastAttemptAt).getTime() : 0))
    .reduce((a, b) => Math.max(a, b), 0);

  const anyError = regs.some((r) => r.status === "ERROR");
  const anyPending = regs.some((r) => r.status === "PENDING");

  let status = "PENDING";
  if (anyError) status = "ERROR";
  else if (!anyPending && primary && primary.status === "SENT") status = "OK";

  const lastErrorRow = [...regs].reverse().find((r) => r.status === "ERROR" && r.errorMessage);

  return {
    numeroReserva,
    status,
    details: {
      primary: primary ? primary.status : "NONE",
      primaryError: primary?.errorMessage || null,
      secondaries: counts,
      lastAttemptAt: lastAttemptMs ? new Date(lastAttemptMs).toISOString() : null,
      lastError: lastErrorRow?.errorMessage || null,
    },
  };
}

/* =========================
   Retry
   ========================= */
async function retryTra(numeroReserva) {
  const regs = await prisma.traRegistro.findMany({ where: { numeroReserva } });
  if (!regs.length) return { ok: false, message: "No hay registros TRA para esa reserva" };

  for (const r of regs) {
    if (r.status !== "SENT") {
      await prisma.traRegistro.update({
        where: { id: r.id },
        data: { status: "PENDING", errorMessage: null },
      });
    }
  }

  setImmediate(() => {
    processTraForReserva(numeroReserva).catch((e) => console.error("retryTra process error:", e));
  });

  return { ok: true };
}

module.exports = {
  createTraRegistrosFromGuests,
  processTraForReserva,
  getTraStatus,
  retryTra,
};
