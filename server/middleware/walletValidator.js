const validateTransfer = async (req, res, next) => {
  try {
    const { recipientAddress, amount, currency } = req.body;

    if (!recipientAddress || !amount || !currency) {
      return res.status(400).json({
        msg: "Todos los campos son requeridos",
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        msg: "El monto debe ser mayor a 0",
      });
    }

    const validCurrencies = ["EUR", "USDT", "BTC", "ETH"];
    if (!validCurrencies.includes(currency)) {
      return res.status(400).json({
        msg: "Moneda no válida",
        validCurrencies,
      });
    }

    // Validar decimales según la moneda
    const decimals = amount.toString().split(".")[1]?.length || 0;
    const maxDecimals = currency === "EUR" || currency === "USDT" ? 2 : 8;

    if (decimals > maxDecimals) {
      return res.status(400).json({
        msg: `La moneda ${currency} solo permite ${maxDecimals} decimales`,
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      msg: "Error en la validación",
      error: error.message,
    });
  }
};

const validateExchange = async (req, res, next) => {
  try {
    const { fromCurrency, toCurrency, amount } = req.body;

    if (!fromCurrency || !toCurrency || !amount) {
      return res.status(400).json({
        msg: "Todos los campos son requeridos",
      });
    }

    const validCurrencies = ["EUR", "USDT", "BTC", "ETH"];
    if (
      !validCurrencies.includes(fromCurrency) ||
      !validCurrencies.includes(toCurrency)
    ) {
      return res.status(400).json({
        msg: "Moneda no válida",
        validCurrencies,
      });
    }

    if (fromCurrency === toCurrency) {
      return res.status(400).json({
        msg: "Las monedas deben ser diferentes",
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        msg: "El monto debe ser mayor a 0",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      msg: "Error en la validación",
      error: error.message,
    });
  }
};

module.exports = {
  validateTransfer,
  validateExchange,
};
