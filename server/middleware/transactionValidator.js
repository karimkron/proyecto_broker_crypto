const { validateAddress } = require("../utils/addressGenerator");

/**
 * Middleware para validar los datos de una transferencia
 */
const transactionValidator = {
  // Validar datos de transferencia
  validateTransfer: async (req, res, next) => {
    try {
      const { recipientAddress, amount, currency } = req.body;

      // Validar que todos los campos requeridos estén presentes
      if (!recipientAddress || !amount || !currency) {
        return res.status(400).json({
          msg: "Todos los campos son requeridos",
          error: "MISSING_FIELDS",
          details: {
            recipientAddress: !recipientAddress ? "Dirección requerida" : null,
            amount: !amount ? "Monto requerido" : null,
            currency: !currency ? "Moneda requerida" : null,
          },
        });
      }

      // Validar formato de dirección
      if (!validateAddress(recipientAddress)) {
        return res.status(400).json({
          msg: "Formato de dirección inválido",
          error: "INVALID_ADDRESS_FORMAT",
          field: "recipientAddress",
        });
      }

      // Validar que el monto sea un número positivo
      if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({
          msg: "El monto debe ser un número mayor a 0",
          error: "INVALID_AMOUNT",
          field: "amount",
        });
      }

      // Validar decimales según la moneda
      const decimals = amount.toString().split(".")[1]?.length || 0;
      const maxDecimals = currency === "EUR" || currency === "USDT" ? 2 : 8;

      if (decimals > maxDecimals) {
        return res.status(400).json({
          msg: `La moneda ${currency} solo permite ${maxDecimals} decimales`,
          error: "INVALID_DECIMALS",
          field: "amount",
        });
      }

      // Validar tipo de moneda
      const validCurrencies = ["EUR", "USDT", "BTC", "ETH"];
      if (!validCurrencies.includes(currency)) {
        return res.status(400).json({
          msg: "Moneda no soportada",
          error: "INVALID_CURRENCY",
          field: "currency",
          validCurrencies,
        });
      }

      // Validar que el monto no exceda límites razonables
      const limits = {
        EUR: 1000000,
        USDT: 1000000,
        BTC: 100,
        ETH: 1000,
      };

      if (amount > limits[currency]) {
        return res.status(400).json({
          msg: `El monto excede el límite máximo para ${currency}`,
          error: "AMOUNT_EXCEEDS_LIMIT",
          field: "amount",
          limit: limits[currency],
        });
      }

      next();
    } catch (error) {
      console.error("Error en validación de transacción:", error);
      return res.status(500).json({
        msg: "Error al validar la transacción",
        error: "VALIDATION_ERROR",
      });
    }
  },

  // Validar saldo suficiente
  validateBalance: async (req, res, next) => {
    try {
      const { amount, currency } = req.body;
      const user = await User.findById(req.user.id);

      const balanceField = `balance${currency}`;
      if (!user[balanceField] || user[balanceField] < amount) {
        return res.status(400).json({
          msg: "Saldo insuficiente",
          error: "INSUFFICIENT_BALANCE",
          available: user[balanceField] || 0,
        });
      }

      next();
    } catch (error) {
      console.error("Error al validar balance:", error);
      return res.status(500).json({
        msg: "Error al verificar el saldo",
        error: "BALANCE_CHECK_ERROR",
      });
    }
  },

  // Validar límites diarios
  validateDailyLimit: async (req, res, next) => {
    try {
      const { amount, currency } = req.body;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Obtener total de transacciones del día
      const dailyTransactions = await Transaction.aggregate([
        {
          $match: {
            user: req.user.id,
            currency,
            type: "send",
            date: { $gte: today },
            status: "completed",
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ]);

      const dailyTotal = (dailyTransactions[0]?.total || 0) + Number(amount);
      const dailyLimits = {
        EUR: 50000,
        USDT: 50000,
        BTC: 5,
        ETH: 50,
      };

      if (dailyTotal > dailyLimits[currency]) {
        return res.status(400).json({
          msg: "Límite diario excedido",
          error: "DAILY_LIMIT_EXCEEDED",
          dailyLimit: dailyLimits[currency],
          used: dailyTransactions[0]?.total || 0,
          remaining: Math.max(
            0,
            dailyLimits[currency] - (dailyTransactions[0]?.total || 0)
          ),
        });
      }

      next();
    } catch (error) {
      console.error("Error al validar límite diario:", error);
      return res.status(500).json({
        msg: "Error al verificar límite diario",
        error: "DAILY_LIMIT_CHECK_ERROR",
      });
    }
  },
};

module.exports = transactionValidator;
