import React, { useState } from 'react';
import { FaSearch, FaCircle } from 'react-icons/fa';
import '../index.css';

const ticketsData = [
  {
    id: 1,
    title: 'Light is not working in the carpark',
    status: 'Not Assigned',
    time: 'Submitted on 2 Jan 2025'
  },
  {
    id: 2,
    title: 'Aircond in Gym is leaking water',
    status: 'Not Assigned',
    time: 'Posted at 1:05 PM'
  },
  {
    id: 3,
    title: 'Light in public toilet beside swimming pool not working',
    status: 'Assigned to John Snow',
    time: 'Posted at 10:45 AM'
  }
];

const Tickets = () => {
  const [activeFilter, setActiveFilter] = useState('New');

  const filters = ['New', 'Assigned', 'Open', 'Resolved'];

  return (
    <div className="tickets-page">
      <div className="content">
        <header>
          <span>Welcome! Alex Ong</span>
          <div className="user-info">
            <button className="notification-btn">🔔</button>
            <span>Alex Ong</span>
          </div>
        </header>

        <h1>Tickets</h1>

        <div className="search-bar">
          <FaSearch />
          <input type="text" placeholder="Search for ticket" />
          <select>
            <option>This Week</option>
          </select>
        </div>

        <div className="filter-buttons">
          {filters.map(filter => (
            <button
              key={filter}
              className={filter === activeFilter ? 'active' : ''}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="tickets-list">
          {ticketsData.map(ticket => (
            <div key={ticket.id} className="ticket-card">
              <div className="ticket-header">
                <FaCircle className="red-dot" />
                <strong>Ticket ID</strong>
              </div>
              <p className="ticket-title">{ticket.title}</p>
              <p className="ticket-status">{ticket.status}</p>
              <p className="ticket-time">{ticket.time}</p>
              <a href="#" className="view-ticket">View Ticket</a>
            </div>
          ))}
        </div>

        <div className="pagination">
          <button>Previous</button>
          <span>1</span>
          <button>Next</button>
        </div>
      </div>
    </div>
  );
};

export default Tickets;