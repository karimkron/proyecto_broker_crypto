import React, { useState, useEffect } from "react";

const InvitationCodeManager = () => {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/invitation-codes",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setCodes(data);
      } else {
        throw new Error("Failed to fetch invitation codes");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateCode = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/invitation-codes/generate",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.ok) {
        const newCode = await response.json();
        setCodes((prevCodes) => [newCode, ...prevCodes]);
      } else {
        throw new Error("Failed to generate invitation code");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Gestión de Códigos de Invitación</h2>
      <button onClick={generateCode}>Generar Nuevo Código</button>
      <ul>
        {codes.map((code) => (
          <li key={code._id || code.code}>
            {code.code} - {code.isUsed ? "Usado" : "Disponible"}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default InvitationCodeManager;
