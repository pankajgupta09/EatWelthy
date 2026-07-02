import React, { useState } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import "./Dashboard.css";
import NutritionalGraph from "./NutritionalGraph";
import ProgressTracker from "./ProgressTracker";
import DietSuggestions from "./DietSuggestions";
import FoodTransformLoading from "./FoodTransformLoading";

const Dashboard = ({ auth }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const userName = auth.user?.name || "Guest";

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <h1 className="welcome-message">Welcome, {userName}!</h1>
      <p className="date-display">{currentDate}</p>
      <div className="dashboard-sections">
        <div className="section">
          <h2>Daily Nutritional Intake</h2>
          <NutritionalGraph />
        </div>

        <div className="section">
          <h2>Progress Tracking</h2>
          <ProgressTracker />
        </div>

        <div className="section">
          <h2>Diet Suggestions</h2>
          <DietSuggestions setDashboardLoading={setIsGenerating} />
        </div>
      </div>

      {isGenerating && <FoodTransformLoading />}
    </>
  );
};

Dashboard.propTypes = {
  auth: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
  auth: state.auth,
});

export default connect(mapStateToProps)(Dashboard);
