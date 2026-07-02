import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import "./App.css";
import Navbar from "./components/layout/Navbar";
import Landing from "./components/layout/Landing";
import NotFound from "./components/NotFound/NotFound";
import Dashboard from "./components/Dashboard/Dashboard";
import NutritionCalculator from "./components/nutrition_cal/NutritionCalculator";
import DietPlanner from "./components/Analysis/DietPlanner";
import DailyPriceList from "./components/Grocery/DailyPriceList";
import Welloh from "./components/Welloh/Welloh";
import MyCalendar from "./components/Calendar/MyCalendar";
import AddEvents from "./components/Calendar/AddEvents";
import UpdateEvent from "./components/Calendar/UpdateEvent";
import FAQs from "./components/FAQ/FAQs";
import Location from "./components/Location/Location";
import LogMeal from "./components/NutritionCalculator_U0301";
import Profile from "./components/Profile/Profile";
import Layout from "./components/layout/Layout";
import NutritionixAPI from "./components/Dashboard/NutritionixAPI";
import RecentMeals from "./components/nutrition_cal/Recent_meals";

function App() {
  const withLayout = (Component) => (
    <Layout>
      <Component />
    </Layout>
  );

  return (
    <div className="App">
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={withLayout(Dashboard)} />
          <Route path="/profile" element={withLayout(Profile)} />
          <Route path="/nutrition-calculator" element={withLayout(NutritionCalculator)} />
          <Route path="/recent-meals" element={withLayout(RecentMeals)} />
          <Route path="/log-meal" element={withLayout(LogMeal)} />
          <Route path="/diet-planner" element={withLayout(DietPlanner)} />
          <Route path="/daily-price-list" element={withLayout(DailyPriceList)} />
          <Route path="/welloh" element={withLayout(Welloh)} />
          <Route path="/calendar" element={withLayout(MyCalendar)} />
          <Route path="/events/add" element={withLayout(AddEvents)} />
          <Route path="/event/:id/update" element={withLayout(UpdateEvent)} />
          <Route path="/nutrition" element={<NutritionixAPI />} />
          <Route path="/faqs" element={withLayout(FAQs)} />
          <Route path="/location" element={<Location />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
