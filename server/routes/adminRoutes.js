const express = require("express");

const router = express.Router();

const User = require("../models/User");

const Transaction = require("../models/Transaction");

const Order = require("../models/Order");

const auth = require("../middleware/auth");

const MarketManipulationService = require("../services/MarketManipulationService");

const axios = require("axios");

const bcrypt = require("bcryptjs");

// Middleware para verificar si el usuario es admin

const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ msg: "Acceso denegado" });
  }

  next();
};

// Obtener todos los usuarios

router.get("/users", auth, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password");

    res.json(users);
  } catch (err) {
    console.error(err.message);

    res.status(500).json({ msg: "Error del servidor" });
  }
});

// Obtener usuario específico

router.get("/users/:userId", auth, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password");

    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);

    res.status(500).json({ msg: "Error del servidor" });
  }
});

// Actualizar información de usuario

router.put("/users/:userId", auth, isAdmin, async (req, res) => {
  const { firstName, lastName, email, username } = req.body;

  try {
    let user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    // Verificar si el email o username ya existe en otro usuario

    if (email !== user.email || username !== user.username) {
      const existingUser = await User.findOne({
        $and: [
          { _id: { $ne: req.params.userId } },

          { $or: [{ email }, { username }] },
        ],
      });

      if (existingUser) {
        return res

          .status(400)

          .json({ msg: "Email o nombre de usuario ya existe" });
      }
    }

    user.firstName = firstName;

    user.lastName = lastName;

    user.email = email;

    user.username = username;

    await user.save();

    res.json(user);
  } catch (err) {
    console.error(err.message);

    res.status(500).json({ msg: "Error del servidor" });
  }
});

// Cambiar contraseña de usuario

router.put("/users/:userId/password", auth, isAdmin, async (req, res) => {
  const { newPassword } = req.body;

  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    const salt = await bcrypt.genSalt(10);

    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.json({ msg: "Contraseña actualizada con éxito" });
  } catch (err) {
    console.error(err.message);

    res.status(500).json({ msg: "Error del servidor" });
  }
});

// Bloquear/Desbloquear usuario

router.put("/users/:userId/toggle-status", auth, isAdmin, async (req, res) => {
  try {
    console.log("Toggle status para usuario:", req.params.userId); // Para debugging

    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    user.isBlocked = !user.isBlocked;

    await user.save();

    console.log("Nuevo estado de bloqueo:", user.isBlocked); // Para debugging

    res.json({
      msg: user.isBlocked ? "Usuario bloqueado" : "Usuario desbloqueado",

      isBlocked: user.isBlocked,

      user: {
        ...user.toObject(),

        password: undefined,
      },
    });
  } catch (err) {
    console.error("Error en toggle-status:", err);

    res.status(500).json({ msg: "Error del servidor" });
  }
});

// Verificar o rechazar KYC

router.put("/users/:userId/kyc-status", auth, isAdmin, async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;

    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    if (!["verified", "rejected"].includes(status)) {
      return res.status(400).json({ msg: "Estado de KYC inválido" });
    }

    user.kycStatus = status;

    if (status === "verified") {
      user.kycVerificationDate = new Date();

      user.kycRejectionReason = null;
    } else if (status === "rejected") {
      user.kycRejectionReason = rejectionReason || "No se proporcionó razón";

      user.kycVerificationDate = null;
    }

    await user.save();

    // Enviar notificación al usuario (puedes implementar esto más tarde)

    res.json({
      msg: status === "verified" ? "KYC verificado con éxito" : "KYC rechazado",

      user: {
        ...user.toObject(),

        password: undefined,
      },
    });
  } catch (err) {
    console.error("Error en actualización de KYC:", err);

    res.status(500).json({ msg: "Error del servidor" });
  }
});

// Realizar depósito

router.post("/deposit", auth, isAdmin, async (req, res) => {
  const { userId, amountEUR } = req.body;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    user.balanceEUR = (user.balanceEUR || 0) + parseFloat(amountEUR);

    const newTransaction = new Transaction({
      user: user._id,

      type: "deposit",

      amountEUR: parseFloat(amountEUR),
    });

    await newTransaction.save();

    user.transactions.push(newTransaction._id);

    await user.save();

    res.json({
      msg: "Depósito realizado con éxito",

      newBalanceEUR: user.balanceEUR,
    });
  } catch (err) {
    console.error(err.message);

    res.status(500).json({ msg: "Error del servidor", error: err.message });
  }
});

// Realizar retiro

router.post("/withdraw", auth, isAdmin, async (req, res) => {
  const { userId, amountEUR } = req.body;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    if (user.balanceEUR < amountEUR) {
      return res.status(400).json({ msg: "Saldo insuficiente" });
    }

    user.balanceEUR -= parseFloat(amountEUR);

    const newTransaction = new Transaction({
      user: user._id,

      type: "withdraw",

      amountEUR: parseFloat(amountEUR),
    });

    await newTransaction.save();

    user.transactions.push(newTransaction._id);

    await user.save();

    res.json({
      msg: "Retiro realizado con éxito",

      newBalanceEUR: user.balanceEUR,
    });
  } catch (err) {
    console.error(err.message);

    res.status(500).json({ msg: "Error del servidor", error: err.message });
  }
});

// Obtener transacciones de usuario

router.get("/transactions/:userId", auth, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate(
      "transactions"
    );

    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    res.json(user.transactions);
  } catch (err) {
    console.error(err.message);

    res.status(500).json({ msg: "Error del servidor" });
  }
});

// Rutas de manipulación del mercado

router.get(
  "/market-manipulation/users/search/email/:email",

  auth,

  isAdmin,

  async (req, res) => {
    try {
      const users = await MarketManipulationService.searchUsersByEmail(
        req.params.email
      );

      res.json(users);
    } catch (err) {
      console.error(err.message);

      res.status(500).json({ msg: "Error en la búsqueda", error: err.message });
    }
  }
);

router.get(
  "/market-manipulation/users/search/name/:name",

  auth,

  isAdmin,

  async (req, res) => {
    try {
      const users = await MarketManipulationService.searchUsersByName(
        req.params.name
      );

      res.json(users);
    } catch (err) {
      console.error(err.message);

      res.status(500).json({ msg: "Error en la búsqueda", error: err.message });
    }
  }
);

router.get(
  "/market-manipulation/users/search/date/:date",

  auth,

  isAdmin,

  async (req, res) => {
    try {
      const users = await MarketManipulationService.searchUsersByDate(
        req.params.date
      );

      res.json(users);
    } catch (err) {
      console.error(err.message);

      res.status(500).json({ msg: "Error en la búsqueda", error: err.message });
    }
  }
);

router.patch(
  "/market-manipulation/toggle-profits/:userId",

  auth,

  isAdmin,

  async (req, res) => {
    try {
      const { userId } = req.params;

      const { allowProfits } = req.body;

      const user = await MarketManipulationService.toggleUserProfits(
        userId,

        allowProfits
      );

      res.json(user);
    } catch (err) {
      console.error(err.message);

      res

        .status(500)

        .json({ msg: "Error al actualizar usuario", error: err.message });
    }
  }
);

router.get("/market-manipulation/stats", auth, isAdmin, async (req, res) => {
  try {
    const stats = await MarketManipulationService.getManipulationStats();

    res.json(stats);
  } catch (err) {
    console.error(err.message);

    res

      .status(500)

      .json({ msg: "Error al obtener estadísticas", error: err.message });
  }
});

module.exports = router;
