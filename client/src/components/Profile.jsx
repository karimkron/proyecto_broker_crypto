import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ChangePassword from "./ChangePassword";
import KYCForm from "./KYCForm";

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

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="profile">
      <h1>Perfil</h1>
      {user && (
        <div>
          <p>Nombre de usuario: {user.email.split("@")[0]}</p>
          <p>Email: {user.email}</p>
          <p>Cuenta creada: {new Date(user.date).toLocaleDateString()}</p>
          <button onClick={handleChangePassword}>
            {showChangePassword
              ? "Cancelar cambio de contraseña"
              : "Cambiar Contraseña"}
          </button>
          <button onClick={handleKYC}>
            {showKYCForm ? "Cancelar KYC" : "Realizar KYC"}
          </button>
          <button onClick={handleLogout}>Cerrar Sesión</button>

          {showChangePassword && <ChangePassword />}
          {showKYCForm && <KYCForm />}
        </div>
      )}
    </div>
  );
};

export default Profile;
