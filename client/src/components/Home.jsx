import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaNewspaper,
  FaChartLine,
  FaBitcoin,
  FaEthereum,
  FaDollarSign,
  FaArrowRight,
  FaArrowUp,
  FaArrowDown,
  FaFire,
  FaGlobe,
  FaChartBar,
  FaLightbulb,
  FaBookmark,
} from "react-icons/fa";
import "../styles/pages/home.css";

const fallbackImageUrl =
  "https://via.placeholder.com/300x200?text=Imagen+No+Disponible";

const ImageWithFallback = ({ src, alt, className }) => {
  const handleError = (e) => {
    e.target.src = fallbackImageUrl;
  };

  return (
    <img src={src} alt={alt} onError={handleError} className={className} />
  );
};

const Home = () => {
  const articles = [
    {
      id: 1,
      title: "El futuro de las criptomonedas",
      description:
        "Explorando las tendencias y predicciones para el mercado de criptomonedas en los próximos años.",
      imageUrl: "https://images.unsplash.com/photo-1621761191319-c6fb62004040",
      category: "Análisis",
    },
    {
      id: 2,
      title: "Ethereum 2.0: Una nueva era",
      description:
        "Una guía completa sobre las actualizaciones de Ethereum y cómo afectarán al ecosistema.",
      imageUrl: "https://images.unsplash.com/photo-1621504450181-5d356f61d307",
      category: "Tecnología",
    },
    {
      id: 3,
      title: "NFTs: Más allá del arte digital",
      description:
        "Descubre cómo los NFTs están revolucionando diversos sectores, desde el entretenimiento hasta los bienes raíces.",
      imageUrl: "https://images.unsplash.com/photo-1621761191319-c6fb62004040",
      category: "Innovación",
    },
    {
      id: 4,
      title: "Regulación Global de Criptomonedas",
      description:
        "Analizamos cómo diferentes países están abordando la regulación de las criptomonedas.",
      imageUrl: "https://images.unsplash.com/photo-1621504450181-5d356f61d307",
      category: "Regulación",
    },
  ];

  const marketData = [
    {
      id: 1,
      name: "Bitcoin",
      symbol: "BTC",
      price: 68789.0,
      change: 2.5,
      icon: <FaBitcoin />,
    },
    {
      id: 2,
      name: "Ethereum",
      symbol: "ETH",
      price: 4356.78,
      change: 1.8,
      icon: <FaEthereum />,
    },
    {
      id: 3,
      name: "Tether",
      symbol: "USDT",
      price: 1.0,
      change: 0.1,
      icon: <FaDollarSign />,
    },
  ];

  const trendingTopics = [
    { id: 1, title: "Bitcoin alcanza nuevo ATH", views: "50K" },
    { id: 2, title: "Ethereum 2.0 se acerca", views: "35K" },
    { id: 3, title: "Nuevas regulaciones en EU", views: "28K" },
    { id: 4, title: "DeFi alcanza $100B TVL", views: "22K" },
    { id: 5, title: "Layer 2s en crecimiento", views: "18K" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="home-container"
    >
      <motion.header
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        className="home-header"
      >
        <h1>
          <FaNewspaper /> Noticias y Análisis de Mercado
        </h1>
      </motion.header>

      <div className="home-main">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="featured-news"
        >
          <h2>
            <FaFire /> Noticia Destacada
          </h2>
          <div className="featured-article">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1518546305927-5a555bb7020d"
              alt="Bitcoin ATH"
              className="featured-image"
            />
            <motion.h3
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Bitcoin alcanza nuevo máximo histórico
            </motion.h3>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              El precio de Bitcoin ha superado los $70,000 por primera vez en su
              historia, marcando un hito importante para la criptomoneda líder.
              Los expertos señalan que esta subida se debe a...
            </motion.p>
            <motion.a href="#" className="read-more" whileHover={{ x: 5 }}>
              Leer más <FaArrowRight />
            </motion.a>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="market-overview-section"
        >
          <h2>
            <FaChartBar /> Resumen del Mercado
          </h2>
          <div className="market-overview">
            {marketData.map((coin, index) => (
              <motion.div
                key={coin.id}
                className="market-item"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="coin-info">
                  {coin.icon}
                  <span>{coin.name}</span>
                </div>
                <div className="price-info">
                  <div className="coin-price">
                    ${coin.price.toLocaleString()}
                  </div>
                  <div
                    className={`price-change ${
                      coin.change > 0 ? "positive" : "negative"
                    }`}
                  >
                    {coin.change > 0 ? <FaArrowUp /> : <FaArrowDown />}
                    {Math.abs(coin.change)}%
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <section className="recent-articles">
          <h2>
            <FaGlobe /> Últimas Noticias
          </h2>
          <motion.div className="articles-grid">
            <AnimatePresence>
              {articles.map((article, index) => (
                <motion.article
                  key={article.id}
                  className="article-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <ImageWithFallback
                    src={article.imageUrl}
                    alt={article.title}
                  />
                  <div className="article-content">
                    <h3>{article.title}</h3>
                    <p>{article.description}</p>
                    <div className="article-footer">
                      <span className="article-category">
                        {article.category}
                      </span>
                      <a href="#" className="read-more">
                        Leer más <FaArrowRight />
                      </a>
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </motion.div>
        </section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="trending-news"
        >
          <h2>
            <FaLightbulb /> Tendencias
          </h2>
          {trendingTopics.map((topic, index) => (
            <motion.div
              key={topic.id}
              className="trending-item"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ x: 5 }}
            >
              <span className="trending-number">{index + 1}</span>
              <div className="trending-content">
                <h3>{topic.title}</h3>
                <span>{topic.views} lecturas</span>
              </div>
            </motion.div>
          ))}
        </motion.section>
      </div>
    </motion.div>
  );
};

export default Home;
