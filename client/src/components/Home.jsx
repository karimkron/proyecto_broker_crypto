import React from "react";
import "./home.css";

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
      imageUrl:
        "https://images.unsplash.com/photo-1621761191319-c6fb62004040?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80",
    },
    {
      id: 2,
      title: "Ethereum 2.0: Lo que necesitas saber",
      description:
        "Una guía completa sobre las actualizaciones de Ethereum y cómo afectarán al ecosistema.",
      imageUrl:
        "https://images.unsplash.com/photo-1621504450181-5d356f61d307?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80",
    },
    {
      id: 3,
      title: "NFTs: Más allá del arte digital",
      description:
        "Descubre cómo los NFTs están revolucionando diversos sectores, desde el entretenimiento hasta los bienes raíces.",
      imageUrl:
        "https://images.unsplash.com/photo-1621761191319-c6fb62004040?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80",
    },
    {
      id: 4,
      title: "Regulación de criptomonedas: Un panorama global",
      description:
        "Analizamos cómo diferentes países están abordando la regulación de las criptomonedas.",
      imageUrl:
        "https://images.unsplash.com/photo-1621504450181-5d356f61d307?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80",
    },
  ];

  return (
    <div className="home-container">
      <header className="home-header">
        <h1>Noticias y Artículos de Criptomonedas</h1>
      </header>

      <main className="home-main">
        <section className="featured-news">
          <h2>Noticia Destacada</h2>
          <div className="featured-article">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1518546305927-5a555bb7020d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80"
              alt="Bitcoin"
              className="featured-image"
            />
            <h3>Bitcoin alcanza nuevo máximo histórico</h3>
            <p>
              El precio de Bitcoin ha superado los $70,000 por primera vez en su
              historia, marcando un hito importante para la criptomoneda
              líder...
            </p>
            <a href="#" className="read-more">
              Leer más
            </a>
          </div>
        </section>

        <section className="recent-articles">
          <h2>Artículos Recientes</h2>
          <div className="articles-grid">
            {articles.map((article) => (
              <article key={article.id} className="article-card">
                <ImageWithFallback src={article.imageUrl} alt={article.title} />
                <h3>{article.title}</h3>
                <p>{article.description}</p>
                <a href="#" className="read-more">
                  Leer más
                </a>
              </article>
            ))}
          </div>
        </section>
      </main>

      <aside className="home-sidebar">
        <div className="market-overview">
          <h2>Resumen del Mercado</h2>
          <ul>
            <li>Bitcoin: $68,789.00 (+2.5%)</li>
            <li>Ethereum: $4,356.78 (+1.8%)</li>
            <li>Cardano: $2.13 (+0.7%)</li>
          </ul>
        </div>
        <div className="useful-links">
          <h2>Enlaces Útiles</h2>
          <ul>
            <li>
              <a href="#">Guía para Principiantes</a>
            </li>
            <li>
              <a href="#">Análisis de Mercado</a>
            </li>
            <li>
              <a href="#">Eventos de Criptomonedas</a>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
};

export default Home;
