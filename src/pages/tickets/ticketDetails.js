import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import supabase from "../../backend/DBClient/SupaBaseClient";
import TicketStatusEnum from "./ticketStatusEnum";
import PageHeader from "../pageHeader";
import userRolesEnum from "../userManagement/userRolesEnum";
import Cookies from "js-cookie";
import { sendNotification, notifyTicketUpdate } from "./notificationService";
import { GoogleMap, Marker } from "@react-google-maps/api";
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
  const [updatedBy, setUpdatedBy] = useState(ticket?.updatedBy || "N/A");
  const [mapCenter, setMapCenter] = useState(null);

  // Map container style
  const mapContainerStyle = {
    width: "100%",
    height: "300px",
    borderRadius: "8px",
    marginTop: "10px",
  };

  // Parse location coordinates from ticket location
  useEffect(() => {
    if (ticket?.locationCoordinates) {
      try {
        // Check if the location is stored as a string with lat,lng format
        if (typeof ticket.locationCoordinates === "string") {
          // Check if it's a lat,lng coordinate pair
          if (
            ticket.locationCoordinates.match(/^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/)
          ) {
            const [lat, lng] = ticket.locationCoordinates
              .split(",")
              .map((coord) => parseFloat(coord.trim()));
            if (!isNaN(lat) && !isNaN(lng)) {
              setMapCenter({ lat, lng });
            }
          }
          // If it might be JSON, try to parse it
          else if (
            ticket.locationCoordinates.startsWith("{") ||
            ticket.locationCoordinates.startsWith("[")
          ) {
            try {
              const locationObj = JSON.parse(ticket.locationCoordinates);
              if (locationObj.lat && locationObj.lng) {
                setMapCenter({
                  lat: parseFloat(locationObj.lat),
                  lng: parseFloat(locationObj.lng),
                });
              }
            } catch (jsonError) {
              // If it's not valid JSON, just treat it as a text location
              console.log("Location is a text address:", ticket.ticketLocation);
              // Don't set mapCenter for text addresses
            }
          }
          // Otherwise it's just a text address like "My Current Location"
          else {
            console.log("Location is a text address:", ticket.ticketLocation);
            // We don't set mapCenter for text addresses
          }
        }
        // Check if location is stored as an object
        else if (
          typeof ticket.locationCoordinates === "object" &&
          ticket.locationCoordinates.lat &&
          ticket.locationCoordinates.lng
        ) {
          setMapCenter({
            lat: parseFloat(ticket.locationCoordinates.lat),
            lng: parseFloat(ticket.locationCoordinates.lng),
          });
        }
      } catch (error) {
        console.error("Error parsing location data:", error);
      }
    }
  }, [ticket?.locationCoordinates]);

  // Helper function to sort notes chronologically
  const sortNotesByTimestamp = (notes) => {
    return [...notes].sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
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
      if (
        ticket.ticketId &&
        (!ticket.reportedResidentId || !ticket.assignedWorkerId)
      ) {
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

        // If updateNotes exists, process it properly
        if (ticketData?.updateNotes) {
          // Handle string-based notes (properly JSON-encoded)
          if (typeof ticketData.updateNotes === "string") {
            try {
              // Try to parse as JSON
              const parsedNotes = JSON.parse(ticketData.updateNotes);

              // If it's an array, use it directly
              if (Array.isArray(parsedNotes)) {
                setTicketNotes(sortNotesByTimestamp(parsedNotes));
              }
              // If it parsed as an object but not an array, wrap it
              else if (typeof parsedNotes === "object") {
                setTicketNotes(sortNotesByTimestamp([parsedNotes]));
              }
              // If it's neither array nor object, create a basic note
              else {
                setTicketNotes([
                  {
                    note: String(ticketData.updateNotes),
                    addedBy: ticket.updatedBy || "Unknown",
                    timestamp:
                      ticket.resolutionDate || new Date().toISOString(),
                  },
                ]);
              }
            } catch (parseError) {
              // Handle invalid JSON by creating a fallback note
              console.warn("Could not parse updateNotes as JSON:", parseError);
              setTicketNotes([
                {
                  note: String(ticketData.updateNotes),
                  addedBy: ticket.updatedBy || "Unknown",
                  timestamp: ticket.resolutionDate || new Date().toISOString(),
                },
              ]);
            }
          }
          // Handle object-based notes (stored directly as object/array in database)
          else if (typeof ticketData.updateNotes === "object") {
            if (Array.isArray(ticketData.updateNotes)) {
              setTicketNotes(sortNotesByTimestamp(ticketData.updateNotes));
            } else {
              setTicketNotes(sortNotesByTimestamp([ticketData.updateNotes]));
            }
          }
          // Fallback for any other unexpected format
          else {
            setTicketNotes([
              {
                note: String(ticketData.updateNotes),
                addedBy: ticket.updatedBy || "Unknown",
                timestamp: ticket.resolutionDate || new Date().toISOString(),
              },
            ]);
          }
        } else {
          // No notes found
          setTicketNotes([]);
        }
      } catch (error) {
        console.error("Error processing ticket notes:", error);
        setTicketNotes([]);
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
      timestamp: new Date().toISOString(),
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
        updatedBy: currentUser.userName,
      })
      .eq("ticketId", ticket.ticketId);

    setUpdatedBy(currentUser.userName);

    if (!error) {
      // Notify the assigned worker
      await sendNotification(
        selectedWorker.userId,
        `You have been assigned to ticket #${ticket.ticketId}: ${ticket.ticketTitle}`,
        ticket.ticketId
      );
      await sendNotification(
        ticket.reportedResidentId,
        `Your ticket #${ticket.ticketId} has been assigned to ${selectedWorker.userName}`,
        ticket.ticketId
      );
    }

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
      timestamp: new Date().toISOString(),
    };

    // Combine existing notes with the new note
    const updatedNotes = sortNotesByTimestamp([...ticketNotes, newNote]);

    // Optimistically update UI
    setTicketStatus(TicketStatusEnum.RESOLVED);
    setTicketNotes(updatedNotes);

    setUpdatedBy(currentUser.userName);

    // Update the ticket status in the database
    const { data, error } = await supabase
      .from("ticket")
      .update({
        ticketStatus: TicketStatusEnum.RESOLVED,
        updatedBy: currentUser.userName,
        resolutionDate: new Date().toISOString(),
        updateNotes: JSON.stringify(updatedNotes),
      })
      .eq("ticketId", ticket.ticketId);

    if (error) {
      console.error("Error resolving ticket:", error);
      alert("Failed to resolve ticket. Please try again.");
    }

    if (!error) {
      // Notify all involved parties about the resolution
      await notifyTicketUpdate(
        ticket.ticketId,
        `Ticket #${ticket.ticketId}: ${ticket.ticketTitle} has been marked as resolved`,
        currentUser.userId // Don't notify the person who resolved it
      );
    }
  };

  // Handle adding notes
  const handleAddNote = async () => {
    if (!noteText.trim() || !ticket?.ticketId) return;

    try {
      console.log("Adding note to ticket ID:", ticket.ticketId);

      // Create the new note object
      const newNote = {
        note: noteText.trim(),
        addedBy: currentUser?.userName || "System",
        timestamp: new Date().toISOString(),
      };

      // Get existing notes
      const { data: currentTicket, error: fetchError } = await supabase
        .from("ticket")
        .select("updateNotes, ticketId")
        .eq("ticketId", ticket.ticketId)
        .single();

      if (fetchError) {
        console.error("Error fetching current ticket:", fetchError);
        alert(`Could not fetch ticket data: ${fetchError.message}`);
        return;
      }

      // Parse existing notes or initialize as empty array
      let existingNotes = [];
      if (currentTicket.updateNotes) {
        try {
          if (typeof currentTicket.updateNotes === "string") {
            existingNotes = JSON.parse(currentTicket.updateNotes);
            if (!Array.isArray(existingNotes)) {
              existingNotes = [];
            }
          } else if (Array.isArray(currentTicket.updateNotes)) {
            existingNotes = currentTicket.updateNotes;
          }
        } catch (parseError) {
          console.warn("Could not parse updateNotes:", parseError);
          existingNotes = [];
        }
      }

      // Add new note to existing notes
      const updatedNotes = [...existingNotes, newNote];

      // Update with direct approach
      const { error: updateError } = await supabase
        .from("ticket")
        .update({
          updateNotes: JSON.stringify(updatedNotes),
          updatedBy: currentUser?.userName || "System",
        })
        .eq("ticketId", ticket.ticketId);

      if (updateError) {
        console.error("Error updating ticket:", updateError);
        alert(`Failed to save note: ${updateError.message}`);
        return;
      }

      if (!updateError) {
        // Notify all involved parties about the new note
        await notifyTicketUpdate(
          ticket.ticketId,
          `New note added to ticket #${ticket.ticketId}: ${noteText.substring(
            0,
            30
          )}${noteText.length > 30 ? "..." : ""}`,
          currentUser.userId // Don't notify the person who added the note
        );
      }

      // Update UI state
      setTicketNotes(updatedNotes);
      setNoteText("");
      setShowNotesModal(false);

      setUpdatedBy(currentUser?.userName || "System");
    } catch (e) {
      console.error("Exception in handleAddNote:", e);
      alert(`An error occurred: ${e.message}`);
    }
  };

  // Check if user can add notes
  const canAddNotes = () => {
    if (!currentUser || !ticket) return false;

    // Admin can add notes to any ticket
    if (currentUser.userRole === userRolesEnum.ADMIN) return true;

    // Facility worker can add notes if they're assigned to the ticket
    if (
      currentUser.userRole === userRolesEnum.FACILITY_WORKER &&
      ticket.assignedWorkerId === currentUser.userId
    )
      return true;

    // Resident can add notes if they submitted the ticket
    if (
      currentUser.userRole === userRolesEnum.RESIDENT &&
      ticket.reportedResidentId === currentUser.userId
    )
      return true;

    return false;
  };

  // Display the location as an address or coordinates
  const displayLocation = () => {
    if (!ticket?.ticketLocation) return "N/A";

    // If it's a simple string that isn't in coordinate format
    if (
      typeof ticket.ticketLocation === "string" &&
      !ticket.ticketLocation.match(/^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/) &&
      !ticket.ticketLocation.startsWith("{") &&
      !ticket.ticketLocation.startsWith("[")
    ) {
      return ticket.ticketLocation;
    }

    // If we have parsed coordinates for the map
    if (mapCenter) {
      return `${mapCenter.lat.toFixed(6)}, ${mapCenter.lng.toFixed(6)}`;
    }

    // Return the raw location string as fallback
    return String(ticket.ticketLocation);
  };

  const handleGetDirections = () => {
    if (mapCenter) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${mapCenter.lat},${mapCenter.lng}`;
      window.open(url, "_blank");
    }
  };

  if (loading) {
    return <p>Loading ticket details...</p>;
  }

  if (!ticket || !authorized) {
    return (
      <p>
        No ticket details available or you are not authorized to view this
        ticket.
      </p>
    );
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
              <h5>{formatDate(ticket.submissionDate)}</h5>
            </p>
            <p>
              <strong>Description:</strong> <h5>{ticket.ticketDescription}</h5>
            </p>
            <p>
              <strong>Location:</strong> <h5>{displayLocation()}</h5>
            </p>
            {/* Google Map Display */}
            {mapCenter && (
              <div className="location-map">
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={mapCenter}
                  zoom={15}
                >
                  <Marker position={mapCenter} />
                </GoogleMap>
                <button
                  className="get-directions-btn"
                  onClick={handleGetDirections}
                  style={{
                    marginTop: "10px",
                    padding: "8px 16px",
                    backgroundColor: "#4285f4",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Get Directions
                </button>
              </div>
            )}
            <p>
              <strong>Assigned To:</strong> <h5>{assignedWorkerName}</h5>
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
                    
                    <p className="note-meta">
                      Added by{" "}
                      {typeof note === "object" && note.addedBy
                        ? note.addedBy
                        : "Unknown"}{" "}
                      on{" "}
                      {typeof note === "object" && note.timestamp
                        ? formatDate(note.timestamp)
                        : "Unknown date"}
                    </p>
                    <p className="note-text">
                      {typeof note === "object" && note.note
                        ? note.note
                        : String(note)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="update-note">No updates available</p>
              )}
            </div>

            {canAddNotes() && (
              <button
                className="add-notes-btn"
                onClick={() => setShowNotesModal(true)}
              >
                💬 Add Notes
              </button>
            )}

            <p>
              <strong>Latest Update By:</strong> <h5>{updatedBy || "N/A"}</h5>
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
      <button className="back-btn" onClick={() => navigate("/tickets")}>
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
              <button onClick={handleAddNote} disabled={!noteText.trim()}>
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
