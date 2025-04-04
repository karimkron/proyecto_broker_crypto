const adminAuth = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res
      .status(403)
      .json({
        msg: "Acceso denegado. Se requieren permisos de administrador.",
      });
  }
};

module.exports = adminAuth;
