import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import supabase from "../../backend/DBClient/SupaBaseClient"; // Import your existing Supabase client
import TicketStatusEnum from "./ticketStatusEnum";
import PageHeader from "../pageHeader";
import userRolesEnum from "../userManagement/userRolesEnum";
import Cookies from "js-cookie";
import "./ticketDetails.css";

const TicketDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { ticket } = location.state || {}; // Retrieve the ticket details from state
  const [submittedBy, setSubmittedBy] = useState("");
  const [ticketStatus, setTicketStatus] = useState(ticket?.ticketStatus || ""); // State to manage ticket status
  const [showModal, setShowModal] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

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
      // (In case we only have ticketId)
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

  // Assign Ticket
  const handleAssignTicket = async () => {
    if (!ticket?.ticketId || !selectedWorker) return;
    const { data, error } = await supabase
      .from("ticket")
      .update({
        assignedWorkerId: selectedWorker.userId,
        ticketStatus: TicketStatusEnum.ASSIGNED,
      })
      .eq("ticketId", ticket.ticketId)
      .select();

    if (error) {
      console.error("Error assigning ticket:", error);
    } else {
      setShowModal(false);
      setTicketStatus(TicketStatusEnum.ASSIGNED);
    }
  };

  // Handle resolve ticket status update
  const handleResolveTicket = async () => {
    if (!ticket?.ticketId) return;

    // Update the ticket status in the database
    const { data, error } = await supabase
      .from("ticket")
      .update({ 
        ticketStatus: TicketStatusEnum.RESOLVED,
        updatedBy: currentUser?.userName || "System" 
      })
      .eq("ticketId", ticket.ticketId)
      .select();

    if (error) {
      console.error("Error resolving ticket:", error);
    } else {
      setTicketStatus(TicketStatusEnum.RESOLVED); // Update status in the UI
    }
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
              {ticket.ticketAttachment ? (
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
            
            {(currentUser?.userRole === userRolesEnum.ADMIN || 
              (currentUser?.userRole === userRolesEnum.FACILITY_WORKER && 
               ticket.assignedWorkerId === currentUser?.userId)) && (
              <button className="add-notes-btn">💬 Add Notes...</button>
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
    </div>
  );
};

export default TicketDetails;