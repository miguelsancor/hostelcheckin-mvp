const axios = require("axios");
const prisma = require("../utils/prismaClient");
const { generarNumeroReserva, toStr, toDateStr } = require("../utils/helpers");
const { parseGuestsFromFormData } = require("../utils/guestparser");
const { renameWithExtension } = require("../utils/upload");

// ✅ EMAIL (NO bloquea check-in)
const { sendCheckinEmail } = require("../utils/mailer");

// ✅ TRA (crea registros + procesa en background)
const {
  createTraRegistrosFromGuests,
  processTraForReserva,
} = require("../tra/tra.service");

/* =======================================================================
   ✅ SESIONES COMPARTIBLES (SQLite con TTL)
   ======================================================================= */
const SESSION_TTL_MS = 6 * 60 * 60 * 1000; // 6 horas

function newToken() {
  return (
    (globalThis.crypto &&
      globalThis.crypto.randomUUID &&
      globalThis.crypto.randomUUID()) ||
    require("crypto").randomUUID()
  );
}

function expiryDate() {
  return new Date(Date.now() + SESSION_TTL_MS);
}

/**
 * ✅ Helper: toma el primer valor NO vacío entre varias llaves posibles.
 * Esto evita que "en el UI se ve lleno" pero el backend lo reciba en otra key.
 */
function pick(obj, keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return "";
}

async function createSession(req, res) {
  try {
    const { reserva, formList } = req.body || {};
    const numeroReserva = String(reserva?.numeroReserva || "").trim();

    if (!numeroReserva) {
      return res
        .status(400)
        .json({ ok: false, message: "Falta reserva.numeroReserva" });
    }

    const token = newToken();

    const snapshot = {
      reserva,
      formList: Array.isArray(formList) ? formList : [],
    };

    // 1 sesión activa por numeroReserva (upsert por numeroReserva)
    const row = await prisma.checkinSession.upsert({
      where: { numeroReserva },
      update: {
        token,
        checkinUrl: null,
        snapshot,
        expiracion: expiryDate(),
        usadoEn: null,
      },
      create: {
        numeroReserva,
        token,
        checkinUrl: null,
        snapshot,
        expiracion: expiryDate(),
      },
    });

    return res.json({
      ok: true,
      token: row.token,
      shareUrl: `/checkin?t=${row.token}`,
    });
  } catch (e) {
    console.error("createSession error:", e);
    return res.status(500).json({ ok: false, message: "Error creando sesión" });
  }
}

async function getSession(req, res) {
  try {
    const token = String(req.params.token || "").trim();
    if (!token) {
      return res.status(400).json({ ok: false, message: "Falta token" });
    }

    const sess = await prisma.checkinSession.findUnique({ where: { token } });
    if (!sess) {
      return res.status(404).json({ ok: false, message: "Sesión no existe" });
    }

    // TTL
    if (sess.expiracion && new Date(sess.expiracion).getTime() < Date.now()) {
      return res.status(404).json({ ok: false, message: "Sesión expiró" });
    }

    // snapshot -> { reserva, formList }
    const snap = sess.snapshot || {};
    const reserva = snap.reserva || null;
    const formList = Array.isArray(snap.formList) ? snap.formList : [];

    return res.json({ ok: true, reserva, formList });
  } catch (e) {
    console.error("getSession error:", e);
    return res
      .status(500)
      .json({ ok: false, message: "Error obteniendo sesión" });
  }
}

async function saveSession(req, res) {
  try {
    const token = String(req.params.token || "").trim();
    if (!token) {
      return res.status(400).json({ ok: false, message: "Falta token" });
    }

    const sess = await prisma.checkinSession.findUnique({ where: { token } });
    if (!sess) {
      return res.status(404).json({ ok: false, message: "Sesión no existe" });
    }

    if (sess.expiracion && new Date(sess.expiracion).getTime() < Date.now()) {
      return res.status(404).json({ ok: false, message: "Sesión expiró" });
    }

    const { reserva, formList } = req.body || {};
    const snapshot = {
      reserva: reserva ?? (sess.snapshot?.reserva ?? null),
      formList: Array.isArray(formList)
        ? formList
        : sess.snapshot?.formList ?? [],
    };

    await prisma.checkinSession.update({
      where: { token },
      data: {
        snapshot,
        expiracion: expiryDate(), // refresca TTL al guardar
      },
    });

    return res.json({ ok: true });
  } catch (e) {
    console.error("saveSession error:", e);
    return res
      .status(500)
      .json({ ok: false, message: "Error guardando sesión" });
  }
}

