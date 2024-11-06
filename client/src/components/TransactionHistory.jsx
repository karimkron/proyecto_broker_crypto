import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaHistory, FaTimes, FaExclamationCircle } from "react-icons/fa";
import axios from "axios";
import "./TransactionHistory.css";

const TransactionHistory = ({ isOpen, onClose }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://localhost:5000/api/wallet/transactions",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Validar y formatear los datos recibidos
        const validatedTransactions = response.data.map((transaction) => ({
          ...transaction,
          amount: Number(transaction.amount) || 0,
          date: new Date(transaction.date).toISOString(),
        }));

        setTransactions(validatedTransactions);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setError("Error al cargar el historial de transacciones");
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchTransactions();
    }
  }, [isOpen]);

  const formatDate = (date) => {
    try {
      return new Date(date).toLocaleString("es-ES", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Fecha inválida";
    }
  };

  const formatAmount = (amount, currency) => {
    try {
      if (amount === undefined || amount === null) {
        return "0.00";
      }
      const numAmount = Number(amount);
      if (isNaN(numAmount)) {
        return "0.00";
      }
      const decimals = currency === "EUR" || currency === "USDT" ? 2 : 8;
      return numAmount.toFixed(decimals);
    } catch (error) {
      console.error("Error formatting amount:", error);
      return "0.00";
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case "send":
        return "↑";
      case "receive":
        return "↓";
      case "exchange":
        return "↔";
      default:
        return "•";
    }
  };

  const getTransactionType = (type) => {
    switch (type) {
      case "send":
        return "Enviado";
      case "receive":
        return "Recibido";
      case "exchange":
        return "Intercambio";
      default:
        return "Desconocido";
    }
  };

  const renderTransactionDetails = (transaction) => {
    const isReceive = transaction.type === "receive";
    const isSend = transaction.type === "send";
    const address = isReceive
      ? transaction.senderAddress
      : transaction.recipientAddress;

    return (
      <div className="transaction-details">
        <div className="transaction-address">
          {isReceive ? "De: " : isSend ? "Para: " : ""}
          {address || "Dirección no disponible"}
        </div>
        <div
          className={`transaction-amount ${
            transaction.type === "send" ? "negative" : "positive"
          }`}
        >
          {transaction.type === "send" ? "-" : "+"}
          {formatAmount(transaction.amount, transaction.currency)}{" "}
          {transaction.currency}
        </div>
      </div>
    );
  };

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
        className="modal-content transaction-history-modal"
      >
        <div className="modal-header">
          <h2>
            <FaHistory /> Historial de Transacciones
          </h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading-spinner">Cargando transacciones...</div>
          ) : error ? (
            <div className="error-message">
              <FaExclamationCircle />
              <span>{error}</span>
            </div>
          ) : transactions.length === 0 ? (
            <div className="no-transactions">
              No hay transacciones para mostrar
            </div>
          ) : (
            <div className="transactions-list">
              {transactions.map((transaction) => (
                <motion.div
                  key={transaction._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="transaction-item"
                >
                  <div className="transaction-icon">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div className="transaction-info">
                    <div className="transaction-type">
                      {getTransactionType(transaction.type)}
                    </div>
                    <div className="transaction-date">
                      {formatDate(transaction.date)}
                    </div>
                  </div>
                  {renderTransactionDetails(transaction)}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TransactionHistory;
