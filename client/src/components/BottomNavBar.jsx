import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  AiFillHome,
  AiOutlineFileText,
  AiOutlineBarChart,
  AiOutlineWallet,
  AiOutlineUser,
  AiOutlineSetting,
} from "react-icons/ai";
import "../styles/components/navigation.css";

const BottomNavBar = ({ userRole }) => {
  const location = useLocation();

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bottom-nav">
      <Link to="/" className={`nav-link ${isActive("/") ? "active" : ""}`}>
        <AiFillHome />
        <span>Inicio</span>
      </Link>

      <Link
        to="/orders"
        className={`nav-link ${isActive("/orders") ? "active" : ""}`}
      >
        <AiOutlineFileText />
        <span>Órdenes</span>
      </Link>

      <Link
        to="/market"
        className={`nav-link ${isActive("/market") ? "active" : ""}`}
      >
        <AiOutlineBarChart />
        <span>Mercado</span>
      </Link>

      <Link
        to="/wallet"
        className={`nav-link ${isActive("/wallet") ? "active" : ""}`}
      >
        <AiOutlineWallet />
        <span>Cartera</span>
      </Link>

      <Link
        to="/profile"
        className={`nav-link ${isActive("/profile") ? "active" : ""}`}
      >
        <AiOutlineUser />
        <span>Perfil</span>
      </Link>

      {userRole === "admin" && (
        <Link
          to="/admin"
          className={`nav-link admin ${isActive("/admin") ? "active" : ""}`}
        >
          <AiOutlineSetting />
          <span>Admin</span>
        </Link>
      )}
    </nav>
  );
};

export default BottomNavBar;