/* =======================================================================
   Check-in simple
   ======================================================================= */
async function postCheckinSimple(req, res) {
  try {
    console.log("FILES RECIBIDOS:", req.files);
    console.log("BODY:", req.body);

    const parsed = JSON.parse(req.body.data || "{}");

    const {
      huespedes = [],
      fechaIngreso,
      fechaSalida,
      codigoTTLock,
      motivoDetallado,
      motivoViaje: motivoViajeGlobal,
      sessionToken,
    } = parsed;

    if (!Array.isArray(huespedes) || !huespedes.length) {
      return res.status(400).json({ ok: false, error: "No llegaron huéspedes" });
    }

    const titular = huespedes[0];
    const numeroReserva = generarNumeroReserva();

    const checkinUrl = sessionToken
      ? `/checkin?t=${encodeURIComponent(String(sessionToken))}`
      : `http:///api:5173/checkin?reserva=${numeroReserva}`;

    const fIng = toDateStr(
      pick(titular, ["fechaIngreso", "check_in", "checkin"]) || fechaIngreso,
      new Date()
    );
    const fSal = toDateStr(
      pick(titular, ["fechaSalida", "check_out", "checkout"]) || fechaSalida,
      new Date()
    );

    const motivoFinal = toStr(
      pick(titular, ["motivoViaje", "motivoDetallado", "motivo"]) ||
        motivoViajeGlobal ||
        motivoDetallado
    );

    /* ===================== ARCHIVOS ===================== */
    const archivos = {};
    if (req.files && req.files.length > 0) {
      for (const f of req.files) {
        const nombreFinal = await renameWithExtension(f);
        archivos[f.fieldname] = nombreFinal;
      }
    }

    /**
     * ✅ IMPORTANTÍSIMO:
     * Procedencia/Residencia/Destino vienen con nombres distintos según tu GuestCard/hook.
     * Aquí los normalizamos para que queden guardados SIEMPRE en SQLite.
     */
    const lugarProcedencia = toStr(
      pick(titular, [
        "lugarProcedencia",
        "lugar_procedencia",
        "ciudadProcedencia",
        "ciudad_procedencia",
        "ciudadResidencia",
        "ciudad_residencia",
        "procedencia",
        "residencia",
      ])
    );

    const lugarDestino = toStr(
      pick(titular, [
        "lugarDestino",
        "lugar_destino",
        "ciudadDestino",
        "ciudad_destino",
        "destino",
      ])
    );

    /* ===================== BD ===================== */
    const payload = {
      nombre: toStr(pick(titular, ["nombre", "fullName", "name"])),
      tipoDocumento: toStr(
        pick(titular, [
          "tipoDocumento",
          "tipo_documento",
          "tipoIdentificacion",
          "tipo_identificacion",
        ])
      ),
      numeroDocumento: toStr(
        pick(titular, [
          "numeroDocumento",
          "numero_documento",
          "numeroIdentificacion",
          "numero_identificacion",
        ])
      ),
      nacionalidad: toStr(pick(titular, ["nacionalidad", "nationality"])),
      direccion: toStr(pick(titular, ["direccion", "address"])),
      lugarProcedencia,
      lugarDestino,
      telefono: toStr(pick(titular, ["telefono", "phone"])),
      email: toStr(pick(titular, ["email"])),
      motivoViaje: motivoFinal,
      fechaIngreso: fIng,
      fechaSalida: fSal,
      numeroReserva,
      checkinUrl,
      creadoEn: new Date(),
      codigoTTLock: toStr(codigoTTLock),

      archivoPasaporte: archivos["archivoPasaporte_0"] || null,
      archivoCedula: archivos["archivoCedula_0"] || null,
      archivoFirma: archivos["archivoFirma_0"] || null,
    };

    const huesped = await prisma.huesped.create({ data: payload });

    // ✅ EMAIL: enviar correo (NO bloquea el check-in)
    try {
      const reservaMail = {
        numeroReserva,
        checkinUrl,
        room_id: parsed?.room_id ?? parsed?.roomId ?? parsed?.roomID ?? null,
      };

      setImmediate(() => {
        sendCheckinEmail({
          reserva: reservaMail,
          formList: Array.isArray(huespedes) ? huespedes : [titular],
        })
          .then((r) => console.log("MAIL result:", r))
          .catch((e) =>
            console.log("MAIL error (no bloquea):", e?.message || e)
          );
      });
    } catch (e) {
      console.log("MAIL init error (no bloquea):", e?.message || e);
    }

    // ✅ TRA: crea registros y dispara envío (NO bloquea el check-in)
    try {
      const ctxTra = {
        fechaIngreso: payload.fechaIngreso,
        fechaSalida: payload.fechaSalida,
        motivoViaje: payload.motivoViaje,
        numeroAcompanantes: Math.max(0, (huespedes?.length || 1) - 1),
      };

      await createTraRegistrosFromGuests({
        huespedId: huesped.id,
        numeroReserva,
        guests: Array.isArray(huespedes) ? huespedes : [titular],
        ctx: ctxTra,
      });

      setImmediate(() => {
        processTraForReserva(numeroReserva).catch((e) =>
          console.error("TRA process error:", e)
        );
      });
    } catch (e) {
      console.error("TRA init error:", e);
      // NO rompemos el check-in
    }

    // si quieres, aquí puedes marcar "usadoEn" cuando se finaliza
    if (sessionToken) {
      try {
        await prisma.checkinSession.update({
          where: { token: String(sessionToken) },
          data: { usadoEn: new Date() },
        });
      } catch {}
    }

    return res.json({
      ok: true,
      numeroReserva,
      checkinUrl,
      archivos,
      total: 1,
      passcode: null,
    });
  } catch (e) {
    console.error("ERROR /api/checkin:", e);
    res.status(500).json({ ok: false, error: "Error al registrar el check-in" });
  }
}

