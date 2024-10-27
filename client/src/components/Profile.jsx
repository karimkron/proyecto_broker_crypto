import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ChangePassword from "./ChangePassword";
import KYCForm from "./KYCForm";
import {
  FaUser,
  FaEnvelope,
  FaCalendar,
  FaLock,
  FaIdCard,
  FaSignOutAlt,
  FaChartLine,
  FaCheckCircle,
  FaMedal,
  FaHistory,
  FaClock,
} from "react-icons/fa";
import "../styles/pages/Profile.css";

const Profile = ({ setIsAuthenticated }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showKYCForm, setShowKYCForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await fetch("http://localhost:5000/api/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          throw new Error("Failed to fetch user data");
        }
      } catch (err) {
        setError("Error al cargar los datos del usuario");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    navigate("/login");
  };

  const handleChangePassword = () => {
    setShowChangePassword(!showChangePassword);
    setShowKYCForm(false);
  };

  const handleKYC = () => {
    setShowKYCForm(!showKYCForm);
    setShowChangePassword(false);
  };

  if (loading)
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="loading"
      >
        <FaClock size={24} className="loading-icon" />
      </motion.div>
    );

  if (error)
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="error"
      >
        {error}
      </motion.div>
    );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="profile-container"
    >
      <motion.div
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        className="profile-header"
      >
        <div className="header-content">
          <h1>¡Hola de nuevo, {user?.firstName}!</h1>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="logout-button"
          onClick={handleLogout}
        >
          <FaSignOutAlt /> Cerrar Sesión
        </motion.button>
      </motion.div>

      {user && (
        <div className="profile-content">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="profile-info"
          >
            <motion.div className="info-item">
              <FaUser className="icon" />
              <div>
                <strong>Nombre Completo</strong>
                <p>{`${user.firstName} ${user.lastName}`}</p>
              </div>
              <span className="verified-badge">
                <FaCheckCircle /> Verificado
              </span>
            </motion.div>

            <motion.div className="info-item">
              <FaUser className="icon" />
              <div>
                <strong>Usuario</strong>
                <p>{user.email.split("@")[0]}</p>
              </div>
            </motion.div>

            <motion.div className="info-item">
              <FaEnvelope className="icon" />
              <div>
                <strong>Email</strong>
                <p>{user.email}</p>
              </div>
            </motion.div>

            <motion.div className="info-item">
              <FaCalendar className="icon" />
              <div>
                <strong>Fecha de Registro</strong>
                <p>{new Date(user.date).toLocaleDateString()}</p>
              </div>
            </motion.div>

            <motion.div className="info-item">
              <FaChartLine className="icon" />
              <div>
                <strong>Nivel de Trader</strong>
                <p>Profesional</p>
              </div>
              <span className="level-badge">
                <FaMedal /> Pro
              </span>
            </motion.div>

            <motion.div className="info-item">
              <FaHistory className="icon" />
              <div>
                <strong>Total de Operaciones</strong>
                <p>127 trades</p>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="profile-actions"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="action-button"
              onClick={handleChangePassword}
            >
              <FaLock className="icon" />
              {showChangePassword ? "Cancelar" : "Cambiar Contraseña"}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="action-button"
              onClick={handleKYC}
            >
              <FaIdCard className="icon" />
              {showKYCForm ? "Cancelar KYC" : "Realizar KYC"}
            </motion.button>
          </motion.div>

          <AnimatePresence>
            {(showChangePassword || showKYCForm) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="profile-forms"
              >
                {showChangePassword && <ChangePassword />}
                {showKYCForm && <KYCForm />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

export default Profile;
