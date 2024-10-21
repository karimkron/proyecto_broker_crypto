const express = require("express");
const router = express.Router();
const InvitationCode = require("../models/InvitationCode");
const auth = require("../middleware/auth");

// Generar un código de invitación
router.post("/generate", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Acceso denegado" });
    }

    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    const invitationCode = new InvitationCode({ code });
    await invitationCode.save();

    res.json({ code });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
});

// Obtener todos los códigos de invitación
router.get("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Acceso denegado" });
    }

    const codes = await InvitationCode.find().sort({ createdAt: -1 });
    res.json(codes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
});

module.exports = router;