/* =======================================================================
   Check-in múltiple
   ======================================================================= */
async function postCheckinMultiple(req, res) {
  try {
    let guests = parseGuestsFromFormData(req.body, req.files || []);
    const parsedData = req.body?.data ? JSON.parse(req.body.data) : {};

    if (!guests.length && parsedData.huespedes) guests = parsedData.huespedes;
    if (!guests.length) {
      return res.status(400).json({ ok: false, error: "No llegaron huéspedes" });
    }

    const titular = guests[0];
    const numeroReserva = generarNumeroReserva();

    const fIng = toDateStr(
      pick(titular, ["fechaIngreso", "check_in", "checkin"]),
      new Date()
    );
    const fSal = toDateStr(
      pick(titular, ["fechaSalida", "check_out", "checkout"]),
      new Date()
    );

    const motivoFinal = toStr(
      pick(titular, ["motivoViaje", "motivoDetallado", "motivo"]) ||
        parsedData.motivoViaje ||
        parsedData.motivoDetallado
    );

    const lugarProcedencia = toStr(
      pick(titular, [
        "lugarProcedencia",
        "lugar_procedencia",
        "ciudadProcedencia",
        "ciudad_procedencia",
        "ciudadResidencia",
        "ciudad_residencia",
        "procedencia",
        "residencia",
      ])
    );

    const lugarDestino = toStr(
      pick(titular, [
        "lugarDestino",
        "lugar_destino",
        "ciudadDestino",
        "ciudad_destino",
        "destino",
      ])
    );

    const payload = {
      nombre: toStr(pick(titular, ["nombre", "fullName", "name"])),
      tipoDocumento: toStr(
        pick(titular, [
          "tipoDocumento",
          "tipo_documento",
          "tipoIdentificacion",
          "tipo_identificacion",
        ])
      ),
      numeroDocumento: toStr(
        pick(titular, [
          "numeroDocumento",
          "numero_documento",
          "numeroIdentificacion",
          "numero_identificacion",
        ])
      ),
      nacionalidad: toStr(pick(titular, ["nacionalidad", "nationality"])),
      direccion: toStr(pick(titular, ["direccion", "address"])),
      lugarProcedencia,
      lugarDestino,
      telefono: toStr(pick(titular, ["telefono", "phone"])),
      email: toStr(pick(titular, ["email"])),
      motivoViaje: motivoFinal,
      fechaIngreso: fIng,
      fechaSalida: fSal,
      numeroReserva,
      creadoEn: new Date(),
      checkinUrl: toStr(parsedData.checkinUrl),
      codigoTTLock: toStr(parsedData.codigoTTLock),
    };

    const huesped = await prisma.huesped.create({ data: payload });

    // ✅ EMAIL: enviar correo (NO bloquea guardar-multiple)
    try {
      const reservaMail = {
        numeroReserva,
        checkinUrl: payload.checkinUrl,
        room_id:
          parsedData?.room_id ??
          parsedData?.roomId ??
          parsedData?.roomID ??
          null,
      };

      setImmediate(() => {
        sendCheckinEmail({
          reserva: reservaMail,
          formList: Array.isArray(guests) ? guests : [titular],
        })
          .then((r) => console.log("MAIL result (multiple):", r))
          .catch((e) =>
            console.log("MAIL error (multiple, no bloquea):", e?.message || e)
          );
      });
    } catch (e) {
      console.log("MAIL init error (multiple, no bloquea):", e?.message || e);
    }

    // ✅ TRA: crea registros y dispara envío (NO bloquea guardar-multiple)
    try {
      const ctxTra = {
        fechaIngreso: payload.fechaIngreso,
        fechaSalida: payload.fechaSalida,
        motivoViaje: payload.motivoViaje,
        numeroAcompanantes: Math.max(0, (guests?.length || 1) - 1),
      };

      await createTraRegistrosFromGuests({
        huespedId: huesped.id,
        numeroReserva,
        guests: Array.isArray(guests) ? guests : [titular],
        ctx: ctxTra,
      });

      setImmediate(() => {
        processTraForReserva(numeroReserva).catch((e) =>
          console.error("TRA process error (multiple):", e)
        );
      });
    } catch (e) {
      console.error("TRA init error (multiple):", e);
    }

    res.json({ ok: true, numeroReserva, total: 1 });
  } catch (e) {
    console.error("error guardar-multiple:", e);
    res.status(500).json({ ok: false, error: "Error al guardar huéspedes" });
  }
}

