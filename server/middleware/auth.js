const jwt = require("jsonwebtoken");
const User = require("../models/User"); // Importar el modelo de Usuario
require("dotenv").config();

/**
 * Middleware de autenticación para verificar el token JWT y el estado del usuario
 */
module.exports = async function (req, res, next) {
  try {
    // Obtener el token del header Authorization
    const authHeader = req.header("Authorization");

    if (!authHeader) {
      return res.status(401).json({
        msg: "No se encontró el token de autorización",
        error: "NO_TOKEN",
      });
    }

    // Verificar el formato del token
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        msg: "Formato de token inválido",
        error: "INVALID_TOKEN_FORMAT",
      });
    }

    // Extraer el token
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        msg: "Token de autorización vacío",
        error: "EMPTY_TOKEN",
      });
    }

    try {
      // Verificar el token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Verificar si el usuario existe y no está bloqueado
      const user = await User.findById(decoded.user.id);

      if (!user) {
        return res.status(401).json({
          msg: "Usuario no encontrado",
          error: "USER_NOT_FOUND",
        });
      }

      if (user.isBlocked) {
        return res.status(403).json({
          msg: "Su cuenta ha sido bloqueada. Por favor, contacte con el administrador",
          error: "USER_BLOCKED",
        });
      }

      // Añadir la información del usuario al request
      req.user = decoded.user;

      next();
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        return res.status(401).json({
          msg: "El token ha expirado",
          error: "TOKEN_EXPIRED",
        });
      } else if (jwtError.name === "JsonWebTokenError") {
        return res.status(401).json({
          msg: "Token inválido",
          error: "INVALID_TOKEN",
        });
      } else {
        return res.status(401).json({
          msg: "Error de validación del token",
          error: "TOKEN_VALIDATION_ERROR",
        });
      }
    }
  } catch (error) {
    console.error("Error en middleware de autenticación:", error);
    return res.status(500).json({
      msg: "Error del servidor en la autenticación",
      error: "SERVER_ERROR",
    });
  }
};
