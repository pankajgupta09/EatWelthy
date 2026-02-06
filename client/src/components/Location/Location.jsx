import React from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import Sidebar from "../layout/Sidebar";
import "./location.css";

const Location = ({ auth }) => {
  return (
    <div className="location-page">
      {auth.user && <Sidebar user={auth.user} />}
      <div className="container" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        padding: '40px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '20px',
          padding: '40px',
          color: 'white',
          maxWidth: '500px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
        }}>
          <h2 style={{ fontSize: '28px', marginBottom: '20px' }}>
            📍 Location Feature
          </h2>
          <p style={{ fontSize: '16px', opacity: 0.9, marginBottom: '15px' }}>
            Find nearby grocery stores and supermarkets with healthy food options!
          </p>
          <div style={{
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '10px',
            padding: '15px',
            marginTop: '20px'
          }}>
            <p style={{ fontSize: '14px', margin: 0 }}>
              🔧 Google Maps API configuration required.
              <br />
              Contact admin to enable this feature.
            </p>
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
