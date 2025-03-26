import React, { useState } from 'react';
import { FaSearch, FaCircle } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import PageHeader from "../pageHeader";
import '../index.css';
import './tickets.css';

const ticketsData = [
  { id: 1, title: 'Light is not working in the carpark', status: 'Not Assigned', time: 'Submitted on 2 Jan 2025' },
  { id: 2, title: 'Aircond in Gym is leaking water', status: 'Not Assigned', time: 'Posted at 1:05 PM' },
  { id: 3, title: 'Light in public toilet beside swimming pool not working', status: 'Assigned to John Snow', time: 'Posted at 10:45 AM' },
  { id: 4, title: 'Broken window in meeting room', status: 'Resolved', time: 'Posted at 9:30 AM' },
  { id: 5, title: 'Elevator malfunction in Block B', status: 'Open', time: 'Posted at 8:15 AM' },
  { id: 6, title: 'Water leakage in parking basement', status: 'Assigned to Jane Doe', time: 'Posted at 7:00 AM' },
  { id: 7, title: 'Door lock issue in main entrance', status: 'Not Assigned', time: 'Posted at 6:45 AM' },
];

const Tickets = () => {
  const [activeFilter, setActiveFilter] = useState('Not Assigned');
  const [pageNumber, setPageNumber] = useState(1);
  const ticketsPerPage = 5;

  const filters = ['Not Assigned', 'Assigned', 'Resolved'];
  const totalPages = Math.ceil(ticketsData.length / ticketsPerPage);

  const filterTickets = () => {
    if (activeFilter === 'Not Assigned') {
      return ticketsData.filter(ticket => ticket.status === 'Not Assigned');
    } else if (activeFilter === 'Assigned') {
      return ticketsData.filter(ticket => ticket.status.includes('Assigned to'));
    } else if (activeFilter === 'Resolved') {
      return ticketsData.filter(ticket => ticket.status === 'Resolved');
    }
    return ticketsData;
  };

  const filteredTickets = filterTickets();
  const startIndex = (pageNumber - 1) * ticketsPerPage;
  const displayedTickets = filteredTickets.slice(startIndex, startIndex + ticketsPerPage);

  const nextPage = () => {
    if (pageNumber < Math.ceil(filteredTickets.length / ticketsPerPage)) {
      setPageNumber(pageNumber + 1);
    }
  };

  const prevPage = () => {
    if (pageNumber > 1) {
      setPageNumber(pageNumber - 1);
    }
  };

  return (
    <div className="tickets-page">
      <div className="content">
        <PageHeader title="Tickets" />

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
              onClick={() => {
                setActiveFilter(filter);
                setPageNumber(1);
              }}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="tickets-list">
          {displayedTickets.length > 0 ? (
            displayedTickets.map(ticket => (
              <div key={ticket.id} className="ticket-card">
                <div className="ticket-header">
                  <FaCircle className="red-dot" />
                  <strong>Ticket ID {ticket.id}</strong>
                </div>
                <p className="ticket-title">{ticket.title}</p>
                <p className="ticket-status">{ticket.status}</p>
                <p className="ticket-time">{ticket.time}</p>
                <Link to={`/ticket/${ticket.id}`} className="view-ticket">View Ticket</Link>
              </div>
            ))
          ) : (
            <p>No tickets available.</p>
          )}
        </div>

        <div className="pagination">
          <div className="button-group">
            <button type="button" className="back-button" onClick={prevPage} disabled={pageNumber === 1}>
              Previous
            </button>
            <span>Page {pageNumber} of {Math.ceil(filteredTickets.length / ticketsPerPage)}</span>
            <button type="button" className="next-button" onClick={nextPage} disabled={pageNumber === Math.ceil(filteredTickets.length / ticketsPerPage)}>
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tickets;
