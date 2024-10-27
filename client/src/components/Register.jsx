import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaKey,
  FaUserCircle,
  FaIdCard,
} from "react-icons/fa";
import "../styles/components/auth.css";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    invitationCode: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    username,
    firstName,
    lastName,
    email,
    password,
    confirmPassword,
    invitationCode,
  } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (password !== confirmPassword) {
      setMessage("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          firstName,
          lastName,
          email,
          password,
          invitationCode,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Registro exitoso. Redirigiendo...");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setMessage(`Error en el registro: ${data.msg}`);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("Error en el registro. Por favor, intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="auth-container"
    >
      <motion.div initial={{ y: -20 }} animate={{ y: 0 }} className="auth-card">
        <div className="auth-header">
          <h2>Coin Switch</h2>
          <p>Crea tu cuenta</p>
        </div>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`auth-message ${
              message.includes("exitoso") ? "success" : "error"
            }`}
          >
            {message}
          </motion.div>
        )}

        <form onSubmit={onSubmit} className="auth-form">
          <div className="form-group">
            <div className="input-icon-wrapper">
              <FaUserCircle className="input-icon" />
              <input
                className="auth-input"
                type="text"
                placeholder="     Nombre de usuario"
                name="username"
                value={username}
                onChange={onChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="input-icon-wrapper">
              <FaIdCard className="input-icon" />
              <input
                className="auth-input"
                type="text"
                placeholder="     Nombre"
                name="firstName"
                value={firstName}
                onChange={onChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="input-icon-wrapper">
              <FaIdCard className="input-icon" />
              <input
                className="auth-input"
                type="text"
                placeholder="     Apellido"
                name="lastName"
                value={lastName}
                onChange={onChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="input-icon-wrapper">
              <FaEnvelope className="input-icon" />
              <input
                className="auth-input"
                type="email"
                placeholder="     Su correo electrónico"
                name="email"
                value={email}
                onChange={onChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="input-icon-wrapper">
              <FaLock className="input-icon" />
              <input
                className="auth-input"
                type="password"
                placeholder="     Longitud de contraseña 6 ~ 30"
                name="password"
                value={password}
                onChange={onChange}
                minLength="6"
                maxLength="30"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="input-icon-wrapper">
              <FaLock className="input-icon" />
              <input
                className="auth-input"
                type="password"
                placeholder="     Ingrese para confirmar la contraseña"
                name="confirmPassword"
                value={confirmPassword}
                onChange={onChange}
                minLength="6"
                maxLength="30"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="input-icon-wrapper">
              <FaKey className="input-icon" />
              <input
                className="auth-input"
                type="text"
                placeholder="     Ingrese el código de invitación"
                name="invitationCode"
                value={invitationCode}
                onChange={onChange}
                required
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? "Registrando..." : "Registrarse"}
          </motion.button>
        </form>

        <div className="auth-footer">
          <p>
            ¿Ya tienes una cuenta?{" "}
            <motion.a
              whileHover={{ scale: 1.05 }}
              href="/login"
              className="auth-link"
            >
              Iniciar sesión
            </motion.a>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Register;
