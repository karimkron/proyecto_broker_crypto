import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useLocation,
} from "react-router-dom";
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
            "http://localhost:5000/api/users/verify",
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
      return <div>Cargando...</div>;
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
    return <div>Cargando...</div>;
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
    <div className="App">
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
      {isAuthenticated && showNavBar && <BottomNavBar userRole={userRole} />}
    </div>
  );
}

export default App;
