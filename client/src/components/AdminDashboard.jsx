import React, { useState, useEffect } from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUsers,
  FaKey,
  FaChartLine,
  FaMoneyBillWave,
  FaTachometerAlt,
  FaBars,
  FaTimes,
  FaBell,
  FaUserCircle,
  FaCog,
  FaChevronRight,
  FaDesktop,
} from "react-icons/fa";
import UserManagement from "./AdminComponents/UserManagement";
import InvitationCodeManager from "./AdminComponents/InvitationCodeManager";
import MarketManipulation from "./AdminComponents/MarketManipulation";
import DepositForm from "./AdminComponents/DepositForm";
import withAdminAuth from "./withAdminAuth.jsx";
import "../styles/pages/AdminDashboard.css";
import UserDeviceInfo from "./AdminComponents/UserDeviceInfo";

const AdminDashboard = () => {
  const location = useLocation();
  const baseUrl = "/admin";
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    if (isMobile) {
      setMenuOpen(false);
    }
  };

  const navItems = [
    {
      path: "users",
      icon: FaUsers,
      text: "Gestión de Usuarios",
      description: "Administrar usuarios y permisos",
    },
    {
      path: "invitation-codes",
      icon: FaKey,
      text: "Códigos de Invitación",
      description: "Generar y gestionar códigos",
    },
    {
      path: "market",
      icon: FaChartLine,
      text: "Manipulación del Mercado",
      description: "Control de precios y tendencias",
    },
    {
      path: "deposit",
      icon: FaMoneyBillWave,
      text: "Ingresar Dinero",
      description: "Gestionar depósitos y retiros",
    },
    {
      path: "device-info",
      icon: FaDesktop, // Necesitarás importar FaDesktop de react-icons/fa
      text: "Info. Dispositivos",
      description: "Detalles de conexión y dispositivos",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="admin-dashboard"
    >
      <motion.header
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        className="dashboard-header"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="menu-toggle"
          onClick={toggleMenu}
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </motion.button>
        <motion.div className="header-brand" whileHover={{ scale: 1.05 }}>
          <FaTachometerAlt />
          <span>Panel de Administración</span>
        </motion.div>
        <div className="header-actions">
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="header-icon"
          >
            <FaBell />
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="notification-badge"
            >
              3
            </motion.span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="header-icon"
          >
            <FaCog />
          </motion.button>
          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="admin-profile"
          >
            <FaUserCircle />
            <span className="admin-name">Admin</span>
          </motion.div>
        </div>
      </motion.header>

      <div className={`dashboard-container ${menuOpen ? "menu-open" : ""}`}>
        <AnimatePresence>
          <motion.nav
            initial={isMobile ? { x: -280 } : false}
            animate={isMobile ? { x: menuOpen ? 0 : -280 } : false}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className={`dashboard-nav ${menuOpen ? "open" : ""}`}
          >
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = location.pathname === `${baseUrl}/${item.path}`;
              return (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  key={item.path}
                >
                  <Link
                    to={`${baseUrl}/${item.path}`}
                    className={`nav-item ${isActive ? "active" : ""}`}
                    onClick={closeMenu}
                  >
                    <Icon className="nav-icon" />
                    <div className="nav-text">
                      <span className="nav-title">{item.text}</span>
                      <span className="nav-description">
                        {item.description}
                      </span>
                    </div>
                    <motion.div
                      animate={{ x: isActive ? 5 : 0 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <FaChevronRight size={12} />
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.nav>
        </AnimatePresence>

        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="dashboard-main"
        >
          <div className="dashboard-content">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="content-header"
            >
              <h1>
                {navItems.find((item) => location.pathname.includes(item.path))
                  ?.text || "Dashboard"}
              </h1>
              <div className="breadcrumb">
                Admin /{" "}
                {navItems.find((item) => location.pathname.includes(item.path))
                  ?.text || "Dashboard"}
              </div>
            </motion.div>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Routes>
                  <Route path="users" element={<UserManagement />} />
                  <Route
                    path="invitation-codes"
                    element={<InvitationCodeManager />}
                  />
                  <Route path="market" element={<MarketManipulation />} />
                  <Route path="deposit" element={<DepositForm />} />
                  <Route path="device-info" element={<UserDeviceInfo />} />{" "}
                  {/* Nueva ruta */}
                </Routes>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.main>
      </div>
    </motion.div>
  );
};

export default withAdminAuth(AdminDashboard);
