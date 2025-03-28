import React, { useState, useEffect } from "react";
import { FaArrowLeft } from "react-icons/fa";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/pages/TradeModal.css";

const TradeModal = ({ cryptoData, tradeType, onClose }) => {
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState("30S");
  const [userBalance, setUserBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profitPercentages, setProfitPercentages] = useState({});
  const [estimatedProfit, setEstimatedProfit] = useState(0);
  const [currentPrice, setCurrentPrice] = useState(cryptoData.current_price);
  const [priceDirection, setPriceDirection] = useState(null);
  const navigate = useNavigate();

  // Función para generar variación de precio aleatoria
  const generatePriceVariation = (basePrice) => {
    const variation = (Math.random() - 0.5) * 0.0001;
    return basePrice + variation;
  };

  // Efecto para la actualización del precio en tiempo real
  useEffect(() => {
    setCurrentPrice(cryptoData.current_price);

    const interval = setInterval(() => {
      setCurrentPrice((prevPrice) => {
        const newPrice = generatePriceVariation(prevPrice);
        setPriceDirection(newPrice > prevPrice ? "up" : "down");
        return newPrice;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [cryptoData.current_price]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        const [balanceResponse, percentagesResponse] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/wallet`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(
            `${import.meta.env.VITE_API_URL}/api/users/profit-percentages`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          ),
        ]);
        setUserBalance(balanceResponse.data.balanceUSDT);
        setProfitPercentages(percentagesResponse.data);
        setLoading(false);
      } catch (err) {
        setError("Error al cargar los datos del usuario");
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    if (amount && duration && profitPercentages[duration]) {
      const profit = (parseFloat(amount) * profitPercentages[duration]) / 100;
      setEstimatedProfit(profit);
    } else {
      setEstimatedProfit(0);
    }
  }, [amount, duration, profitPercentages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (parseFloat(amount) > userBalance) {
      setError("Saldo insuficiente");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const orderData = {
        cryptoSymbol: cryptoData.symbol,
        orderType: tradeType,
        amount: parseFloat(amount),
        duration,
        initialPrice: currentPrice,
        profitPercentage: profitPercentages[duration],
      };

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/trades/trade`,
        orderData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Orden enviada:", response.data);
      onClose();
      navigate("/orders");
    } catch (err) {
      console.error("Error al enviar la orden:", err);
      setError(err.response?.data?.msg || "Error al procesar la orden");
    }
  };

  const formatPrice = (price) => {
    if (typeof price !== "number") return "0.0000";
    return price.toFixed(4);
  };

  const getPriceClassName = () => {
    return `current-price ${
      priceDirection === "up"
        ? "price-increase"
        : priceDirection === "down"
        ? "price-decrease"
        : ""
    }`;
  };

  if (loading) return <div>Cargando...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="trade-modal-overlay">
      <div className="trade-modal">
        <div className="modal-header">
          <FaArrowLeft className="back-arrow" onClick={onClose} />
          <h2>{cryptoData.symbol.toUpperCase()}/USDT</h2>
        </div>
        <div className="trade-info">
          <div className="info-row">
            <span>Nombre del producto</span>
            <span>{cryptoData.symbol.toUpperCase()}/USDT</span>
          </div>
          <div className="info-row">
            <span>Precio actual</span>
            <span className={getPriceClassName()}>
              ${formatPrice(currentPrice)}
            </span>
          </div>
          <div className="info-row">
            <span>Dirección</span>
            <span className="direction">
              {tradeType === "buy" ? "Compra" : "Venta"}
            </span>
          </div>
          <div className="info-row">
            <span>Tarifa</span>
            <span>0%</span>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tiempo de negociación</label>
            <div className="duration-buttons">
              {Object.entries(profitPercentages).map(([key, value]) => (
                <button
                  key={key}
                  type="button"
                  className={duration === key ? "active" : ""}
                  onClick={() => setDuration(key)}
                >
                  <span className="duration-label">{key}</span>
                  <span className="duration-scale">Escala:{value}%</span>
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>
              Saldo disponible:{" "}
              <span className="balance">{userBalance.toFixed(4)} USDT</span>
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Ingrese el monto"
              required
              min="0.01"
              step="0.01"
              max={userBalance}
            />
          </div>
          {/*  <div className="form-group">
            <label>Ganancia estimada: {estimatedProfit.toFixed(4)} USDT</label>
          </div> */}
          <button type="submit" className="submit-trade">
            Confirmación del pedido
          </button>
        </form>
      </div>
    </div>
  );
};

export default TradeModal;
