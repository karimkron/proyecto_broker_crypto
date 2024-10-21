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
  amount: {
    type: Number,
    required: true,
  },
  duration: {
    type: String,
    required: true,
  },
  estimatedProfit: {
    type: Number,
    required: true,
  },
  finalProfit: {
    type: Number,
  },
  status: {
    type: String,
    enum: ["en progreso", "completada", "cancelada"],
    default: "en progreso",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Order", orderSchema);