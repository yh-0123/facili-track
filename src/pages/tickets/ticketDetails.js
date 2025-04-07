import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import supabase from "../../backend/DBClient/SupaBaseClient"; // Import your existing Supabase client
import TicketStatusEnum from "./ticketStatusEnum";
import PageHeader from "../pageHeader";
import "./ticketDetails.css";

const TicketDetails = () => {
  const location = useLocation();
  const { ticket } = location.state || {}; // Retrieve the ticket details from state
  const [submittedBy, setSubmittedBy] = useState("");
  const [ticketStatus, setTicketStatus] = useState(ticket?.ticketStatus || ""); // State to manage ticket status
  const [showModal, setShowModal] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);

  useEffect(() => {
    const fetchUserName = async () => {
      if (ticket?.reportedResidentID) {
        const { data, error } = await supabase
          .from("users")
          .select("userName")
          .eq("userId", ticket.reportedResidentId)
          .single();

        if (error) {
          console.error("Error fetching user:", error);
          setSubmittedBy("Unknown");
        } else {
          setSubmittedBy(data?.userName || "Unknown");
        }
      }
    };

    fetchUserName();
  }, [ticket?.reportedResidentId]);

  // Fetch facility workers
  useEffect(() => {
    const fetchWorkers = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("userRole", 1);
      if (error) {
        console.error("Error fetching workers:", error);
      } else {
        setWorkers(data);
      }
    };

    fetchWorkers();
  }, []);

  // Assign Ticket
  const handleAssignTicket = async () => {
    if (!ticket?.ticketId) return;
    const { data, error } = await supabase
      .from("ticket")
      .update({
        assignedWorkerId: selectedWorker.userId,
        ticketStatus: TicketStatusEnum.ASSIGNED,
      })
      .eq("ticketId", ticket.ticketId)
      .single();

    if (error) {
      console.error("Error assigning ticket:", error);
    } else {
      setShowModal(false);
      ticket.assignedTo = selectedWorker.userName;
      setTicketStatus(TicketStatusEnum.ASSIGNED);
    }
    setShowModal(false);
  };

  // Handle resolve ticket status update
  const handleResolveTicket = async () => {
    if (!ticket?.ticketId) return;

    // Update the ticket status in the database
    const { data, error } = await supabase
      .from("ticket")
      .update({ ticketStatus: TicketStatusEnum.RESOLVED })
      .eq("ticketId", ticket.ticketId)
      .single();

    if (error) {
      console.error("Error resolving ticket:", error);
    } else {
      setTicketStatus(TicketStatusEnum.RESOLVED); // Update status in the UI
    }
  };

  if (!ticket) {
    return <p>No ticket details available.</p>;
  }

  return (
    <div className="ticket-details-page">
      <PageHeader title="Ticket Details" />
      <div className="ticket-container">
        <div className="ticket-header">
          <p>Ticket ID: {ticket.ticketId}</p>
        </div>

        <div className="ticket-content">
          {/* Left Section */}
          <div className="ticket-info">
            <p>
              <strong>Title:</strong> <h5>{ticket.ticketTitle}</h5>
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <h5>
                {ticket.ticketStatus === TicketStatusEnum.NOT_ASSIGNED
                  ? "Not Assigned"
                  : ticket.ticketStatus === TicketStatusEnum.ASSIGNED
                  ? "Assigned"
                  : ticket.ticketStatus === TicketStatusEnum.RESOLVED
                  ? "Resolved"
                  : "Unknown Status"}
              </h5>
            </p>
            <p>
              <strong>Submitted By:</strong> <h5>{submittedBy}</h5>
            </p>
            <p>
              <strong>Submission Date:</strong>{" "}
              <h5>{new Date(ticket.submissionDate).toLocaleString()}</h5>
            </p>
            <p>
              <strong>Description:</strong> <h5>{ticket.ticketDescription}</h5>
            </p>
            <p>
              <strong>Location:</strong> <h5>{ticket.ticketLocation}</h5>
            </p>
            <p>
              <strong>Assigned To:</strong>{" "}
              <h5>{ticket.userName || "Not Assigned"}</h5>
            </p>
          </div>

          {/* Right Section */}
          <div className="ticket-updates">
            <p>
              <strong>Attachment:</strong>
            </p>
            <div className="attachment-box">
              {ticket.attachment ? (
                <img src={ticket.ticketAttachment} alt="Attachment" />
              ) : (
                "(No Image)"
              )}
            </div>
            <p>
              <strong>Update Notes:</strong>
            </p>
            <p className="update-note">
              {ticket.updateNotes || "No updates available"}
            </p>
            <button className="add-notes-btn">💬 Add Notes...</button>

            <p>
              <strong>Updated By:</strong> <h5>{ticket.updatedBy || "N/A"}</h5>
            </p>
          </div>
        </div>
      </div>

      <div className="ticket-actions">
        {/* Conditionally render the buttons if the ticket status is not "Resolved" */}
        {ticketStatus !== TicketStatusEnum.RESOLVED && (
          <>
            <button className="assign-btn" onClick={() => setShowModal(true)}>
              Assign Ticket
            </button>
            <button className="resolve-btn" onClick={handleResolveTicket}>
              Resolve Ticket
            </button>
          </>
        )}
      </div>
      <button className="back-btn" onClick={() => window.history.back()}>
        Back
      </button>

      {/* Assign Ticket Modal */}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Select Facility Worker</h3>
            <select
              onChange={(e) =>
                setSelectedWorker(
                  workers.find(
                    (worker) => worker.userId === parseInt(e.target.value, 10)
                  )
                )
              }
            >
              <option value="">Select a worker</option>
              {workers.map((worker) => (
                <option key={worker.userId} value={worker.userId}>
                  {worker.userName}
                </option>
              ))}
            </select>
            <div className="modal-buttons">
              <button onClick={() => setShowModal(false)}>Cancel</button>
              <button onClick={handleAssignTicket} disabled={!selectedWorker}>
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketDetails;
