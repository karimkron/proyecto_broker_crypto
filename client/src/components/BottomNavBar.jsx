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
import "./BottomNavBar.css";

const BottomNavBar = ({ userRole }) => {
  const location = useLocation();

  return (
    <nav className="bottom-nav">
      <Link to="/" className={location.pathname === "/" ? "active" : ""}>
        <AiFillHome />
        <span>Inicio</span>
      </Link>
      <Link
        to="/orders"
        className={location.pathname === "/orders" ? "active" : ""}
      >
        <AiOutlineFileText />
        <span>Órdenes</span>
      </Link>
      <Link
        to="/market"
        className={location.pathname === "/market" ? "active" : ""}
      >
        <AiOutlineBarChart />
        <span>Mercado</span>
      </Link>
      <Link
        to="/wallet"
        className={location.pathname === "/wallet" ? "active" : ""}
      >
        <AiOutlineWallet />
        <span>Cartera</span>
      </Link>
      <Link
        to="/profile"
        className={location.pathname === "/profile" ? "active" : ""}
      >
        <AiOutlineUser />
        <span>Perfil</span>
      </Link>
      {userRole === "admin" && (
        <Link
          to="/admin"
          className={location.pathname.startsWith("/admin") ? "active" : ""}
        >
          <AiOutlineSetting />
          <span>Admin</span>
        </Link>
      )}
    </nav>
  );
};

export default BottomNavBar;
