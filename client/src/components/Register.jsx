import React, { useState } from "react";

const Register = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    invitationCode: "",
  });
  // Añade esta línea junto a tus otros estados, justo después de const [formData, setFormData] = useState({...});
  const [message, setMessage] = useState("");

  const { email, password, confirmPassword, invitationCode } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      // Mostrar mensaje de error si las contraseñas no coinciden
      setMessage("Las contraseñas no coinciden");
    } else {
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
          // Mostrar mensaje de éxito
          setMessage("Registro exitoso. Redirigiendo...");
          console.log("Registro exitoso", data);
          // Aquí podrías redirigir al usuario a la página de inicio de sesión o al dashboard
        } else {
          // Mostrar mensaje de error desde el servidor
          setMessage(`Error en el registro: ${data.msg}`);
        }
      } catch (error) {
        console.error("Error:", error);
        // Mostrar mensaje de error genérico
        setMessage("Error en el registro. Por favor, intenta de nuevo.");
      }
    }
  };
  return (
    <div className="register-container">
      <h2>Coin Switch</h2>
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
          placeholder="Su correo electrónico"
          name="email"
          value={email}
          onChange={onChange}
          required
        />
        <input
          type="password"
          placeholder="Longitud de contraseña 6 ~ 30"
          name="password"
          value={password}
          onChange={onChange}
          minLength="6"
          maxLength="30"
          required
        />
        <input
          type="password"
          placeholder="Ingrese para confirmar la contraseña"
          name="confirmPassword"
          value={confirmPassword}
          onChange={onChange}
          minLength="6"
          maxLength="30"
          required
        />
        <input
          type="text"
          placeholder="Ingrese el código de invitación"
          name="invitationCode"
          value={invitationCode}
          onChange={onChange}
          required
        />
        <button type="submit">Registro</button>
      </form>
      <p>
        ¿Cuenta existente? <a href="/login">Iniciar sesión ahora</a>
      </p>
    </div>
  );
};

export default Register;
