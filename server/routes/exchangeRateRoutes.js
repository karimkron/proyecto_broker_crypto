const express = require("express");
const router = express.Router();
const axios = require("axios");
const auth = require("../middleware/auth");

// Cache para el tipo de cambio
let exchangeRateCache = {
  data: null,
  lastUpdate: null,
};

// Cache para datos de criptomonedas
let cryptoDataCache = {
  data: null,
  lastUpdate: null,
};

const CACHE_DURATION = 120000; // 2 minutos

// Obtener tipo de cambio EUR/USDT
router.get("/exchange-rate", auth, async (req, res) => {
  try {
    if (
      exchangeRateCache.data &&
      Date.now() - exchangeRateCache.lastUpdate < CACHE_DURATION
    ) {
      return res.json(exchangeRateCache.data);
    }

    const response = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=eur"
    );

    exchangeRateCache = {
      data: response.data,
      lastUpdate: Date.now(),
    };

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    if (exchangeRateCache.data) {
      return res.json(exchangeRateCache.data);
    }
    res.status(500).json({ error: "Error al obtener tipo de cambio" });
  }
});

// Obtener datos de criptomonedas
router.get("/crypto-data", async (req, res) => {
  try {
    if (
      cryptoDataCache.data &&
      Date.now() - cryptoDataCache.lastUpdate < CACHE_DURATION
    ) {
      return res.json(cryptoDataCache.data);
    }

    const response = await axios.get(
      "https://api.coingecko.com/api/v3/coins/markets",
      {
        params: {
          vs_currency: "usd",
          ids: "bitcoin,ethereum,dogecoin,litecoin,cardano,polkadot,chainlink",
          order: "market_cap_desc",
          per_page: 7,
          page: 1,
          sparkline: false,
        },
      }
    );

    cryptoDataCache = {
      data: response.data,
      lastUpdate: Date.now(),
    };

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching crypto data:", error);
    if (cryptoDataCache.data) {
      return res.json(cryptoDataCache.data);
    }
    res.status(500).json({ error: "Error al obtener datos de criptomonedas" });
  }
});

module.exports = router;
