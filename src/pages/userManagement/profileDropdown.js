import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, User } from "lucide-react";
import { Link } from "react-router-dom";
import "./profileDropdown.css";

const ProfileDropdown = ({ userName = "Alex Ong" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="profile-container" ref={dropdownRef}>
      <button
        className={`profile-button ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className="profile-icon">
          <User size={20} color="#6b7280" />
        </div>
        <span className="profile-name">{userName}</span>
        <ChevronDown size={18} className="chevron-icon" />
      </button>

      {isOpen && (
        <div className="dropdown-menu" role="menu">
          <Link to="/view-profile" className="dropdown-item">View Profile</Link>
          <button className="dropdown-item" role="menuitem">Logout</button>
          <button className="dropdown-item deactivate" role="menuitem">
            Deactivate Account
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
