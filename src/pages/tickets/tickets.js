import React, { useState, useEffect } from "react";
import { FaSearch, FaCircle } from "react-icons/fa";
import { Link } from "react-router-dom";
import PageHeader from "../pageHeader";
import supabase from "../../backend/DBClient/SupaBaseClient"; // Import your existing Supabase client
import "../index.css";
import "./tickets.css";
import TicketStatusEnum from "./ticketStatusEnum";
import Cookies from "js-cookie";

const Tickets = () => {
  const [tickets, setTickets] = useState([]); // State to store tickets from Supabase
  const [activeFilter, setActiveFilter] = useState("Not Assigned");
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true); // Loading state
  const ticketsPerPage = 5;

  const filters = ["Not Assigned", "Assigned", "Resolved"];

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      try {
        let userInfo;
        const userData = Cookies.get("userData");
        userInfo = JSON.parse(userData);
        const { data, error } = await supabase
          .from("ticket")
          .select("*, users(userName)")
          .eq("assignedWorkerId", userInfo.userId);

        console.log("Fetched tickets:", data); // Log the fetched tickets
        
        if (error) {
          console.error("Error fetching tickets:", error.message);
        } else {
          setTickets(data || []); // Set the fetched tickets
        }
      } catch (error) {
        console.error("Unexpected error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  const filterTickets = () => {
    if (activeFilter === "Not Assigned") {
      return tickets.filter(
        (ticket) => ticket.ticketStatus === TicketStatusEnum.NOT_ASSIGNED
      );
    } else if (activeFilter === "Assigned") {
      return tickets.filter(
        (ticket) => ticket.ticketStatus === TicketStatusEnum.ASSIGNED
      );
    } else if (activeFilter === "Resolved") {
      return tickets.filter(
        (ticket) => ticket.ticketStatus === TicketStatusEnum.RESOLVED
      );
    }
    console.log(tickets);
    return tickets;
  };

  const filteredTickets = filterTickets();
  const startIndex = (pageNumber - 1) * ticketsPerPage;
  const displayedTickets = filteredTickets.slice(
    startIndex,
    startIndex + ticketsPerPage
  );

  return (
    <div className="tickets-page">
      <div className="content">
        <PageHeader title="Tickets" />

        <div className="search-bar">
          <FaSearch style={{ marginTop: "10px" }} />
          <input type="text" placeholder="Search for ticket" />
          <select>
            <option>This Week</option>
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
                  setPageNumber(1);
                }}
              >
                {filter}
              </button>
            ))}
          </div>

          <Link to="/create-ticket" className="create-ticket-button">
            Create Ticket
          </Link>
        </div>

        <div className="tickets-list">
          {loading ? (
            <p>Loading tickets...</p>
          ) : displayedTickets.length > 0 ? (
            displayedTickets.map((ticket) => {
              // Determine the color based on status
              const getStatusColor = (ticket) => {
                console.log(ticket.ticketStatus);
                if (ticket.ticketStatus === TicketStatusEnum.NOT_ASSIGNED)
                  return "red-dot";
                if (ticket.ticketStatus === TicketStatusEnum.ASSIGNED)
                  return "orange-dot";
                if (ticket.ticketStatus === TicketStatusEnum.RESOLVED)
                  return "green-dot";
                return "";
              };

              return (
                <div key={ticket.id} className="ticket-card">
                  <div className="ticket-header">
                    <FaCircle
                      className={`status-dot ${getStatusColor(ticket)}`}
                    />
                    <strong>Ticket ID {ticket.ticketId}</strong>
                  </div>
                  <p className="ticket-title">{ticket.ticketTitle}</p>
                  <p className="ticket-status">
                    {ticket.ticketStatus === TicketStatusEnum.NOT_ASSIGNED
                      ? "Not Assigned"
                      : ticket.ticketStatus === TicketStatusEnum.ASSIGNED
                      ? "Assigned"
                      : ticket.ticketStatus === TicketStatusEnum.RESOLVED
                      ? "Resolved"
                      : "Unknown Status"}
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
            <p>No tickets available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tickets;
