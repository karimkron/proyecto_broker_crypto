const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// Obtener todas las órdenes
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Crear una nueva orden
router.post('/', async (req, res) => {
  const order = new Order({
    user: req.body.user,
    cryptoSymbol: req.body.cryptoSymbol,
    amount: req.body.amount,
    duration: req.body.duration,
    profit: req.body.profit,
  });

  try {
    const newOrder = await order.save();
    res.status(201).json(newOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Puedes añadir más rutas según sea necesario, como obtener una orden específica, actualizar o eliminar órdenes

module.exports = router;