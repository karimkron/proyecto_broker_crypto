const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const auth = require("../middleware/auth");
const {
  validateTransfer,
  validateExchange,
} = require("../middleware/walletValidator");
const axios = require("axios");
const crypto = require("crypto");

// ====== Rutas de Balance y Dirección ======
/**
 * @route   GET /api/wallet
 * @desc    Obtener balance del usuario
 */
router.get("/wallet", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }
    res.json({
      balanceEUR: user.balanceEUR || 0,
      balanceUSDT: user.balanceUSDT || 0,
      balanceBTC: user.balanceBTC || 0,
      balanceETH: user.balanceETH || 0,
    });
  } catch (err) {
    console.error("Error al obtener balance:", err);
    res.status(500).json({ msg: "Error del servidor", error: err.message });
  }
});

/**
 * @route   GET /api/wallet/address
 * @desc    Obtener o generar dirección de billetera
 */
router.get("/wallet/address", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    if (!user.walletAddress) {
      // Generar dirección con prefijo
      const randomBytes = crypto.randomBytes(32);
      const address = `wx${randomBytes.toString("hex")}`;
      user.walletAddress = address;
      await user.save();
    }

    res.json({ address: user.walletAddress });
  } catch (err) {
    console.error("Error al obtener dirección:", err);
    res.status(500).json({ msg: "Error del servidor", error: err.message });
  }
});

// ====== Rutas de Transacciones ======
/**
 * @route   GET /api/wallet/transactions
 * @desc    Obtener historial de transacciones
 */
router.get("/wallet/transactions", auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      $or: [
        // Transacciones enviadas por el usuario
        { user: req.user.id, type: "send" },
        // Transacciones recibidas por el usuario
        { user: req.user.id, type: "receive" },
        // Intercambios del usuario
        { user: req.user.id, type: "exchange" },
      ],
    })
      .sort({ date: -1 })
      .populate("relatedUser", "username");

    res.json(transactions);
  } catch (err) {
    console.error("Error al obtener transacciones:", err);
    res.status(500).json({ msg: "Error del servidor", error: err.message });
  }
});

/**
 * @route   POST /api/wallet/transfer
 * @desc    Realizar transferencia entre usuarios
 */
router.post("/wallet/transfer", [auth, validateTransfer], async (req, res) => {
  try {
    const { recipientAddress, amount, currency } = req.body;
    const sender = await User.findById(req.user.id);
    const recipient = await User.findOne({ walletAddress: recipientAddress });

    // Validar que no sea una auto-transferencia
    if (sender.walletAddress === recipientAddress) {
      return res.status(400).json({
        msg: "No puedes realizar transferencias a tu propia billetera",
        error: "SELF_TRANSFER_NOT_ALLOWED",
      });
    }

    if (!recipient) {
      return res
        .status(404)
        .json({ msg: "Dirección de billetera no encontrada" });
    }

    const balanceField = `balance${currency}`;
    if (sender[balanceField] < amount) {
      return res.status(400).json({ msg: "Saldo insuficiente" });
    }

    // Crear transacciones
    const txHash = crypto.randomBytes(32).toString("hex");

    // Crear transacción para el remitente (send)
    await Transaction.create({
      user: sender._id,
      type: "send",
      amount,
      currency,
      status: "completed",
      senderAddress: sender.walletAddress,
      recipientAddress,
      relatedUser: recipient._id,
      description: `Transferencia enviada a ${recipient.username}`,
      txHash,
    });

    // Crear transacción para el destinatario (receive)
    await Transaction.create({
      user: recipient._id,
      type: "receive",
      amount,
      currency,
      status: "completed",
      senderAddress: sender.walletAddress,
      recipientAddress,
      relatedUser: sender._id,
      description: `Transferencia recibida de ${sender.username}`,
      txHash,
    });

    // Actualizar balances
    sender[balanceField] -= amount;
    recipient[balanceField] = (recipient[balanceField] || 0) + amount;

    await Promise.all([sender.save(), recipient.save()]);

    res.json({
      msg: "Transferencia realizada con éxito",
      transactionId: txHash,
      newBalance: sender[balanceField],
    });
  } catch (err) {
    console.error("Error en transferencia:", err);
    res.status(500).json({ msg: "Error del servidor", error: err.message });
  }
});

/**
 * @route   POST /api/wallet/exchange
 * @desc    Realizar intercambio entre monedas
 */
router.post("/wallet/exchange", [auth, validateExchange], async (req, res) => {
  try {
    const { fromCurrency, toCurrency, amount } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    const fromBalanceField = `balance${fromCurrency}`;
    if (user[fromBalanceField] < amount) {
      return res.status(400).json({
        msg: `Saldo insuficiente en ${fromCurrency}`,
        availableBalance: user[fromBalanceField],
      });
    }

    // Obtener tasas de cambio
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=eur,usd"
    );

    const rates = {
      EUR: {
        USDT: 1 / response.data.tether.eur,
        BTC: 1 / response.data.bitcoin.eur,
        ETH: 1 / response.data.ethereum.eur,
      },
      USDT: {
        EUR: response.data.tether.eur,
        BTC: response.data.tether.usd / response.data.bitcoin.usd,
        ETH: response.data.tether.usd / response.data.ethereum.usd,
      },
      BTC: {
        EUR: response.data.bitcoin.eur,
        USDT: response.data.bitcoin.usd,
        ETH: response.data.bitcoin.usd / response.data.ethereum.usd,
      },
      ETH: {
        EUR: response.data.ethereum.eur,
        USDT: response.data.ethereum.usd,
        BTC: response.data.ethereum.usd / response.data.bitcoin.usd,
      },
    };

    const rate = rates[fromCurrency][toCurrency];
    const convertedAmount = amount * rate;
    const toBalanceField = `balance${toCurrency}`;

    // Crear transacción de intercambio
    await Transaction.create({
      user: user._id,
      type: "exchange",
      amount,
      currency: fromCurrency,
      description: `Intercambio de ${amount} ${fromCurrency} a ${convertedAmount.toFixed(
        8
      )} ${toCurrency}`,
      status: "completed",
      txHash: crypto.randomBytes(32).toString("hex"),
    });

    // Actualizar balances
    user[fromBalanceField] -= parseFloat(amount);
    user[toBalanceField] = (user[toBalanceField] || 0) + convertedAmount;
    await user.save();

    res.json({
      msg: "Intercambio realizado con éxito",
      newBalanceEUR: user.balanceEUR || 0,
      newBalanceUSDT: user.balanceUSDT || 0,
      newBalanceBTC: user.balanceBTC || 0,
      newBalanceETH: user.balanceETH || 0,
      convertedAmount,
      rate,
    });
  } catch (err) {
    console.error("Error en intercambio:", err);
    res.status(500).json({ msg: "Error del servidor", error: err.message });
  }
});

module.exports = router;
