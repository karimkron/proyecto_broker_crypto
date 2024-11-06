import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaDesktop,
  FaUser,
  FaEnvelope,
  FaGlobe,
  FaNetworkWired,
  FaSearch,
  FaLanguage,
  FaMapMarkerAlt,
  FaChrome,
  FaWindows,
  FaApple,
  FaLinux,
  FaAndroid,
  FaMobile,
  FaSync,
  FaExclamationTriangle,
  FaLocationArrow,
} from "react-icons/fa";

import "./UserDeviceInfo.css";

const UserDeviceInfo = () => {
  const [usersInfo, setUsersInfo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);

  const handleLocationRequest = async () => {
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/admin/update-location",
        {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setLocationPermission(true);
      await fetchUsersDeviceInfo();
    } catch (error) {
      console.error("Error getting location:", error);
      setLocationPermission(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchUsersDeviceInfo();
    } catch (error) {
      console.error("Error refreshing data:", error);
      setError("Error al actualizar los datos");
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  const fetchUsersDeviceInfo = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/api/admin/users-device-info",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUsersInfo(response.data);
      setLoading(false);

      // Verificar si necesitamos solicitar ubicación
      if (!locationPermission) {
        const currentUser = response.data.find(
          (user) => user.deviceInfo?.location?.latitude === null
        );
        if (currentUser) {
          await handleLocationRequest();
        }
      }
    } catch (error) {
      console.error("Error fetching users device info:", error);
      setError("Error al cargar la información de dispositivos");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersDeviceInfo();
  }, []);

  const filteredUsers = usersInfo.filter(
    (user) =>
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDeviceInfo = (deviceInfo) => {
    if (!deviceInfo) return "Desconocido";

    const browserName =
      typeof deviceInfo.browser === "object"
        ? deviceInfo.browser.name
        : deviceInfo.browser || "Desconocido";

    const osName =
      typeof deviceInfo.os === "object"
        ? deviceInfo.os.name
        : deviceInfo.os || "Desconocido";

    return `${browserName} / ${osName}`;
  };

  const formatLocation = (location) => {
    if (!location) return "No disponible";
    if (location.latitude === null || location.longitude === null) {
      return "Ubicación no autorizada";
    }
    return `${location.city || "Ciudad desconocida"}, ${
      location.country || "País desconocido"
    }`;
  };

  return (
    <div className="wallet-container">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="wallet-header"
      >
        <div className="header-content">
          <div className="title-section">
            <h1>Información de Dispositivos</h1>
            <p className="subtitle">Monitoreo de Conexiones</p>
          </div>
          <div className="header-actions">
            <div className="search-bar">
              <FaSearch />
              <input
                type="text"
                placeholder="Buscar usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="refresh-button"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <FaSync className={isRefreshing ? "spinning" : ""} />
            </motion.button>
            {!locationPermission && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="location-button"
                onClick={handleLocationRequest}
              >
                <FaLocationArrow />
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      <div className="assets-grid">
        <AnimatePresence>
          {loading ? (
            <div className="loading">Cargando...</div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : filteredUsers.length === 0 ? (
            <div className="no-results">No se encontraron resultados</div>
          ) : (
            filteredUsers.map((user, index) => (
              <motion.div
                key={user._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.1 }}
                className="asset-card"
              >
                <div className="asset-card-header">
                  <FaUser className="currency-icon" />
                  <div className="user-info">
                    <h3>{user.name || "Usuario"}</h3>
                    <span className="username">@{user.username}</span>
                  </div>
                </div>

                <div className="asset-card-body">
                  <div className="info-grid">
                    <div className="info-item">
                      <FaEnvelope />
                      <div>
                        <span className="detail-label">Email</span>
                        <span className="detail-value">{user.email}</span>
                      </div>
                    </div>

                    <div className="info-item">
                      <FaGlobe />
                      <div>
                        <span className="detail-label">IP</span>
                        <span className="detail-value">
                          {user.deviceInfo?.ip || "No disponible"}
                        </span>
                      </div>
                    </div>

                    <div className="info-item">
                      <FaDesktop />
                      <div>
                        <span className="detail-label">Dispositivo</span>
                        <span className="detail-value">
                          {getDeviceInfo(user.deviceInfo)}
                        </span>
                      </div>
                    </div>

                    <div className="info-item">
                      <FaLanguage />
                      <div>
                        <span className="detail-label">Idioma</span>
                        <span className="detail-value">
                          {user.deviceInfo?.language || "No especificado"}
                        </span>
                      </div>
                    </div>

                    <div className="info-item">
                      <FaNetworkWired />
                      <div>
                        <span className="detail-label">Conexión</span>
                        <span className="detail-value">
                          {user.deviceInfo?.connection?.type || "Desconocida"}
                        </span>
                      </div>
                    </div>

                    <div className="info-item">
                      <FaMapMarkerAlt />
                      <div>
                        <span className="detail-label">Ubicación</span>
                        <span className="detail-value">
                          {formatLocation(user.deviceInfo?.location)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="last-connection">
                  <span>
                    Última conexión: {new Date(user.lastLogin).toLocaleString()}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default UserDeviceInfo;
