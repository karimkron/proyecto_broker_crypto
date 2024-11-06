const mongoose = require("mongoose");

const deviceInfoSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    ip: {
      type: String,
      default: "unknown",
    },
    browser: {
      name: {
        type: String,
        default: "unknown",
      },
      version: {
        type: String,
        default: "unknown",
      },
    },
    os: {
      name: {
        type: String,
        default: "unknown",
      },
      version: {
        type: String,
        default: "unknown",
      },
    },
    device: {
      type: {
        type: String,
        enum: ["desktop", "mobile", "tablet", "unknown"],
        default: "unknown",
      },
      screen: {
        type: String,
        default: "unknown",
      },
    },
    language: {
      type: String,
      default: "unknown",
    },
    location: {
      country: {
        type: String,
        default: "unknown",
      },
      city: {
        type: String,
        default: "unknown",
      },
      latitude: {
        type: Number,
        default: null,
      },
      longitude: {
        type: Number,
        default: null,
      },
      authorized: {
        type: Boolean,
        default: false,
      },
    },
    connection: {
      type: {
        type: String,
        default: "unknown",
      },
      networkType: {
        type: String,
        default: "unknown",
      },
      saveData: {
        type: Boolean,
        default: false,
      },
    },
    referrer: {
      type: String,
      default: "direct",
    },
    lastUpdate: {
      type: Date,
      default: Date.now,
    },
    sessions: [
      {
        loginTime: {
          type: Date,
          default: Date.now,
        },
        logoutTime: Date,
        duration: Number,
        ip: String,
        browser: String,
        os: String,
        device: String,
      },
    ],
    securityFlags: {
      suspiciousActivity: {
        type: Boolean,
        default: false,
      },
      multipleIPs: {
        type: Boolean,
        default: false,
      },
      unusualLocation: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Índices para mejor rendimiento
deviceInfoSchema.index({ userId: 1, lastUpdate: -1 });
deviceInfoSchema.index({ "location.country": 1 });
deviceInfoSchema.index({ "sessions.loginTime": -1 });

// Método para registrar una nueva sesión
deviceInfoSchema.methods.addSession = function (sessionData) {
  this.sessions.push({
    loginTime: new Date(),
    ip: sessionData.ip,
    browser: sessionData.browser,
    os: sessionData.os,
    device: sessionData.device,
  });
  return this.save();
};

// Método para cerrar la sesión actual
deviceInfoSchema.methods.closeCurrentSession = function () {
  if (this.sessions.length > 0) {
    const currentSession = this.sessions[this.sessions.length - 1];
    currentSession.logoutTime = new Date();
    currentSession.duration =
      currentSession.logoutTime - currentSession.loginTime;
    return this.save();
  }
};

// Método para verificar actividad sospechosa
deviceInfoSchema.methods.checkSuspiciousActivity = function () {
  const uniqueIPs = new Set(this.sessions.map((session) => session.ip));
  this.securityFlags.multipleIPs = uniqueIPs.size > 3;

  // Verificar cambios rápidos de ubicación
  if (this.sessions.length >= 2) {
    const lastTwoSessions = this.sessions.slice(-2);
    if (lastTwoSessions[0].ip !== lastTwoSessions[1].ip) {
      const timeDiff =
        lastTwoSessions[1].loginTime - lastTwoSessions[0].loginTime;
      this.securityFlags.unusualLocation = timeDiff < 3600000; // menos de 1 hora
    }
  }

  this.securityFlags.suspiciousActivity =
    this.securityFlags.multipleIPs || this.securityFlags.unusualLocation;

  return this.save();
};

// Middleware pre-save para actualizar lastUpdate
deviceInfoSchema.pre("save", function (next) {
  this.lastUpdate = new Date();
  next();
});

const DeviceInfo = mongoose.model("DeviceInfo", deviceInfoSchema);

module.exports = DeviceInfo;
