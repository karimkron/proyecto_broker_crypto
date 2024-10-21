import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");

  const { email, password } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
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
    }
  };

  return (
    <div className="login-container">
      <h2>Iniciar Sesión</h2>
      {message && (
        <div
          className={`message ${
            message.includes("exitoso") ? "success" : "error"
          }`}
        >
          {message}
        </div>
      )}
      <form onSubmit={onSubmit}>
        <input
          type="email"
          placeholder="Correo electrónico"
          name="email"
          value={email}
          onChange={onChange}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          name="password"
          value={password}
          onChange={onChange}
          required
        />
        <button type="submit">Iniciar Sesión</button>
      </form>
      <p>
        ¿No tienes una cuenta? <a href="/register">Regístrate aquí</a>
      </p>
    </div>
  );
};

export default Login;
