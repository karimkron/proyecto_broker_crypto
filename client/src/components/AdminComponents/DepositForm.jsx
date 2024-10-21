import React, { useState, useEffect } from "react";
import axios from "axios";
import "./DepositForm.css";

const DepositForm = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [eurToUSDT, setEurToUSDT] = useState(null);
  const [action, setAction] = useState("deposit");
  const [transactions, setTransactions] = useState([]);

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
      }
    };

    const fetchExchangeRate = async () => {
      try {
        const response = await axios.get(
          "https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=eur"
        );
        setEurToUSDT(response.data.tether.eur);
      } catch (error) {
        console.error("Error fetching exchange rate:", error);
      }
    };

    fetchUsers();
    fetchExchangeRate();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
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

      console.log("Server response:", response.data);

      if (
        response.data &&
        response.data.newBalanceEUR !== undefined &&
        response.data.newBalanceUSDT !== undefined
      ) {
        setMessage(
          `${
            action === "deposit" ? "Depósito" : "Retiro"
          } realizado con éxito. Nuevo balance: ${response.data.newBalanceEUR.toFixed(
            2
          )} EUR (${response.data.newBalanceUSDT.toFixed(2)} USDT)`
        );
        fetchTransactions(selectedUser);
      } else {
        setMessage(
          `${
            action === "deposit" ? "Depósito" : "Retiro"
          } realizado, pero no se pudo obtener el nuevo balance`
        );
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
    }
  };

  return (
    <div className="deposit-form">
      <h2>Gestionar Billetera de Usuario</h2>
      {message && <p className="message">{message}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="user">Usuario:</label>
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
                EUR ({user.balanceUSDT?.toFixed(2) || "0.00"} USDT)
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="action">Acción:</label>
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
          <label htmlFor="amount">Cantidad (EUR):</label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            min="0"
            step="0.01"
          />
          {eurToUSDT && amount && (
            <p>Equivalente en USDT: {(amount / eurToUSDT).toFixed(2)} USDT</p>
          )}
        </div>
        <button type="submit">
          {action === "deposit" ? "Realizar Depósito" : "Realizar Retiro"}
        </button>
      </form>
      {transactions.length > 0 && (
        <div className="transaction-history">
          <h3>Historial de Transacciones</h3>
          <ul>
            {transactions.map((transaction) => (
              <li
                key={transaction._id}
                className={
                  transaction.type === "deposit" ? "deposit" : "withdraw"
                }
              >
                {transaction.type === "deposit" ? "Depósito" : "Retiro"} de{" "}
                {transaction.amountEUR.toFixed(2)} EUR (
                {transaction.amountUSDT.toFixed(2)} USDT) -{" "}
                {new Date(transaction.date).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DepositForm;
