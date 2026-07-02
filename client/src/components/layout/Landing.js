import React from "react";
import { Link } from "react-router-dom";
import "./Landing.css";

const features = [
  {
    icon: "🥗",
    title: "Smart Meal Plans",
    description: "AI-powered nutrition plans tailored to your goals and preferences.",
    link: "/diet-planner",
    color: "#2d8a5f",
  },
  {
    icon: "📊",
    title: "Track Progress",
    description: "Monitor calories, macros, and micro-nutrients with interactive charts.",
    link: "/dashboard",
    color: "#3aa876",
  },
  {
    icon: "🤖",
    title: "Welloh AI",
    description: "Your personal nutrition assistant — ask anything, anytime.",
    link: "/welloh",
    color: "#4ecdc4",
  },
  {
    icon: "📍",
    title: "Store Locator",
    description: "Find healthy grocery stores near you in seconds.",
    link: "/location",
    color: "#6cafa4",
  },
  {
    icon: "🛒",
    title: "Grocery Prices",
    description: "Compare daily prices and plan your healthy shopping list.",
    link: "/daily-price-list",
    color: "#52b788",
  },
  {
    icon: "📅",
    title: "Meal Calendar",
    description: "Schedule meals and sync plans to stay on track every day.",
    link: "/calendar",
    color: "#40916c",
  },
];

const stats = [
  { value: "10K+", label: "Foods tracked" },
  { value: "AI", label: "Powered insights" },
  { value: "100%", label: "Personalized" },
  { value: "Free", label: "To explore" },
];

const Landing = () => {
  return (
    <div className="landing-page">
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg-shapes">
          <div className="shape shape-1" />
          <div className="shape shape-2" />
          <div className="shape shape-3" />
        </div>
        <div className="hero-content">
          <span className="hero-badge">🌿 Your Wellness Journey Starts Here</span>
          <h1 className="hero-title">
            Eat <span className="highlight">Well</span>, Live{" "}
            <span className="highlight">Wellthy</span>
          </h1>
          <p className="hero-subtitle">
            A smart nutrition platform that helps you plan meals, track progress,
            and build healthier habits — powered by AI.
          </p>
          <div className="hero-actions">
            <Link to="/dashboard" className="btn-primary">
              Explore Dashboard
              <span className="btn-arrow">→</span>
            </Link>
            <Link to="/nutrition-calculator" className="btn-secondary">
              Track Nutrition
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-card">
            <div className="hero-card-header">
              <span className="dot green" />
              <span className="dot yellow" />
              <span className="dot red" />
            </div>
            <div className="hero-card-body">
              <div className="macro-row">
                <div className="macro-item">
                  <span className="macro-label">Calories</span>
                  <span className="macro-value">1,840</span>
                  <div className="macro-bar"><div className="macro-fill" style={{ width: "72%" }} /></div>
                </div>
                <div className="macro-item">
                  <span className="macro-label">Protein</span>
                  <span className="macro-value">98g</span>
                  <div className="macro-bar"><div className="macro-fill protein" style={{ width: "85%" }} /></div>
                </div>
                <div className="macro-item">
                  <span className="macro-label">Carbs</span>
                  <span className="macro-value">210g</span>
                  <div className="macro-bar"><div className="macro-fill carbs" style={{ width: "65%" }} /></div>
                </div>
              </div>
              <p className="hero-card-tip">✨ Today's tip: Add leafy greens for extra fiber!</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="stats-strip">
        {stats.map((stat, i) => (
          <div className="stat-item" key={i}>
            <span className="stat-value">{stat.value}</span>
            <span className="stat-label">{stat.label}</span>
          </div>
        ))}
      </section>

      {/* Features grid */}
      <section className="features-section">
        <div className="section-header">
          <h2>Everything you need to eat well</h2>
          <p>Explore powerful tools designed for your health journey</p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <Link to={feature.link} className="feature-card" key={index}>
              <div className="feature-icon" style={{ background: `${feature.color}22`, color: feature.color }}>
                {feature.icon}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <span className="feature-link">Explore →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="cta-banner">
        <div className="cta-inner">
          <h2>Ready to transform your nutrition?</h2>
          <p>Jump straight in — no sign-up required.</p>
          <Link to="/dashboard" className="btn-primary btn-large">
            Get Started Now
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Landing;
