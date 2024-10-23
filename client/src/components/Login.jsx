import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/components/auth.css";

const Login = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const { email, password } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("token", data.token);
        if (data.role === "admin") {
          localStorage.setItem("userRole", "admin");
        } else {
          localStorage.setItem("userRole", "user");
        }
        setIsAuthenticated(true);
        navigate(data.role === "admin" ? "/admin" : "/");
      } else {
        setMessage(data.msg || "Error en el inicio de sesión");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("Error en el servidor. Por favor, intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Iniciar Sesión</h2>
          <p>Bienvenido de nuevo</p>
        </div>

        {message && (
          <div
            className={`auth-message ${
              message.includes("exitoso") ? "success" : "error"
            }`}
          >
            {message}
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
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
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
