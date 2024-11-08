const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const geoip = require("geoip-lite");
require("dotenv").config();

const cryptoRoutes = require("./routes/crypto");
const invitationCodesRoutes = require("./routes/invitationCodes");
const adminRoutes = require("./routes/adminRoutes");
const tradeRoutes = require("./routes/trade");
const userRoutes = require("./routes/users");
const kycRoutes = require("./routes/kyc");
const walletRoutes = require("./routes/walletRoutes");
const orderRoutes = require("./routes/orderRoutes");
const exchangeRateRoutes = require("./routes/exchangeRateRoutes");
const deviceInfoMiddleware = require("./middleware/deviceInfo");
const auth = require("./middleware/auth");
const adminDeviceRoutes = require("./routes/adminDeviceRoutes");

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "Access-Control-Allow-Headers",
      "Access-Control-Allow-Origin",
      "Access-Control-Allow-Credentials",
    ],
  },
});

// Configuración mejorada de CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "Access-Control-Allow-Headers",
      "Access-Control-Allow-Origin",
      "Access-Control-Allow-Credentials",
    ],
  })
);

// Configuraciones adicionales para Express
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Configurar confianza en proxies
app.set("trust proxy", true);

// Headers de seguridad
app.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Origin",
    process.env.CLIENT_URL || "http://localhost:3000"
  );
  res.header("Access-Control-Allow-Credentials", true);
  res.header(
    "Access-Control-Allow-Methods",
    "GET,PUT,POST,DELETE,PATCH,OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Middleware para manejar errores de JSON malformado
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ message: "Invalid JSON" });
  }
  next();
});

// Rutas públicas (no requieren autenticación)
app.use("/api/users", userRoutes);

// Middleware de autenticación y deviceInfo
app.use((req, res, next) => {
  if (
    req.path.includes("/api/users/login") ||
    req.path.includes("/api/users/register") ||
    req.path.includes("/api/users/verify")
  ) {
    return next();
  }
  auth(req, res, next);
});
app.use(deviceInfoMiddleware);

// Rutas protegidas (requieren autenticación)
app.use("/api", cryptoRoutes);
app.use("/api", exchangeRateRoutes);
app.use("/api/invitation-codes", invitationCodesRoutes);
app.use("/api/kyc", kycRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", walletRoutes);
app.use("/api/trades", tradeRoutes(io));
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminDeviceRoutes);

// Socket.IO middleware y configuración
io.use((socket, next) => {
  if (socket.handshake.auth && socket.handshake.auth.token) {
    jwt.verify(
      socket.handshake.auth.token,
      process.env.JWT_SECRET,
      (err, decoded) => {
        if (err) return next(new Error("Authentication error"));
        socket.decoded = decoded;
        next();
      }
    );
  } else {
    next(new Error("Authentication error"));
  }
});

// Conexión MongoDB con manejo de errores mejorado
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Socket.IO connection handler
io.on("connection", (socket) => {
  const clientIp = socket.handshake.address;
  console.log(`New client connected: ${socket.id} from ${clientIp}`);

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });

  socket.on("error", (error) => {
    console.error(`Socket error from ${socket.id}:`, error);
  });
});

const PORT = process.env.PORT || 5000;

// Manejo de errores no capturados
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

// Inicio del servidor con manejo de errores
server
  .listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  })
  .on("error", (err) => {
    console.error("Server failed to start:", err);
    process.exit(1);
  });

module.exports = { app, io };
