const nodemailer = require("nodemailer");

function env(name, def = "") {
  return String(process.env[name] || def).trim();
}

function boolEnv(name, def = "false") {
  return ["1", "true", "yes", "on"].includes(env(name, def).toLowerCase());
}

function buildTransport() {
  const host = env("MAIL_HOST");
  const port = Number(env("MAIL_PORT", "587"));
  const secure = boolEnv("MAIL_SECURE", port === 465 ? "true" : "false");
  const user = env("MAIL_USER");
  const pass = env("MAIL_PASS");

  if (!host || !port || !user || !pass) {
    return { ok: false, error: "Faltan MAIL_HOST/MAIL_PORT/MAIL_USER/MAIL_PASS" };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  return { ok: true, transporter };
}

function buildHtml({ reserva, titular, totalGuests }) {
  const numeroReserva =
    reserva?.numeroReserva || reserva?.numero_reserva || reserva?.codigoReserva || "N/A";
  const roomId = reserva?.room_id ?? reserva?.roomId ?? reserva?.roomID ?? "N/A";

  const nombre = titular?.nombre || "N/A";
  const docType = titular?.tipoDocumento || "N/A";
  const docNum = titular?.numeroDocumento || "N/A";
  const email = titular?.email || "N/A";
  const tel = titular?.telefono || "N/A";
  const ingreso = titular?.fechaIngreso || "N/A";
  const salida = titular?.fechaSalida || "N/A";
  const motivo = titular?.motivoViaje || "N/A";

  return `
  <div style="font-family: Arial, sans-serif; line-height: 1.4;">
    <h2>✅ Nuevo Check-in registrado</h2>
    <p><b>Reserva:</b> ${numeroReserva}</p>
    <p><b>Room ID:</b> ${roomId}</p>

    <h3>👤 Titular</h3>
    <ul>
      <li><b>Nombre:</b> ${nombre}</li>
      <li><b>Documento:</b> ${docType} ${docNum}</li>
      <li><b>Email:</b> ${email}</li>
      <li><b>Teléfono:</b> ${tel}</li>
    </ul>

    <h3>🛏️ Estadia</h3>
    <ul>
      <li><b>Check-in:</b> ${ingreso}</li>
      <li><b>Check-out:</b> ${salida}</li>
      <li><b>Motivo:</b> ${motivo}</li>
      <li><b>Total huéspedes:</b> ${totalGuests}</li>
    </ul>

    <p style="color:#6b7280;font-size:12px;">Enviado automáticamente por HostelCheckin.</p>
  </div>
  `;
}

async function sendCheckinEmail({ reserva, formList }) {
  const enabled = boolEnv("MAIL_ENABLED", "false");
  if (!enabled) return { ok: true, skipped: true, reason: "MAIL_ENABLED=false" };

  const { ok, transporter, error } = buildTransport();
  if (!ok) return { ok: false, error };

  const from = env("MAIL_FROM", env("MAIL_USER"));
  const to = env("MAIL_TO_DEFAULT");
  if (!to) return { ok: false, error: "Falta MAIL_TO_DEFAULT" };

  const titular = Array.isArray(formList) ? formList[0] : null;
  const totalGuests = Array.isArray(formList) ? formList.length : 0;

  const numeroReserva =
    reserva?.numeroReserva || reserva?.numero_reserva || reserva?.codigoReserva || "N/A";

  const subject = `Nuevo Check-in - Reserva ${numeroReserva}`;
  const html = buildHtml({ reserva, titular, totalGuests });

  const info = await transporter.sendMail({ from, to, subject, html });
  return { ok: true, messageId: info?.messageId || null };
}

module.exports = { sendCheckinEmail };
