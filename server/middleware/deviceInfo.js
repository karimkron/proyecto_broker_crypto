const DeviceInfo = require("../models/DeviceInfo");
const geoip = require("geoip-lite");
const axios = require("axios");
const useragent = require("express-useragent");

const deviceInfoMiddleware = async (req, res, next) => {
  if (
    req.path.includes("/api/users/login") ||
    req.path.includes("/api/users/register") ||
    req.path.includes("/api/users/verify")
  ) {
    return next();
  }

  try {
    if (req.user && req.user.id) {
      // Obtener IP real
      let ip =
        req.headers["x-real-ip"] ||
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress;

      ip = ip ? ip.split(",")[0].trim() : "unknown";

      // Si es una IP local, obtener IP pública
      if (
        ip.includes("::1") ||
        ip.includes("127.0.0.1") ||
        ip.includes("localhost")
      ) {
        try {
          const response = await axios.get("https://api.ipify.org?format=json");
          ip = response.data.ip;
        } catch (error) {
          ip = "No disponible";
        }
      }

      // Parse user agent
      const source = req.headers["user-agent"];
      const userAgentInfo = useragent.parse(source);

      // Obtener geolocalización
      let locationInfo = null;
      try {
        // Primero intentar con geoip-lite
        const geo = geoip.lookup(ip);
        if (geo) {
          locationInfo = {
            country: geo.country,
            city: geo.city,
            latitude: geo.ll[0],
            longitude: geo.ll[1],
            authorized: true,
          };
        } else {
          // Backup con ipapi.co
          const response = await axios.get(`https://ipapi.co/${ip}/json/`);
          if (response.data) {
            locationInfo = {
              country: response.data.country_name,
              city: response.data.city,
              latitude: response.data.latitude,
              longitude: response.data.longitude,
              authorized: true,
            };
          }
        }
      } catch (error) {
        locationInfo = {
          country: "Desconocido",
          city: "Desconocido",
          latitude: null,
          longitude: null,
          authorized: false,
        };
      }

      // Detectar tipo de conexión
      const connectionInfo = {
        type: req.headers.connection || "unknown",
        networkType: req.headers["downlink"] ? "4g" : "unknown",
        saveData: req.headers["save-data"] === "on",
      };

      const deviceInfo = {
        userId: req.user.id,
        ip: ip,
        browser: {
          name: userAgentInfo.browser,
          version: userAgentInfo.version,
        },
        os: {
          name: userAgentInfo.os,
          version: userAgentInfo.osVersion,
        },
        device: {
          type: userAgentInfo.isMobile
            ? "mobile"
            : userAgentInfo.isTablet
            ? "tablet"
            : "desktop",
          screen: req.headers["sec-ch-viewport-width"]
            ? `${req.headers["sec-ch-viewport-width"]}x${req.headers["sec-ch-viewport-height"]}`
            : "unknown",
        },
        language: req.headers["accept-language"]?.split(",")[0] || "unknown",
        location: locationInfo,
        connection: connectionInfo,
        referrer: req.headers.referer || "direct",
        lastUpdate: new Date(),
      };

      await DeviceInfo.findOneAndUpdate(
        { userId: req.user.id },
        { $set: deviceInfo },
        { upsert: true, new: true }
      );
    }
  } catch (error) {
    // Error silencioso para no interrumpir el flujo
  }
  next();
};

module.exports = deviceInfoMiddleware;
