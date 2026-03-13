const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

function getCookieName() {
  return process.env.ADMIN_COOKIE_NAME || "kuyay_admin_session";
}

function getSessionHours() {
  const n = Number(process.env.ADMIN_SESSION_HOURS || 12);
  return Number.isFinite(n) && n > 0 ? n : 12;
}

function getCookieOptions() {
  const secure =
    String(process.env.COOKIE_SECURE || "false").toLowerCase() === "true";

  return {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: getSessionHours() * 60 * 60 * 1000,
  };
}

function signToken(payload) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("Falta ADMIN_SESSION_SECRET en .env");
  }

  return jwt.sign(payload, secret, {
    expiresIn: `${getSessionHours()}h`,
  });
}

async function login(req, res) {
  try {
    const { username, password } = req.body || {};

    const envUsername = String(process.env.ADMIN_USERNAME || "").trim();
    const envHash = String(process.env.ADMIN_PASSWORD_HASH || "").trim();

    if (!envUsername || !envHash) {
      return res.status(500).json({
        ok: false,
        error: "Credenciales administrativas no configuradas en el servidor",
      });
    }

    const inputUsername = String(username || "").trim();
    const inputPassword = String(password || "");

    if (!inputUsername || !inputPassword) {
      return res.status(400).json({
        ok: false,
        error: "Usuario y contraseña son obligatorios",
      });
    }

    if (inputUsername !== envUsername) {
      return res.status(401).json({
        ok: false,
        error: "Credenciales inválidas",
      });
    }

    const isValid = await bcrypt.compare(inputPassword, envHash);

    if (!isValid) {
      return res.status(401).json({
        ok: false,
        error: "Credenciales inválidas",
      });
    }

    const token = signToken({
      role: "admin",
      username: envUsername,
    });

    res.cookie(getCookieName(), token, getCookieOptions());

    return res.json({
      ok: true,
      user: {
        username: envUsername,
        role: "admin",
      },
    });
  } catch (error) {
    console.error("admin login error:", error);
    return res.status(500).json({
      ok: false,
      error: "Error interno al iniciar sesión",
    });
  }
}

async function session(req, res) {
  try {
    if (!req.adminUser) {
      return res.status(401).json({ ok: false, error: "No autenticado" });
    }

    return res.json({
      ok: true,
      user: {
        username: req.adminUser.username,
        role: req.adminUser.role,
      },
    });
  } catch (error) {
    console.error("admin session error:", error);
    return res.status(500).json({
      ok: false,
      error: "Error interno consultando sesión",
    });
  }
}

async function logout(_req, res) {
  try {
    res.clearCookie(getCookieName(), {
      httpOnly: true,
      secure:
        String(process.env.COOKIE_SECURE || "false").toLowerCase() === "true",
      sameSite: "lax",
      path: "/",
    });

    return res.json({ ok: true });
  } catch (error) {
    console.error("admin logout error:", error);
    return res.status(500).json({
      ok: false,
      error: "Error cerrando sesión",
    });
  }
}

module.exports = {
  login,
  session,
  logout,
};
