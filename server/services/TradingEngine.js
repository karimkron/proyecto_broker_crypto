const User = require("../models/User");
const Order = require("../models/Order");

class TradingEngine {
  // Mapa de criptomonedas alternativas y sus rangos de precios
  static cryptoAlternatives = {
    btc: {
      symbol: "eth",
      priceRange: { min: 2200, max: 2800 },
    },
    eth: {
      symbol: "doge",
      priceRange: { min: 280, max: 320 },
    },
    bnb: {
      symbol: "ada",
      priceRange: { min: 90, max: 110 },
    },
    sol: {
      symbol: "link",
      priceRange: { min: 0.4, max: 0.6 },
    },
    ada: {
      symbol: "dot",
      priceRange: { min: 5, max: 7 },
    },
  };

  static getAlternativeCryptoData(originalSymbol) {
    const symbolLower = originalSymbol.toLowerCase();
    const altData = this.cryptoAlternatives[symbolLower];
    if (!altData) return { symbol: originalSymbol, price: 100 }; // Default fallback

    const price =
      Math.random() * (altData.priceRange.max - altData.priceRange.min) +
      altData.priceRange.min;
    return {
      symbol: altData.symbol,
      price: price,
    };
  }

  static async processOrder(
    userId,
    cryptoSymbol,
    orderType,
    amount,
    duration,
    initialPrice,
    profitPercentage,
    io
  ) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new Error("Usuario no encontrado");
      }

      if (user.balanceUSDT < amount) {
        throw new Error("Saldo insuficiente");
      }

      const willProfit = user.allowProfits;

      // Obtener datos de cripto alternativa si es necesario
      const displayData = willProfit
        ? { symbol: cryptoSymbol, price: initialPrice }
        : this.getAlternativeCryptoData(cryptoSymbol);

      // Función para calcular la variación del precio según el tipo de cripto
      const calculatePriceVariation = (symbol, basePrice, isProfit) => {
        const symbolLower = symbol.toLowerCase();
        if (symbolLower === "btc") {
          return isProfit
            ? Math.random() * 1200 + 300
            : -(Math.random() * 1200 + 300);
        } else if (symbolLower === "eth") {
          return isProfit
            ? Math.random() * 100 + 20
            : -(Math.random() * 100 + 20);
        } else if (basePrice < 1) {
          return isProfit
            ? Math.random() * 0.02 + 0.01
            : -(Math.random() * 0.02 + 0.01);
        } else {
          const percentVariation = (Math.random() * 0.7 + 0.1) / 100;
          return basePrice * (isProfit ? percentVariation : -percentVariation);
        }
      };

      // Calcular variaciones de precio
      const realPriceVariation = calculatePriceVariation(
        cryptoSymbol,
        initialPrice,
        willProfit
      );
      const displayPriceVariation = calculatePriceVariation(
        displayData.symbol,
        displayData.price,
        willProfit
      );

      const realTargetPrice = initialPrice + realPriceVariation;
      const displayTargetPrice = displayData.price + displayPriceVariation;

      // Crear la orden con datos reales y de visualización
      const order = new Order({
        user: userId,
        cryptoSymbol,
        displaySymbol: displayData.symbol,
        orderType,
        amount,
        duration,
        initialPrice,
        displayInitialPrice: displayData.price,
        targetPrice: realTargetPrice,
        displayTargetPrice,
        profitPercentage,
        status: "en progreso",
        willProfit: user.allowProfits,
      });

      await order.save();

      // Actualizar el balance del usuario
      user.balanceUSDT -= amount;
      await user.save();

      // Simulación del proceso de trading
      const startTime = Date.now();
      const endTime = startTime + this.getDurationInMilliseconds(duration);
      const intervalTime = 100;

      const interval = setInterval(async () => {
        const currentTime = Date.now();
        const progress = (currentTime - startTime) / (endTime - startTime);

        if (currentTime >= endTime) {
          clearInterval(interval);

          let result;
          if (willProfit) {
            result = (amount * profitPercentage) / 100;
          } else {
            result = -amount;
          }

          order.status = "completada";
          order.finalPrice = realTargetPrice;
          order.displayFinalPrice = displayTargetPrice;
          order.result = result;
          order.completedAt = new Date();
          await order.save();

          if (willProfit) {
            user.balanceUSDT += amount + result;
            await user.save();
          }

          if (io) {
            io.to(userId.toString()).emit("orderComplete", {
              orderId: order._id,
              displaySymbol: displayData.symbol,
              finalPrice: displayTargetPrice,
              result,
            });
          }
        } else {
          const realProgressPrice =
            initialPrice + realPriceVariation * progress;
          const displayProgressPrice =
            displayData.price + displayPriceVariation * progress;
          const noise = displayData.price * (Math.random() - 0.5) * 0.0001;
          const currentDisplayPrice = displayProgressPrice + noise;

          if (io) {
            io.to(userId.toString()).emit("orderUpdate", {
              orderId: order._id,
              displaySymbol: displayData.symbol,
              currentPrice: currentDisplayPrice,
              progress,
            });
          }
        }
      }, intervalTime);

      return order;
    } catch (error) {
      console.error("Error en TradingEngine.processOrder:", error);
      throw error;
    }
  }

  static getDurationInMilliseconds(duration) {
    const durationMap = {
      "30S": 30 * 1000,
      "60S": 60 * 1000,
      "120S": 120 * 1000,
    };
    return durationMap[duration] || 30 * 1000;
  }
}

module.exports = TradingEngine;
