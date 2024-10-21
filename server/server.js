const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const cryptoRoutes = require("./routes/crypto");
const invitationCodesRoutes = require("./routes/invitationCodes");
const adminRoutes = require("./routes/adminRoutes");
const tradeRoutes = require("./routes/trade");
const userRoutes = require("./routes/users");
const kycRoutes = require("./routes/kyc");
const walletRoutes = require("./routes/walletRoutes");
const orderRoutes = require("./routes/orderRoutes");

const app = express();

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// Rutas
app.use("/api", cryptoRoutes);
app.use("/api/invitation-codes", invitationCodesRoutes);
app.use("/api/kyc", kycRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", walletRoutes);
app.use("/api/trades", tradeRoutes);
app.use("/api/orders", orderRoutes);

// Conectar a MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
