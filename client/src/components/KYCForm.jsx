import React, { useState } from "react";

const KYCForm = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    address: "",
    idNumber: "",
  });
  const [files, setFiles] = useState({
    frontId: null,
    backId: null,
    selfieWithId: null,
    addressProof: null,
  });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFiles({ ...files, [e.target.name]: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach((key) => data.append(key, formData[key]));
    Object.keys(files).forEach((key) => data.append(key, files[key]));

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/kyc", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: data,
      });
      const result = await response.json();
      if (response.ok) {
        setMessage("Información de KYC enviada con éxito");
      } else {
        setMessage(result.msg || "Error al enviar la información de KYC");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage(
        "Error al enviar la información. Por favor, intente de nuevo."
      );
    }
  };

  return (
    <div className="kyc-form">
      <h2>Formulario KYC</h2>
      {message && (
        <p className={message.includes("éxito") ? "success" : "error"}>
          {message}
        </p>
      )}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          placeholder="Nombre completo"
          required
        />
        <input
          type="date"
          name="dateOfBirth"
          value={formData.dateOfBirth}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="Dirección"
          required
        />
        <input
          type="text"
          name="idNumber"
          value={formData.idNumber}
          onChange={handleChange}
          placeholder="Número de DNI/NIE"
          required
        />

        <label>DNI/NIE (Frente):</label>
        <input
          type="file"
          name="frontId"
          onChange={handleFileChange}
          required
        />

        <label>DNI/NIE (Reverso):</label>
        <input type="file" name="backId" onChange={handleFileChange} required />

        <label>Selfie con DNI/NIE:</label>
        <input
          type="file"
          name="selfieWithId"
          onChange={handleFileChange}
          required
        />

        <label>Comprobante de domicilio:</label>
        <input
          type="file"
          name="addressProof"
          onChange={handleFileChange}
          required
        />

        <button type="submit">Enviar información KYC</button>
      </form>
    </div>
  );
};

export default KYCForm;
