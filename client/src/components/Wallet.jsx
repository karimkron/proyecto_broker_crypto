// ====== IMPORTACIONES ======
import React, { useState, useEffect, useCallback, useRef } from "react";
import axiosInstance from "../utils/axiosConfig.js";
import { motion, AnimatePresence } from "framer-motion";

// Iconos
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
  FaArrowRight,
  FaPlus,
  FaMinus,
  FaExclamationTriangle,
  FaHistory,
  FaEllipsisH,
} from "react-icons/fa";

// Componentes
import ExchangeModal from "./ExchangeModal";
import TransferModal from "./modalTransferencias.jsx";
import TransactionHistory from "./TransactionHistory";

// Estilos
import "../styles/pages/Wallet.css";

// Constantes
const CACHE_DURATION = 120000; // 2 minutos
const REFRESH_INTERVAL = 10000; // 10 segundos

const initialBalances = {
  EUR: { available: 0, frozen: 0 },
  USDT: {
    available: 0,
    frozen: 0,
    image: "https://assets.coingecko.com/coins/images/325/small/Tether.png",
  },
  BTC: { available: 0, frozen: 0, image: "" },
  ETH: { available: 0, frozen: 0, image: "" },
};

const Wallet = () => {
  // ====== ESTADOS ======
  const [balances, setBalances] = useState(initialBalances);
  const [totalAssetsEUR, setTotalAssetsEUR] = useState(0);
  const [totalAssetsUSDT, setTotalAssetsUSDT] = useState(0);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showTransactionHistoryModal, setShowTransactionHistoryModal] =
    useState(false);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [activeDotIndex, setActiveDotIndex] = useState(0);
  const quickActionsRef = useRef(null);

  // ====== FUNCIONES AUXILIARES ======
  const formatCurrency = useCallback((value, currency) => {
    const decimals = currency === "EUR" || currency === "USDT" ? 2 : 8;
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  }, []);

  const getCurrencyIcon = useCallback((currency) => {
    const icons = {
      BTC: <FaBitcoin className="currency-icon bitcoin" />,
      ETH: <FaEthereum className="currency-icon ethereum" />,
      EUR: <FaEuroSign className="currency-icon euro" />,
      USDT: <FaDollarSign className="currency-icon tether" />,
    };
    return icons[currency] || null;
  }, []);

  const updateBalances = useCallback((data) => {
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
  }, []);

  // ====== FUNCIONES DE API ======
  const fetchWalletData = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/wallet", {
        onDownloadProgress: (progressEvent) => {
          const percentage = (progressEvent.loaded * 100) / progressEvent.total;
          setLoadingProgress(percentage);
        },
      });

      const { balanceEUR, balanceUSDT, balanceBTC, balanceETH } = response.data;

      setBalances((prevBalances) => ({
        ...prevBalances,
        EUR: { ...prevBalances.EUR, available: balanceEUR || 0 },
        USDT: { ...prevBalances.USDT, available: balanceUSDT || 0 },
        BTC: { ...prevBalances.BTC, available: balanceBTC || 0 },
        ETH: { ...prevBalances.ETH, available: balanceETH || 0 },
      }));

      setTotalAssetsEUR(balanceEUR || 0);
      setTotalAssetsUSDT(balanceUSDT || 0);
    } catch (error) {
      console.error("Error fetching wallet data:", error);
      handleApiError(error);
    }
  }, []);

  const fetchCryptoData = useCallback(async () => {
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

      const response = await axiosInstance.get("/crypto-data");
      const data = response.data;

      localStorage.setItem("cryptoData", JSON.stringify(data));
      localStorage.setItem("cryptoDataTimestamp", Date.now().toString());

      updateBalances(data);
    } catch (error) {
      console.error("Error fetching crypto data:", error);
      handleApiError(error);
    }
  }, [updateBalances]);

  const handleApiError = useCallback((error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      setError("Sesión expirada. Por favor, inicie sesión nuevamente.");
      window.location.href = "/login";
    } else {
      setError(
        "No se pudo cargar la información. Por favor, intente de nuevo más tarde."
      );
    }
  }, []);
  // ====== MANEJADORES DE EVENTOS ======
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([fetchWalletData(), fetchCryptoData()]);
    } catch (error) {
      console.error("Error refreshing data:", error);
      handleApiError(error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  }, [fetchWalletData, fetchCryptoData, handleApiError]);

  const handleExchangeComplete = useCallback((data) => {
    setBalances((prevBalances) => ({
      ...prevBalances,
      EUR: { ...prevBalances.EUR, available: data.newBalanceEUR || 0 },
      USDT: { ...prevBalances.USDT, available: data.newBalanceUSDT || 0 },
      BTC: { ...prevBalances.BTC, available: data.newBalanceBTC || 0 },
      ETH: { ...prevBalances.ETH, available: data.newBalanceETH || 0 },
    }));
    setTotalAssetsEUR(data.newBalanceEUR || 0);
    setTotalAssetsUSDT(data.newBalanceUSDT || 0);
  }, []);

  // ====== EFECTOS ======
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("No hay sesión activa. Por favor, inicie sesión.");
      window.location.href = "/login";
      return;
    }

    // Carga inicial de datos
    fetchWalletData();
    fetchCryptoData();

    // Configurar intervalos de actualización
    const walletInterval = setInterval(fetchWalletData, REFRESH_INTERVAL);
    const cryptoInterval = setInterval(fetchCryptoData, CACHE_DURATION);

    return () => {
      clearInterval(walletInterval);
      clearInterval(cryptoInterval);
    };
  }, [fetchWalletData, fetchCryptoData]);

  useEffect(() => {
    const handleScroll = () => {
      if (quickActionsRef.current) {
        const scrollPosition = quickActionsRef.current.scrollLeft;
        const width = quickActionsRef.current.offsetWidth;
        const index = Math.round(scrollPosition / width);
        setActiveDotIndex(index);
      }
    };

    const quickActions = quickActionsRef.current;
    if (quickActions) {
      quickActions.addEventListener("scroll", handleScroll);
      return () => quickActions.removeEventListener("scroll", handleScroll);
    }
  }, []);

  // ====== RENDERIZADO CONDICIONAL DE ERROR ======
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

  // ====== RENDERIZADO PRINCIPAL ======
  return (
    <>
      <div className="wallet-container">
        {/* Header */}
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

        {/* Balance Card */}
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
                <span>{formatCurrency(totalAssetsEUR, "EUR")}</span>
              </motion.div>
              <p className="usdt-equivalent">
                ≈ ${formatCurrency(totalAssetsUSDT, "USDT")} USDT
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

        {/* Quick Actions */}
        <div className="quick-actions-wrapper">
          <div className="quick-actions-scroll">
            <div className="quick-actions" ref={quickActionsRef}>
              <QuickActionButton
                icon={<FaArrowDown />}
                text="Depositar"
                onClick={() => {
                  /* Implementar lógica de depósito */
                }}
              />
              <QuickActionButton
                icon={<FaArrowRight />}
                text="Transferir"
                onClick={() => setShowTransferModal(true)}
              />
              <QuickActionButton
                icon={<FaHistory />}
                text="Transacciones"
                onClick={() => setShowTransactionHistoryModal(true)}
              />
              <QuickActionButton
                icon={<FaArrowUp />}
                text="Retirar"
                onClick={() => {
                  /* Implementar lógica de retiro */
                }}
              />
              <QuickActionButton
                icon={<FaExchangeAlt />}
                text="Intercambiar"
                onClick={() => setShowExchangeModal(true)}
              />
            </div>
            <div className="quick-actions-dots">
              <span
                className={`dot ${activeDotIndex === 0 ? "active" : ""}`}
              ></span>
              <span
                className={`dot ${activeDotIndex === 1 ? "active" : ""}`}
              ></span>
            </div>
          </div>
        </div>
        {/* Assets Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="assets-grid"
        >
          <AnimatePresence>
            {Object.entries(balances).map(([currency, balance], index) => (
              <AssetCard
                key={currency}
                currency={currency}
                balance={balance}
                index={index}
                isSelected={selectedCurrency === currency}
                onSelect={setSelectedCurrency}
                formatCurrency={formatCurrency}
                getCurrencyIcon={getCurrencyIcon}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Modales */}
      <AnimatePresence>
        {showExchangeModal && (
          <ExchangeModal
            isOpen={showExchangeModal}
            onClose={() => setShowExchangeModal(false)}
            onExchangeComplete={handleExchangeComplete}
            balances={balances}
            formatCurrency={formatCurrency}
          />
        )}
        {showTransferModal && (
          <TransferModal
            isOpen={showTransferModal}
            onClose={() => setShowTransferModal(false)}
            onTransferComplete={handleExchangeComplete}
            balances={balances}
            formatCurrency={formatCurrency}
          />
        )}
        {showTransactionHistoryModal && (
          <TransactionHistory
            isOpen={showTransactionHistoryModal}
            onClose={() => setShowTransactionHistoryModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

// Componentes auxiliares
const QuickActionButton = ({ icon, text, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className={`action-button ${text.toLowerCase()}`}
    onClick={onClick}
  >
    <div className="button-content">
      {icon}
      <span>{text}</span>
    </div>
  </motion.button>
);

const AssetCard = ({
  currency,
  balance,
  index,
  isSelected,
  onSelect,
  formatCurrency,
  getCurrencyIcon,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{ delay: index * 0.1 }}
    className={`asset-card ${isSelected ? "selected" : ""}`}
    onClick={() => onSelect(currency)}
    whileHover={{ scale: 1.02 }}
  >
    <div className="asset-card-header">
      {getCurrencyIcon(currency)}
      <h3>{currency}</h3>
    </div>
    <div className="asset-card-body">
      <div className="asset-amount">
        <span className="amount-value">
          {formatCurrency(balance.available, currency)}
        </span>
        <span className="amount-label">Disponible</span>
      </div>
      <div className="asset-details">
        <div className="detail-item">
          <span className="detail-value">
            {formatCurrency(balance.frozen, currency)}
          </span>
          <span className="detail-label">Bloqueado</span>
        </div>
        <div className="detail-item">
          <span className="detail-value">
            {formatCurrency(balance.available + balance.frozen, currency)}
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
);

export default Wallet;
