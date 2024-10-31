const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const User = require("../models/User");
const MarketManipulationService = require("../services/MarketManipulationService");

// Middleware combinado para autenticación y rol de admin
const authAdmin = [auth, admin];

// Obtener todos los usuarios
router.get("/users", authAdmin, async (req, res) => {
  try {
    const users = await MarketManipulationService.getAllUsers();
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res
      .status(500)
      .json({ msg: "Error al obtener usuarios", error: err.message });
  }
});

// Buscar usuarios por email
router.get("/users/search/email/:email", authAdmin, async (req, res) => {
  try {
    const users = await MarketManipulationService.searchUsersByEmail(
      req.params.email
    );
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Error en la búsqueda", error: err.message });
  }
});

// Buscar usuarios por nombre
router.get("/users/search/name/:name", authAdmin, async (req, res) => {
  try {
    const users = await MarketManipulationService.searchUsersByName(
      req.params.name
    );
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Error en la búsqueda", error: err.message });
  }
});

// Buscar usuarios por fecha
router.get("/users/search/date/:date", authAdmin, async (req, res) => {
  try {
    const users = await MarketManipulationService.searchUsersByDate(
      req.params.date
    );
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Error en la búsqueda", error: err.message });
  }
});

// Activar/desactivar ganancias para un usuario
router.patch("/toggle-profits/:userId", authAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { allowProfits } = req.body;

    const user = await MarketManipulationService.toggleUserProfits(
      userId,
      allowProfits
    );
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res
      .status(500)
      .json({ msg: "Error al actualizar usuario", error: err.message });
  }
});

// Obtener estadísticas de manipulación
router.get("/stats", authAdmin, async (req, res) => {
  try {
    const stats = await MarketManipulationService.getManipulationStats();
    res.json(stats);
  } catch (err) {
    console.error(err.message);
    res
      .status(500)
      .json({ msg: "Error al obtener estadísticas", error: err.message });
  }
});

module.exports = router;
