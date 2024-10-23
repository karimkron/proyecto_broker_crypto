import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/components/auth.css";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    invitationCode: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const { email, password, confirmPassword, invitationCode } = formData;

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
        body: JSON.stringify({ email, password, invitationCode }),
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
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Coin Switch</h2>
          <p>Crea tu cuenta</p>
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
              placeholder="Su correo electrónico"
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
              placeholder="Longitud de contraseña 6 ~ 30"
              name="password"
              value={password}
              onChange={onChange}
              minLength="6"
              maxLength="30"
              required
            />
          </div>

          <div className="form-group">
            <input
              className="auth-input"
              type="password"
              placeholder="Ingrese para confirmar la contraseña"
              name="confirmPassword"
              value={confirmPassword}
              onChange={onChange}
              minLength="6"
              maxLength="30"
              required
            />
          </div>

          <div className="form-group">
            <input
              className="auth-input"
              type="text"
              placeholder="Ingrese el código de invitación"
              name="invitationCode"
              value={invitationCode}
              onChange={onChange}
              required
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Registrando..." : "Registrarse"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            ¿Ya tienes una cuenta?{" "}
            <a href="/login" className="auth-link">
              Iniciar sesión
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
