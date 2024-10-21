import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Orders.css";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5000/api/trades/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(response.data);
        setLoading(false);
      } catch (err) {
        setError("Error al cargar las órdenes");
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) return <div>Cargando órdenes...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="orders-container">
      <h2>Historial de Órdenes</h2>
      <table className="orders-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Criptomoneda</th>
            <th>Cantidad</th>
            <th>Duración</th>
            <th>Ganancia Estimada</th>
            <th>Ganancia Final</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order._id}>
              <td>{new Date(order.createdAt).toLocaleString()}</td>
              <td>{order.cryptoSymbol}</td>
              <td>${order.amount.toFixed(2)}</td>
              <td>{order.duration}</td>
              <td>${order.estimatedProfit.toFixed(2)}</td>
              <td>${order.finalProfit ? order.finalProfit.toFixed(2) : "En progreso"}</td>
              <td>{order.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Orders;