import React, { useState, useEffect } from "react";
import {
  FaUser,
  FaEnvelope,
  FaIdCard,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaSpinner,
  FaSignOutAlt,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaShieldAlt,
  FaUserCheck,
  FaPhone,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import "../styles/pages/Profile.css";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showKycForm, setShowKycForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [kycFormData, setKycFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    address: "",
    idNumber: "",
    phoneNumber: "",
    frontId: null,
    backId: null,
    selfieWithId: null,
    addressProof: null,
  });

  const [validation, setValidation] = useState({
    fullName: false,
    dateOfBirth: false,
    address: false,
    idNumber: false,
    phoneNumber: false,
    frontId: false,
    backId: false,
    selfieWithId: false,
    addressProof: false,
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const [userResponse, kycResponse] = await Promise.all([
        axios.get("http://localhost:5000/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:5000/api/kyc/status", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setUser({
        ...userResponse.data,
        kycStatus: kycResponse.data.kycStatus,
        kycSubmissionDate: kycResponse.data.kycSubmissionDate,
        kycVerificationDate: kycResponse.data.kycVerificationDate,
        kycRejectionReason: kycResponse.data.kycRejectionReason,
      });

      setError(null);
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError(
        error.response?.data?.msg || "Error al cargar los datos del usuario"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setKycFormData((prev) => ({ ...prev, [field]: value }));

    let isValid = false;
    switch (field) {
      case "fullName":
        isValid = value.trim().length >= 3;
        break;
      case "phoneNumber":
        isValid = /^\+?\d{9,15}$/.test(value);
        break;
      case "idNumber":
        // Validación para DNI/NIE español
        isValid = /^[0-9XYZ][0-9]{7}[A-Z]$/.test(value.toUpperCase());
        break;
      case "address":
        isValid = value.trim().length >= 5;
        break;
      case "dateOfBirth":
        const birthDate = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        isValid = age >= 18 && age <= 120;
        break;
      default:
        isValid = !!value;
    }

    setValidation((prev) => ({ ...prev, [field]: isValid }));
  };

  const handleFileChange = (field, file) => {
    if (file) {
      const isValidFile = validateFile(file);
      setKycFormData((prev) => ({
        ...prev,
        [field]: isValidFile ? file : null,
      }));
      setValidation((prev) => ({ ...prev, [field]: isValidFile }));
    }
  };

  const validateFile = (file) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
    ];
    return file.size <= maxSize && validTypes.includes(file.type);
  };

  const handleKYCSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      Object.keys(kycFormData).forEach((key) => {
        if (kycFormData[key]) {
          formData.append(key, kycFormData[key]);
        }
      });

      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5000/api/kyc", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      await fetchUserData();
      setShowKycForm(false);

      // Reset form
      setKycFormData({
        fullName: "",
        dateOfBirth: "",
        address: "",
        idNumber: "",
        phoneNumber: "",
        frontId: null,
        backId: null,
        selfieWithId: null,
        addressProof: null,
      });
      setValidation({
        fullName: false,
        dateOfBirth: false,
        address: false,
        idNumber: false,
        phoneNumber: false,
        frontId: false,
        backId: false,
        selfieWithId: false,
        addressProof: false,
      });
    } catch (error) {
      setError(
        error.response?.data?.msg || "Error al enviar documentación KYC"
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("Las contraseñas nuevas no coinciden");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      await axios.put(
        "http://localhost:5000/api/users/change-password",
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setShowPasswordModal(false);
      setError(null);
    } catch (error) {
      setError(error.response?.data?.msg || "Error al cambiar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const renderKYCStatus = () => {
    if (!user) return null;

    const statusConfig = {
      verified: {
        icon: <FaUserCheck />,
        text: "Verificado",
        className: "verified",
      },
      pending: {
        icon: <FaClock />,
        text: "Pendiente",
        className: "pending",
      },
      rejected: {
        icon: <FaTimesCircle />,
        text: "Rechazado",
        className: "rejected",
      },
      not_submitted: {
        icon: <FaTimesCircle />,
        text: "No Verificado",
        className: "not-verified",
      },
    };

    const status = statusConfig[user.kycStatus] || statusConfig.not_submitted;

    return (
      <span
        className={`kyc-status ${status.className}`}
        title={user.kycRejectionReason || status.text}
      >
        {status.icon} {status.text}
      </span>
    );
  };

  const renderPasswordModal = () => {
    if (!showPasswordModal) return null;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="modal-overlay"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="modal-content"
        >
          <div className="modal-header">
            <h3>Cambiar Contraseña</h3>
            <button
              className="close-button"
              onClick={() => setShowPasswordModal(false)}
            >
              ×
            </button>
          </div>

          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label>Contraseña Actual</label>
              <div className="password-input-wrapper">
                <input
                  type={showPasswords.current ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      currentPassword: e.target.value,
                    })
                  }
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => togglePasswordVisibility("current")}
                >
                  {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Nueva Contraseña</label>
              <div className="password-input-wrapper">
                <input
                  type={showPasswords.new ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword: e.target.value,
                    })
                  }
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => togglePasswordVisibility("new")}
                >
                  {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Confirmar Nueva Contraseña</label>
              <div className="password-input-wrapper">
                <input
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => togglePasswordVisibility("confirm")}
                >
                  {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="submit"
                className="submit-button"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <FaSpinner className="spinning" /> Actualizando...
                  </>
                ) : (
                  "Actualizar Contraseña"
                )}
              </button>
              <button
                type="button"
                className="cancel-button"
                onClick={() => setShowPasswordModal(false)}
              >
                Cancelar
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    );
  };

  const renderKYCFormModal = () => {
    if (!showKycForm) return null;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="modal-overlay"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="modal-content kyc-modal"
        >
          <div className="modal-header">
            <h3>Verificación KYC</h3>
            <button
              className="close-button"
              onClick={() => setShowKycForm(false)}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleKYCSubmit} className="kyc-form">
            <div className="form-group">
              <label>Nombre Completo</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  value={kycFormData.fullName}
                  onChange={(e) =>
                    handleInputChange("fullName", e.target.value)
                  }
                  required
                />
                {validation.fullName && (
                  <FaCheckCircle className="validation-icon success" />
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Teléfono</label>
              <div className="input-wrapper">
                <input
                  type="tel"
                  value={kycFormData.phoneNumber}
                  onChange={(e) =>
                    handleInputChange("phoneNumber", e.target.value)
                  }
                  placeholder="+34 XXX XXX XXX"
                  required
                />
                {validation.phoneNumber && (
                  <FaCheckCircle className="validation-icon success" />
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Fecha de Nacimiento</label>
              <div className="input-wrapper">
                <input
                  type="date"
                  value={kycFormData.dateOfBirth}
                  onChange={(e) =>
                    handleInputChange("dateOfBirth", e.target.value)
                  }
                  required
                />
                {validation.dateOfBirth && (
                  <FaCheckCircle className="validation-icon success" />
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Dirección</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  value={kycFormData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Calle, número, piso, ciudad, código postal"
                  required
                />
                {validation.address && (
                  <FaCheckCircle className="validation-icon success" />
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Número de DNI/NIE</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  value={kycFormData.idNumber}
                  onChange={(e) =>
                    handleInputChange("idNumber", e.target.value)
                  }
                  placeholder="12345678X o X1234567X"
                  required
                />
                {validation.idNumber && (
                  <FaCheckCircle className="validation-icon success" />
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Frente del DNI/NIE</label>
              <div className="input-wrapper file-input">
                <input
                  type="file"
                  onChange={(e) =>
                    handleFileChange("frontId", e.target.files[0])
                  }
                  accept="image/jpeg,image/png,image/jpg,application/pdf"
                  required
                />
                {validation.frontId && (
                  <FaCheckCircle className="validation-icon success" />
                )}
              </div>
              <small className="file-info">
                Formatos aceptados: JPG, PNG, PDF. Máx: 5MB
              </small>
            </div>

            <div className="form-group">
              <label>Reverso del DNI/NIE</label>
              <div className="input-wrapper file-input">
                <input
                  type="file"
                  onChange={(e) =>
                    handleFileChange("backId", e.target.files[0])
                  }
                  accept="image/jpeg,image/png,image/jpg,application/pdf"
                  required
                />
                {validation.backId && (
                  <FaCheckCircle className="validation-icon success" />
                )}
              </div>
              <small className="file-info">
                Formatos aceptados: JPG, PNG, PDF. Máx: 5MB
              </small>
            </div>

            <div className="form-group">
              <label>Selfie con DNI/NIE</label>
              <div className="input-wrapper file-input">
                <input
                  type="file"
                  onChange={(e) =>
                    handleFileChange("selfieWithId", e.target.files[0])
                  }
                  accept="image/jpeg,image/png,image/jpg"
                  required
                />
                {validation.selfieWithId && (
                  <FaCheckCircle className="validation-icon success" />
                )}
              </div>
              <small className="file-info">
                Formatos aceptados: JPG, PNG. Máx: 5MB
              </small>
            </div>

            <div className="form-group">
              <label>Comprobante de Domicilio</label>
              <div className="input-wrapper file-input">
                <input
                  type="file"
                  onChange={(e) =>
                    handleFileChange("addressProof", e.target.files[0])
                  }
                  accept="image/jpeg,image/png,image/jpg,application/pdf"
                  required
                />
                {validation.addressProof && (
                  <FaCheckCircle className="validation-icon success" />
                )}
              </div>
              <small className="file-info">
                Formatos aceptados: JPG, PNG, PDF. Máx: 5MB
              </small>
            </div>

            <div className="modal-actions">
              <button
                type="submit"
                className="submit-button"
                disabled={loading || !Object.values(validation).every(Boolean)}
              >
                {loading ? (
                  <>
                    <FaSpinner className="spinning" /> Enviando...
                  </>
                ) : (
                  "Enviar Documentación"
                )}
              </button>
              <button
                type="button"
                className="cancel-button"
                onClick={() => setShowKycForm(false)}
              >
                Cancelar
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="loading"
      >
        <FaSpinner className="loading-icon" />
        <p>Cargando perfil...</p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="error"
      >
        <p>{error}</p>
        <button onClick={fetchUserData}>Reintentar</button>
      </motion.div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="profile-container">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="profile-header"
      >
        <div className="header-content">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            ¡Hola de nuevo, {user.firstName}!
          </motion.h1>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="logout-button"
          onClick={handleLogout}
        >
          <FaSignOutAlt /> Salir
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="profile-content"
      >
        <div className="profile-info">
          <motion.div
            className="info-item"
            whileHover={{ x: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <FaUser className="icon" />
            <div>
              <strong>Nombre Completo</strong>
              <p>{`${user.firstName} ${user.lastName}`}</p>
            </div>
            {renderKYCStatus()}
          </motion.div>

          <motion.div
            className="info-item"
            whileHover={{ x: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <FaIdCard className="icon" />
            <div>
              <strong>Usuario</strong>
              <p>@{user.username}</p>
            </div>
          </motion.div>

          <motion.div
            className="info-item"
            whileHover={{ x: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <FaEnvelope className="icon" />
            <div>
              <strong>Correo Electrónico</strong>
              <p>{user.email}</p>
            </div>
          </motion.div>

          <motion.div
            className="info-item"
            whileHover={{ x: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <FaCalendarAlt className="icon" />
            <div>
              <strong>Fecha de Registro</strong>
              <p>{new Date(user.date).toLocaleDateString()}</p>
            </div>
          </motion.div>
        </div>

        <div className="quick-actions">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="action-button"
            onClick={() => setShowPasswordModal(true)}
          >
            <div className="button-content">
              <FaLock className="action-icon" />
              <span>Cambiar Contraseña</span>
            </div>
          </motion.button>

          {user.kycStatus !== "verified" && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="action-button kyc-button"
              onClick={() => setShowKycForm(true)}
            >
              <div className="button-content">
                <FaShieldAlt className="action-icon" />
                <span>
                  {user.kycStatus === "pending"
                    ? "KYC en Revisión"
                    : "Completar KYC"}
                </span>
              </div>
            </motion.button>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {showPasswordModal && renderPasswordModal()}
        {showKycForm && renderKYCFormModal()}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
