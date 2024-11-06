const express = require("express");
const router = express.Router();
const DeviceInfo = require("../models/DeviceInfo");
const User = require("../models/User");
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");

// @route   GET /api/admin/users-device-info
// @desc    Obtener información de dispositivos de todos los usuarios
// @access  Private/Admin
router.get("/users-device-info", auth, adminAuth, async (req, res) => {
  try {
    // Obtener todos los usuarios con su información de dispositivo
    const users = await User.find().select("-password");
    const deviceInfos = await DeviceInfo.find();

    // Crear un mapa de deviceInfo por userId para búsqueda rápida
    const deviceInfoMap = deviceInfos.reduce((map, device) => {
      map[device.userId.toString()] = device;
      return map;
    }, {});

    // Combinar la información de usuarios con sus dispositivos
    const usersWithDeviceInfo = users.map((user) => {
      const deviceInfo = deviceInfoMap[user._id.toString()] || {};
      return {
        _id: user._id,
        name: user.firstName + " " + user.lastName,
        username: user.username,
        email: user.email,
        lastLogin: user.lastLogin,
        deviceInfo: {
          ip: deviceInfo.ip || "No disponible",
          browser: deviceInfo.browser || {
            name: "Desconocido",
            version: "Desconocido",
          },
          os: deviceInfo.os || { name: "Desconocido", version: "Desconocido" },
          device: deviceInfo.device || {
            type: "Desconocido",
            screen: "Desconocido",
          },
          language: deviceInfo.language || "No especificado",
          location: deviceInfo.location || {
            country: "Desconocido",
            city: "Desconocido",
            latitude: null,
            longitude: null,
            authorized: false,
          },
          connection: deviceInfo.connection || {
            type: "Desconocida",
            networkType: "Desconocido",
            saveData: false,
          },
          lastUpdate: deviceInfo.lastUpdate || null,
        },
      };
    });

    res.json(usersWithDeviceInfo);
  } catch (error) {
    console.error("Error al obtener información de dispositivos:", error);
    res.status(500).json({
      msg: "Error al obtener información de dispositivos",
      error: error.message,
    });
  }
});

// @route   GET /api/admin/device-info/:userId
// @desc    Obtener información detallada del dispositivo de un usuario específico
// @access  Private/Admin
router.get("/device-info/:userId", auth, adminAuth, async (req, res) => {
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

// @route   GET /api/admin/device-stats
// @desc    Obtener estadísticas generales de dispositivos
// @access  Private/Admin
router.get("/device-stats", auth, adminAuth, async (req, res) => {
  try {
    const devices = await DeviceInfo.find();

    const stats = {
      totalDevices: devices.length,
      browsers: {},
      operatingSystems: {},
      deviceTypes: {},
      locations: {},
      connectionTypes: {},
    };

    devices.forEach((device) => {
      // Contar navegadores
      const browserName = device.browser?.name || "unknown";
      stats.browsers[browserName] = (stats.browsers[browserName] || 0) + 1;

      // Contar sistemas operativos
      const osName = device.os?.name || "unknown";
      stats.operatingSystems[osName] =
        (stats.operatingSystems[osName] || 0) + 1;

      // Contar tipos de dispositivos
      const deviceType = device.device?.type || "unknown";
      stats.deviceTypes[deviceType] = (stats.deviceTypes[deviceType] || 0) + 1;

      // Contar ubicaciones
      const country = device.location?.country || "unknown";
      stats.locations[country] = (stats.locations[country] || 0) + 1;

      // Contar tipos de conexión
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

// @route   GET /api/admin/suspicious-activity
// @desc    Obtener lista de actividades sospechosas
// @access  Private/Admin
router.get("/suspicious-activity", auth, adminAuth, async (req, res) => {
  try {
    const suspiciousDevices = await DeviceInfo.find({
      $or: [
        { "securityFlags.suspiciousActivity": true },
        { "securityFlags.multipleIPs": true },
        { "securityFlags.unusualLocation": true },
      ],
    }).populate("userId", "firstName lastName email username");

    res.json(suspiciousDevices);
  } catch (error) {
    console.error("Error al obtener actividades sospechosas:", error);
    res.status(500).json({ msg: "Error del servidor" });
  }
});

module.exports = router;