/* =======================================================================
   Buscar reserva (SQLite)
   ======================================================================= */
async function buscarReserva(req, res) {
  const { codigoReserva, tipoDocumento, numeroDocumento } = req.body;

  try {
    let huesped;

    if (codigoReserva) {
      huesped = await prisma.huesped.findUnique({
        where: { numeroReserva: codigoReserva },
      });
    } else if (tipoDocumento && numeroDocumento) {
      huesped = await prisma.huesped.findFirst({
        where: { tipoDocumento, numeroDocumento },
      });
    } else {
      return res
        .status(400)
        .json({ ok: false, error: "Parámetros insuficientes" });
    }

    if (!huesped) {
      return res.status(404).json({ ok: false, error: "Reserva no encontrada" });
    }

    res.json(huesped);
  } catch (error) {
    console.error("error /api/checkin/buscar:", error);
    res.status(500).json({ ok: false, error: "Error al buscar reserva" });
  }
}

/* =======================================================================
   Huéspedes de HOY
   ======================================================================= */
async function huespedesHoy(_req, res) {
  try {
    const inicio = new Date();
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date();
    fin.setHours(23, 59, 59, 999);

    const lista = await prisma.huesped.findMany({
      where: { creadoEn: { gte: inicio, lte: fin } },
      orderBy: { creadoEn: "desc" },
    });

    return res.json({ ok: true, total: lista.length, huespedes: lista });
  } catch (err) {
    console.error("error /api/checkin/hoy:", err);
    return res.status(500).json({ ok: false, error: "Error interno" });
  }
}

/* =======================================================================
   AUTOCOMPLETE CONTACTOS
   - SQLite: mantiene resultados locales
   - NoBeds: SOLO reservas vigentes (checkout >= hoy Bogotá)
   - Excluye canceladas
   - Devuelve también fechaIngreso y fechaSalida
   ======================================================================= */
