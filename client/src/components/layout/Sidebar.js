import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { getProfile } from "../../actions/Profile";

import bearIcon from "../../img/bear.png";
import capybaraIcon from "../../img/capybara.png";
import catIcon from "../../img/cat.png";
import dogIcon from "../../img/dog.png";
import otterIcon from "../../img/otter.png";
import pandaIcon from "../../img/panda.png";
import rabbitIcon from "../../img/rabbit.png";
import tigerIcon from "../../img/tiger.png";

const Sidebar = ({ user, isOpen, onNavigate }) => {
  const dispatch = useDispatch();
  const profileState = useSelector((state) => state.profile);

  useEffect(() => {
    dispatch(getProfile());
  }, [dispatch]);

  const animalIcons = {
    bear: bearIcon,
    capybara: capybaraIcon,
    cat: catIcon,
    dog: dogIcon,
    otter: otterIcon,
    panda: pandaIcon,
    rabbit: rabbitIcon,
    tiger: tigerIcon,
  };

  const userIcon = profileState?.profile?.profileIcon
    ? animalIcons[profileState.profile.profileIcon]
    : bearIcon;

  const handleClick = () => {
    if (onNavigate) onNavigate();
  };

  return (
    <aside className={`sidebar ${isOpen ? "sidebar-open" : ""}`}>
      <div className="profile-section">
        <img src={userIcon} alt="user-icon" className="user-avatar" />
        <p>{user && user.name}</p>
      </div>
      <ul className="menu">
        <li><Link to="/profile" onClick={handleClick}>Profile</Link></li>
        <li><Link to="/nutrition-calculator" onClick={handleClick}>Tracker</Link></li>
        <li><Link to="/diet-planner" onClick={handleClick}>Analysis</Link></li>
        <li><Link to="/daily-price-list" onClick={handleClick}>Grocery</Link></li>
        <li><Link to="/calendar" onClick={handleClick}>Calendar</Link></li>
        <li><Link to="/faqs" onClick={handleClick}>FAQs</Link></li>
        <li><Link to="/location" onClick={handleClick}>Location</Link></li>
        <li><Link to="/welloh" className="wellohli" onClick={handleClick}>Welloh</Link></li>
      </ul>
    </aside>
  );
};

export default Sidebar;
