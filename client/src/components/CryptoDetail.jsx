import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { FaArrowLeft, FaChartLine } from "react-icons/fa";
import { motion } from "framer-motion";
import TradeModal from "./TradeModal";
import "../styles/pages/CryptoDetail.css";

const timeRanges = [
  { label: "1M", days: 1 / 1440 },
  { label: "5M", days: 5 / 1440 },
  { label: "30M", days: 30 / 1440 },
  { label: "1H", days: 1 / 24 },
  { label: "4H", days: 4 / 24 },
  { label: "1D", days: 1 },
];

// Datos de respaldo
const fallbackChartData = Array(24)
  .fill(0)
  .map((_, i) => ({
    timestamp: Date.now() - (23 - i) * 3600000,
    open: 35000 + Math.random() * 1000,
    high: 36000 + Math.random() * 1000,
    low: 34000 + Math.random() * 1000,
    close: 35500 + Math.random() * 1000,
  }));

const CryptoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cryptoData, setCryptoData] = useState(null);
  const [chartData, setChartData] = useState(fallbackChartData);
  const [loading, setLoading] = useState(true);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeType, setTradeType] = useState("");
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRanges[0]);
  const [simulatedOrders, setSimulatedOrders] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [priceDirection, setPriceDirection] = useState(null);
  const retryTimeoutRef = useRef(null);
  const requestCountRef = useRef(0);

  // Función para generar variación de precio aleatoria con menos volatilidad
  const generatePriceVariation = useCallback((basePrice) => {
    const variation = (Math.random() - 0.5) * 0.0002;
    return basePrice * (1 + variation);
  }, []);

  // Configuración de axios con interceptor para el token
  const axiosInstance = axios.create();
  axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Efecto para la actualización del precio en tiempo real
  useEffect(() => {
    if (cryptoData) {
      const basePrice = cryptoData.current_price || 35000;
      setCurrentPrice(basePrice);

      const interval = setInterval(() => {
        setCurrentPrice((prevPrice) => {
          const newPrice = generatePriceVariation(prevPrice);
          setPriceDirection(newPrice > prevPrice ? "up" : "down");
          return newPrice;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [cryptoData, generatePriceVariation]);

  // Función para manejar errores de la API
  const handleApiError = useCallback(
    (error) => {
      console.warn("API Error:", error.message);
      if (error.response?.status === 401) {
        // Error de autenticación - redirigir al login
        navigate("/login");
      } else if (error.response?.status === 429) {
        // Rate limit - usar datos de respaldo y reintentar después
        requestCountRef.current++;
        const retryAfter = Math.min(requestCountRef.current * 5000, 30000);
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
        retryTimeoutRef.current = setTimeout(() => {
          requestCountRef.current = 0;
        }, retryAfter);
      }
    },
    [navigate]
  );

  // Efecto para cargar datos de la criptomoneda
  useEffect(() => {
    const fetchCryptoData = async () => {
      try {
        if (requestCountRef.current > 5) {
          return; // Evitar demasiados reintentos
        }

        const [detailResponse, historyResponse] = await Promise.all([
          axiosInstance.get(`${import.meta.env.VITE_API_URL}/api/crypto/${id}`),
          axiosInstance.get(
            `${import.meta.env.VITE_API_URL}/api/crypto/${id}/history?days=${
              selectedTimeRange.days
            }`
          ),
        ]);

        setCryptoData(detailResponse.data);
        setChartData(historyResponse.data);
        requestCountRef.current = 0;
      } catch (error) {
        handleApiError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchCryptoData();

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [id, selectedTimeRange, handleApiError]);

  // Efecto para simular órdenes
  useEffect(() => {
    const generateSimulatedOrder = () => ({
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      direction: Math.random() > 0.5 ? "Compra" : "Venta",
      price: (currentPrice || 35000).toFixed(2),
      amount: (Math.random() * 0.5 + 0.1).toFixed(4),
    });

    setSimulatedOrders([
      generateSimulatedOrder(),
      generateSimulatedOrder(),
      generateSimulatedOrder(),
      generateSimulatedOrder(),
      generateSimulatedOrder(),
    ]);

    const interval = setInterval(() => {
      setSimulatedOrders((prev) => [
        generateSimulatedOrder(),
        ...prev.slice(0, 4),
      ]);
    }, 3000);

    return () => clearInterval(interval);
  }, [currentPrice]);

  const handleTrade = (type) => {
    setTradeType(type);
    setShowTradeModal(true);
  };

  const formatXAxis = (timestamp) => {
    const date = new Date(timestamp);
    return selectedTimeRange.days <= 1
      ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : date.toLocaleDateString();
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p>{`Tiempo: ${new Date(label).toLocaleString()}`}</p>
          <p>{`Apertura: $${Number(data.open).toFixed(2)}`}</p>
          <p>{`Máximo: $${Number(data.high).toFixed(2)}`}</p>
          <p>{`Mínimo: $${Number(data.low).toFixed(2)}`}</p>
          <p>{`Cierre: $${Number(data.close).toFixed(2)}`}</p>
        </div>
      );
    }
    return null;
  };

  const formatPrice = (price) => {
    if (typeof price !== "number") return "0.00";
    return price.toFixed(2);
  };

  const getPriceClassName = () => {
    return `crypto-price ${
      priceDirection === "up"
        ? "crypto-price-increase"
        : priceDirection === "down"
        ? "crypto-price-decrease"
        : ""
    }`;
  };

  if (loading) {
    return (
      <div className="crypto-detail">
        <div className="loading">
          <FaChartLine className="loading-icon" />
        </div>
      </div>
    );
  }

  return (
    <div className="crypto-detail">
      <motion.div
        className="back-arrow"
        onClick={() => navigate(-1)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <FaArrowLeft />
      </motion.div>

      <div className="header">
        <h1>{(cryptoData?.symbol || id).toUpperCase()}/USDT</h1>
        <div className="crypto-info">
          <p className={getPriceClassName()}>${formatPrice(currentPrice)}</p>
          <p
            className={
              (cryptoData?.price_change_percentage_24h || 0) > 0
                ? "positive"
                : "negative"
            }
          >
            {(cryptoData?.price_change_percentage_24h || 0) > 0 ? "+" : ""}
            {(cryptoData?.price_change_percentage_24h || 0).toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="main-content">
        <div className="chart-container">
          <div className="time-range-buttons">
            {timeRanges.map((range) => (
              <motion.button
                key={range.label}
                onClick={() => setSelectedTimeRange(range)}
                className={
                  selectedTimeRange.label === range.label ? "active" : ""
                }
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {range.label}
              </motion.button>
            ))}
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatXAxis}
                minTickGap={30}
                tick={{ fontSize: 10 }}
              />
              <YAxis
                domain={["auto", "auto"]}
                orientation="right"
                tick={{ fontSize: 10 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="low" fill="transparent" />
              <Bar dataKey="high" fill="transparent" />
              {chartData.map((entry, index) => (
                <ReferenceLine
                  key={`candle-${index}`}
                  segment={[
                    { x: entry.timestamp, y: entry.low },
                    { x: entry.timestamp, y: entry.high },
                  ]}
                  stroke={entry.open > entry.close ? "#e74c3c" : "#2ecc71"}
                  strokeWidth={2}
                />
              ))}
              {chartData.map((entry, index) => (
                <ReferenceLine
                  key={`body-${index}`}
                  segment={[
                    { x: entry.timestamp, y: entry.open },
                    { x: entry.timestamp, y: entry.close },
                  ]}
                  stroke={entry.open > entry.close ? "#e74c3c" : "#2ecc71"}
                  strokeWidth={4}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="trade-section">
          <div className="trade-buttons">
            <motion.button
              className="buy-button"
              onClick={() => handleTrade("buy")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Comprar
            </motion.button>
            <motion.button
              className="sell-button"
              onClick={() => handleTrade("sell")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Vender
            </motion.button>
          </div>
          <div className="simulated-orders">
            <div className="title-orders">
              <p>Tiempo</p>
              <p>Dirección</p>
              <p>Precio</p>
              <p>Cantidad</p>
            </div>
            <div className="orders-container">
              {simulatedOrders.map((order, index) => (
                <motion.div
                  key={index}
                  className="order-row"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <span>{order.time}</span>
                  <span
                    className={
                      order.direction === "Compra" ? "positive" : "negative"
                    }
                  >
                    {order.direction}
                  </span>
                  <span>${order.price}</span>
                  <span>{order.amount}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showTradeModal && (
        <TradeModal
          cryptoData={cryptoData}
          tradeType={tradeType}
          onClose={() => setShowTradeModal(false)}
          currentPrice={currentPrice}
        />
      )}
    </div>
  );
};

export default CryptoDetail;
