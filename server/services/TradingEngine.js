const User = require("../models/User");
const Order = require("../models/Order");

class TradingEngine {
  static async processOrder(userId, cryptoSymbol, amount, duration) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("Usuario no encontrado");
      }

      if (user.balanceUSDT < amount) {
        throw new Error("Saldo insuficiente");
      }

      const percentage = user.tradingPercentages[duration];
      if (!percentage) {
        throw new Error("Duración de trading inválida");
      }

      const estimatedProfit = amount * (percentage / 100);

      // Crear la orden
      const order = new Order({
        user: userId,
        cryptoSymbol,
        amount,
        duration,
        estimatedProfit,
        status: "en progreso",
      });

      await order.save();

      // Actualizar el balance del usuario
      user.balanceUSDT -= amount;
      await user.save();

      // Simular el proceso de trading
      setTimeout(async () => {
        // Calcular la ganancia final (puede variar ligeramente de la estimada)
        const finalProfit = estimatedProfit * (0.9 + Math.random() * 0.2); // ±10% de variación

        // Actualizar la orden y el balance del usuario
        order.status = "completada";
        order.finalProfit = finalProfit;
        await order.save();

        user.balanceUSDT += amount + finalProfit;
        await user.save();
      }, duration * 1000);

      return order;
    } catch (error) {
      console.error("Error en el proceso de trading:", error);
      throw error;
    }
  }

  static async getOrderStatus(orderId) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error("Orden no encontrada");
      }
      return order;
    } catch (error) {
      console.error("Error al obtener el estado de la orden:", error);
      throw error;
    }
  }
}

module.exports = TradingEngine;