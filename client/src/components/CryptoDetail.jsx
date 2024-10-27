import React, { useState, useEffect } from "react";
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

const CryptoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cryptoData, setCryptoData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeType, setTradeType] = useState("");
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRanges[0]);
  const [simulatedOrders, setSimulatedOrders] = useState([]);

  useEffect(() => {
    const fetchCryptoData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [detailResponse, historyResponse] = await Promise.all([
          axios.get(`http://localhost:5000/api/crypto/${id}`),
          axios.get(
            `http://localhost:5000/api/crypto/${id}/history?days=${selectedTimeRange.days}`
          ),
        ]);
        setCryptoData(detailResponse.data);
        setChartData(historyResponse.data);
      } catch (error) {
        console.error("Error fetching crypto data:", error);
        setError(
          "No se pudo cargar la información de la criptomoneda. Por favor, intente más tarde."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCryptoData();
  }, [id, selectedTimeRange]);

  useEffect(() => {
    if (!cryptoData) return;

    const generateSimulatedOrder = () => {
      const direction = Math.random() > 0.5 ? "Compra" : "Venta";
      const price = cryptoData.current_price;
      const amount = (Math.random() * 0.5 + 0.1).toFixed(4);
      return {
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        direction,
        price: price.toFixed(2),
        amount,
      };
    };

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
  }, [cryptoData]);

  const handleTrade = (type) => {
    setTradeType(type);
    setShowTradeModal(true);
  };

  const formatXAxis = (timestamp) => {
    const date = new Date(timestamp);
    if (selectedTimeRange.days <= 1) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString();
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p>{`Tiempo: ${new Date(label).toLocaleString()}`}</p>
          <p>{`Apertura: $${data.open.toFixed(2)}`}</p>
          <p>{`Máximo: $${data.high.toFixed(2)}`}</p>
          <p>{`Mínimo: $${data.low.toFixed(2)}`}</p>
          <p>{`Cierre: $${data.close.toFixed(2)}`}</p>
        </div>
      );
    }
    return null;
  };

  if (loading)
    return (
      <div className="loading">
        <FaChartLine size={24} />
      </div>
    );

  if (error) return <div className="error-message">{error}</div>;

  if (!cryptoData || chartData.length === 0)
    return (
      <div className="error-message">
        No se pudo cargar la información. Por favor, intente más tarde.
      </div>
    );

  return (
    <div className="crypto-detail">
      <div className="back-arrow" onClick={() => navigate(-1)}>
        <FaArrowLeft />
      </div>

      <div className="header">
        <h1>{cryptoData.symbol.toUpperCase()}/USDT</h1>
        <div className="crypto-info">
          <p>${cryptoData.current_price.toFixed(2)}</p>
          <p
            className={
              cryptoData.price_change_percentage_24h > 0
                ? "positive"
                : "negative"
            }
          >
            {cryptoData.price_change_percentage_24h > 0 ? "+" : ""}
            {cryptoData.price_change_percentage_24h.toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="main-content">
        <div className="chart-container">
          <div className="time-range-buttons">
            {timeRanges.map((range) => (
              <button
                key={range.label}
                onClick={() => setSelectedTimeRange(range)}
                className={
                  selectedTimeRange.label === range.label ? "active" : ""
                }
              >
                {range.label}
              </button>
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
      </div>

      <div className="trade-section">
        <div className="simulated-orders">
          <div className="title-orders">
            <p>Tiempo</p>
            <p>Dirección</p>
            <p>Precio</p>
            <p>Cantidad</p>
          </div>
          <table>
            <tbody className="orders-position">
              {simulatedOrders.map((order, index) => (
                <tr key={index}>
                  <td>{order.time}</td>
                  <td
                    className={
                      order.direction === "Compra" ? "positive" : "negative"
                    }
                  >
                    {order.direction}
                  </td>
                  <td>${order.price}</td>
                  <td>{order.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="trade-buttons">
          <button className="buy-button" onClick={() => handleTrade("buy")}>
            Comprar
          </button>
          <button className="sell-button" onClick={() => handleTrade("sell")}>
            Vender
          </button>
        </div>
      </div>

      {showTradeModal && (
        <TradeModal
          cryptoData={cryptoData}
          tradeType={tradeType}
          onClose={() => setShowTradeModal(false)}
        />
      )}
    </div>
  );
};

export default CryptoDetail;
