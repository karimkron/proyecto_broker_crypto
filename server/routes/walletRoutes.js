const express = require("express");
const router = express.Router();
const User = require("../models/User");
const auth = require("../middleware/auth");
const axios = require("axios");

// Obtener balance
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
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
});

// Realizar intercambio
router.post("/exchange", auth, async (req, res) => {
  try {
    const { fromCurrency, toCurrency, amount } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    // Validar que el usuario tenga suficiente balance
    const fromBalanceField = `balance${fromCurrency}`;
    if (user[fromBalanceField] < amount) {
      return res.status(400).json({
        msg: `Saldo insuficiente en ${fromCurrency}`,
        availableBalance: user[fromBalanceField],
      });
    }

    // Obtener tasas de cambio actuales para todas las criptos
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

    // Actualizar balances
    const toBalanceField = `balance${toCurrency}`;
    user[fromBalanceField] -= parseFloat(amount);
    user[toBalanceField] = (user[toBalanceField] || 0) + convertedAmount;

    await user.save();

    // Enviar respuesta con todos los balances actualizados
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
    console.error(err.message);
    res.status(500).json({ msg: "Error del servidor", error: err.message });
  }
});

module.exports = router;
