import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaWallet,
  FaExchangeAlt,
  FaHeadset,
  FaChartLine,
  FaArrowUp,
  FaArrowDown,
  FaSync,
  FaBitcoin,
  FaEthereum,
  FaDollarSign,
  FaEuroSign,
  FaChevronRight,
  FaPlus,
  FaMinus,
  FaExclamationTriangle,
} from "react-icons/fa";
import "./Wallet.css";

const CACHE_DURATION = 5 * 60 * 1000;

const Wallet = () => {
  const [balances, setBalances] = useState({
    EUR: { available: 0, frozen: 0 },
    USDT: {
      available: 0,
      frozen: 0,
      image: "https://assets.coingecko.com/coins/images/325/small/Tether.png",
    },
    BTC: { available: 0, frozen: 0, image: "" },
    ETH: { available: 0, frozen: 0, image: "" },
  });

  const [totalAssetsEUR, setTotalAssetsEUR] = useState(0);
  const [totalAssetsUSDT, setTotalAssetsUSDT] = useState(0);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5000/api/wallet", {
          headers: { Authorization: `Bearer ${token}` },
          onDownloadProgress: (progressEvent) => {
            const percentage =
              (progressEvent.loaded * 100) / progressEvent.total;
            setLoadingProgress(percentage);
          },
        });

        const { balanceEUR, balanceUSDT } = response.data;
        setBalances((prevBalances) => ({
          ...prevBalances,
          EUR: { ...prevBalances.EUR, available: balanceEUR },
          USDT: { ...prevBalances.USDT, available: balanceUSDT },
        }));
        setTotalAssetsEUR(balanceEUR);
        setTotalAssetsUSDT(balanceUSDT);
      } catch (error) {
        console.error("Error fetching wallet data:", error);
        setError(
          "No se pudo cargar la información de la billetera. Por favor, intenta de nuevo más tarde."
        );
      }
    };

    const fetchCryptoData = async () => {
      try {
        const cachedData = localStorage.getItem("cryptoData");
        const cachedTimestamp = localStorage.getItem("cryptoDataTimestamp");

        if (
          cachedData &&
          cachedTimestamp &&
          Date.now() - parseInt(cachedTimestamp) < CACHE_DURATION
        ) {
          updateBalances(JSON.parse(cachedData));
          return;
        }

        const response = await axios.get(
          "http://localhost:5000/api/crypto-data"
        );
        const data = response.data;

        localStorage.setItem("cryptoData", JSON.stringify(data));
        localStorage.setItem("cryptoDataTimestamp", Date.now().toString());

        updateBalances(data);
      } catch (error) {
        console.error("Error fetching crypto data:", error);
        setError(
          "No se pudo cargar la información de las criptomonedas. Por favor, intenta de nuevo más tarde."
        );
      }
    };

    fetchWalletData();
    fetchCryptoData();

    // Simulación de actualización en tiempo real
    const interval = setInterval(() => {
      updateRandomPrices();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const updateBalances = (data) => {
    setBalances((prevBalances) => {
      const updatedBalances = { ...prevBalances };
      data.forEach((crypto) => {
        const symbol = crypto.symbol.toUpperCase();
        if (updatedBalances[symbol]) {
          updatedBalances[symbol].image = crypto.image;
        }
      });
      return updatedBalances;
    });
  };

  const updateRandomPrices = () => {
    setBalances((prevBalances) => {
      const updatedBalances = { ...prevBalances };
      Object.keys(updatedBalances).forEach((currency) => {
        const randomChange = (Math.random() - 0.5) * 0.001;
        updatedBalances[currency].available *= 1 + randomChange;
      });
      return updatedBalances;
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const fetchWalletData = async () => {
        // ... (código existente de fetchWalletData)
      };
      const fetchCryptoData = async () => {
        // ... (código existente de fetchCryptoData)
      };
      await fetchWalletData();
      await fetchCryptoData();
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1000);
    }
  };

  const getCurrencyIcon = (currency) => {
    switch (currency) {
      case "BTC":
        return <FaBitcoin className="currency-icon bitcoin" />;
      case "ETH":
        return <FaEthereum className="currency-icon ethereum" />;
      case "EUR":
        return <FaEuroSign className="currency-icon euro" />;
      case "USDT":
        return <FaDollarSign className="currency-icon tether" />;
      default:
        return null;
    }
  };

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="error-container"
      >
        <div className="error-message">
          <FaExclamationTriangle />
          <p>{error}</p>
          <button onClick={handleRefresh}>Reintentar</button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="wallet-container">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="wallet-header"
      >
        <div className="header-content">
          <div className="title-section">
            <h1>Mi Billetera</h1>
            <p className="subtitle">Panel de Control</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="refresh-button"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <FaSync className={isRefreshing ? "spinning" : ""} />
          </motion.button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="balance-card main-balance"
      >
        <div className="balance-card-content">
          <div className="balance-info">
            <h2>Balance Total</h2>
            <motion.div
              className="total-amount"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <span className="currency-symbol">€</span>
              <span>{totalAssetsEUR.toFixed(2)}</span>
            </motion.div>
            <p className="usdt-equivalent">
              ≈ ${totalAssetsUSDT.toFixed(2)} USDT
            </p>
          </div>
          <div className="balance-chart">
            <motion.div
              className="trend-indicator positive"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <FaChartLine />
              <span>+2.4% esta semana</span>
            </motion.div>
          </div>
        </div>
        <div className="card-background-effect"></div>
      </motion.div>

      <div className="quick-actions">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="action-button deposit"
        >
          <div className="button-content">
            <FaArrowDown className="action-icon" />
            <span>Depositar</span>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="action-button withdraw"
        >
          <div className="button-content">
            <FaArrowUp className="action-icon" />
            <span>Retirar</span>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="action-button exchange"
        >
          <div className="button-content">
            <FaExchangeAlt className="action-icon" />
            <span>Intercambiar</span>
          </div>
        </motion.button>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="assets-grid"
      >
        <AnimatePresence>
          {Object.entries(balances).map(([currency, balance], index) => (
            <motion.div
              key={currency}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.1 }}
              className={`asset-card ${
                selectedCurrency === currency ? "selected" : ""
              }`}
              onClick={() => setSelectedCurrency(currency)}
              whileHover={{ scale: 1.02 }}
            >
              <div className="asset-card-header">
                {getCurrencyIcon(currency)}
                <h3>{currency}</h3>
              </div>

              <div className="asset-card-body">
                <div className="asset-amount">
                  <span className="amount-value">
                    {balance.available.toFixed(4)}
                  </span>
                  <span className="amount-label">Disponible</span>
                </div>

                <div className="asset-details">
                  <div className="detail-item">
                    <span className="detail-value">
                      {balance.frozen.toFixed(4)}
                    </span>
                    <span className="detail-label">Bloqueado</span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-value">
                      {(balance.available + balance.frozen).toFixed(4)}
                    </span>
                    <span className="detail-label">Total</span>
                  </div>
                </div>
              </div>

              <motion.div
                className="asset-card-footer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <button className="action-link">
                  Ver detalles
                  <FaChevronRight />
                </button>
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Wallet;
