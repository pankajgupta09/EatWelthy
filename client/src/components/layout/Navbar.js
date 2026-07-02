import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const isHome = location.pathname === "/";

  const navLinks = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/nutrition-calculator", label: "Tracker" },
    { to: "/location", label: "Stores" },
    { to: "/faqs", label: "FAQs" },
  ];

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <nav className="navbar bg-dark">
      <div className="left-section">
        <Link to="/" className="brand-link">
          <div className="icon-container">
            <img src="/favicon.ico" width="35" height="35" alt="EatWelthy Logo" />
          </div>
          <span className="brand-name">EatWelthy</span>
        </Link>
      </div>

      <button
        type="button"
        className="nav-toggle"
        aria-label="Toggle navigation"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((prev) => !prev)}
      >
        <span className={`nav-hamburger ${menuOpen ? "open" : ""}`} />
      </button>

      <ul className={`nav-links ${menuOpen ? "nav-open" : ""}`}>
        {navLinks.map((link) => (
          <li key={link.to}>
            <Link
              to={link.to}
              className={location.pathname === link.to ? "nav-active" : ""}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          </li>
        ))}
        {!isHome && (
          <li>
            <Link to="/" className="nav-home-btn" onClick={() => setMenuOpen(false)}>
              Home
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
