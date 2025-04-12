import React, { useState, useEffect } from "react";
import { FaSearch, FaCircle } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "../pageHeader";
import supabase from "../../backend/DBClient/SupaBaseClient"; // Import your existing Supabase client
import "../index.css";
import "./tickets.css";
import TicketStatusEnum from "./ticketStatusEnum";
import userRolesEnum from "../userManagement/userRolesEnum";
import Cookies from "js-cookie";

const Tickets = () => {
  const [tickets, setTickets] = useState([]); // State to store tickets from Supabase
  const [activeFilter, setActiveFilter] = useState("Not Assigned");
  const [loading, setLoading] = useState(true); // Loading state
  const [userRole, setUserRole] = useState(null); // State to store user role
  const [userId, setUserId] = useState(null); // State for user ID
  const [searchTerm, setSearchTerm] = useState(""); // State for search term
  const [dateFilter, setDateFilter] = useState("all"); // Default to showing all dates
  const navigate = useNavigate();

  // Define filters based on user role
  const getFilters = (role) => {
    if (role === userRolesEnum.RESIDENT) {
      return ["Open", "Resolved"];
    }
    return ["Not Assigned", "Assigned", "Resolved"];
  };

  const [filters, setFilters] = useState([]);

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      try {
        let userInfo;
        const userData = Cookies.get("userData");
    
        if (!userData) {
          console.error("No user data found");
          navigate("/login");
          return;
        }
    
        userInfo = JSON.parse(userData);
        console.log("User info:", userInfo); // Debug user info
    
        setUserRole(userInfo.userRole);
        setUserId(userInfo.userId);
        setFilters(getFilters(userInfo.userRole));
    
        if (userInfo.userRole === userRolesEnum.RESIDENT) {
          setActiveFilter("Open");
        }
    
        // Fixed query structure for Supabase
        let query = supabase.from("ticket").select("*");
    
        // Apply role-based filters
        if (userInfo.userRole === userRolesEnum.ADMIN) {
          // Admin sees all tickets
          console.log("Admin query - no filters");
        } else if (userInfo.userRole === userRolesEnum.FACILITY_WORKER) {
          // Facility worker sees assigned tickets
          query = query.eq("assignedWorkerId", userInfo.userId);
          console.log("Worker query - filtered by assignedWorkerId:", userInfo.userId);
        } else if (userInfo.userRole === userRolesEnum.RESIDENT) {
          // Resident sees their tickets
          query = query.eq("reportedResidentId", userInfo.userId);
          console.log("Resident query - filtered by reportedResidentId:", userInfo.userId);
        }
    
        const { data, error } = await query;
    
        if (error) {
          console.error("Error fetching tickets:", error.message);
        } else {
          console.log("Fetched tickets count:", data?.length);
          console.log("First ticket sample:", data?.[0]);
          setTickets(data || []);
        }
      } catch (error) {
        console.error("Unexpected error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [navigate]);

  // This function gets the start date for filtering based on the selected option
  const getDateFilterStartDate = (filterOption) => {
    const today = new Date();
    switch (filterOption) {
      case "today":
        // Start of today
        today.setHours(0, 0, 0, 0);
        return today;
      case "this_week":
        // Start of current week (Sunday)
        const dayOfWeek = today.getDay(); // 0 for Sunday, 1 for Monday, etc.
        today.setDate(today.getDate() - dayOfWeek); // Go back to Sunday
        today.setHours(0, 0, 0, 0);
        return today;
      case "this_month":
        // Start of current month
        today.setDate(1); // First day of current month
        today.setHours(0, 0, 0, 0);
        return today;
      case "last_month":
        // Start of last month
        today.setMonth(today.getMonth() - 1);
        today.setDate(1); // First day of last month
        today.setHours(0, 0, 0, 0);
        return today;
      case "last_3_months":
        // 3 months ago
        today.setMonth(today.getMonth() - 3);
        today.setHours(0, 0, 0, 0);
        return today;
      case "last_6_months":
        // 6 months ago
        today.setMonth(today.getMonth() - 6);
        today.setHours(0, 0, 0, 0);
        return today;
      case "this_year":
        // Start of current year
        today.setMonth(0, 1); // January 1st
        today.setHours(0, 0, 0, 0);
        return today;
      default:
        return null; // No date filtering
    }
  };

  const filterTickets = () => {
    // First apply search filter if there's a search term
    let filtered = tickets;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(ticket => 
        ticket.ticketTitle?.toLowerCase().includes(term) || 
        String(ticket.ticketId).includes(term) ||
        (ticket.ticketDescription && ticket.ticketDescription.toLowerCase().includes(term))
      );
    }
    
    // Apply date filter if selected
    if (dateFilter !== "all") {
      const startDate = getDateFilterStartDate(dateFilter);
      if (startDate) {
        filtered = filtered.filter(ticket => {
          const ticketDate = new Date(ticket.submissionDate);
          return ticketDate >= startDate;
        });
      }
    }
    
    // Then apply status filters
    if (userRole === userRolesEnum.RESIDENT) {
      // For resident users
      if (activeFilter === "Open") {
        return filtered.filter(
          (ticket) => 
            ticket.ticketStatus === TicketStatusEnum.NOT_ASSIGNED || 
            ticket.ticketStatus === TicketStatusEnum.ASSIGNED
        );
      } else if (activeFilter === "Resolved") {
        return filtered.filter(
          (ticket) => ticket.ticketStatus === TicketStatusEnum.RESOLVED
        );
      }
    } 
    
    else if (userRole === userRolesEnum.FACILITY_WORKER) {
      // For resident users
      if (activeFilter === "Assigned") {
        return filtered.filter(
          (ticket) => ticket.ticketStatus === TicketStatusEnum.ASSIGNED
        );
      } else if (activeFilter === "Resolved") {
        return filtered.filter(
          (ticket) => ticket.ticketStatus === TicketStatusEnum.RESOLVED
        );
      }
    }
    
    else {
      // For admin and facility worker users
      if (activeFilter === "Not Assigned") {
        return filtered.filter(
          (ticket) => ticket.ticketStatus === TicketStatusEnum.NOT_ASSIGNED
        );
      } else if (activeFilter === "Assigned") {
        return filtered.filter(
          (ticket) => ticket.ticketStatus === TicketStatusEnum.ASSIGNED
        );
      } else if (activeFilter === "Resolved") {
        return filtered.filter(
          (ticket) => ticket.ticketStatus === TicketStatusEnum.RESOLVED
        );
      }
    }
    
    return filtered;
  };

  const handleDateFilterChange = (e) => {
    setDateFilter(e.target.value);
  };

  const filteredTickets = filterTickets();

  return (
    <div className="tickets-page">
      <div className="content">
          {userRole === userRolesEnum.RESIDENT && (
            <PageHeader title="Ticket History" />
          )}

          {userRole !== userRolesEnum.RESIDENT && (
            <PageHeader title="Tickets" />
          )}
        
        <div className="search-bar">
          <FaSearch style={{ marginTop: "10px" }} />
          <input 
            type="text" 
            placeholder="Search for ticket" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select 
            value={dateFilter} 
            onChange={handleDateFilterChange}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="last_3_months">Last 3 Months</option>
            <option value="last_6_months">Last 6 Months</option>
            <option value="this_year">This Year</option>
          </select>
        </div>
        <div className="filter-container">
          <div className="filter-buttons">
            {filters.map((filter) => (
              <button
                key={filter}
                className={filter === activeFilter ? "active" : ""}
                onClick={() => {
                  setActiveFilter(filter);
                }}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Conditionally render the "Create Ticket" button based on the user's role */}
          {userRole === userRolesEnum.ADMIN && (
            <Link to="/create-ticket" className="create-ticket-button">
              Create Ticket
            </Link>
          )}
          
        </div>

        <div className="tickets-list">
          {loading ? (
            <p>Loading tickets...</p>
          ) : filteredTickets.length > 0 ? (
            filteredTickets.map((ticket) => {
              // Determine the color based on status
              const getStatusColor = (ticket) => {
                if (ticket.ticketStatus === TicketStatusEnum.NOT_ASSIGNED)
                  return "red-dot";
                if (ticket.ticketStatus === TicketStatusEnum.ASSIGNED)
                  return "orange-dot";
                if (ticket.ticketStatus === TicketStatusEnum.RESOLVED)
                  return "green-dot";
                return "";
              };

              // Get the display status text
              const getStatusText = (ticket) => {
                if (userRole === userRolesEnum.RESIDENT && 
                   (ticket.ticketStatus === TicketStatusEnum.NOT_ASSIGNED || 
                    ticket.ticketStatus === TicketStatusEnum.ASSIGNED)) {
                  return "Open";
                } else {
                  return ticket.ticketStatus === TicketStatusEnum.NOT_ASSIGNED
                    ? "Not Assigned"
                    : ticket.ticketStatus === TicketStatusEnum.ASSIGNED
                    ? "Assigned"
                    : ticket.ticketStatus === TicketStatusEnum.RESOLVED
                    ? "Resolved"
                    : "Unknown Status";
                }
              };

              return (
                <div key={ticket.ticketId} className="ticket-card">
                  <div className="ticket-header">
                    <FaCircle
                      className={`status-dot ${getStatusColor(ticket)}`}
                    />
                    <strong>Ticket ID {ticket.ticketId}</strong>
                  </div>
                  <p className="ticket-title">{ticket.ticketTitle}</p>
                  <p className="ticket-status">
                    {getStatusText(ticket)}
                  </p>
                  <p className="ticket-time">
                    {new Date(ticket.submissionDate).toLocaleString()}
                  </p>
                  <Link
                    to={`/ticket/${ticket.ticketId}`}
                    state={{ ticket }} // Pass the ticket details as state
                    className="view-ticket"
                  >
                    View Ticket
                  </Link>
                </div>
              );
            })
          ) : (
            <p>No tickets available for the selected filters.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tickets;