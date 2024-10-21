import React from "react";
import { Navigate } from "react-router-dom";

const withAdminAuth = (WrappedComponent) => {
  return function WithAdminAuth(props) {
    const isAdmin = localStorage.getItem("userRole") === "admin";

    if (isAdmin) {
      return <WrappedComponent {...props} />;
    } else {
      return <Navigate to="/login" />;
    }
  };
};

export default withAdminAuth;
