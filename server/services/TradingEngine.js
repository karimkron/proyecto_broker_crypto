const User = require("../models/User");
const Order = require("../models/Order");

class TradingEngine {
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

      // Función para calcular la variación del precio según el tipo de cripto
      const calculatePriceVariation = (symbol, initialPrice, isProfit) => {
        // Para Bitcoin (variación entre 300-1000 USDT)
        if (symbol.toLowerCase() === "btc") {
          const variation = isProfit
            ? Math.random() * 1200 + 300 // 300-1000 USDT para ganancia
            : -(Math.random() * 1200 + 300); // -300 a -1000 USDT para pérdida
          return variation;
        }
        // Para criptos de bajo valor (como DOGE, variación en centavos)
        else if (initialPrice < 1) {
          const variation = isProfit
            ? Math.random() * 0.02 + 0.01 // 0.01-0.03 USDT para ganancia
            : -(Math.random() * 0.02 + 0.01); // -0.01 a -0.03 USDT para pérdida
          return variation;
        }
        // Para otras criptos (variación del 0.1% - 0.5%)
        else {
          const percentVariation = (Math.random() * 0.7 + 0.1) / 100; // 0.1% - 0.5%
          return (
            initialPrice * (isProfit ? percentVariation : -percentVariation)
          );
        }
      };

      // Calcular el precio final con variación realista
      const priceVariation = calculatePriceVariation(
        cryptoSymbol,
        initialPrice,
        willProfit
      );
      const targetPrice = initialPrice + priceVariation;

      // Crear la orden
      const order = new Order({
        user: userId,
        cryptoSymbol,
        orderType,
        amount,
        duration,
        initialPrice,
        targetPrice,
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

          // Calcular resultado basado en el porcentaje seleccionado, no en el movimiento del precio
          let result;
          if (willProfit) {
            result = (amount * profitPercentage) / 100;
          } else {
            result = -amount; // Pérdida total en caso de willProfit false
          }

          // Actualizar la orden
          order.status = "completada";
          order.finalPrice = targetPrice;
          order.result = result;
          order.completedAt = new Date();
          await order.save();

          // Actualizar balance del usuario
          if (willProfit) {
            user.balanceUSDT += amount + result;
          }
          await user.save();

          if (io) {
            io.to(userId.toString()).emit("orderComplete", {
              orderId: order._id,
              finalPrice: targetPrice,
              result,
            });
          }
        } else {
          // Generar precio actual con pequeñas variaciones
          const progressPrice = initialPrice + priceVariation * progress;
          // Añadir pequeño ruido al precio
          const noise = initialPrice * (Math.random() - 0.5) * 0.0001; // ±0.01%
          const currentPrice = progressPrice + noise;

          if (io) {
            io.to(userId.toString()).emit("orderUpdate", {
              orderId: order._id,
              currentPrice,
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
