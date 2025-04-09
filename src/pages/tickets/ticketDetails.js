import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import supabase from "../../backend/DBClient/SupaBaseClient";
import TicketStatusEnum from "./ticketStatusEnum";
import PageHeader from "../pageHeader";
import userRolesEnum from "../userManagement/userRolesEnum";
import Cookies from "js-cookie";
import "./ticketDetails.css";

const TicketDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { ticket } = location.state || {};
  const [submittedBy, setSubmittedBy] = useState("");
  const [assignedWorkerName, setAssignedWorkerName] = useState("Not Assigned");
  const [ticketStatus, setTicketStatus] = useState(ticket?.ticketStatus || "");
  const [showModal, setShowModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [ticketNotes, setTicketNotes] = useState([]);

  // Helper function to sort notes chronologically
  const sortNotesByTimestamp = (notes) => {
    return [...notes].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
  };

  useEffect(() => {
    // Get current user from cookie
    const getCurrentUser = () => {
      try {
        const userData = Cookies.get("userData");
        if (userData) {
          const user = JSON.parse(userData);
          setCurrentUser(user);
          return user;
        }
        return null;
      } catch (error) {
        console.error("Error parsing user data:", error);
        return null;
      }
    };

    // Check if user is authorized to view this ticket
    const checkAuthorization = async (user, ticketData) => {
      if (!user || !ticketData) {
        setAuthorized(false);
        return false;
      }

      // Admin can view all tickets
      if (user.userRole === userRolesEnum.ADMIN) {
        setAuthorized(true);
        return true;
      }

      // Facility worker can view tickets assigned to them
      if (user.userRole === userRolesEnum.FACILITY_WORKER) {
        if (ticketData.assignedWorkerId === user.userId) {
          setAuthorized(true);
          return true;
        }
      }

      // Resident can view tickets they submitted
      if (user.userRole === userRolesEnum.RESIDENT) {
        if (ticketData.reportedResidentId === user.userId) {
          setAuthorized(true);
          return true;
        }
      }

      setAuthorized(false);
      return false;
    };

    const initializeComponent = async () => {
      setLoading(true);
      const user = getCurrentUser();
      
      if (!ticket) {
        setLoading(false);
        return;
      }
      
      // If we need to fetch the complete ticket data from the database
      let ticketData = ticket;
      if (ticket.ticketId && (!ticket.reportedResidentId || !ticket.assignedWorkerId)) {
        const { data, error } = await supabase
          .from("ticket")
          .select("*")
          .eq("ticketId", ticket.ticketId)
          .single();
          
        if (!error) {
          ticketData = data;
        }
      }
      
      const isAuthorized = await checkAuthorization(user, ticketData);
      
      if (!isAuthorized) {
        // Redirect unauthorized users
        alert("You are not authorized to view this ticket");
        navigate("/tickets");
        return;
      }
      
      setLoading(false);
    };

    initializeComponent();
  }, [ticket, navigate]);

  useEffect(() => {
    const fetchUserName = async () => {
      if (ticket?.reportedResidentId) {
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

    if (authorized) {
      fetchUserName();
    }
  }, [ticket?.reportedResidentId, authorized]);

  // Fetch assigned worker's name
  useEffect(() => {
    const fetchAssignedWorker = async () => {
      if (ticket?.assignedWorkerId) {
        const { data, error } = await supabase
          .from("users")
          .select("userName")
          .eq("userId", ticket.assignedWorkerId)
          .single();

        if (error) {
          console.error("Error fetching assigned worker:", error);
        } else {
          setAssignedWorkerName(data?.userName || "Unknown");
        }
      }
    };

    if (authorized && ticket?.assignedWorkerId) {
      fetchAssignedWorker();
    }
  }, [ticket?.assignedWorkerId, authorized]);

  // Fetch facility workers
  useEffect(() => {
    if (!authorized || currentUser?.userRole !== userRolesEnum.ADMIN) return;
    
    const fetchWorkers = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("userRole", userRolesEnum.FACILITY_WORKER);
      if (error) {
        console.error("Error fetching workers:", error);
      } else {
        setWorkers(data);
      }
    };

    fetchWorkers();
  }, [authorized, currentUser]);

  // Fetch ticket notes
  useEffect(() => {
    const fetchTicketNotes = async () => {
      if (!ticket?.ticketId) return;
      
      try {
        // First check if updateNotes exists in the ticket table
        const { data: ticketData, error: ticketError } = await supabase
          .from("ticket")
          .select("updateNotes")
          .eq("ticketId", ticket.ticketId)
          .single();
        
        if (ticketError) {
          console.error("Error fetching ticket notes:", ticketError);
          return;
        }
        
        // If updateNotes exists and is not null/empty, parse it
        if (ticketData?.updateNotes) {
          try {
            const parsedNotes = JSON.parse(ticketData.updateNotes);
            if (Array.isArray(parsedNotes)) {
              setTicketNotes(sortNotesByTimestamp(parsedNotes));
            } else {
              // If it's not an array but has content, convert to the new format
              setTicketNotes([{
                note: String(ticketData.updateNotes),
                addedBy: ticket.updatedBy || "Unknown",
                timestamp: ticket.resolutionDate || new Date().toISOString()
              }]);
            }
          } catch (parseError) {
            console.warn("Could not parse updateNotes as JSON:", parseError);
            // If it's not valid JSON, treat it as a single note in the old format
            setTicketNotes([{
              note: String(ticketData.updateNotes),
              addedBy: ticket.updatedBy || "Unknown",
              timestamp: ticket.resolutionDate || new Date().toISOString()
            }]);
          }
        }
      } catch (error) {
        console.error("Error processing ticket notes:", error);
      }
    };

    if (authorized) {
      fetchTicketNotes();
    }
  }, [ticket?.ticketId, authorized]);

  // Assign Ticket
  const handleAssignTicket = async () => {
    if (!ticket?.ticketId || !selectedWorker) return;
    
    // Validate user data
    if (!currentUser?.userName) {
      console.error("Cannot assign ticket: User information missing");
      alert("You must be logged in to assign tickets");
      return;
    }
    
    // Create a new note for this assignment
    const newNote = {
      note: `Ticket assigned to ${selectedWorker.userName}`,
      addedBy: currentUser.userName,
      timestamp: new Date().toISOString()
    };
    
    // Combine existing notes with the new note
    const updatedNotes = sortNotesByTimestamp([...ticketNotes, newNote]);
    
    // Optimistically update UI
    setShowModal(false);
    setTicketStatus(TicketStatusEnum.ASSIGNED);
    setTicketNotes(updatedNotes);
    setAssignedWorkerName(selectedWorker.userName);
    
    const { data, error } = await supabase
      .from("ticket")
      .update({
        assignedWorkerId: selectedWorker.userId,
        ticketStatus: TicketStatusEnum.ASSIGNED,
        updateNotes: JSON.stringify(updatedNotes),
        updatedBy: currentUser.userName
      })
      .eq("ticketId", ticket.ticketId);

    if (error) {
      console.error("Error assigning ticket:", error);
      // Rollback UI if there's an error
      alert("Failed to assign ticket. Please try again.");
    }
  };

  // Handle resolve ticket status update
  const handleResolveTicket = async () => {
    if (!ticket?.ticketId) return;
    
    // Validate user data
    if (!currentUser?.userName) {
      console.error("Cannot resolve ticket: User information missing");
      alert("You must be logged in to resolve tickets");
      return;
    }

    // Create a new note for this resolution
    const newNote = {
      note: "Ticket marked as resolved",
      addedBy: currentUser.userName,
      timestamp: new Date().toISOString()
    };
    
    // Combine existing notes with the new note
    const updatedNotes = sortNotesByTimestamp([...ticketNotes, newNote]);
    
    // Optimistically update UI
    setTicketStatus(TicketStatusEnum.RESOLVED);
    setTicketNotes(updatedNotes);

    // Update the ticket status in the database
    const { data, error } = await supabase
      .from("ticket")
      .update({ 
        ticketStatus: TicketStatusEnum.RESOLVED,
        updatedBy: currentUser.userName,
        resolutionDate: new Date().toISOString(),
        updateNotes: JSON.stringify(updatedNotes)
      })
      .eq("ticketId", ticket.ticketId);

    if (error) {
      console.error("Error resolving ticket:", error);
      alert("Failed to resolve ticket. Please try again.");
    }
  };

  // Handle adding notes
  const handleAddNote = async () => {
    if (!noteText.trim() || !ticket?.ticketId) return;
    
    // Validate user data
    if (!currentUser?.userName) {
      console.error("Cannot add note: User information missing");
      alert("You must be logged in to add notes");
      return;
    }
    
    // Create the new note object
    const newNote = {
      note: noteText.trim(),
      addedBy: currentUser.userName,
      timestamp: new Date().toISOString()
    };
    
    // Combine existing notes with the new note and sort chronologically
    const updatedNotes = sortNotesByTimestamp([...ticketNotes, newNote]);
    
    // Optimistically update UI
    setTicketNotes(updatedNotes);
    setNoteText(""); 
    setShowNotesModal(false);
    
    // Update the database
    const { data, error } = await supabase
      .from("ticket")
      .update({
        updateNotes: JSON.stringify(updatedNotes),
        updatedBy: currentUser.userName
      })
      .eq("ticketId", ticket.ticketId);
      
    if (error) {
      console.error("Error adding note:", error);
      // Rollback UI if there's an error
      setTicketNotes(ticketNotes);
      alert("Failed to save your note. Please try again.");
    }
  };

  // Check if user can add notes
  const canAddNotes = () => {
    if (!currentUser || !ticket) return false;
    
    // Admin can add notes to any ticket
    if (currentUser.userRole === userRolesEnum.ADMIN) return true;
    
    // Facility worker can add notes if they're assigned to the ticket
    if (currentUser.userRole === userRolesEnum.FACILITY_WORKER && 
        ticket.assignedWorkerId === currentUser.userId) return true;
    
    // Resident can add notes if they submitted the ticket
    if (currentUser.userRole === userRolesEnum.RESIDENT && 
        ticket.reportedResidentId === currentUser.userId) return true;
    
    return false;
  };

  if (loading) {
    return <p>Loading ticket details...</p>;
  }

  if (!ticket || !authorized) {
    return <p>No ticket details available or you are not authorized to view this ticket.</p>;
  }

  const canAssignTicket = 
    currentUser?.userRole === userRolesEnum.ADMIN && 
    ticketStatus !== TicketStatusEnum.RESOLVED;
    
  const canResolveTicket = 
    (currentUser?.userRole === userRolesEnum.ADMIN || 
     (currentUser?.userRole === userRolesEnum.FACILITY_WORKER && 
      ticket.assignedWorkerId === currentUser?.userId)) && 
    ticketStatus !== TicketStatusEnum.RESOLVED;

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

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
                {ticketStatus === TicketStatusEnum.NOT_ASSIGNED
                  ? "Not Assigned"
                  : ticketStatus === TicketStatusEnum.ASSIGNED
                  ? "Assigned"
                  : ticketStatus === TicketStatusEnum.RESOLVED
                  ? "Resolved"
                  : "Unknown Status"}
              </h5>
            </p>
            <p>
              <strong>Submitted By:</strong> <h5>{submittedBy}</h5>
            </p>
            <p>
              <strong>Submission Date:</strong>{" "}
              <h5>{formatDate(ticket.submissionDate)}</h5>
            </p>
            <p>
              <strong>Description:</strong> <h5>{ticket.ticketDescription}</h5>
            </p>
            <p>
              <strong>Location:</strong> <h5>{ticket.ticketLocation}</h5>
            </p>
            <p>
              <strong>Assigned To:</strong>{" "}
              <h5>{assignedWorkerName}</h5>
            </p>
            {ticket.resolutionDate && (
              <p>
                <strong>Resolution Date:</strong>{" "}
                <h5>{formatDate(ticket.resolutionDate)}</h5>
              </p>
            )}
          </div>

          {/* Right Section */}
          <div className="ticket-updates">
            <p>
              <strong>Attachment:</strong>
            </p>
            <div className="attachment-box">
              {ticket.ticketAttachment ? (
                <img src={ticket.ticketAttachment} alt="Attachment" />
              ) : (
                "(No Image)"
              )}
            </div>
            <p>
              <strong>Update Notes:</strong>
            </p>
            <div className="update-notes-container">
              {ticketNotes.length > 0 ? (
                ticketNotes.map((note, index) => (
                  <div key={index} className="note-item">
                    <p className="note-text">{note.note}</p>
                    <p className="note-meta">
                      Added by {note.addedBy} on {formatDate(note.timestamp)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="update-note">No updates available</p>
              )}
            </div>
            
            {canAddNotes() && (
              <button className="add-notes-btn" onClick={() => setShowNotesModal(true)}>
                💬 Add Notes
              </button>
            )}

            <p>
              <strong>Updated By:</strong> <h5>{ticket.updatedBy || "N/A"}</h5>
            </p>
          </div>
        </div>
      </div>

      <div className="ticket-actions">
        {canAssignTicket && (
          <button className="assign-btn" onClick={() => setShowModal(true)}>
            Assign Ticket
          </button>
        )}
        
        {canResolveTicket && (
          <button className="resolve-btn" onClick={handleResolveTicket}>
            Resolve Ticket
          </button>
        )}
      </div>
      <button className="back-btn" onClick={() => navigate('/tickets')}>
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

      {/* Add Notes Modal */}
      {showNotesModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Add Notes</h3>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Enter your notes here..."
              rows={4}
              className="notes-textarea"
            />
            <div className="modal-buttons">
              <button onClick={() => setShowNotesModal(false)}>Cancel</button>
              <button 
                onClick={handleAddNote} 
                disabled={!noteText.trim()}
              >
                Add Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketDetails;