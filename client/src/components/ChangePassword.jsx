import React, { useState } from "react";
import "../styles/pages/ChangePassword.css";

const ChangePassword = () => {
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [message, setMessage] = useState("");

  const { currentPassword, newPassword, confirmNewPassword } = passwords;

  const onChange = (e) =>
    setPasswords({ ...passwords, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setMessage("Las nuevas contraseñas no coinciden");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/users/change-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ currentPassword, newPassword }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        setMessage("Contraseña cambiada exitosamente");
        setPasswords({
          currentPassword: "",
          newPassword: "",
          confirmNewPassword: "",
        });
      } else {
        setMessage(data.msg || "Error al cambiar la contraseña");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("Error en el servidor. Por favor, intenta de nuevo.");
    }
  };

  return (
    <div className="change-password">
      <h2>Cambiar Contraseña</h2>
      {message && (
        <p className={message.includes("exitosamente") ? "success" : "error"}>
          {message}
        </p>
      )}
      <form onSubmit={onSubmit}>
        <input
          type="password"
          name="currentPassword"
          value={currentPassword}
          onChange={onChange}
          placeholder="Contraseña actual"
          required
        />
        <input
          type="password"
          name="newPassword"
          value={newPassword}
          onChange={onChange}
          placeholder="Nueva contraseña"
          required
        />
        <input
          type="password"
          name="confirmNewPassword"
          value={confirmNewPassword}
          onChange={onChange}
          placeholder="Confirmar nueva contraseña"
          required
        />
        <button type="submit" className="btn-submit">
          Cambiar Contraseña
        </button>
      </form>
    </div>
  );
};

export default ChangePassword;
