const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,

    ref: "User",

    required: true,
  },

  cryptoSymbol: {
    type: String,

    required: true,
  },

  orderType: {
    type: String,

    enum: ["buy", "sell"],

    required: true,
  },

  amount: {
    type: Number,

    required: true,
  },

  duration: {
    type: String,

    enum: ["30S", "60S", "120S"],

    required: true,
  },

  initialPrice: {
    type: Number,

    required: true,
  },

  targetPrice: {
    type: Number,

    required: true,
  },

  finalPrice: {
    type: Number,
  },

  profitPercentage: {
    type: Number,

    required: true,
  },

  status: {
    type: String,

    enum: ["en progreso", "completada", "cancelada"],

    default: "en progreso",
  },

  result: {
    type: Number,
  },

  createdAt: {
    type: Date,

    default: Date.now,
  },

  completedAt: {
    type: Date,
  },
  willProfit: {
    type: Boolean,
    required: true,
  },
});

module.exports = mongoose.model("Order", orderSchema);
