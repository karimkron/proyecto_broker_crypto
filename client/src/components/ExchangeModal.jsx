import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { FaExchangeAlt, FaTimes } from "react-icons/fa";
import "./ExchangeModal.css";

const ExchangeModal = ({
  isOpen,
  onClose,
  onExchangeComplete,
  balances,
  formatCurrency,
}) => {
  const [fromCurrency, setFromCurrency] = useState("EUR");
  const [toCurrency, setToCurrency] = useState("USDT");
  const [amount, setAmount] = useState("");
  const [exchangeRate, setExchangeRate] = useState(null);
  const [estimatedAmount, setEstimatedAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currencies = ["EUR", "USDT", "BTC", "ETH"];

  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/exchange-rate`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setExchangeRate(response.data.rates);
      } catch (err) {
        console.error("Error fetching exchange rate:", err);
        setError(
          "Error al obtener la tasa de cambio. Por favor, intente nuevamente."
        );
      }
    };

    fetchExchangeRate();
    const interval = setInterval(fetchExchangeRate, 120000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (amount && exchangeRate) {
      const amountNum = parseFloat(amount);
      const rate = exchangeRate[fromCurrency][toCurrency];
      if (rate) {
        setEstimatedAmount(amountNum * rate);
      }
    } else {
      setEstimatedAmount(0);
    }
    setError("");
  }, [amount, exchangeRate, fromCurrency, toCurrency]);

  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setAmount("");
    setEstimatedAmount(0);
    setError("");
  };

  const getAvailableBalance = (currency) => {
    return balances[currency]?.available || 0;
  };

  const validateAmount = () => {
    const amountNum = parseFloat(amount);
    const availableBalance = getAvailableBalance(fromCurrency);

    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Por favor, ingrese una cantidad válida");
      return false;
    }
    if (amountNum > availableBalance) {
      setError(
        `Saldo insuficiente. Disponible: ${formatCurrency(
          availableBalance,
          fromCurrency === "EUR" ? 2 : 8
        )} ${fromCurrency}`
      );
      return false;
    }
    return true;
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    setAmount(value);
    setError("");
  };

  const handleExchange = async () => {
    if (!validateAmount()) return;

    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      const exchangeData = {
        fromCurrency,
        toCurrency,
        amount: parseFloat(amount),
      };

      console.log("Sending exchange request:", exchangeData);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/wallet/exchange`,
        exchangeData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Exchange response:", response.data);
      onExchangeComplete(response.data);
      onClose();
    } catch (err) {
      console.error("Exchange error:", err);
      console.error("Exchange error response:", err.response?.data);
      setError(
        err.response?.data?.msg ||
          "No se pudo completar el intercambio. Por favor, intente nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getDecimals = (currency) => {
    switch (currency) {
      case "EUR":
        return 2;
      case "USDT":
        return 4;
      case "BTC":
        return 8;
      case "ETH":
        return 6;
      default:
        return 4;
    }
  };

  return (
    <motion.div
      className="exchange-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="exchange-modal"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="modal-header">
          <h2>Intercambiar Monedas</h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="exchange-form">
          <div className="currency-input">
            <label>De</label>
            <select
              value={fromCurrency}
              onChange={(e) => {
                setFromCurrency(e.target.value);
                if (e.target.value === toCurrency) {
                  setToCurrency(fromCurrency);
                }
              }}
              disabled={loading}
            >
              {currencies.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={amount}
              onChange={handleAmountChange}
              placeholder="Cantidad"
              disabled={loading}
              min="0"
              step="any"
            />
            <span className="balance-info">
              Disponible:{" "}
              {formatCurrency(
                getAvailableBalance(fromCurrency),
                getDecimals(fromCurrency)
              )}{" "}
              {fromCurrency}
            </span>
          </div>

          <button
            className="swap-button"
            onClick={handleSwapCurrencies}
            disabled={loading}
          >
            <FaExchangeAlt />
          </button>

          <div className="currency-input">
            <label>A</label>
            <select
              value={toCurrency}
              onChange={(e) => {
                setToCurrency(e.target.value);
                if (e.target.value === fromCurrency) {
                  setFromCurrency(toCurrency);
                }
              }}
              disabled={loading}
            >
              {currencies
                .filter((c) => c !== fromCurrency)
                .map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
            </select>
            <div className="estimated-amount">
              {formatCurrency(estimatedAmount, getDecimals(toCurrency))}{" "}
              {toCurrency}
            </div>
          </div>

          {exchangeRate && exchangeRate[fromCurrency] && (
            <div className="exchange-rate">
              1 {fromCurrency} ={" "}
              {formatCurrency(
                exchangeRate[fromCurrency][toCurrency],
                getDecimals(toCurrency)
              )}{" "}
              {toCurrency}
            </div>
          )}

          {error && <div className="exchange-error-message">{error}</div>}

          <button
            className="exchange-button"
            onClick={handleExchange}
            disabled={loading || !amount || parseFloat(amount) <= 0}
          >
            {loading ? (
              <span className="loading-text">Procesando...</span>
            ) : (
              "Confirmar Intercambio"
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ExchangeModal;
