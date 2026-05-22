import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { connect } from "react-redux";
import axios from "axios";
import setAuthToken from "../../utils/setAuthToken";
import { loadUser } from "../../actions/auth";
import config from "../../config";

const GuestLogin = ({ loadUser }) => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Setting up your account...");

  useEffect(() => {
    const autoLogin = async () => {
      try {
        // If already logged in, go straight to dashboard
        if (localStorage.getItem("token")) {
          setAuthToken(localStorage.getItem("token"));
          await loadUser();
          navigate("/dashboard");
          return;
        }

        // Generate unique guest credentials
        const uid = Math.random().toString(36).substring(2, 10);
        const guestEmail = `guest_${uid}@eatwelthy.app`;
        const guestPassword = Math.random().toString(36).substring(2, 18);
        const guestName = "EatWelthy User";

        setStatus("Creating your profile...");

        // Try to register
        let token = null;
        try {
          const regRes = await axios.post(`${config.backendUrl}/users`, {
            name: guestName,
            email: guestEmail,
            password: guestPassword,
          });
          token = regRes.data.token;
        } catch (regErr) {
          // If register failed for some reason, try a fallback login
          console.error("Guest register error:", regErr.message);
          setStatus("Something went wrong. Redirecting...");
          navigate("/login");
          return;
        }

        if (token) {
          localStorage.setItem("token", token);
          // Store credentials so user can come back (optional)
          localStorage.setItem("guestEmail", guestEmail);
          localStorage.setItem("guestPassword", guestPassword);
          setAuthToken(token);
          await loadUser();
          setStatus("All set! Taking you in...");
          navigate("/dashboard");
        }
      } catch (err) {
        console.error("Auto login error:", err.message);
        navigate("/login");
      }
    };

    autoLogin();
  }, [navigate, loadUser]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.spinner}></div>
        <p style={styles.text}>{status}</p>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
  },
  card: {
    background: "white",
    borderRadius: "16px",
    padding: "50px 60px",
    textAlign: "center",
    boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
  },
  spinner: {
    width: "50px",
    height: "50px",
    border: "5px solid #e0e0e0",
    borderTop: "5px solid #2d8a5f",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    margin: "0 auto 20px auto",
  },
  text: {
    color: "#2d8a5f",
    fontSize: "1.1rem",
    fontWeight: "600",
    margin: 0,
  },
};

const mapStateToProps = (state) => ({
  isAuthenticated: state.auth.isAuthenticated,
});

export default connect(mapStateToProps, { loadUser })(GuestLogin);
