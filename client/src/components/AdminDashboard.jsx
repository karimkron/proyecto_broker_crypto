import React, { useState, useEffect } from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
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
} from "react-icons/fa";
import UserManagement from "./AdminComponents/UserManagement";
import InvitationCodeManager from "./AdminComponents/InvitationCodeManager";
import MarketManipulation from "./AdminComponents/MarketManipulation";
import DepositForm from "./AdminComponents/DepositForm";
import withAdminAuth from "./withAdminAuth.jsx";
import "./AdminDashboard.css";

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
  ];

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <button className="menu-toggle" onClick={toggleMenu}>
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
        <div className="header-brand">
          <FaTachometerAlt />
          <span>Admin Panel</span>
        </div>
        <div className="header-actions">
          <button className="header-icon">
            <FaBell />
            <span className="notification-badge">3</span>
          </button>
          <button className="header-icon">
            <FaCog />
          </button>
          <div className="admin-profile">
            <FaUserCircle />
            <span className="admin-name">Admin</span>
          </div>
        </div>
      </header>

      <div className={`dashboard-container ${menuOpen ? "menu-open" : ""}`}>
        <nav className={`dashboard-nav ${menuOpen ? "open" : ""}`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === `${baseUrl}/${item.path}`;
            return (
              <Link
                key={item.path}
                to={`${baseUrl}/${item.path}`}
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={closeMenu}
              >
                <Icon className="nav-icon" />
                <div className="nav-text">
                  <span className="nav-title">{item.text}</span>
                  <span className="nav-description">{item.description}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <main className="dashboard-main">
          <div className="dashboard-content">
            <div className="content-header">
              <h1>
                {navItems.find((item) => location.pathname.includes(item.path))
                  ?.text || "Dashboard"}
              </h1>
              <div className="breadcrumb">
                Admin /{" "}
                {navItems.find((item) => location.pathname.includes(item.path))
                  ?.text || "Dashboard"}
              </div>
            </div>
            <Routes>
              <Route path="users" element={<UserManagement />} />
              <Route
                path="invitation-codes"
                element={<InvitationCodeManager />}
              />
              <Route path="market" element={<MarketManipulation />} />
              <Route path="deposit" element={<DepositForm />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default withAdminAuth(AdminDashboard);
