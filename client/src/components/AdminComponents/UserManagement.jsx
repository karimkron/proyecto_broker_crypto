import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaBan,
  FaCheck,
  FaTimesCircle,
  FaSearch,
  FaSpinner,
  FaUserCheck,
  FaCalendarAlt,
  FaIdCard,
  FaUserEdit,
  FaEye,
  FaEyeSlash,
  FaExclamationTriangle,
  FaUnlock,
  FaLockOpen,
  FaClock,
  FaFilter,
  FaTable,
  FaThLarge,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import "./UserManagement.css";

const UserManagement = () => {
  // Estados principales
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Estados de formularios
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  // Estados de UI
  const [message, setMessage] = useState({ text: "", type: "" });
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });
  const [tableView, setTableView] = useState(true);
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    kycStatus: "all",
    userStatus: "all",
    dateRange: "all",
  });

  // Añade esto después de la definición de estados y antes del useEffect
  const renderKYCStatus = (user) => {
    if (!user) return null;

    switch (user.kycStatus) {
      case "verified":
        return (
          <>
            <FaUserCheck /> Verificado
          </>
        );
      case "pending":
        return (
          <>
            <FaClock /> Pendiente
          </>
        );
      case "rejected":
        return (
          <>
            <FaTimesCircle /> Rechazado
          </>
        );
      default:
        return (
          <>
            <FaTimesCircle /> No Verificado
          </>
        );
    }
  };

  // Funciones de filtrado y paginación
  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedUsers = filteredUsers.sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === "asc" ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === "asc" ? 1 : -1;
    }
    return 0;
  });

  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
  const paginatedUsers = sortedUsers.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Función para manejar el ordenamiento
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Efectos
  useEffect(() => {
    fetchUsers();
  }, []);

  // Funciones principales
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/api/admin/users",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUsers(response.data);
      setError(null);
    } catch (error) {
      setError(
        "Error al cargar usuarios: " +
          (error.response?.data?.msg || error.message)
      );
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handlers de usuario
  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
    });
    setEditMode(false);
    setShowPasswordForm(false);
    setMessage({ text: "", type: "" });
  };

  const handleUpdateUser = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `http://localhost:5000/api/admin/users/${selectedUser._id}`,
        editForm,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMessage({
        text: "Usuario actualizado con éxito",
        type: "success",
      });
      setSelectedUser({ ...selectedUser, ...response.data });
      await fetchUsers();
      setEditMode(false);
    } catch (error) {
      setMessage({
        text: error.response?.data?.msg || "Error al actualizar usuario",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handlers KYC
  const handleKYCStatus = async (status, rejectionReason = null) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await axios.put(
        `http://localhost:5000/api/admin/users/${selectedUser._id}/kyc-status`,
        {
          status,
          rejectionReason,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data) {
        setSelectedUser(response.data.user);
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user._id === selectedUser._id ? response.data.user : user
          )
        );

        setMessage({
          text: response.data.msg,
          type: "success",
        });
      }
    } catch (error) {
      setMessage({
        text: error.response?.data?.msg || "Error al actualizar estado KYC",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handlers de contraseña
  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ text: "Las contraseñas no coinciden", type: "error" });
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/admin/users/${selectedUser._id}/password`,
        { newPassword: passwordForm.newPassword },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMessage({
        text: "Contraseña actualizada con éxito",
        type: "success",
      });
      setPasswordForm({ newPassword: "", confirmPassword: "" });
      setShowPasswordForm(false);
    } catch (error) {
      setMessage({
        text: error.response?.data?.msg || "Error al cambiar la contraseña",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handlers de bloqueo
  const handleToggleBlock = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `http://localhost:5000/api/admin/users/${selectedUser._id}/toggle-status`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data) {
        setMessage({
          text: response.data.msg,
          type: "success",
        });

        setSelectedUser((prev) => ({
          ...prev,
          isBlocked: response.data.isBlocked,
        }));

        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user._id === selectedUser._id
              ? { ...user, isBlocked: response.data.isBlocked }
              : user
          )
        );
      }
    } catch (error) {
      setMessage({
        text:
          error.response?.data?.msg || "Error al cambiar estado del usuario",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Funciones de renderizado
  const renderHeader = () => (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="header-section"
    >
      <div className="header-content">
        <h1>Panel de Administración</h1>
        <p className="header-subtitle">Gestión de Usuarios</p>
      </div>
      <div className="header-controls">
        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Buscar usuarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="filter-button"
          onClick={() => setShowFilters(!showFilters)}
        >
          <FaFilter /> Filtros
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="view-toggle-button"
          onClick={() => setTableView(!tableView)}
        >
          {tableView ? <FaThLarge /> : <FaTable />}
          {tableView ? "Vista de Tarjetas" : "Vista de Tabla"}
        </motion.button>
      </div>
    </motion.div>
  );

  const renderFilters = () => (
    <AnimatePresence>
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="filters-section"
        >
          <div className="filters-content">
            <div className="filter-group">
              <label>Estado KYC</label>
              <select
                value={filters.kycStatus}
                onChange={(e) =>
                  setFilters({ ...filters, kycStatus: e.target.value })
                }
              >
                <option value="all">Todos</option>
                <option value="verified">Verificados</option>
                <option value="pending">Pendientes</option>
                <option value="not_submitted">No Verificados</option>
                <option value="rejected">Rechazados</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Estado Usuario</label>
              <select
                value={filters.userStatus}
                onChange={(e) =>
                  setFilters({ ...filters, userStatus: e.target.value })
                }
              >
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="blocked">Bloqueados</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Fecha de Registro</label>
              <select
                value={filters.dateRange}
                onChange={(e) =>
                  setFilters({ ...filters, dateRange: e.target.value })
                }
              >
                <option value="all">Todo el tiempo</option>
                <option value="today">Hoy</option>
                <option value="week">Esta semana</option>
                <option value="month">Este mes</option>
                <option value="year">Este año</option>
              </select>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderTableView = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="table-container"
    >
      <table className="users-table">
        <thead>
          <tr>
            <th onClick={() => handleSort("username")}>
              <div className="th-content">
                Usuario
                {sortConfig.key === "username" && (
                  <span className={`sort-indicator ${sortConfig.direction}`} />
                )}
              </div>
            </th>
            <th onClick={() => handleSort("email")}>
              <div className="th-content">
                Email
                {sortConfig.key === "email" && (
                  <span className={`sort-indicator ${sortConfig.direction}`} />
                )}
              </div>
            </th>
            <th onClick={() => handleSort("firstName")}>
              <div className="th-content">
                Nombre
                {sortConfig.key === "firstName" && (
                  <span className={`sort-indicator ${sortConfig.direction}`} />
                )}
              </div>
            </th>
            <th onClick={() => handleSort("date")}>
              <div className="th-content">
                Registro
                {sortConfig.key === "date" && (
                  <span className={`sort-indicator ${sortConfig.direction}`} />
                )}
              </div>
            </th>
            <th>Estado</th>
            <th>KYC</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {paginatedUsers.map((user) => (
            <motion.tr
              key={user._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={selectedUser?._id === user._id ? "selected" : ""}
              onClick={() => handleSelectUser(user)}
              whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
            >
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>{`${user.firstName} ${user.lastName}`}</td>
              <td>{new Date(user.date).toLocaleDateString()}</td>
              <td>
                <span
                  className={`status-badge ${
                    user.isBlocked ? "blocked" : "active"
                  }`}
                >
                  {user.isBlocked ? (
                    <>
                      <FaBan /> Bloqueado
                    </>
                  ) : (
                    <>
                      <FaCheck /> Activo
                    </>
                  )}
                </span>
              </td>
              <td>
                <span className={`status-badge kyc-${user.kycStatus}`}>
                  {renderKYCStatus(user)}
                </span>
              </td>
              <td>
                <div className="table-actions">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="action-button edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectUser(user);
                      setEditMode(true);
                    }}
                  >
                    <FaUserEdit />
                  </motion.button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>

      {renderPagination()}
    </motion.div>
  );

  const renderCardView = () => (
    <div className="users-grid">
      {paginatedUsers.map((user) => (
        <motion.div
          key={user._id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.2)" }}
          className={`user-card ${
            selectedUser?._id === user._id ? "selected" : ""
          }`}
          onClick={() => handleSelectUser(user)}
        >
          <div className="user-card-header">
            <div className="user-avatar">
              <FaUser />
            </div>
            <div className="user-status">
              {user.isBlocked && (
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="status-icon blocked"
                  title="Usuario Bloqueado"
                >
                  <FaBan />
                </motion.div>
              )}
              {user.kycStatus === "verified" && (
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="status-icon verified"
                  title="KYC Verificado"
                >
                  <FaUserCheck />
                </motion.div>
              )}
            </div>
          </div>

          <div className="user-card-content">
            <h3>{user.username}</h3>
            <div className="user-info-item">
              <FaEnvelope className="icon" />
              <p>{user.email}</p>
            </div>
            <div className="user-info-item">
              <FaUser className="icon" />
              <p>{`${user.firstName} ${user.lastName}`}</p>
            </div>
            <div className="user-info-item">
              <FaCalendarAlt className="icon" />
              <p>{new Date(user.date).toLocaleDateString()}</p>
            </div>

            <div className="user-status-badges">
              <span
                className={`status-badge ${
                  user.isBlocked ? "blocked" : "active"
                }`}
              >
                {user.isBlocked ? <FaBan /> : <FaCheck />}
                {user.isBlocked ? "Bloqueado" : "Activo"}
              </span>

              {user.kycStatus !== "not_submitted" && (
                <span className={`status-badge kyc-${user.kycStatus}`}>
                  {user.kycStatus === "verified" && <FaUserCheck />}
                  {user.kycStatus === "pending" && <FaClock />}
                  {user.kycStatus === "rejected" && <FaTimesCircle />}
                  {user.kycStatus === "verified" && "Verificado"}
                  {user.kycStatus === "pending" && "Pendiente"}
                  {user.kycStatus === "rejected" && "Rechazado"}
                </span>
              )}
            </div>
          </div>

          <div className="user-card-actions">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="card-action-button edit"
              onClick={(e) => {
                e.stopPropagation();
                setEditMode(true);
              }}
            >
              <FaUserEdit />
              <span>Editar</span>
            </motion.button>
          </div>
        </motion.div>
      ))}
    </div>
  );

  const renderPagination = () => (
    <div className="pagination">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setPage(page - 1)}
        disabled={page === 1}
        className="pagination-button"
      >
        Anterior
      </motion.button>

      {Array.from({ length: totalPages }, (_, i) => (
        <motion.button
          key={i + 1}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setPage(i + 1)}
          className={`pagination-button ${page === i + 1 ? "active" : ""}`}
        >
          {i + 1}
        </motion.button>
      ))}

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setPage(page + 1)}
        disabled={page === totalPages}
        className="pagination-button"
      >
        Siguiente
      </motion.button>
    </div>
  );

  const renderUserDetailsPanel = () => (
    <AnimatePresence>
      {selectedUser && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="user-details-panel"
        >
          <div className="panel-header">
            <h2>Detalles del Usuario</h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="close-button"
              onClick={() => setSelectedUser(null)}
            >
              <FaTimesCircle />
            </motion.button>
          </div>

          {message.text && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`message ${message.type}`}
            >
              {message.type === "success" ? <FaCheck /> : <FaTimesCircle />}
              <span>{message.text}</span>
            </motion.div>
          )}

          <div className="panel-content">
            {editMode ? renderEditForm() : renderUserInfo()}
            {renderActionButtons()}
            {showPasswordForm && renderPasswordForm()}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderEditForm = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="edit-form"
    >
      <div className="form-group">
        <label>Nombre:</label>
        <input
          type="text"
          value={editForm.firstName}
          onChange={(e) =>
            setEditForm({ ...editForm, firstName: e.target.value })
          }
        />
      </div>
      <div className="form-group">
        <label>Apellido:</label>
        <input
          type="text"
          value={editForm.lastName}
          onChange={(e) =>
            setEditForm({ ...editForm, lastName: e.target.value })
          }
        />
      </div>
      <div className="form-group">
        <label>Email:</label>
        <input
          type="email"
          value={editForm.email}
          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label>Usuario:</label>
        <input
          type="text"
          value={editForm.username}
          onChange={(e) =>
            setEditForm({ ...editForm, username: e.target.value })
          }
        />
      </div>
      <div className="form-actions">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="save-button"
          onClick={handleUpdateUser}
          disabled={loading}
        >
          {loading ? <FaSpinner className="spinning" /> : "Guardar Cambios"}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="cancel-button"
          onClick={() => setEditMode(false)}
        >
          Cancelar
        </motion.button>
      </div>
    </motion.div>
  );

  const renderUserInfo = () => (
    <div className="user-info">
      <div className="info-group">
        <FaUser className="info-icon" />
        <div>
          <label>Nombre completo</label>
          <p>{`${selectedUser.firstName} ${selectedUser.lastName}`}</p>
        </div>
      </div>

      <div className="info-group">
        <FaIdCard className="info-icon" />
        <div>
          <label>Nombre de usuario</label>
          <p>{selectedUser.username}</p>
        </div>
      </div>

      <div className="info-group">
        <FaEnvelope className="info-icon" />
        <div>
          <label>Email</label>
          <p>{selectedUser.email}</p>
        </div>
      </div>

      <div className="info-group">
        <FaCalendarAlt className="info-icon" />
        <div>
          <label>Fecha de registro</label>
          <p>{new Date(selectedUser.date).toLocaleString()}</p>
        </div>
      </div>

      <div className="info-group">
        <FaUserCheck className="info-icon" />
        <div>
          <label>Estado KYC</label>
          <div className={`kyc-status-details ${selectedUser.kycStatus}`}>
            {renderKYCStatus(selectedUser)}
          </div>
        </div>
      </div>

      <div className="info-group">
        <FaBan className="info-icon" />
        <div>
          <label>Estado de la cuenta</label>
          <p className={selectedUser.isBlocked ? "blocked" : "active"}>
            {selectedUser.isBlocked ? "Bloqueado" : "Activo"}
          </p>
        </div>
      </div>
    </div>
  );

  const renderActionButtons = () => (
    <div className="action-buttons">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="edit-button"
        onClick={() => setEditMode(!editMode)}
        disabled={loading}
      >
        <FaUserEdit />
        {editMode ? "Cancelar Edición" : "Editar Usuario"}
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="password-button"
        onClick={() => setShowPasswordForm(!showPasswordForm)}
        disabled={loading}
      >
        <FaLock />
        Cambiar Contraseña
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`block-button ${
          selectedUser.isBlocked ? "unblock" : "block"
        }`}
        onClick={handleToggleBlock}
        disabled={loading}
      >
        {selectedUser.isBlocked ? <FaLockOpen /> : <FaBan />}
        {selectedUser.isBlocked ? "Desbloquear Usuario" : "Bloquear Usuario"}
      </motion.button>

      {selectedUser.kycStatus === "pending" && (
        <div className="kyc-buttons">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="verify-button"
            onClick={() => handleKYCStatus("verified")}
            disabled={loading}
          >
            <FaUserCheck />
            Aprobar KYC
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="reject-button"
            onClick={() => {
              const reason = window.prompt("Razón del rechazo:");
              if (reason) handleKYCStatus("rejected", reason);
            }}
            disabled={loading}
          >
            <FaTimesCircle />
            Rechazar KYC
          </motion.button>
        </div>
      )}
    </div>
  );

  const renderPasswordForm = () => (
    <div className="password-form">
      <h3>Cambiar Contraseña</h3>
      <div className="form-group">
        <label>Nueva Contraseña:</label>
        <input
          type="password"
          value={passwordForm.newPassword}
          onChange={(e) =>
            setPasswordForm({
              ...passwordForm,
              newPassword: e.target.value,
            })
          }
        />
      </div>
      <div className="form-group">
        <label>Confirmar Contraseña:</label>
        <input
          type="password"
          value={passwordForm.confirmPassword}
          onChange={(e) =>
            setPasswordForm({
              ...passwordForm,
              confirmPassword: e.target.value,
            })
          }
        />
      </div>
      <div className="form-actions">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="save-button"
          onClick={handleChangePassword}
          disabled={loading}
        >
          {loading ? <FaSpinner className="spinning" /> : "Guardar Contraseña"}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="cancel-button"
          onClick={() => {
            setShowPasswordForm(false);
            setPasswordForm({
              newPassword: "",
              confirmPassword: "",
            });
          }}
        >
          Cancelar
        </motion.button>
      </div>
    </div>
  );

  if (loading && !selectedUser) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="loading-container"
      >
        <FaSpinner className="spinning" />
        <p>Cargando usuarios...</p>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="error-container"
      >
        <FaExclamationTriangle />
        <p>{error}</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchUsers}
        >
          Reintentar
        </motion.button>
      </motion.div>
    );
  }

  return (
    <div className="user-management-container">
      {renderHeader()}
      {renderFilters()}
      {tableView ? renderTableView() : renderCardView()}
      {renderUserDetailsPanel()}
    </div>
  );
};

export default UserManagement;
