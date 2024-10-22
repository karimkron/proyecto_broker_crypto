import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
} from "react-icons/fa";
import "./Profile.css";

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
        setError("Error fetching user data");
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

  if (loading) return <div className="loading">Cargando...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Perfil del Trader</h1>
        <button className="logout-button" onClick={handleLogout}>
          <FaSignOutAlt /> Cerrar Sesión
        </button>
      </div>
      {user && (
        <div className="profile-content">
          <div className="profile-info">
            <div className="info-item">
              <FaUser className="icon" />
              <p>
                <strong>Usuario:</strong> {user.email.split("@")[0]}
              </p>
            </div>
            <div className="info-item">
              <FaEnvelope className="icon" />
              <p>
                <strong>Email:</strong> {user.email}
              </p>
            </div>
            <div className="info-item">
              <FaCalendar className="icon" />
              <p>
                <strong>Cuenta creada:</strong>{" "}
                {new Date(user.date).toLocaleDateString()}
              </p>
            </div>
            <div className="info-item">
              <FaChartLine className="icon" />
              <p>
                <strong>Nivel de Trader:</strong> Profesional
              </p>
            </div>
          </div>
          <div className="profile-actions">
            <button className="action-button" onClick={handleChangePassword}>
              <FaLock className="icon" />
              {showChangePassword ? "Cancelar" : "Cambiar Contraseña"}
            </button>
            <button className="action-button" onClick={handleKYC}>
              <FaIdCard className="icon" />
              {showKYCForm ? "Cancelar KYC" : "Realizar KYC"}
            </button>
          </div>
          <div className="profile-forms">
            {showChangePassword && <ChangePassword />}
            {showKYCForm && <KYCForm />}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
