import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import Sidebar from "../layout/Sidebar";
import "../Dashboard/Dashboard.css";
import "./location.css";

const Location = ({ auth }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = auth.user || { name: "Guest" };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 992) setSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="location-page">
      <button
        type="button"
        className="sidebar-toggle-btn"
        aria-label="Toggle navigation menu"
        onClick={() => setSidebarOpen((prev) => !prev)}
      >
        <span className={`hamburger ${sidebarOpen ? "open" : ""}`} />
      </button>

      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      )}

      <Sidebar
        user={user}
        isOpen={sidebarOpen}
        onNavigate={() => setSidebarOpen(false)}
      />

      <div className="location-content">
        <div className="location-card">
          <h2>📍 Store Locator</h2>
          <p>
            Find nearby grocery stores and supermarkets with healthy food options.
          </p>
          <div className="location-card-note">
            Google Maps API configuration required to enable the interactive map.
          </div>
        </div>
      </div>
    </div>
  );
};

Location.propTypes = {
  auth: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
  auth: state.auth,
});

export default connect(mapStateToProps)(Location);
