import React from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import UserManagement from "./AdminComponents/UserManagement";
import InvitationCodeManager from "./AdminComponents/InvitationCodeManager";
import MarketManipulation from "./AdminComponents/MarketManipulation";
import DepositForm from "./AdminComponents/DepositForm";
import withAdminAuth from "./withAdminAuth.jsx";

const AdminDashboard = () => {
  const location = useLocation();
  const baseUrl = "/admin";

  return (
    <div className="admin-dashboard">
      <h1>Panel de Administración</h1>
      <nav>
        <ul>
          <li>
            <Link to={`${baseUrl}/users`}>Gestión de Usuarios</Link>
          </li>
          <li>
            <Link to={`${baseUrl}/invitation-codes`}>
              Códigos de Invitación
            </Link>
          </li>
          <li>
            <Link to={`${baseUrl}/market`}>Manipulación del Mercado</Link>
          </li>
          <li>
            <Link to={`${baseUrl}/deposit`}>Ingresar Dinero</Link>
          </li>
        </ul>
      </nav>

      <Routes>
        <Route path="users" element={<UserManagement />} />
        <Route path="invitation-codes" element={<InvitationCodeManager />} />
        <Route path="market" element={<MarketManipulation />} />
        <Route path="deposit" element={<DepositForm />} />
      </Routes>
    </div>
  );
};

export default withAdminAuth(AdminDashboard);
