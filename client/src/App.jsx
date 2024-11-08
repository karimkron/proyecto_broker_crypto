import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useLocation,
} from "react-router-dom";

// Importación de estilos base
import "./styles/reset.css";
import "./styles/theme.css";
import "./styles/globals.css";
import "./styles/components/layout.css";

// Componentes
import BottomNavBar from "./components/BottomNavBar";
import Home from "./components/Home";
import Orders from "./components/Orders";
import Market from "./components/Market";
import CryptoDetail from "./components/CryptoDetail";
import Wallet from "./components/Wallet";
import Profile from "./components/Profile";
import Login from "./components/Login";
import Register from "./components/Register";
import AdminDashboard from "./components/AdminDashboard";

// Componente Loading
const LoadingScreen = () => (
  <div className="loading-screen">
    <div className="loading-spinner"></div>
    <p>Cargando...</p>
  </div>
);

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      const storedRole = localStorage.getItem("userRole");
      if (token) {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/api/users/verify`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (response.ok) {
            const data = await response.json();
            setIsAuthenticated(true);
            setUserRole(data.role || storedRole);
          } else {
            localStorage.removeItem("token");
            localStorage.removeItem("userRole");
          }
        } catch (error) {
          console.error("Error verifying token:", error);
          localStorage.removeItem("token");
          localStorage.removeItem("userRole");
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const PrivateRoute = ({ children, requiredRole = null }) => {
    if (loading) {
      return <LoadingScreen />;
    }
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
    if (requiredRole && userRole !== requiredRole) {
      return <Navigate to="/" />;
    }
    return children;
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <AppContent
        isAuthenticated={isAuthenticated}
        setIsAuthenticated={setIsAuthenticated}
        userRole={userRole}
        PrivateRoute={PrivateRoute}
      />
    </Router>
  );
}

function AppContent({
  isAuthenticated,
  setIsAuthenticated,
  userRole,
  PrivateRoute,
}) {
  const location = useLocation();
  const showNavBar = !location.pathname.startsWith("/crypto/");

  return (
    <div className="app-container">
      <main className="main-content">
        <Routes>
          <Route
            path="/login"
            element={<Login setIsAuthenticated={setIsAuthenticated} />}
          />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <PrivateRoute>
                <Orders />
              </PrivateRoute>
            }
          />
          <Route
            path="/market"
            element={
              <PrivateRoute>
                <Market />
              </PrivateRoute>
            }
          />
          <Route
            path="/crypto/:id"
            element={
              <PrivateRoute>
                <CryptoDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/wallet"
            element={
              <PrivateRoute>
                <Wallet />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile setIsAuthenticated={setIsAuthenticated} />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <PrivateRoute requiredRole="admin">
                <AdminDashboard />
              </PrivateRoute>
            }
          />
        </Routes>
      </main>
      {isAuthenticated && showNavBar && <BottomNavBar userRole={userRole} />}
    </div>
  );
}

export default App;
