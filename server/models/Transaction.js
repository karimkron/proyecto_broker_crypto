const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: ["deposit", "withdraw", "send", "receive", "exchange"],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    required: true,
    enum: ["EUR", "USDT", "BTC", "ETH"],
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
  senderAddress: {
    type: String,
  },
  recipientAddress: {
    type: String,
  },
  txHash: {
    type: String,
  },
  description: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  exchangeDetails: {
    fromCurrency: String,
    toCurrency: String,
    rate: Number,
    fromAmount: Number,
    toAmount: Number,
  },
});

module.exports = mongoose.model("Transaction", transactionSchema);
