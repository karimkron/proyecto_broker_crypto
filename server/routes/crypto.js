const express = require("express");

const axios = require("axios");

const router = express.Router();

let cryptoCache = {
  markets: { data: null, lastFetch: 0 },

  details: {},

  history: {},
};

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos

// Función para generar datos históricos simulados

const generateSimulatedData = (days, startPrice) => {
  const data = [];

  const now = Date.now();

  const interval = (days * 24 * 60 * 60 * 1000) / 100; // 100 puntos de datos

  let price = startPrice;

  for (let i = 0; i < 100; i++) {
    const timestamp = now - (99 - i) * interval;

    const open = price;

    const close = open * (1 + (Math.random() - 0.5) * 0.02);

    const high = Math.max(open, close) * (1 + Math.random() * 0.005);

    const low = Math.min(open, close) * (1 - Math.random() * 0.005);

    price = close;

    data.push({ timestamp, open, high, low, close });
  }

  return data;
};

// Ruta para obtener datos de todas las criptomonedas

router.get("/crypto-data", async (req, res) => {
  try {
    const currentTime = Date.now();

    if (
      cryptoCache.markets.data &&
      currentTime - cryptoCache.markets.lastFetch < CACHE_DURATION
    ) {
      return res.json(cryptoCache.markets.data);
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

    cryptoCache.markets.data = response.data;

    cryptoCache.markets.lastFetch = currentTime;

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching crypto data:", error.message);

    if (cryptoCache.markets.data) {
      return res.json(cryptoCache.markets.data);
    }

    res

      .status(500)

      .json({ error: "Unable to fetch crypto data", details: error.message });
  }
});

// Ruta para obtener detalles de una criptomoneda individual

router.get("/crypto/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const currentTime = Date.now();

    if (
      cryptoCache.details[id] &&
      currentTime - cryptoCache.details[id].lastFetch < CACHE_DURATION
    ) {
      return res.json(cryptoCache.details[id].data);
    }

    const response = await axios.get(
      `https://api.coingecko.com/api/v3/coins/${id}`,

      {
        params: {
          localization: false,

          tickers: false,

          market_data: true,

          community_data: false,

          developer_data: false,

          sparkline: false,
        },
      }
    );

    const { name, symbol, market_data } = response.data;

    const cryptoData = {
      id,

      name,

      symbol,

      current_price: market_data.current_price.usd,

      price_change_percentage_24h: market_data.price_change_percentage_24h,

      high_24h: market_data.high_24h.usd,

      low_24h: market_data.low_24h.usd,

      market_cap: market_data.market_cap.usd,

      total_volume: market_data.total_volume.usd,
    };

    cryptoCache.details[id] = { data: cryptoData, lastFetch: currentTime };

    res.json(cryptoData);
  } catch (error) {
    console.error(
      `Error fetching crypto data for ${req.params.id}:`,

      error.message
    );

    if (cryptoCache.details[req.params.id]) {
      return res.json(cryptoCache.details[req.params.id].data);
    }

    res

      .status(500)

      .json({ error: "Unable to fetch crypto data", details: error.message });
  }
});

// Ruta para obtener datos históricos de una criptomoneda

router.get("/crypto/:id/history", async (req, res) => {
  try {
    const { id } = req.params;

    const { days } = req.query;

    const currentTime = Date.now();

    const cacheKey = `${id}-${days}`;

    if (
      cryptoCache.history[cacheKey] &&
      currentTime - cryptoCache.history[cacheKey].lastFetch < CACHE_DURATION
    ) {
      return res.json(cryptoCache.history[cacheKey].data);
    }

    const response = await axios.get(
      `https://api.coingecko.com/api/v3/coins/${id}/ohlc`,

      {
        params: {
          vs_currency: "usd",

          days: days || "1",
        },
      }
    );

    const candleData = response.data.map(
      ([timestamp, open, high, low, close]) => ({
        timestamp,

        open,

        high,

        low,

        close,
      })
    );

    cryptoCache.history[cacheKey] = {
      data: candleData,

      lastFetch: currentTime,
    };

    res.json(candleData);
  } catch (error) {
    console.error(
      `Error fetching historical data for ${req.params.id}:`,

      error.message
    );

    // Si no podemos obtener datos reales, generamos datos simulados

    if (!cryptoCache.details[req.params.id]) {
      // Si no tenemos datos de la criptomoneda, usamos un precio base

      const simulatedData = generateSimulatedData(
        parseFloat(req.query.days),

        1000
      );

      return res.json(simulatedData);
    }

    const currentPrice = cryptoCache.details[req.params.id].data.current_price;

    const simulatedData = generateSimulatedData(
      parseFloat(req.query.days),

      currentPrice
    );

    // Guardamos los datos simulados en el caché

    cryptoCache.history[`${req.params.id}-${req.query.days}`] = {
      data: simulatedData,

      lastFetch: Date.now(),
    };

    res.json(simulatedData);
  }
});

module.exports = router;