async function contactos(req, res) {
  try {
    let { query } = req.query;
    if (!query) return res.json([]);

    const rawQuery = String(query).trim();
    const q = rawQuery.toLowerCase();
    const qDigits = rawQuery.replace(/[^\d]/g, "");

    // =========================================================
    // HOY en Bogotá (YYYY-MM-DD)
    // =========================================================
    const hoyBogota = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Bogota",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    // =========================================================
    // SQLITE
    // =========================================================
    const rawSqlite = await prisma.huesped.findMany({
      where: {
        OR: [
          { nombre: { contains: rawQuery } },
          { email: { contains: q } },
          { telefono: { contains: rawQuery } },
          ...(qDigits ? [{ telefono: { contains: qDigits } }] : []),
          { numeroReserva: { contains: rawQuery } },
        ],
      },
      select: {
        id: true,
        nombre: true,
        telefono: true,
        email: true,
        numeroReserva: true,
        fechaIngreso: true,
        fechaSalida: true,
      },
      take: 20,
    });

    const sqliteResults = rawSqlite.map((r) => ({
      origen: "sqlite",
      id: r.id,
      nombre: r.nombre,
      telefono: r.telefono,
      email: r.email,
      numeroReserva: r.numeroReserva,
      fechaIngreso: r.fechaIngreso,
      fechaSalida: r.fechaSalida,
    }));

    // =========================================================
    // NOBEDS
    // =========================================================
    let nobeds = [];

    try {
      const url = `${process.env.NOBEDS_API}/${process.env.NOBEDS_TOKEN}`;
      const nbRes = await axios.get(url, { timeout: 20000 });

      if (Array.isArray(nbRes.data)) {
        nobeds = nbRes.data
          .filter((r) => {
            const firstName = String(r.first_name || r.name || "").trim();
            const lastName = String(r.last_name || "").trim();
            const fullName = `${firstName} ${lastName}`.trim().toLowerCase();

            const email = String(r.email || "").trim().toLowerCase();
            const phone = String(r.phone || "").trim();
            const phoneDigits = phone.replace(/[^\d]/g, "");
            const orderId = String(r.order_id || "").trim();

            const rawCheckout =
              r.checkout ||
              r.check_out ||
              r.end_date ||
              r.endDate ||
              "";

            const checkoutDate = String(rawCheckout).trim().slice(0, 10);

            const status = String(r.status || "").trim().toLowerCase();

            const reservaVigente = checkoutDate && checkoutDate >= hoyBogota;

            const noCancelada = ![
              "cancelled",
              "canceled",
              "cancelada",
              "anulada",
            ].includes(status);

            const coincideBusqueda =
              fullName.includes(q) ||
              email.includes(q) ||
              phone.includes(rawQuery) ||
              (qDigits ? phoneDigits.includes(qDigits) : false) ||
              orderId.includes(rawQuery);

            return coincideBusqueda && reservaVigente && noCancelada;
          })
          .map((r) => ({
            origen: "nobeds",
            id: r.id || `nb-${r.phone || r.email || r.order_id}`,
            nombre: `${String(r.first_name || r.name || "").trim()} ${String(
              r.last_name || ""
            ).trim()}`.trim(),
            telefono: r.phone || "",
            email: r.email || "",
            numeroReserva: String(r.order_id || ""),
            fechaIngreso: r.checkin || r.check_in || null,
            fechaSalida: r.checkout || r.check_out || r.end_date || r.endDate || null,
          }));
      }
    } catch (err) {
      console.error("Error obteniendo nobeds:", err.message);
    }

    // =========================================================
    // MERGE + DEDUPE
    // =========================================================
    const merged = [...sqliteResults, ...nobeds];

    const unique = merged.filter(
      (item, index, arr) =>
        index ===
        arr.findIndex(
          (x) =>
            String(x.numeroReserva || "") === String(item.numeroReserva || "") &&
            String(x.email || "") === String(item.email || "") &&
            String(x.telefono || "") === String(item.telefono || "")
        )
    );

    return res.json(unique.slice(0, 20));
  } catch (error) {
    console.error("ERROR /api/checkin/contactos:", error);
    return res.status(500).json({ error: "Error interno" });
  }
}

/* =======================================================================
   BUSCAR COMBINADO
   ======================================================================= */
