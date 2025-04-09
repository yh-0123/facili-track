import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, User, Bell } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../../backend/DBClient/SupaBaseClient"; // Import Supabase client
import Cookies from "js-cookie"; // Import js-cookie for managing cookies
import "./profileDropdown.css";

const ProfileDropdown = ({ updateLoginState }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false); // Track notification dropdown visibility
  const [userName, setUserName] = useState(""); // State to store user's name
  const [notifications, setNotifications] = useState([]); // State to store notifications
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null); // Ref for notification dropdown
  // Add this inside useEffect to get userId from cookies or Supabase
  const [userId, setUserId] = useState("");
  const navigate = useNavigate();

  // Fetch user data from Supabase
  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const userData = Cookies.get("userData");
        if (userData) {
          let userInfo;
          try {
            userInfo = JSON.parse(userData);
            // Set the userId from cookie
            setUserId(userInfo.userId);
          } catch (parseError) {
            console.error("Error parsing userData:", parseError);
            setUserName("Unknown User");
            return;
          }
          const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("userId", userInfo.userId)
            .single();

          if (data) {
            setUserName(data.userName);
          } else if (error) {
            console.error("Error fetching userName:", error);
            setUserName("Unknown User"); // Fallback to "User" if no data is found
          }
        }
      } catch (error) {
        console.error("Unexpected error:", error);
        setUserName("Unknown User"); // Fallback to "User" on unexpected errors
      }
    };

    fetchUserName();
  }, []); // Empty dependency array ensures this runs once on mount/unmount

  // Function to handle logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut(); // Sign out from Supabase Auth
      Cookies.remove("userData"); // Remove user cookie

      // Call the updateLoginState function passed from App.js
      if (updateLoginState) {
        updateLoginState(false);
      }

      navigate("/login"); // Redirect to login page
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Expand the notification fetching to include ticket information
const handleNotificationClick = async () => {
  setIsNotificationOpen(!isNotificationOpen);

  if (!isNotificationOpen && userId) {
    // Fetch notifications with joined ticket information if available
    const { data, error } = await supabase
      .from("notifications")
      .select(`
        notificationId,
        notificationMessage,
        createdAt,
        isRead,
        ticketId,
        tickets:ticketId (ticketId, ticketTitle)
      `)
      .eq("recipientId", userId)
      .order("createdAt", { ascending: false });

    if (error) {
      console.error("Failed to fetch notifications", error);
    } else {
      setNotifications(data);
      
      // Mark notifications as read
      const unreadNotifications = data.filter(n => !n.isRead).map(n => n.id);
      if (unreadNotifications.length > 0) {
        await supabase
          .from("notifications")
          .update({ isRead: true })
          .in("id", unreadNotifications);
      }
    }
  }
};

  // Close dropdown if clicked outside (handles both profile and notification dropdowns)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }

      // Close notification dropdown if clicked outside
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    // Clean up the event listener when component unmounts
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []); // Empty dependency array ensures this runs once on mount/unmount

  return (
    <div className="profile-container" ref={dropdownRef}>
      {/* Notification Button */}
      <button
        className="notification-button"
        aria-label="Notifications"
        onClick={handleNotificationClick}
      >
        <Bell color="#6b7280" />
      </button>

      {/* Profile Dropdown Button */}
      <button
        className={`profile-button ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className="profile-icon">
          <User size={20} color="#6b7280" />
        </div>
        <span className="profile-name">
          {userName ? userName : "Loading..."}
        </span>
        <ChevronDown size={18} className="chevron-icon" />
      </button>

      {/* Notification Dropdown */}
      {isNotificationOpen && (
        <div className="notification-dropdown" ref={notificationRef}>
          <h4>Notifications</h4>
          {notifications.length === 0 ? (
            <p>No new notifications</p>
          ) : (
            <ul>
              {notifications.map((notification) => (
                <li 
                  key={notification.id} 
                  className={`notification-item ${notification.isRead ? "" : "unread"}`}
                  onClick={() => {
                    // If notification has a ticket, navigate to that ticket's detail page
                    if (notification.ticketId) {
                      navigate(`/ticket/${notification.ticketId}`);
                      setIsNotificationOpen(false);
                    }
                  }}
                >
                  <p>{notification.message}</p>
                  <small>{new Date(notification.createdAt).toLocaleString()}</small>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {isOpen && (
        <div className="dropdown-menu" role="menu">
          <Link to="/view-profile" className="dropdown-item">
            View Profile
          </Link>
          <button
            className="dropdown-item"
            role="menuitem"
            onClick={handleLogout}
          >
            Logout
          </button>
          {/* <button className="dropdown-item deactivate" role="menuitem">
            Deactivate Account
          </button> */}
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
