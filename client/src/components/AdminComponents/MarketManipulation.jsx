import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  FaSearch,
  FaUser,
  FaCalendar,
  FaEnvelope,
  FaToggleOn,
  FaToggleOff,
} from "react-icons/fa";
import "./MarketManipulation.css";

const MarketManipulation = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchType, setSearchType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/admin/users`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUsers(response.data.filter((user) => user.role !== "admin")); // Filtramos admin
      setFilteredUsers(response.data.filter((user) => user.role !== "admin"));
      setLoading(false);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
      setError("Error al cargar los usuarios");
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      const token = localStorage.getItem("token");
      let response;

      if (!searchQuery.trim() || searchType === "all") {
        response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/admin/users`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setFilteredUsers(response.data.filter((user) => user.role !== "admin"));
        return;
      }

      switch (searchType) {
        case "email":
          response = await axios.get(
            `http://localhost:5000/api/admin/market-manipulation/users/search/email/${searchQuery}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          break;
        case "name":
          response = await axios.get(
            `${
              import.meta.env.VITE_API_URL
            }/api/admin/market-manipulation/users/search/name//${searchQuery}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          break;
        case "date":
          response = await axios.get(
            `${
              import.meta.env.VITE_API_URL
            }/api/admin/market-manipulation/users/search/date/${searchQuery}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          break;
        default:
          return;
      }

      setFilteredUsers(response.data);
    } catch (err) {
      console.error("Error en la búsqueda:", err);
      setError("Error al realizar la búsqueda");
    }
  };

  const toggleProfits = async (userId, currentStatus) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `${
          import.meta.env.VITE_API_URL
        }/api/admin/market-manipulation/toggle-profits/${userId}`,
        { allowProfits: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Actualizar la lista de usuarios después de cambiar el estado
      await fetchUsers();
    } catch (err) {
      console.error("Error al actualizar estado de ganancias:", err);
      setError("Error al actualizar el estado de ganancias del usuario");
    }
  };

  if (loading) return <div className="loading">Cargando usuarios...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="market-manipulation-container"
    >
      <div className="search-section">
        <div className="search-type-buttons">
          <button
            className={`search-type-button ${
              searchType === "all" ? "active" : ""
            }`}
            onClick={() => setSearchType("all")}
          >
            <FaUser /> Todos
          </button>
          <button
            className={`search-type-button ${
              searchType === "email" ? "active" : ""
            }`}
            onClick={() => setSearchType("email")}
          >
            <FaEnvelope /> Email
          </button>
          <button
            className={`search-type-button ${
              searchType === "name" ? "active" : ""
            }`}
            onClick={() => setSearchType("name")}
          >
            <FaUser /> Nombre
          </button>
          <button
            className={`search-type-button ${
              searchType === "date" ? "active" : ""
            }`}
            onClick={() => setSearchType("date")}
          >
            <FaCalendar /> Fecha
          </button>
        </div>

        <div className="search-input-container">
          <input
            type="text"
            placeholder="Buscar usuarios..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          />
          <button onClick={handleSearch}>
            <FaSearch />
          </button>
        </div>
      </div>

      <div className="users-list">
        {filteredUsers.map((user) => (
          <motion.div
            key={user._id}
            className="user-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="user-info">
              <h3>
                {user.firstName} {user.lastName}
              </h3>
              <p>{user.email}</p>
              <p>Registrado: {new Date(user.date).toLocaleDateString()}</p>
              <p>Balance: {user.balanceUSDT.toFixed(2)} USDT</p>
            </div>
            <div className="user-controls">
              <button
                className={`toggle-button ${user.allowProfits ? "active" : ""}`}
                onClick={() => toggleProfits(user._id, user.allowProfits)}
              >
                {user.allowProfits ? <FaToggleOn /> : <FaToggleOff />}
                <span>
                  {user.allowProfits
                    ? "Ganancias Activadas"
                    : "Ganancias Desactivadas"}
                </span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default MarketManipulation;
