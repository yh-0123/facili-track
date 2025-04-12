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
  const [unreadCount, setUnreadCount] = useState(0); // State to track unread notifications count
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

  // Fetch unread notifications count when userId changes
  useEffect(() => {
    const fetchUnreadNotificationsCount = async () => {
      if (!userId) return;
      
      try {
        const { data, error } = await supabase
          .from("notifications")
          .select("notificationId")
          .eq("recipientId", userId)
          .eq("isRead", false);
          
        if (error) {
          console.error("Error fetching unread notifications count:", error);
          return;
        }
        
        setUnreadCount(data.length);
      } catch (error) {
        console.error("Unexpected error fetching unread notifications:", error);
      }
    };
    
    fetchUnreadNotificationsCount();
    
    // Set up a periodic refresh of the unread count (every 30 seconds)
    const intervalId = setInterval(fetchUnreadNotificationsCount, 30000);
    
    return () => clearInterval(intervalId);
  }, [userId]);

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
      const { data, error } = await supabase
        .from("notifications")
        .select(
          `
          notificationId,
          notificationMessage,
          createdAt,
          isRead,
          ticketId,
          tickets:ticketId (ticketId, ticketTitle)
        `
        )
        .eq("recipientId", userId)
        .order("createdAt", { ascending: false });

      if (error) {
        console.error("Failed to fetch notifications", error);
      } else {
        setNotifications(data);

        // Fix: Only update if there are unread notifications
        const unreadNotifications = data
          .filter((n) => !n.isRead)
          .map((n) => n.notificationId); // Change from n.id to n.notificationId

        if (unreadNotifications.length > 0) {
          const { error: updateError } = await supabase
            .from("notifications")
            .update({ isRead: true })
            .in("notificationId", unreadNotifications); // Change from 'id' to 'notificationId'

          if (updateError) {
            console.error("Error marking notifications as read:", updateError);
          } else {
            // If successfully marked as read, update the unread count to zero
            setUnreadCount(0);
          }
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
      {/* Notification Button with Badge */}
      <div className="notification-wrapper">
        <button
          className="notification-button"
          aria-label="Notifications"
          onClick={handleNotificationClick}
        >
          <Bell color="#6b7280" />
        </button>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </div>

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
                  key={notification.notificationId} // Fix: Changed from id to notificationId
                  className={`notification-item ${
                    notification.isRead ? "" : "unread"
                  }`}
                  onClick={() => {
                    if (notification.ticketId) {
                      navigate(`/ticket/${notification.ticketId}`);
                      setIsNotificationOpen(false);
                    }
                  }}
                >
                  <p>{notification.notificationMessage}</p>{" "}
                  {/* Fix: Changed from message to notificationMessage */}
                  <small>
                    {new Date(notification.createdAt).toLocaleString()}
                  </small>
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