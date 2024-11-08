import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/components/auth.css";

const Login = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [message, setMessage] = useState({ text: "", type: "error" });
  const [loading, setLoading] = useState(false);

  const { email, password } = formData;

  // Limpiar mensaje después de 5 segundos
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ text: "", type: "error" });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "error" });

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/users/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Verificar si el usuario está bloqueado
        if (data.user?.isBlocked) {
          setMessage({
            text: "Su cuenta ha sido bloqueada. Por favor, contacte con el administrador",
            type: "error",
          });
          return;
        }

        // Guardar token y rol
        localStorage.setItem("token", data.token);
        localStorage.setItem(
          "userRole",
          data.role === "admin" ? "admin" : "user"
        );

        // Configurar interceptor de axios para futuros requests
        axios.interceptors.response.use(
          (response) => response,
          (error) => {
            if (
              error.response?.status === 403 &&
              error.response?.data?.error === "USER_BLOCKED"
            ) {
              localStorage.removeItem("token");
              localStorage.removeItem("userRole");
              setIsAuthenticated(false);
              navigate("/login");
              setMessage({
                text: "Su cuenta ha sido bloqueada. Por favor, contacte con el administrador",
                type: "error",
              });
            }
            return Promise.reject(error);
          }
        );

        setIsAuthenticated(true);
        setMessage({ text: "Inicio de sesión exitoso", type: "success" });

        // Redireccionar según el rol
        navigate(data.role === "admin" ? "/admin" : "/");
      } else {
        // Manejar diferentes tipos de errores
        if (data.error === "ACCOUNT_BLOCKED") {
          setMessage({
            text: "Su cuenta ha sido bloqueada. Por favor, contacte con el administrador",
            type: "error",
          });
        } else {
          setMessage({
            text: data.msg || "Error en el inicio de sesión",
            type: "error",
          });
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage({
        text: "Error en el servidor. Por favor, intenta de nuevo.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    setIsAuthenticated(false);
    navigate("/login");
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Iniciar Sesión</h2>
          <p>Bienvenido de nuevo</p>
        </div>

        {message.text && (
          <div
            className={`auth-message ${
              message.type === "success" ? "success" : "error"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={onSubmit} className="auth-form">
          <div className="form-group">
            <input
              className="auth-input"
              type="email"
              placeholder="Correo electrónico"
              name="email"
              value={email}
              onChange={onChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <input
              className="auth-input"
              type="password"
              placeholder="Contraseña"
              name="password"
              value={password}
              onChange={onChange}
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? (
              <span className="loading-text">Iniciando sesión...</span>
            ) : (
              "Iniciar Sesión"
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            ¿No tienes una cuenta?{" "}
            <a href="/register" className="auth-link">
              Regístrate aquí
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
