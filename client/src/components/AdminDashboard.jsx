import React, { useState, useEffect } from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUsers,
  FaKey,
  FaChartLine,
  FaMoneyBillWave,
  FaDesktop,
  FaBars,
  FaTimes,
  FaChevronRight,
  FaTachometerAlt,
} from "react-icons/fa";
import UserManagement from "./AdminComponents/UserManagement";
import InvitationCodeManager from "./AdminComponents/InvitationCodeManager";
import MarketManipulation from "./AdminComponents/MarketManipulation";
import DepositForm from "./AdminComponents/DepositForm";
import UserDeviceInfo from "./AdminComponents/UserDeviceInfo";
import withAdminAuth from "./withAdminAuth.jsx";
import "../styles/pages/AdminDashboard.css";

const AdminDashboard = () => {
  const location = useLocation();
  const baseUrl = "/admin";
  const [menuOpen, setMenuOpen] = useState(false);

  // Cerrar menú al cambiar de ruta
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    {
      path: "dashboard",
      icon: FaTachometerAlt,
      text: "Dashboard",
      description: "Panel principal",
      gradient: "blue",
    },
    {
      path: "users",
      icon: FaUsers,
      text: "Usuarios",
      description: "Gestión de usuarios",
      gradient: "purple",
    },
    {
      path: "invitation-codes",
      icon: FaKey,
      text: "Códigos",
      description: "Códigos de invitación",
      gradient: "green",
    },
    {
      path: "market",
      icon: FaChartLine,
      text: "Mercado",
      description: "Control de mercado",
      gradient: "gold",
    },
    {
      path: "deposit",
      icon: FaMoneyBillWave,
      text: "Finanzas",
      description: "Gestión financiera",
      gradient: "orange",
    },
    {
      path: "device-info",
      icon: FaDesktop,
      text: "Dispositivos",
      description: "Info dispositivos",
      gradient: "cyan",
    },
  ];

  const currentItem =
    navItems.find((item) => location.pathname.includes(item.path)) ||
    navItems[0];

  // Animaciones para los componentes
  const pageTransition = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 },
  };

  return (
    <div className="adm-dashboard">
      {/* Header */}
      <header className="adm-header">
        <div className="adm-header-content">
          <div className="adm-section-title">
            <span className={`adm-title-icon gradient-${currentItem.gradient}`}>
              <currentItem.icon />
            </span>
            <h1>{currentItem.text}</h1>
          </div>

          <motion.button
            className="adm-menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {menuOpen ? <FaTimes /> : <FaBars />}
          </motion.button>
        </div>
      </header>

      {/* Navigation Overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="adm-nav-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Side Navigation */}
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            className="adm-nav"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", bounce: 0, duration: 0.5 }}
          >
            <div className="adm-nav-header">
              <h2>Panel de Control</h2>
            </div>

            <div className="adm-nav-items">
              {navItems.map((item, index) => {
                const isActive = location.pathname.includes(item.path);
                return (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      to={`${baseUrl}/${item.path}`}
                      className={`adm-nav-item ${
                        isActive ? "active" : ""
                      } gradient-${item.gradient}`}
                    >
                      <span className="adm-nav-icon">
                        <item.icon />
                      </span>
                      <div className="adm-nav-text">
                        <span className="adm-nav-title">{item.text}</span>
                        <span className="adm-nav-description">
                          {item.description}
                        </span>
                      </div>
                      <motion.span
                        className="adm-nav-arrow"
                        animate={{ x: isActive ? 5 : 0 }}
                      >
                        <FaChevronRight />
                      </motion.span>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={`adm-main ${menuOpen ? "blur" : ""}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            className="adm-content"
            {...pageTransition}
          >
            <Routes>
              <Route path="dashboard" element={<div>Dashboard</div>} />
              <Route path="users" element={<UserManagement />} />
              <Route
                path="invitation-codes"
                element={<InvitationCodeManager />}
              />
              <Route path="market" element={<MarketManipulation />} />
              <Route path="deposit" element={<DepositForm />} />
              <Route path="device-info" element={<UserDeviceInfo />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default withAdminAuth(AdminDashboard);
