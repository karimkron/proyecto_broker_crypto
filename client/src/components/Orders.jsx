import React, { useState, useEffect } from "react";
import axios from "axios";
import io from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaHistory,
  FaClock,
  FaSpinner,
  FaExclamationTriangle,
  FaChartLine,
  FaCheckCircle,
  FaHourglassHalf,
  FaDollarSign,
  FaCalendarAlt,
  FaClock as FaDuration,
} from "react-icons/fa";
import "../styles/pages/Orders.css";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const socket = io("http://localhost:5000", {
      auth: { token },
    });

    const fetchOrders = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/trades/orders",
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
                progress: data.progress,
                currentProfit: data.currentProfit,
              }
            : order
        )
      );
    });

    socket.on("orderComplete", (data) => {
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === data.orderId
            ? { ...order, status: "completada", finalProfit: data.finalProfit }
            : order
        )
      );
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      setError("Error de conexión. Por favor, recargue la página.");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="loading"
      >
        <FaSpinner className="loading-spinner" size={24} />
        <span>Cargando órdenes...</span>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="error-message"
      >
        <FaExclamationTriangle />
        <span>{error}</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="orders-container"
    >
      <motion.div
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        className="orders-header"
      >
        <h2>
          <FaHistory /> Historial de Órdenes
        </h2>
      </motion.div>

      {orders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="no-orders"
        >
          <FaClock size={48} />
          <p>No hay órdenes para mostrar.</p>
        </motion.div>
      ) : (
        <motion.div className="orders-list">
          <AnimatePresence>
            {orders.map((order, index) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.1 }}
                className="order-item"
              >
                <div className="order-header">
                  <div className="crypto-info">
                    <FaChartLine />
                    <span className="crypto-symbol">{order.cryptoSymbol}</span>
                  </div>
                  <div className="order-date">
                    <FaCalendarAlt />
                    {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="order-details">
                  <div className="detail-item">
                    <span className="detail-label">
                      <FaDollarSign /> Cantidad
                    </span>
                    <span className="detail-value">
                      ${order.amount.toFixed(2)}
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">
                      <FaDuration /> Duración
                    </span>
                    <span className="detail-value">{order.duration}</span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">
                      <FaChartLine /> Ganancia Estimada
                    </span>
                    <span className="detail-value">
                      ${order.estimatedProfit.toFixed(2)}
                    </span>
                  </div>

                  {order.status === "en progreso" ? (
                    <div className="order-progress-container">
                      <div className="order-progress">
                        <motion.div
                          className="progress-bar"
                          initial={{ width: "0%" }}
                          animate={{ width: `${(order.progress || 0) * 100}%` }}
                        />
                      </div>
                      <div className="current-profit">
                        <FaDollarSign />
                        {(order.currentProfit || 0).toFixed(2)}
                      </div>
                    </div>
                  ) : (
                    <div className="detail-item">
                      <span className="detail-label">
                        <FaCheckCircle /> Ganancia Final
                      </span>
                      <span
                        className={`detail-value ${
                          order.finalProfit > 0
                            ? "profit-positive"
                            : "profit-negative"
                        }`}
                      >
                        $
                        {order.finalProfit
                          ? order.finalProfit.toFixed(2)
                          : "N/A"}
                      </span>
                    </div>
                  )}

                  <div className="detail-item">
                    <motion.span
                      className={`order-status ${order.status}`}
                      whileHover={{ scale: 1.05 }}
                    >
                      {order.status === "en progreso" && <FaHourglassHalf />}
                      {order.status === "completada" && <FaCheckCircle />}
                      {order.status === "cancelada" && (
                        <FaExclamationTriangle />
                      )}
                      {" " + order.status}
                    </motion.span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Orders;
