import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaCopy,
  FaCheck,
  FaExclamationCircle,
  FaArrowRight,
  FaWallet,
  FaTimes,
} from "react-icons/fa";
import axios from "axios";
import "./modalTransferencias.css";

const TransferModal = ({
  isOpen,
  onClose,
  balances,
  formatCurrency,
  onTransferComplete,
}) => {
  // Estados
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("USDT");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [walletAddress, setWalletAddress] = useState("");
  const [copied, setCopied] = useState(false);

  // Obtener dirección de billetera
  useEffect(() => {
    const fetchWalletAddress = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://localhost:5000/api/wallet/address",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setWalletAddress(response.data.address);
      } catch (error) {
        console.error("Error fetching wallet address:", error);
        setError("Error al obtener la dirección de la billetera");
      }
    };

    if (isOpen) {
      fetchWalletAddress();
    }
  }, [isOpen]);

  // Validación de dirección
  const validateAddress = (address) => {
    if (!address) return false;
    // Validar formato de dirección (wx seguido de 64 caracteres hexadecimales)
    const addressRegex = /^wx[0-9a-fA-F]{64}$/;
    return addressRegex.test(address);
  };

  // Validar monto
  const validateAmount = (amount, currency) => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return false;

    // Validar decimales según la moneda
    const decimals = currency === "EUR" || currency === "USDT" ? 2 : 8;
    const decimalPart = amount.toString().split(".")[1] || "";
    if (decimalPart.length > decimals) return false;

    // Validar contra el balance disponible
    return parsedAmount <= balances[currency].available;
  };

  // Copiar dirección
  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Validación completa antes de enviar
  const validateTransfer = () => {
    if (!validateAddress(recipientAddress)) {
      setError("Dirección de billetera inválida");
      return false;
    }

    if (recipientAddress === walletAddress) {
      setError("No puedes transferir a tu propia billetera");
      return false;
    }

    if (!validateAmount(amount, selectedCurrency)) {
      if (parseFloat(amount) > balances[selectedCurrency].available) {
        setError("Saldo insuficiente");
      } else {
        setError("Monto inválido");
      }
      return false;
    }

    return true;
  };

  // Manejar envío
  const handleSubmit = async () => {
    if (!validateTransfer()) return;

    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");

      // Realizar la transferencia
      const response = await axios.post(
        "http://localhost:5000/api/wallet/transfer",
        {
          recipientAddress,
          amount: parseFloat(amount),
          currency: selectedCurrency,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Obtener balance actualizado
      const balanceResponse = await axios.get(
        "http://localhost:5000/api/wallet",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setConfirmation({
        txId: response.data.transactionId,
        amount,
        currency: selectedCurrency,
        recipient: recipientAddress,
        newBalance: response.data.newBalance,
      });

      // Actualizar el balance en el componente padre
      onTransferComplete(balanceResponse.data);

      // Cerrar el modal después de 3 segundos
      setTimeout(() => {
        onClose();
        window.location.reload(); // Recargar para actualizar el historial
      }, 3000);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Error al realizar la transferencia";
      setError(errorMessage);
      console.error("Transfer error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar cambio de monto
  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Validar formato del número
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError("");
    }
  };

  // Renderizar confirmación
  const renderConfirmation = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="transfer-confirmation"
    >
      <div className="success-icon-container">
        <FaCheck className="success-icon" />
      </div>
      <h3>Transferencia Exitosa</h3>
      <div className="confirmation-details">
        <div className="confirmation-item">
          <span className="label">ID de Transacción:</span>
          <span className="value">{confirmation.txId}</span>
        </div>
        <div className="confirmation-item">
          <span className="label">Monto:</span>
          <span className="value">
            {formatCurrency(confirmation.amount, confirmation.currency)}{" "}
            {confirmation.currency}
          </span>
        </div>
        <div className="confirmation-item">
          <span className="label">Destinatario:</span>
          <span className="value address">{confirmation.recipient}</span>
        </div>
        <div className="confirmation-item">
          <span className="label">Nuevo Balance:</span>
          <span className="value">
            {formatCurrency(confirmation.newBalance, confirmation.currency)}{" "}
            {confirmation.currency}
          </span>
        </div>
      </div>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-overlay"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="modal-content transfer-modal"
      >
        <div className="modal-header">
          <h2>Transferir</h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {confirmation ? (
          renderConfirmation()
        ) : (
          <>
            <div className="wallet-address-section">
              <div className="section-header">
                <FaWallet className="section-icon" />
                <h3>Mi Dirección de Billetera</h3>
              </div>
              <div className="address-container">
                <span className="address">
                  {walletAddress || "Cargando..."}
                </span>
                <button
                  className={`copy-button ${copied ? "copied" : ""}`}
                  onClick={handleCopy}
                  disabled={!walletAddress}
                >
                  {copied ? <FaCheck /> : <FaCopy />}
                </button>
              </div>
              <p className="address-note">
                Comparte esta dirección para recibir transferencias
              </p>
            </div>

            <div className="modal-body">
              <div className="currency-selector">
                <label>Seleccionar Moneda</label>
                <div className="currency-options">
                  {Object.entries(balances).map(([currency, balance]) => (
                    <button
                      key={currency}
                      className={`currency-option ${
                        selectedCurrency === currency ? "selected" : ""
                      }`}
                      onClick={() => {
                        setSelectedCurrency(currency);
                        setError("");
                      }}
                    >
                      {balance.image && (
                        <img src={balance.image} alt={currency} />
                      )}
                      <div className="currency-info">
                        <span className="currency-name">{currency}</span>
                        <span className="currency-balance">
                          Disponible:{" "}
                          {formatCurrency(balance.available, currency)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="input-group">
                <label>Dirección de Billetera Destino</label>
                <div className="input-container">
                  <input
                    type="text"
                    placeholder="Ingresa la dirección de la billetera"
                    value={recipientAddress}
                    onChange={(e) => {
                      setRecipientAddress(e.target.value);
                      setError("");
                    }}
                    className="address-input"
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Monto a Enviar</label>
                <div className="amount-input-container">
                  <input
                    type="text"
                    placeholder="0.00"
                    value={amount}
                    onChange={handleAmountChange}
                    className="amount-input"
                  />
                  <span className="currency-label">{selectedCurrency}</span>
                </div>
                <span className="available-balance">
                  Disponible:{" "}
                  {formatCurrency(
                    balances[selectedCurrency].available,
                    selectedCurrency
                  )}{" "}
                  {selectedCurrency}
                </span>
              </div>

              {error && (
                <div className="error-message">
                  <FaExclamationCircle />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="confirm-button"
                onClick={handleSubmit}
                disabled={isLoading || !amount || !recipientAddress}
              >
                {isLoading ? (
                  "Procesando..."
                ) : (
                  <>
                    <span>Confirmar Transferencia</span>
                    <FaArrowRight />
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default TransferModal;
