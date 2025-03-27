// Homepage for Resident
import React, { useState, useEffect} from "react";
import { useNavigate } from "react-router-dom";
import { FaPlusCircle, FaHistory, FaUserCircle } from "react-icons/fa";
import Cookies from "js-cookie";
import "./residentHome.css"; 

const ResidentHome = () => {
  const navigate = useNavigate();
  const userData = JSON.parse(Cookies.get("user") || "{}");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    // Hide top bar and sidebar when ResidentHome mounts
    document.body.classList.add("hide-layout");

    return () => {
      // Show top bar and sidebar again when leaving ResidentHome
      document.body.classList.remove("hide-layout");
    };
  }, []);

  return (
    <div className="resident-home">
      {/* User Profile Dropdown */}
      <div className="user-dropdown">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="dropdown-button"
        >
          <FaUserCircle className="icon" />
          {userData.userName || "User"}
          <span className="arrow">▼</span>
        </button>

        {dropdownOpen && (
          <div className="dropdown-menu">
            <button
              onClick={() => {
                Cookies.remove("user");
                navigate("/");
              }}
              className="dropdown-item"
            >
              Logout
            </button>
          </div>
        )}
      </div>

      {/* App Title */}
      <h1 className="app-title">FaciliTrack</h1>

      {/* Buttons */}
      <div className="button-container">
        <button className="action-button" onClick={() => navigate("/create-ticket")}>
          <FaPlusCircle className="button-icon" />
          Create New Ticket
        </button>
        <button className="action-button" onClick={() => navigate("/ticket-history")}>
          <FaHistory className="button-icon" />
          View Ticket History
        </button>
      </div>
    </div>
  );
};

export default ResidentHome;
