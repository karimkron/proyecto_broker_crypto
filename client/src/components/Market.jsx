import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaWallet, FaExchangeAlt, FaHeadset } from "react-icons/fa";
import TradeModal from "./TradeModal";
import "./Market.css";

const Market = () => {
  const [cryptocurrencies, setCryptocurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [tradeType, setTradeType] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCryptoPrices = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(
          "http://localhost:5000/api/crypto-data"
        );
        setCryptocurrencies(response.data);
      } catch (error) {
        console.error("Error fetching crypto data:", error);
        setError(
          "No se pudo cargar la información de las criptomonedas. Por favor, intenta de nuevo más tarde."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCryptoPrices();
    const interval = setInterval(fetchCryptoPrices, 60000); // Actualizar cada minuto
    return () => clearInterval(interval);
  }, []);

  const handleCryptoSelect = (crypto) => {
    navigate(`/crypto/${crypto.id}`);
  };

  const handleTradeClick = (e, crypto, type) => {
    e.stopPropagation();
    setSelectedCrypto(crypto);
    setTradeType(type);
  };

  if (loading) return <div className="loading">Cargando...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="market">
      <div className="top-cryptos">
        {cryptocurrencies.slice(0, 3).map((crypto) => (
          <div key={crypto.id} className="top-crypto-item">
            <div className="crypto-symbol">
              {crypto.symbol.toUpperCase()}/USDT
            </div>
            <div className="crypto-price">
              {crypto.current_price.toFixed(4)}
            </div>
            <div
              className={`crypto-change ${
                crypto.price_change_percentage_24h > 0 ? "positive" : "negative"
              }`}
            >
              {crypto.price_change_percentage_24h.toFixed(2)}%
            </div>
          </div>
        ))}
      </div>
      <div className="action-buttons">
        <button>
          <FaWallet /> Recarga
        </button>
        <button>
          <FaExchangeAlt /> Retirada
        </button>
        <button>
          <FaHeadset /> Servicio al cliente
        </button>
      </div>
      <div className="crypto-list">
        {cryptocurrencies.map((crypto) => (
          <div
            key={crypto.id}
            className="crypto-item"
            onClick={() => handleCryptoSelect(crypto)}
          >
            <img src={crypto.image} alt={crypto.name} className="crypto-icon" />
            <div className="crypto-info">
              <span className="crypto-symbol">
                {crypto.symbol.toUpperCase()}/USDT
              </span>
              <span className="crypto-price">
                {crypto.current_price.toFixed(4)}
              </span>
              <span
                className={`crypto-change ${
                  crypto.price_change_percentage_24h > 0
                    ? "positive"
                    : "negative"
                }`}
              >
                {crypto.price_change_percentage_24h.toFixed(2)}%
              </span>
            </div>
            <div className="trade-buttons">
              <button onClick={(e) => handleTradeClick(e, crypto, "buy")}>
                Comprar
              </button>
              <button onClick={(e) => handleTradeClick(e, crypto, "sell")}>
                Vender
              </button>
            </div>
          </div>
        ))}
      </div>
      {selectedCrypto && (
        <TradeModal
          cryptoData={selectedCrypto}
          tradeType={tradeType}
          onClose={() => setSelectedCrypto(null)}
        />
      )}
    </div>
  );
};

export default Market;
