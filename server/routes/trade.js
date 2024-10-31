const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");

const TradingEngine = require("../services/TradingEngine");

const Order = require("../models/Order");

const User = require("../models/User");

module.exports = (io) => {
  // Ruta para obtener los porcentajes de ganancia del usuario

  router.get("/profit-percentages", auth, async (req, res) => {
    try {
      const user = await User.findById(req.user.id);

      res.json(user.tradingPercentages);
    } catch (err) {
      console.error(err.message);

      res.status(500).json({ msg: "Error en el servidor", error: err.message });
    }
  });

  // Ruta para realizar una operación de trading

  router.post("/trade", auth, async (req, res) => {
    try {
      const {
        cryptoSymbol,

        orderType,

        amount,

        duration,

        initialPrice,

        profitPercentage,
      } = req.body;

      // Validar que todos los campos necesarios estén presentes

      if (
        !cryptoSymbol ||
        !orderType ||
        !amount ||
        !duration ||
        !initialPrice ||
        !profitPercentage
      ) {
        return res.status(400).json({ msg: "Todos los campos son requeridos" });
      }

      // Validar que el orderType sea válido

      if (!["buy", "sell"].includes(orderType)) {
        return res.status(400).json({ msg: "Tipo de orden inválido" });
      }

      // Validar que la duración sea válida

      if (!["30S", "60S", "120S"].includes(duration)) {
        return res.status(400).json({ msg: "Duración inválida" });
      }

      const order = await TradingEngine.processOrder(
        req.user.id,

        cryptoSymbol,

        orderType,

        parseFloat(amount),

        duration,

        parseFloat(initialPrice),

        parseFloat(profitPercentage),

        io
      );

      res.json(order);
    } catch (err) {
      console.error("Error en la ruta /trade:", err);

      res.status(500).json({
        msg: "Error en el servidor",

        error: err.message,

        details: err.stack,
      });
    }
  });

  // Ruta para obtener todas las órdenes del usuario

  router.get("/orders", auth, async (req, res) => {
    try {
      const orders = await Order.find({ user: req.user.id }).sort({
        createdAt: -1,
      });

      res.json(orders);
    } catch (err) {
      console.error(err.message);

      res.status(500).json({ msg: "Error en el servidor", error: err.message });
    }
  });

  // Ruta para obtener el estado de una orden específica

  router.get("/order/:id", auth, async (req, res) => {
    try {
      const order = await Order.findOne({
        _id: req.params.id,

        user: req.user.id,
      });

      if (!order) {
        return res.status(404).json({ msg: "Orden no encontrada" });
      }

      res.json(order);
    } catch (err) {
      console.error(err.message);

      res.status(500).json({ msg: "Error en el servidor", error: err.message });
    }
  });

  return router;
};
