const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");
const InvitationCode = require("../models/InvitationCode");

// @route   POST api/users
// @desc    Register user
// @access  Public
router.post("/", async (req, res) => {
  const { firstName, lastName, username, email, password, invitationCode } =
    req.body;

  try {
    let userExists = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (userExists) {
      return res.status(400).json({ msg: "El usuario o email ya existe" });
    }

    const validCode = await InvitationCode.findOne({
      code: invitationCode,
      isUsed: false,
    });

    if (!validCode) {
      return res
        .status(400)
        .json({ msg: "Código de invitación inválido o ya utilizado" });
    }

    const user = new User({
      firstName,
      lastName,
      username,
      email,
      password,
      invitationCode,
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    validCode.isUsed = true;
    validCode.usedBy = user._id;
    await validCode.save();

    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 3600 },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
});

// @route   POST api/users/login
// @desc    Autenticar usuario y obtener token
// @access  Public
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ msg: "Credenciales inválidas" });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        msg: "Su cuenta ha sido bloqueada. Por favor, contacte con el administrador",
        error: "ACCOUNT_BLOCKED",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ msg: "Credenciales inválidas" });
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 3600 },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          role: user.role,
          user: {
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            email: user.email,
          },
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
});

// @route   GET api/users/me
// @desc    Get current user
// @access  Private
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .select("-transactions");
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   PUT api/users/change-password
// @desc    Change user password
// @access  Private
router.put("/change-password", auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    // Validaciones
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        msg: "Se requieren la contraseña actual y la nueva contraseña",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        msg: "La nueva contraseña debe tener al menos 6 caracteres",
      });
    }

    const user = await User.findById(req.user.id);

    // Verificar contraseña actual
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ msg: "La contraseña actual es incorrecta" });
    }

    // Verificar que la nueva contraseña sea diferente a la actual
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        msg: "La nueva contraseña debe ser diferente a la actual",
      });
    }

    // Encriptar y guardar nueva contraseña
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ msg: "Contraseña actualizada con éxito" });
  } catch (err) {
    console.error("Error al cambiar la contraseña:", err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

// @route   GET api/users/verify
// @desc    Verify user token
// @access  Private
router.get("/verify", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json({ user, role: user.role });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

router.get("/profit-percentages", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }
    res.json(user.tradingPercentages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error del servidor");
  }
});

module.exports = router;
