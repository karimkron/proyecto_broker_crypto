import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaChartLine,
  FaBitcoin,
  FaEthereum,
  FaDollarSign,
  FaArrowUp,
  FaArrowDown,
  FaExchangeAlt,
  FaWallet,
  FaUserShield,
  FaChevronRight,
  FaGlobe,
  FaSpinner,
  FaNewspaper,
} from "react-icons/fa";
import io from "socket.io-client";
import axiosInstance from "../utils/axiosConfig";
import "../styles/pages/home.css";

// Datos de respaldo optimizados
const fallbackData = [
  {
    id: "bitcoin",
    symbol: "btc",
    name: "Bitcoin",
    current_price: 35000,
    price_change_percentage_24h: 2.5,
  },
  {
    id: "ethereum",
    symbol: "eth",
    name: "Ethereum",
    current_price: 2000,
    price_change_percentage_24h: 1.8,
  },
  {
    id: "tether",
    symbol: "usdt",
    name: "Tether",
    current_price: 1,
    price_change_percentage_24h: 0.1,
  },
];

const newsData = [
  {
    id: 1,
    title: "Bitcoin alcanza nuevo máximo histórico",
    category: "Mercado",
    summary:
      "El precio de Bitcoin supera todas las expectativas mientras el mercado muestra señales alcistas.",
    date: new Date(),
  },
  {
    id: 2,
    title: "Ethereum 2.0 revoluciona el mercado",
    category: "Tecnología",
    summary:
      "La actualización más esperada de Ethereum promete mejorar la escalabilidad y eficiencia.",
    date: new Date(),
  },
  {
    id: 3,
    title: "Regulación cripto en Europa",
    category: "Regulación",
    summary:
      "Nuevas normativas europeas buscan establecer un marco regulatorio claro para las criptomonedas.",
    date: new Date(),
  },
];

const CryptoIcon = ({ symbol }) => {
  switch (symbol) {
    case "btc":
      return <FaBitcoin className="home-crypto-icon home-bitcoin" />;
    case "eth":
      return <FaEthereum className="home-crypto-icon home-ethereum" />;
    default:
      return <FaDollarSign className="home-crypto-icon home-tether" />;
  }
};

const Home = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cryptoData, setCryptoData] = useState(fallbackData);
  const [priceVariations, setPriceVariations] = useState({});

  const generatePriceVariation = useCallback((basePrice) => {
    const variation = (Math.random() - 0.5) * 0.00001;
    return Number((basePrice * (1 + variation)).toFixed(4));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const socket = io(`${import.meta.env.VITE_API_URL}`, { auth: { token } });
    let priceInterval;
    let dataInterval;

    const fetchInitialData = async () => {
      try {
        const response = await axiosInstance.get("/crypto-data");
        if (response.data?.length > 0) {
          setCryptoData(response.data);
          const initialVariations = Object.fromEntries(
            response.data.map((crypto) => [crypto.id, crypto.current_price])
          );
          setPriceVariations(initialVariations);
        }
      } catch (err) {
        console.warn("Using fallback data:", err);
        setCryptoData(fallbackData);
      } finally {
        setLoading(false);
      }
    };

    const setupIntervals = () => {
      priceInterval = setInterval(() => {
        setPriceVariations((prev) => {
          const newVariations = { ...prev };
          Object.keys(newVariations).forEach((cryptoId) => {
            newVariations[cryptoId] = generatePriceVariation(
              newVariations[cryptoId]
            );
          });
          return newVariations;
        });
      }, 2000);

      dataInterval = setInterval(fetchInitialData, 60000);
    };

    fetchInitialData();
    setupIntervals();

    socket.on("priceUpdate", ({ cryptoId, price }) => {
      setPriceVariations((prev) => ({ ...prev, [cryptoId]: price }));
    });

    return () => {
      clearInterval(priceInterval);
      clearInterval(dataInterval);
      socket.disconnect();
    };
  }, [navigate, generatePriceVariation]);

  if (loading) {
    return (
      <div className="home-loading">
        <FaSpinner className="home-spinning" />
        <p>Cargando...</p>
      </div>
    );
  }

  const renderMarketCard = (crypto) => (
    <motion.div
      key={crypto.id}
      className="home-market-card"
      whileHover={{ y: -5 }}
      onClick={() => navigate("/market")}
    >
      <div className="home-market-card-header">
        <CryptoIcon symbol={crypto.symbol} />
        <span className="home-crypto-name">{crypto.name}</span>
      </div>
      <div className="home-market-card-body">
        <div className="home-crypto-price">
          $
          {(
            priceVariations[crypto.id] || crypto.current_price
          ).toLocaleString()}
        </div>
        <div
          className={`home-crypto-change ${
            crypto.price_change_percentage_24h >= 0 ? "positive" : "negative"
          }`}
        >
          {crypto.price_change_percentage_24h >= 0 ? (
            <FaArrowUp />
          ) : (
            <FaArrowDown />
          )}
          {Math.abs(crypto.price_change_percentage_24h).toFixed(2)}%
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="home-container">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="home-hero"
      >
        <div className="home-hero-content">
          <h1>Trading simplificado para todos</h1>
          <p>
            Opera con las principales criptomonedas de forma segura y sencilla
          </p>
          <div className="home-hero-buttons">
            <button
              onClick={() => navigate("/market")}
              className="home-button-primary"
            >
              <FaChartLine /> Comenzar a Operar
            </button>
            <button
              onClick={() => navigate("/wallet")}
              className="home-button-secondary"
            >
              <FaWallet /> Depositar Fondos
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="home-market-section"
      >
        <div className="home-section-header">
          <h2>Mercados Principales</h2>
          <button onClick={() => navigate("/market")} className="home-view-all">
            Ver Todos <FaChevronRight />
          </button>
        </div>
        <div className="home-market-grid">
          {cryptoData.map(renderMarketCard)}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="home-features"
      >
        <div className="home-section-header">
          <h2>Características Principales</h2>
        </div>
        <div className="home-features-grid">
          {[
            {
              icon: <FaChartLine />,
              title: "Trading Avanzado",
              description:
                "Accede a herramientas profesionales y análisis en tiempo real",
            },
            {
              icon: <FaWallet />,
              title: "Wallet Segura",
              description:
                "Almacena tus criptomonedas de forma segura con nuestra wallet multicrypto",
            },
            {
              icon: <FaUserShield />,
              title: "KYC Verificado",
              description:
                "Opera con la tranquilidad de una plataforma regulada y verificada",
            },
          ].map((feature, index) => (
            <motion.div key={index} className="home-feature-card">
              <div className="home-feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="home-news-section"
      >
        <div className="home-section-header">
          <h2>
            <FaNewspaper /> Últimas Noticias
          </h2>
        </div>
        <div className="home-news-grid">
          {newsData.map((news) => (
            <motion.div
              key={news.id}
              className="home-news-card"
              whileHover={{ y: -5 }}
            >
              <div className="home-news-header">
                <span className="home-news-category">{news.category}</span>
                <time className="home-news-date">
                  {news.date.toLocaleDateString()}
                </time>
              </div>
              <h3 className="home-news-title">{news.title}</h3>
              <p className="home-news-summary">{news.summary}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="home-cta"
      >
        <div className="home-cta-content">
          <h2>¿Listo para empezar?</h2>
          <p>Únete a miles de traders que ya confían en nuestra plataforma</p>
          <div className="home-cta-buttons">
            <button
              onClick={() => navigate("/market")}
              className="home-button-primary"
            >
              <FaChartLine /> Comenzar Ahora
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Home;
