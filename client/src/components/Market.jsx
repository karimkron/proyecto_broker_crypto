import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaWallet,
  FaExchangeAlt,
  FaHeadset,
  FaChartLine,
  FaArrowUp,
  FaArrowDown,
  FaPhoneAlt,
  FaArrowDown as FaDeposit,
} from "react-icons/fa";
import "../styles/pages/market.css";

const Market = () => {
  const [cryptocurrencies, setCryptocurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCryptoPrices = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(
          "http://localhost:5000/api/crypto-data"
        );
        setCryptocurrencies(response.data);
      } catch (error) {
        console.error("Error fetching crypto data:", error);
        setError(
          "No se pudo cargar la información de las criptomonedas. Por favor, intenta de nuevo más tarde."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCryptoPrices();
    const interval = setInterval(fetchCryptoPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleCryptoSelect = (crypto) => {
    navigate(`/crypto/${crypto.id}`);
  };

  if (loading)
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="loading"
      />
    );

  if (error)
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="error-message"
      >
        {error}
      </motion.div>
    );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="market-container"
    >
      {/* Top Cryptos Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="top-cryptos"
      >
        {cryptocurrencies.slice(0, 3).map((crypto, index) => (
          <motion.div
            key={crypto.id}
            className="top-crypto-item"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleCryptoSelect(crypto)}
          >
            <motion.div
              className="crypto-symbol"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {crypto.symbol.toUpperCase()}/USDT
            </motion.div>
            <motion.div
              className="crypto-price"
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
            >
              ${crypto.current_price.toFixed(2)}
            </motion.div>
            <motion.div
              className={`crypto-change ${
                crypto.price_change_percentage_24h > 0 ? "positive" : "negative"
              }`}
            >
              {crypto.price_change_percentage_24h > 0 ? (
                <FaArrowUp size={12} />
              ) : (
                <FaArrowDown size={12} />
              )}
              {Math.abs(crypto.price_change_percentage_24h).toFixed(2)}%
            </motion.div>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="quick-actions"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="action-button deposit"
        >
          <div className="button-content">
            <FaDeposit className="action-icon" />
            <span>Depositar</span>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="action-button withdraw"
        >
          <div className="button-content">
            <FaExchangeAlt className="action-icon" />
            <span>Retirar</span>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="action-button support"
        >
          <div className="button-content">
            <FaPhoneAlt className="action-icon" />
            <span>Soporte</span>
          </div>
        </motion.button>
      </motion.div>

      {/* Crypto List */}
      <motion.div
        className="crypto-list"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <AnimatePresence>
          {cryptocurrencies.map((crypto, index) => (
            <motion.div
              key={crypto.id}
              className="crypto-item"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ x: 5 }}
              onClick={() => handleCryptoSelect(crypto)}
            >
              <motion.img
                src={crypto.image}
                alt={crypto.name}
                className="crypto-icon"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              />
              <div className="crypto-info">
                <div className="crypto-symbol">
                  {crypto.symbol.toUpperCase()}/USDT
                </div>
                <div className="crypto-price">
                  ${crypto.current_price.toFixed(2)}
                </div>
                <motion.div
                  className={`crypto-change ${
                    crypto.price_change_percentage_24h > 0
                      ? "positive"
                      : "negative"
                  }`}
                >
                  {crypto.price_change_percentage_24h > 0 ? (
                    <FaArrowUp size={12} />
                  ) : (
                    <FaArrowDown size={12} />
                  )}
                  {Math.abs(crypto.price_change_percentage_24h).toFixed(2)}%
                </motion.div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default Market;
