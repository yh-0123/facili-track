//Resident Ticket History Page

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import "./ticketHistory.css";

const TicketHistory = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    // Fetch tickets from the database
    const fetchTickets = async () => {
      try {
        const userData = JSON.parse(Cookies.get("user") || "{}");
        const response = await fetch(
          `http://localhost:5000/get-tickets?userId=${userData.userId}`
        );
        const data = await response.json();
        setTickets(data);
      } catch (error) {
        console.error("Error fetching tickets:", error);
      }
    };

    fetchTickets();
  }, []);

  return (
    <div className="ticket-history">
      <button className="back1-button" onClick={() => navigate("/resident-home")}>
        ←
      </button>
      <h1 className="page-title">My Tickets</h1>

      {tickets.length > 0 ? (
        tickets.map((ticket) => (
          <div key={ticket.id} className="ticket-card">
            <p><strong>Ticket ID:</strong> {ticket.id}</p>
            <p><strong>Title:</strong> {ticket.title}</p>
            <p><strong>Status:</strong> {ticket.status}</p>
            <button
              className="view-ticket-button"
              onClick={() => navigate(`/ticket/${ticket.id}`)}
            >
              View Ticket
            </button>
          </div>
        ))
      ) : (
        <p className="no-tickets">No tickets found.</p>
      )}
    </div>
  );
};

export default TicketHistory;
