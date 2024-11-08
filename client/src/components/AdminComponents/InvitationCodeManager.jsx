import React, { useState, useEffect } from "react";
import {
  FaKey,
  FaCopy,
  FaPlus,
  FaCheck,
  FaTimes,
  FaSpinner,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import "./InvitationCodyManager.css";

const InvitationCodeManager = () => {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const [generatingCode, setGeneratingCode] = useState(false);

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/invitation-codes`,
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
        throw new Error("Error al cargar los códigos de invitación");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateCode = async () => {
    try {
      setGeneratingCode(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/invitation-codes/generate`,
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
        throw new Error("Error al generar el código de invitación");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setGeneratingCode(false);
    }
  };

  const copyToClipboard = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error("Error al copiar el código:", err);
    }
  };

  if (loading) {
    return (
      <div className="invitation-manager-container">
        <div className="loading-state">
          <FaSpinner className="spinning" />
          <span>Cargando códigos de invitación...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="invitation-manager-container">
        <div className="error-state">
          <FaTimes className="error-icon" />
          <span>{error}</span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="retry-button"
            onClick={fetchCodes}
          >
            Reintentar
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="invitation-manager-container">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="header-section"
      >
        <div className="title-container">
          <FaKey className="title-icon" />
          <h2>Códigos de Invitación</h2>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="generate-button"
          onClick={generateCode}
          disabled={generatingCode}
        >
          {generatingCode ? (
            <FaSpinner className="spinning" />
          ) : (
            <>
              <FaPlus /> Generar Código
            </>
          )}
        </motion.button>
      </motion.div>

      <div className="codes-container">
        <AnimatePresence>
          {codes.map((code, index) => (
            <motion.div
              key={code._id || code.code}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.1 }}
              className={`code-item ${code.isUsed ? "used" : "available"}`}
            >
              <div className="code-info">
                <span className="code-value">{code.code}</span>
                <span className="code-status">
                  {code.isUsed ? "Usado" : "Disponible"}
                </span>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="copy-button"
                onClick={() => copyToClipboard(code.code)}
                disabled={code.isUsed}
              >
                {copiedCode === code.code ? (
                  <FaCheck className="copied" />
                ) : (
                  <FaCopy />
                )}
              </motion.button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default InvitationCodeManager;
