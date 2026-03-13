const jwt = require("jsonwebtoken");

function getCookieName() {
  return process.env.ADMIN_COOKIE_NAME || "kuyay_admin_session";
}

function requireAdminAuth(req, res, next) {
  try {
    const cookieName = getCookieName();
    const token = req.cookies?.[cookieName];

    if (!token) {
      return res.status(401).json({
        ok: false,
        error: "No autenticado",
      });
    }

    const secret = process.env.ADMIN_SESSION_SECRET;
    if (!secret) {
      return res.status(500).json({
        ok: false,
        error: "Falta ADMIN_SESSION_SECRET en el servidor",
      });
    }

    const decoded = jwt.verify(token, secret);

    if (!decoded || decoded.role !== "admin") {
      return res.status(403).json({
        ok: false,
        error: "Sesión inválida",
      });
    }

    req.adminUser = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      ok: false,
      error: "Sesión expirada o inválida",
    });
  }
}

module.exports = {
  requireAdminAuth,
};
