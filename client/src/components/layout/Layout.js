import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import Sidebar from "./Sidebar";
import "../Dashboard/Dashboard.css";

const Layout = ({ auth, children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = auth.user || { name: "Guest", _id: "guest" };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 992) setSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="dashboard-container">
      <button
        type="button"
        className="sidebar-toggle-btn"
        aria-label="Toggle navigation menu"
        onClick={() => setSidebarOpen((prev) => !prev)}
      >
        <span className={`hamburger ${sidebarOpen ? "open" : ""}`} />
      </button>

      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar} aria-hidden="true" />
      )}

      <Sidebar
        user={user}
        isOpen={sidebarOpen}
        onNavigate={closeSidebar}
      />

      <div className="dashboard-content">{children}</div>
    </div>
  );
};

Layout.propTypes = {
  auth: PropTypes.object.isRequired,
  children: PropTypes.node.isRequired,
};

const mapStateToProps = (state) => ({
  auth: state.auth,
});

export default connect(mapStateToProps)(Layout);
