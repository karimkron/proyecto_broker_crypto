import React, { useState, useEffect, useCallback, memo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axiosInstance from "../utils/axiosConfig";
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

// Datos de respaldo
const fallbackData = [
  {
    id: "bitcoin",
    symbol: "btc",
    name: "Bitcoin",
    image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
    current_price: 35000,
    price_change_percentage_24h: 2.5,
  },
  {
    id: "ethereum",
    symbol: "eth",
    name: "Ethereum",
    image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
    current_price: 2000,
    price_change_percentage_24h: 1.8,
  },
];

// Componentes memorizados para prevenir re-renders innecesarios
const PriceDisplay = memo(({ price }) => {
  const formattedPrice =
    typeof price === "number"
      ? price.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 6,
        })
      : "0.00";

  return <div className="crypto-price">${formattedPrice}</div>;
});

const PercentageChange = memo(({ percentage }) => {
  const isPositive = percentage > 0;
  return (
    <div className={`crypto-change ${isPositive ? "positive" : "negative"}`}>
      {isPositive ? <FaArrowUp size={12} /> : <FaArrowDown size={12} />}
      {Math.abs(percentage).toFixed(2)}%
    </div>
  );
});

const CryptoItem = memo(({ crypto, onSelect, priceVariation }) => {
  return (
    <motion.div
      className="crypto-item"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      onClick={() => onSelect(crypto)}
      layout
    >
      <img
        src={crypto.image}
        alt={crypto.name}
        className="crypto-icon"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = "/fallback-crypto-icon.png";
        }}
      />
      <div className="crypto-info">
        <div className="crypto-symbol">{crypto.symbol.toUpperCase()}/USDT</div>
        <PriceDisplay price={priceVariation || crypto.current_price} />
        <PercentageChange percentage={crypto.price_change_percentage_24h} />
      </div>
    </motion.div>
  );
});

const TopCryptoItem = memo(({ crypto, priceVariation }) => {
  return (
    <motion.div
      className="top-crypto-item"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      layout
    >
      <div className="crypto-symbol">{crypto.symbol.toUpperCase()}/USDT</div>
      <PriceDisplay price={priceVariation || crypto.current_price} />
      <PercentageChange percentage={crypto.price_change_percentage_24h} />
    </motion.div>
  );
});

const QuickActionButton = memo(({ icon: Icon, text, onClick, className }) => (
  <motion.button
    className={`action-button ${className}`}
    onClick={onClick}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    <div className="button-content">
      <Icon className="action-icon" />
      <span>{text}</span>
    </div>
  </motion.button>
));
const Market = () => {
  const [cryptocurrencies, setCryptocurrencies] = useState(fallbackData);
  const [loading, setLoading] = useState(true);
  const [priceVariations, setPriceVariations] = useState({});
  const [retryCount, setRetryCount] = useState(0);
  const priceUpdateInterval = useRef(null);
  const navigate = useNavigate();

  // Función para generar variación de precio con menos volatilidad
  const generatePriceVariation = useCallback((basePrice) => {
    const variation = (Math.random() - 0.5) * 0.00001;
    return Number((basePrice * (1 + variation)).toFixed(4));
  }, []);

  // Fetch de datos iniciales
  const fetchCryptoPrices = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axiosInstance.get("/crypto-data");
      if (response.data && response.data.length > 0) {
        setCryptocurrencies(response.data);
        // Inicializar variaciones de precio
        const initialVariations = {};
        response.data.forEach((crypto) => {
          initialVariations[crypto.id] = crypto.current_price;
        });
        setPriceVariations(initialVariations);
        setRetryCount(0);
      }
    } catch (error) {
      console.warn("Using fallback data:", error.message);
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount((prev) => prev + 1);
        }, 5000 * Math.pow(2, retryCount));
      }
    } finally {
      setLoading(false);
    }
  }, [retryCount]);

  // Efecto para actualizar solo los precios
  useEffect(() => {
    if (cryptocurrencies.length > 0) {
      priceUpdateInterval.current = setInterval(() => {
        setPriceVariations((prev) => {
          const newVariations = { ...prev };
          Object.keys(newVariations).forEach((cryptoId) => {
            const currentPrice = newVariations[cryptoId];
            newVariations[cryptoId] = generatePriceVariation(currentPrice);
          });
          return newVariations;
        });
      }, 2000); // Actualización cada 2 segundos para reducir la carga
    }

    return () => {
      if (priceUpdateInterval.current) {
        clearInterval(priceUpdateInterval.current);
      }
    };
  }, [cryptocurrencies, generatePriceVariation]);

  // Efecto para datos iniciales y actualizaciones periódicas
  useEffect(() => {
    fetchCryptoPrices();
    const dataInterval = setInterval(fetchCryptoPrices, 60000); // Actualizar datos completos cada minuto

    return () => clearInterval(dataInterval);
  }, [fetchCryptoPrices]);

  const handleCryptoSelect = useCallback(
    (crypto) => {
      navigate(`/crypto/${crypto.id}`);
    },
    [navigate]
  );

  if (loading) {
    return (
      <div className="market-container">
        <div className="loading-skeleton">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-item" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="market-page-container">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="market-container"
      >
        {/* Top Cryptos Section */}
        <motion.div className="top-cryptos">
          {cryptocurrencies.slice(0, 3).map((crypto) => (
            <TopCryptoItem
              key={crypto.id}
              crypto={crypto}
              priceVariation={priceVariations[crypto.id]}
            />
          ))}
        </motion.div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <QuickActionButton
            icon={FaDeposit}
            text="Depositar"
            className="deposit"
            onClick={() => navigate("/wallet")}
          />
          <QuickActionButton
            icon={FaExchangeAlt}
            text="Retirar"
            className="withdraw"
            onClick={() => navigate("/wallet")}
          />
          <QuickActionButton
            icon={FaPhoneAlt}
            text="Soporte"
            className="support"
            onClick={() => navigate("/support")}
          />
        </div>

        {/* Crypto List */}
        <motion.div className="crypto-list" layout>
          {cryptocurrencies.map((crypto) => (
            <CryptoItem
              key={crypto.id}
              crypto={crypto}
              onSelect={handleCryptoSelect}
              priceVariation={priceVariations[crypto.id]}
            />
          ))}
        </motion.div>

        {/* Notification for API limits */}
        {retryCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="floating-info"
          >
            Actualizando datos...
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Market;
