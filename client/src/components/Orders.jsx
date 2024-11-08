import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaHistory } from "react-icons/fa";
import io from "socket.io-client";
import axios from "axios";
import "../styles/pages/Orders.css";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getMaxPriceVariation = (symbol, initialPrice) => {
    const symbolLower = symbol.toLowerCase();
    if (symbolLower === "btc") {
      return Math.random() * 900 + 300;
    } else if (symbolLower === "eth") {
      return Math.random() * 80 + 20;
    } else if (initialPrice < 1) {
      return Math.random() * 0.02 + 0.01;
    } else {
      return initialPrice * (Math.random() * 0.004 + 0.001);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const socket = io(`${import.meta.env.VITE_API_URL}`, {
      auth: { token },
    });

    const fetchOrders = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/trades/orders`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setOrders(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError("Error al cargar las órdenes. Por favor, intente nuevamente.");
        setLoading(false);
      }
    };

    fetchOrders();

    socket.on("orderUpdate", (data) => {
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === data.orderId
            ? {
                ...order,
                displaySymbol: data.displaySymbol || order.displaySymbol,
                currentPrice: data.currentPrice,
                progress: data.progress,
              }
            : order
        )
      );
    });

    socket.on("orderComplete", (data) => {
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === data.orderId
            ? {
                ...order,
                status: "completada",
                displaySymbol: data.displaySymbol || order.displaySymbol,
                displayFinalPrice: data.finalPrice,
                finalPrice: data.finalPrice,
                result: data.result,
              }
            : order
        )
      );
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const LiveOrder = ({ order }) => {
    const [displayPrice, setDisplayPrice] = useState(
      order.displayInitialPrice || order.initialPrice
    );
    const [currentProfit, setCurrentProfit] = useState(0);
    const [priceDirection, setPriceDirection] = useState(null);

    useEffect(() => {
      if (order.status === "en progreso") {
        const startTime = new Date(order.createdAt).getTime();
        const duration = getDurationInMs(order.duration);
        const targetProfit = (order.amount * order.profitPercentage) / 100;
        const maxPriceChange = getMaxPriceVariation(
          order.displaySymbol || order.cryptoSymbol,
          order.displayInitialPrice || order.initialPrice
        );

        const interval = setInterval(() => {
          const now = Date.now();
          const elapsed = now - startTime;
          const remaining = duration - elapsed;

          if (remaining <= 0) {
            clearInterval(interval);
            if (order.willProfit) {
              setCurrentProfit(targetProfit);
              setDisplayPrice(
                (order.displayInitialPrice || order.initialPrice) +
                  maxPriceChange
              );
            } else {
              setCurrentProfit(-order.amount);
              setDisplayPrice(
                Math.max(
                  (order.displayInitialPrice || order.initialPrice) -
                    maxPriceChange,
                  (order.displayInitialPrice || order.initialPrice) * 0.7
                )
              );
            }
          } else {
            const progress = elapsed / duration;
            const smoothProgress = Math.pow(progress, 0.5);

            if (order.willProfit) {
              const profitProgress =
                smoothProgress + Math.random() * 0.1 * smoothProgress;
              const currentAmount = targetProfit * profitProgress;
              setCurrentProfit(Math.min(currentAmount, targetProfit));

              const priceChange = maxPriceChange * smoothProgress;
              const noise = maxPriceChange * 0.01 * (Math.random() - 0.5);
              const newPrice =
                (order.displayInitialPrice || order.initialPrice) +
                priceChange +
                noise;
              setDisplayPrice(newPrice);
              setPriceDirection("up");
            } else {
              const lossProgress = smoothProgress;
              setCurrentProfit(-order.amount * lossProgress);

              const priceChange = maxPriceChange * lossProgress;
              const noise = maxPriceChange * 0.01 * (Math.random() - 0.5);
              const newPrice = Math.max(
                (order.displayInitialPrice || order.initialPrice) -
                  priceChange +
                  noise,
                (order.displayInitialPrice || order.initialPrice) * 0.7
              );
              setDisplayPrice(newPrice);
              setPriceDirection("down");
            }
          }
        }, 100);

        return () => clearInterval(interval);
      }
    }, [order]);

    return (
      <>
        <div className="order-symbol">
          {(order.displaySymbol || order.cryptoSymbol).toUpperCase()}/USDT
        </div>
        <div className={`order-type ${order.orderType}`}>
          {order.orderType} {formatAmount(order.amount)}
        </div>
        <div className="price-range">
          <span>
            {formatPrice(order.displayInitialPrice || order.initialPrice)}
          </span>
          <span className="price-arrow">→</span>
          <span className={`price-value ${priceDirection}`}>
            {formatPrice(
              order.status === "completada"
                ? order.displayFinalPrice || order.finalPrice
                : displayPrice
            )}
          </span>
        </div>
        <div className="order-time">{formatTime(order.createdAt)}</div>
        <div
          className={`profit-display ${
            order.willProfit ? "positive" : "negative"
          }`}
        >
          {order.status === "completada"
            ? formatProfit(order.result)
            : formatProfit(currentProfit)}
        </div>
      </>
    );
  };

  const getDurationInMs = (duration) => {
    const durationMap = {
      "30S": 30 * 1000,
      "60S": 60 * 1000,
      "120S": 120 * 1000,
    };
    return durationMap[duration] || 30 * 1000;
  };

  const formatTime = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const formatPrice = (price) => {
    if (!price || isNaN(price)) return "0.00000";
    return price.toFixed(5);
  };

  const formatAmount = (amount) => {
    if (!amount || isNaN(amount)) return "0.00";
    return amount.toFixed(2);
  };

  const formatProfit = (profit) => {
    if (!profit || isNaN(profit)) return "+0.00";
    return profit >= 0
      ? `+${profit.toFixed(2)}`
      : `-${Math.abs(profit).toFixed(2)}`;
  };

  if (loading) return <div className="loading">Cargando órdenes...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="orders-page-container">
      <div className="orders-container">
        <div className="orders-header">
          <h2>
            <FaHistory /> Historial de Trades
          </h2>
        </div>

        <div className="orders-list">
          <AnimatePresence>
            {orders.map((order) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="order-item"
              >
                <div className="order-row">
                  <LiveOrder order={order} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Orders;
