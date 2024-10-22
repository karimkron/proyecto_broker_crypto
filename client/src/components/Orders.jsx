import React, { useState, useEffect } from "react";
import axios from "axios";
import io from "socket.io-client";
import "./Orders.css";

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
    return <div className="loading">Cargando órdenes...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="orders-container">
      <h2>Historial de Órdenes</h2>
      {orders.length === 0 ? (
        <p>No hay órdenes para mostrar.</p>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order._id} className="order-item">
              <div className="order-header">
                <span>{order.cryptoSymbol}</span>
                <span>{new Date(order.createdAt).toLocaleString()}</span>
              </div>
              <div className="order-details">
                <div>Cantidad: ${order.amount.toFixed(2)}</div>
                <div>Duración: {order.duration}</div>
                <div>
                  Ganancia Estimada: ${order.estimatedProfit.toFixed(2)}
                </div>
                {order.status === "en progreso" ? (
                  <div className="order-progress">
                    <div
                      className="progress-bar"
                      style={{ width: `${(order.progress || 0) * 100}%` }}
                    ></div>
                    <div className="current-profit">
                      ${(order.currentProfit || 0).toFixed(2)}
                    </div>
                  </div>
                ) : (
                  <div>
                    Ganancia Final: $
                    {order.finalProfit ? order.finalProfit.toFixed(2) : "N/A"}
                  </div>
                )}
                <div className={`order-status ${order.status}`}>
                  {order.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
