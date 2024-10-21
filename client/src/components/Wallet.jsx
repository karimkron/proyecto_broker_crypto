import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaWallet,
  FaExchangeAlt,
  FaExchangeAlt as FaSwap,
  FaHeadset,
} from "react-icons/fa";
import "./Wallet.css";

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos en milisegundos

const Wallet = () => {
  const [balances, setBalances] = useState({
    EUR: { available: 0, frozen: 0 },
    USDT: {
      available: 0,
      frozen: 0,
      image: "https://assets.coingecko.com/coins/images/325/small/Tether.png",
    },
    BTC: { available: 0, frozen: 0, image: "" },
    ETH: { available: 0, frozen: 0, image: "" },
  });

  const [totalAssetsEUR, setTotalAssetsEUR] = useState(0);
  const [totalAssetsUSDT, setTotalAssetsUSDT] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5000/api/wallet", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const { balanceEUR, balanceUSDT } = response.data;
        setBalances((prevBalances) => ({
          ...prevBalances,
          EUR: { ...prevBalances.EUR, available: balanceEUR },
          USDT: { ...prevBalances.USDT, available: balanceUSDT },
        }));
        setTotalAssetsEUR(balanceEUR);
        setTotalAssetsUSDT(balanceUSDT);
      } catch (error) {
        console.error("Error fetching wallet data:", error);
        setError(
          "No se pudo cargar la información de la billetera. Por favor, intenta de nuevo más tarde."
        );
      }
    };

    const fetchCryptoData = async () => {
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

        const response = await fetch("http://localhost:5000/api/crypto-data", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Response from server:", data);

        localStorage.setItem("cryptoData", JSON.stringify(data));
        localStorage.setItem("cryptoDataTimestamp", Date.now().toString());

        updateBalances(data);
      } catch (error) {
        console.error("Error fetching crypto data:", error);
        setError(
          "No se pudo cargar la información de las criptomonedas. Por favor, intenta de nuevo más tarde."
        );
      }
    };

    fetchWalletData();
    fetchCryptoData();
  }, []);

  const updateBalances = (data) => {
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
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="wallet">
      <div className="assets-info">
        <h2>Información de activos</h2>
        <div className="total-assets">
          <h3>Activos totales</h3>
          <p>{totalAssetsEUR.toFixed(2)} EUR</p>
          <p>≈ {totalAssetsUSDT.toFixed(2)} USDT</p>
        </div>
        <div className="cloud-effect"></div>
      </div>

      <div className="action-buttons-container">
        <div className="action-buttons">
          <button>
            <FaWallet /> Recarga
          </button>
          <button>
            <FaExchangeAlt /> Retirada
          </button>
          <button>
            <FaSwap /> Intercambio de monedas
          </button>
        </div>
      </div>

      <div className="balances">
        {Object.entries(balances).map(([currency, balance]) => (
          <div key={currency} className="balance-item">
            <div className="currency-name">
              {balance.image && (
                <img
                  src={balance.image}
                  alt={currency}
                  className="currency-icon"
                />
              )}
              {currency}
            </div>
            <div className="balance-details">
              <div>
                <p className="balance-amount">{balance.available.toFixed(4)}</p>
                <span>Saldo disponible</span>
              </div>
              <div>
                <p className="balance-amount">{balance.frozen.toFixed(4)}</p>
                <span>Congelado</span>
              </div>
              <div>
                <p className="balance-amount">
                  {(balance.available + balance.frozen).toFixed(4)}
                </p>
                <span>Saldo</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Wallet;