async function buscarCombinado(req, res) {
  try {
    const { valor } = req.params;
    if (!valor) {
      return res.status(400).json({ ok: false, error: "Falta valor" });
    }

    const raw = String(valor).trim();
    const q = raw.toLowerCase();
    const qDigits = raw.replace(/[^\d]/g, "");

    let huesped = await prisma.huesped.findFirst({
      where: {
        OR: [
          { telefono: raw },
          { email: q },
          { nombre: { contains: raw } },
          ...(qDigits ? [{ telefono: { contains: qDigits } }] : []),
        ],
      },
    });

    if (huesped) return res.json({ ok: true, origen: "local", data: huesped });

    const url = `${process.env.NOBEDS_API}/${process.env.NOBEDS_TOKEN}`;
    const { data } = await axios.get(url, { timeout: 20000 });

    if (Array.isArray(data)) {
      const match = data.find((r) => {
        const firstName = String(r.first_name || "").trim();
        const lastName = String(r.last_name || "").trim();
        const fullName = `${firstName} ${lastName}`.trim().toLowerCase();
        const email = String(r.email || "").trim().toLowerCase();
        const phone = String(r.phone || "").trim();
        const phoneDigits = phone.replace(/[^\d]/g, "");

        return (
          email === q ||
          phone === raw ||
          (qDigits ? phoneDigits === qDigits : false) ||
          fullName.includes(q)
        );
      });

      if (match) {
        return res.json({ ok: true, origen: "nobeds", data: match });
      }
    }

    return res.status(404).json({ ok: false, error: "No encontrado" });
  } catch (error) {
    console.error("buscar-combinado error:", error);
    return res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
}

/* =======================================================================
   Buscar por número de reserva
   ======================================================================= */
async function getByNumeroReserva(req, res) {
  try {
    const valor = String(req.params.numeroReserva).trim();
    if (!valor) {
      return res.status(400).json({ ok: false, error: "Falta numeroReserva" });
    }

    const huesped = await prisma.huesped.findFirst({
      where: { OR: [{ numeroReserva: valor }, { numeroDocumento: valor }] },
    });

    if (!huesped) {
      return res.status(404).json({
        ok: false,
        error: "Reserva no encontrada en base de datos",
        buscado: valor,
      });
    }

    // Enrich with Nobeds total/price
    let total = null;
    let price = null;
    try {
      const baseUrl = `${process.env.NOBEDS_API}/${process.env.NOBEDS_TOKEN}`;

      // 1) Try by order_id directly
      let match = null;
      try {
        const { data } = await axios.get(`${baseUrl}?order_id=${encodeURIComponent(huesped.numeroReserva)}`, { timeout: 15000 });
        if (Array.isArray(data) && data.length > 0) match = data[0];
      } catch { /* silent */ }

      // 2) Fallback: search by date range and match by name/email
      if (!match && huesped.fechaIngreso) {
        const fromdate = String(huesped.fechaIngreso).split("T")[0];
        const todate = huesped.fechaSalida ? String(huesped.fechaSalida).split("T")[0] : fromdate;
        try {
          const { data } = await axios.get(`${baseUrl}?fromdate=${fromdate}&todate=${todate}`, { timeout: 15000 });
          if (Array.isArray(data) && data.length > 0) {
            const nombre = String(huesped.nombre || "").toLowerCase().trim();
            const email = String(huesped.email || "").toLowerCase().trim();
            match = data.find((r) => {
              const rName = String(r.name || "").toLowerCase().trim();
              const rEmail = String(r.email || r.emails || "").toLowerCase().trim();
              if (nombre && rName && rName.includes(nombre)) return true;
              if (email && rEmail && rEmail.includes(email)) return true;
              return false;
            }) || null;
          }
        } catch { /* silent */ }
      }

      if (match) {
        total = match.balance ?? match.total ?? match.price ?? null;
        price = match.price ?? null;
      }
    } catch (err) {
      console.error("Error enriqueciendo con Nobeds:", err.message);
    }

    return res.json({ ok: true, data: { ...huesped, total, price } });
  } catch (err) {
    console.error("ERROR /api/checkin/por-reserva:", err);
    return res.status(500).json({ ok: false, error: "Error interno" });
  }
}

module.exports = {
  postCheckinSimple,
  postCheckinMultiple,
  buscarReserva,
  huespedesHoy,
  contactos,
  buscarCombinado,
  getByNumeroReserva,

  // ✅ Sesión compartible (SQLite)
  createSession,
  getSession,
  saveSession,
};