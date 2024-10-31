import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaMoneyBillWave,
  FaExchangeAlt,
  FaUserCircle,
  FaArrowUp,
  FaArrowDown,
  FaHistory,
  FaCalendarAlt,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";
import "./DepositForm.css";

const DepositForm = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [action, setAction] = useState("deposit");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://localhost:5000/api/admin/users",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUsers(response.data);
      } catch (error) {
        console.error("Error fetching users:", error);
        setMessage("Error al cargar los usuarios");
        setMessageType("error");
      }
    };

    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:5000/api/admin/${action}`,
        {
          userId: selectedUser,
          amountEUR: parseFloat(amount),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data && response.data.newBalanceEUR !== undefined) {
        setMessage(
          `${
            action === "deposit" ? "Depósito" : "Retiro"
          } realizado con éxito. Nuevo balance: ${response.data.newBalanceEUR.toFixed(
            2
          )} EUR`
        );
        setMessageType("success");
        fetchTransactions(selectedUser);
      } else {
        setMessage(
          `${
            action === "deposit" ? "Depósito" : "Retiro"
          } realizado, pero no se pudo obtener el nuevo balance`
        );
        setMessageType("error");
      }

      setSelectedUser("");
      setAmount("");
    } catch (error) {
      console.error(
        `Error ${action === "deposit" ? "making deposit" : "withdrawing"}:`,
        error
      );
      setMessage(
        `Error al realizar el ${
          action === "deposit" ? "depósito" : "retiro"
        }: ${error.response?.data?.msg || error.message}`
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:5000/api/admin/transactions/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setTransactions(response.data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setMessage("Error al cargar las transacciones");
      setMessageType("error");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="deposit-form"
    >
      <motion.div
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        className="deposit-header"
      >
        <h2>
          <FaMoneyBillWave /> Gestión de Billeteras
        </h2>
      </motion.div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`message ${messageType}`}
          >
            {messageType === "success" ? (
              <FaCheckCircle />
            ) : (
              <FaExclamationCircle />
            )}
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        onSubmit={handleSubmit}
      >
        <div className="form-group">
          <label htmlFor="user">
            <FaUserCircle /> Usuario:
          </label>
          <select
            id="user"
            value={selectedUser}
            onChange={(e) => {
              setSelectedUser(e.target.value);
              if (e.target.value) {
                fetchTransactions(e.target.value);
              } else {
                setTransactions([]);
              }
            }}
            required
          >
            <option value="">Seleccione un usuario</option>
            {users.map((user) => (
              <option key={user._id} value={user._id}>
                {user.email} - Balance: {user.balanceEUR?.toFixed(2) || "0.00"}{" "}
                EUR
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="action">
            <FaExchangeAlt /> Acción:
          </label>
          <select
            id="action"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            required
          >
            <option value="deposit">Ingresar</option>
            <option value="withdraw">Retirar</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="amount">
            <FaMoneyBillWave /> Cantidad (EUR):
          </label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            min="0"
            step="0.01"
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="submit-button"
          type="submit"
          disabled={loading}
        >
          {action === "deposit" ? (
            <>
              <FaArrowUp /> Realizar Depósito
            </>
          ) : (
            <>
              <FaArrowDown /> Realizar Retiro
            </>
          )}
        </motion.button>
      </motion.form>

      <AnimatePresence>
        {transactions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="transaction-history"
          >
            <h3>
              <FaHistory /> Historial de Transacciones
            </h3>
            <div className="transaction-list">
              {transactions.map((transaction, index) => (
                <motion.div
                  key={transaction._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="transaction-item"
                >
                  <div className="transaction-info">
                    <span className={`transaction-type ${transaction.type}`}>
                      {transaction.type === "deposit" ? (
                        <FaArrowUp />
                      ) : (
                        <FaArrowDown />
                      )}
                      {transaction.type === "deposit" ? "Depósito" : "Retiro"}
                    </span>
                    <span className="transaction-amount">
                      {transaction.amountEUR.toFixed(2)} EUR
                    </span>
                  </div>
                  <span className="transaction-date">
                    <FaCalendarAlt />{" "}
                    {new Date(transaction.date).toLocaleString()}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DepositForm;
