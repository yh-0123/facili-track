import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, User, Bell } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "../../redux/actions/authActions";
import supabase from "../../backend/DBClient/SupaBaseClient";
import "./profileDropdown.css";

const ProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Get user data from Redux store
  const { userData } = useSelector((state) => state.auth);
  const userId = userData?.userId;
  const userName = userData?.userName || "Unknown User";

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

      // Dispatch logout action to Redux
      dispatch(logoutUser());

      navigate("/login"); // Redirect to login page
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Handle notification click to fetch and display notifications
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

        // Only update if there are unread notifications
        const unreadNotifications = data
          .filter((n) => !n.isRead)
          .map((n) => n.notificationId);

        if (unreadNotifications.length > 0) {
          const { error: updateError } = await supabase
            .from("notifications")
            .update({ isRead: true })
            .in("notificationId", unreadNotifications);

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

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
          <span className="notification-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
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
        <span className="profile-name">{userName}</span>
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
                  key={notification.notificationId}
                  className={`notification-item ${
                    notification.isRead ? "" : "unread"
                  }`}
                  onClick={() => {
                    if (notification.ticketId) {
                      navigate(`/tickets/${notification.ticketId}`, {
                        state: {
                          fromNotification: true,
                          ticketDetails: notification.tickets,
                          timestamp: new Date().getTime(),
                        },
                      });
                      setIsNotificationOpen(false);
                    }
                  }}
                >
                  <p>{notification.notificationMessage}</p>
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
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
