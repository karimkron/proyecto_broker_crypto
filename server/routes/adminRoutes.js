const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const auth = require("../middleware/auth");
const Order = require("../models/Order");
const axios = require("axios");

// Middleware para verificar si el usuario es admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ msg: "Acceso denegado" });
  }
  next();
};

// Ruta para obtener todos los usuarios (solo para administradores)
router.get("/users", auth, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

// Ruta para realizar depósitos (solo para administradores)
router.post("/deposit", auth, isAdmin, async (req, res) => {
  const { userId, amountEUR } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    // Obtener el tipo de cambio actual de EUR a USDT
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=eur"
    );
    const eurToUSDT = response.data.tether.eur;

    const amountUSDT = amountEUR / eurToUSDT;

    // Actualizar los balances
    user.balanceEUR = (user.balanceEUR || 0) + parseFloat(amountEUR);
    user.balanceUSDT = (user.balanceUSDT || 0) + amountUSDT;

    // Crear nueva transacción
    const newTransaction = new Transaction({
      user: user._id,
      type: "deposit",
      amountEUR: parseFloat(amountEUR),
      amountUSDT: amountUSDT,
    });

    await newTransaction.save();
    user.transactions.push(newTransaction._id);
    await user.save();

    res.json({
      msg: "Depósito realizado con éxito",
      newBalanceEUR: user.balanceEUR,
      newBalanceUSDT: user.balanceUSDT,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Error del servidor", error: err.message });
  }
});

// Ruta para realizar retiros (solo para administradores)
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

    // Obtener el tipo de cambio actual de EUR a USDT
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=eur"
    );
    const eurToUSDT = response.data.tether.eur;

    const amountUSDT = amountEUR / eurToUSDT;

    // Actualizar los balances
    user.balanceEUR -= parseFloat(amountEUR);
    user.balanceUSDT -= amountUSDT;

    // Crear nueva transacción
    const newTransaction = new Transaction({
      user: user._id,
      type: "withdraw",
      amountEUR: parseFloat(amountEUR),
      amountUSDT: amountUSDT,
    });

    await newTransaction.save();
    user.transactions.push(newTransaction._id);
    await user.save();

    res.json({
      msg: "Retiro realizado con éxito",
      newBalanceEUR: user.balanceEUR,
      newBalanceUSDT: user.balanceUSDT,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Error del servidor", error: err.message });
  }
});

// Nueva ruta para obtener el historial de transacciones de un usuario
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

module.exports = router;
