const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,

    required: true,
  },

  lastName: {
    type: String,

    required: true,
  },

  username: {
    type: String,

    required: true,

    unique: true,
  },

  email: {
    type: String,

    required: true,

    unique: true,
  },

  password: {
    type: String,

    required: true,
  },

  invitationCode: {
    type: String,
  },

  role: {
    type: String,

    enum: ["user", "admin"],

    default: "user",
  },

  balanceEUR: {
    type: Number,

    default: 0,
  },

  balanceUSDT: {
    type: Number,

    default: 0,
  },

  balanceBTC: {
    type: Number,

    default: 0,
  },

  balanceETH: {
    type: Number,

    default: 0,
  },

  transactions: [
    {
      type: mongoose.Schema.Types.ObjectId,

      ref: "Transaction",
    },
  ],

  tradingPercentages: {
    "30S": { type: Number, default: 30 },

    "60S": { type: Number, default: 40 },

    "120S": { type: Number, default: 60 },
  },

  allowProfits: {
    type: Boolean,

    default: false,
  },

  date: {
    type: Date,

    default: Date.now,
  },

  isBlocked: {
    type: Boolean,

    default: false,
  },

  kycStatus: {
    type: String,

    enum: ["not_submitted", "pending", "verified", "rejected"],

    default: "not_submitted",
  },

  kycVerificationDate: {
    type: Date,

    default: null,
  },

  kycSubmissionDate: {
    type: Date,

    default: null,
  },

  kycRejectionReason: {
    type: String,

    default: null,
  },
  walletAddress: {
    type: String,
    unique: true,
    sparse: true,
  },
  deviceInfo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DeviceInfo",
  },
});

module.exports = mongoose.model("User", userSchema);
