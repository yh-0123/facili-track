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
import { useDispatch, useSelector } from "react-redux";
import {
  fetchTicketSuccess,
  fetchTicketNotesSuccess,
  updateTicketStatus,
  updateTicketNotes,
  setAssignedWorker,
  setSubmittedBy,
  setWorkersList,
  setTicketDueDate,
  setAssignmentDate,
  setIsOverdue,
  setMapCenter,
  setAttachmentType,
  assignTicket,
  resolveTicket,
  addNote,
} from "../../redux/actions/ticketActions";

const TicketDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { ticket } = location.state || {};
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTicketData = async () => {
      // If we don't have ticket data from location state, fetch it from URL
      if (!ticket) {
        const ticketId = window.location.pathname.split("/").pop();
        if (ticketId) {
          try {
            const { data, error } = await supabase
              .from("ticket")
              .select("*")
              .eq("ticketId", ticketId)
              .single();

            if (error) {
              console.error("Error fetching ticket:", error);
              navigate("/tickets");
              return;
            }

            if (data) {
              dispatch(fetchTicketSuccess(data));
              // Update location state with the fetched ticket
              navigate(`/tickets/${ticketId}`, {
                state: { ticket: data },
                replace: true,
              });
            }
          } catch (error) {
            console.error("Error:", error);
            navigate("/tickets");
          }
        }
      }
      setLoading(false);
    };

    fetchTicketData();
  }, [dispatch, navigate, ticket]);

  // Get states from Redux instead of local state
  const submittedBy = useSelector((state) => state.ticket.submittedBy);
  const assignedWorkerName = useSelector(
    (state) => state.ticket.assignedWorkerName
  );
  const ticketStatus = useSelector(
    (state) => state.ticket.ticketStatus || ticket?.ticketStatus
  );
  const workers = useSelector((state) => state.ticket.workers || []);
  const currentUser = useSelector((state) => state.auth.userData);
  const ticketNotes = useSelector((state) => state.ticket.ticketNotes || []);
  const updatedBy = useSelector(
    (state) => state.ticket.updatedBy || ticket?.updatedBy || "N/A"
  );
  const mapCenter = useSelector((state) => state.ticket.mapCenter);
  const ticketDueDate = useSelector((state) => state.ticket.ticketDueDate);
  const assignmentDate = useSelector((state) => state.ticket.assignmentDate);
  const isOverdue = useSelector((state) => state.ticket.isOverdue);
  const attachmentType = useSelector((state) => state.ticket.attachmentType);

  // Keep some UI-related states local since they don't need to be in Redux
  const [showModal, setShowModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [authorized, setAuthorized] = useState(false);
  const [resolutionDuration, setResolutionDuration] = useState(7); // Default to 7 days

  // Map container style
  const mapContainerStyle = {
    width: "100%",
    height: "300px",
    borderRadius: "8px",
    marginTop: "0px",
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
              dispatch(setMapCenter({ lat, lng }));
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
                dispatch(
                  setMapCenter({
                    lat: parseFloat(locationObj.lat),
                    lng: parseFloat(locationObj.lng),
                  })
                );
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
          dispatch(
            setMapCenter({
              lat: parseFloat(ticket.locationCoordinates.lat),
              lng: parseFloat(ticket.locationCoordinates.lng),
            })
          );
        }
      } catch (error) {
        console.error("Error parsing location data:", error);
      }
    }
  }, [ticket?.locationCoordinates, dispatch]);

  // Determine attachment file type
  useEffect(() => {
    if (ticket?.ticketAttachment) {
      // Function to determine file type from URL or file extension
      const determineFileType = (url) => {
        if (!url) return null;

        // Make sure url is a string before using split
        const urlString = String(url);

        // Try to extract file extension from URL
        try {
          const fileExtension = urlString.split(".").pop().toLowerCase();

          // Check for image types
          if (
            ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"].includes(
              fileExtension
            )
          ) {
            return "image";
          }
          // Check for document types
          else if (
            [
              "pdf",
              "doc",
              "docx",
              "xls",
              "xlsx",
              "ppt",
              "pptx",
              "txt",
            ].includes(fileExtension)
          ) {
            return "document";
          }
          // Check for video types
          else if (
            ["mp4", "webm", "ogg", "mov", "avi", "wmv"].includes(fileExtension)
          ) {
            return "video";
          }
          // Check for audio types
          else if (
            ["mp3", "wav", "ogg", "aac", "flac"].includes(fileExtension)
          ) {
            return "audio";
          }
          // If we can't determine, use a generic file type
          else {
            return "other";
          }
        } catch (error) {
          console.error("Error determining file type:", error);
          return "other"; // Default to other if there's an error
        }
      };
      dispatch(setAttachmentType(determineFileType(ticket.ticketAttachment)));
    }
  }, [ticket?.ticketAttachment, dispatch]);

  // Helper function to sort notes chronologically
  const sortNotesByTimestamp = (notes) => {
    return [...notes].sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );
  };

  // Function to calculate due date based on assignment date and duration
  const calculateDueDate = (assignmentDate, durationDays) => {
    const dueDate = new Date(assignmentDate);
    dueDate.setDate(dueDate.getDate() + parseInt(durationDays, 10));
    return dueDate;
  };

  // Function to check if ticket is overdue
  const checkIfOverdue = (dueDate) => {
    if (!dueDate) return false;
    const now = new Date();
    return now > new Date(dueDate);
  };

  // Function to send reminders for overdue tickets
  const sendOverdueReminder = async () => {
    if (!ticket?.assignedWorkerId || !isOverdue) return;

    const reminderMessage = `REMINDER: Ticket #${ticket.ticketId}: ${ticket.ticketTitle} is overdue. Please resolve it as soon as possible.`;
    await sendNotification(
      ticket.assignedWorkerId,
      reminderMessage,
      ticket.ticketId
    );

    // Add a note about the reminder
    const reminderNote = {
      note: "Automatic reminder sent - ticket is overdue",
      addedBy: "System",
      timestamp: new Date().toISOString(),
    };

    // Update notes in the database with the reminder
    const updatedNotes = [...ticketNotes, reminderNote];
    await supabase
      .from("ticket")
      .update({
        updateNotes: JSON.stringify(updatedNotes),
      })
      .eq("ticketId", ticket.ticketId);

    // Update state through Redux
    dispatch(updateTicketNotes(updatedNotes));
  };

  useEffect(() => {
    // Get current user from cookie
    const getCurrentUser = () => {
      try {
        const userData = Cookies.get("userData");
        if (userData) {
          const user = JSON.parse(userData);
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
      if (
        user.userRole === userRolesEnum.FACILITY_WORKER &&
        ticketData.assignedWorkerId === user.userId
      ) {
        setAuthorized(true);
        return true;
      }

      // Resident can view tickets they submitted
      if (
        user.userRole === userRolesEnum.RESIDENT &&
        ticketData.reportedResidentId === user.userId
      ) {
        setAuthorized(true);
        return true;
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

          // Set due date and assignment date if available
          if (data.ticketDue) {
            dispatch(setTicketDueDate(data.ticketDue));
            dispatch(setIsOverdue(checkIfOverdue(data.ticketDue)));
          }

          if (data.assignmentDate) {
            dispatch(setAssignmentDate(data.assignmentDate));
          }
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
  }, [ticket, navigate, dispatch]);

  // Check for overdue tickets and send reminders if needed
  useEffect(() => {
    if (isOverdue && ticket?.ticketStatus !== TicketStatusEnum.RESOLVED) {
      // Only send reminder if ticket is assigned but not resolved
      if (ticket?.ticketStatus === TicketStatusEnum.ASSIGNED) {
        sendOverdueReminder();
      }
    }
  }, [isOverdue, ticket?.ticketStatus]);

  // Fetch submitter's name
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
          dispatch(setSubmittedBy("Unknown"));
        } else {
          dispatch(setSubmittedBy(data?.userName || "Unknown"));
        }
      }
    };

    if (authorized) {
      fetchUserName();
    }
  }, [ticket?.reportedResidentId, authorized, dispatch]);

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
          dispatch(
            setAssignedWorker({
              workerId: ticket.assignedWorkerId,
              workerName: data?.userName || "Unknown",
            })
          );
        }
      }
    };

    if (authorized && ticket?.assignedWorkerId) {
      fetchAssignedWorker();
    }
  }, [ticket?.assignedWorkerId, authorized, dispatch]);

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
        dispatch(setWorkersList(data));
      }
    };

    fetchWorkers();
  }, [authorized, currentUser, dispatch]);

  // Fetch ticket notes
  useEffect(() => {
    const fetchTicketNotes = async () => {
      if (!ticket?.ticketId) return;

      try {
        // First check if updateNotes exists in the ticket table
        const { data: ticketData, error: ticketError } = await supabase
          .from("ticket")
          .select("updateNotes, ticketDue, assignmentDate")
          .eq("ticketId", ticket.ticketId)
          .single();

        if (ticketError) {
          console.error("Error fetching ticket notes:", ticketError);
          return;
        }

        // Set ticketDue and assignmentDate if available
        if (ticketData?.ticketDue) {
          dispatch(setTicketDueDate(ticketData.ticketDue));
          dispatch(setIsOverdue(checkIfOverdue(ticketData.ticketDue)));
        }

        if (ticketData?.assignmentDate) {
          dispatch(setAssignmentDate(ticketData.assignmentDate));
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
                dispatch(
                  fetchTicketNotesSuccess(sortNotesByTimestamp(parsedNotes))
                );
              }
              // If it parsed as an object but not an array, wrap it
              else if (typeof parsedNotes === "object") {
                dispatch(
                  fetchTicketNotesSuccess(sortNotesByTimestamp([parsedNotes]))
                );
              }
              // If it's neither array nor object, create a basic note
              else {
                dispatch(
                  fetchTicketNotesSuccess([
                    {
                      note: String(ticketData.updateNotes),
                      addedBy: ticket.updatedBy || "Unknown",
                      timestamp:
                        ticket.resolutionDate || new Date().toISOString(),
                    },
                  ])
                );
              }
            } catch (parseError) {
              // Handle invalid JSON by creating a fallback note
              console.warn("Could not parse updateNotes as JSON:", parseError);
              dispatch(
                fetchTicketNotesSuccess([
                  {
                    note: String(ticketData.updateNotes),
                    addedBy: ticket.updatedBy || "Unknown",
                    timestamp:
                      ticket.resolutionDate || new Date().toISOString(),
                  },
                ])
              );
            }
          }
          // Handle object-based notes (stored directly as object/array in database)
          else if (typeof ticketData.updateNotes === "object") {
            if (Array.isArray(ticketData.updateNotes)) {
              dispatch(
                fetchTicketNotesSuccess(
                  sortNotesByTimestamp(ticketData.updateNotes)
                )
              );
            } else {
              dispatch(
                fetchTicketNotesSuccess(
                  sortNotesByTimestamp([ticketData.updateNotes])
                )
              );
            }
          }
          // Fallback for any other unexpected format
          else {
            dispatch(
              fetchTicketNotesSuccess([
                {
                  note: String(ticketData.updateNotes),
                  addedBy: ticket.updatedBy || "Unknown",
                  timestamp: ticket.resolutionDate || new Date().toISOString(),
                },
              ])
            );
          }
        } else {
          // No notes found
          dispatch(fetchTicketNotesSuccess([]));
        }
      } catch (error) {
        console.error("Error processing ticket notes:", error);
        dispatch(fetchTicketNotesSuccess([]));
      }
    };

    if (authorized) {
      fetchTicketNotes();
    }
  }, [ticket?.ticketId, authorized, dispatch]);

  // Assign Ticket
  const handleAssignTicket = async () => {
    if (!ticket?.ticketId || !selectedWorker) return;

    // Validate user data
    if (!currentUser?.userName) {
      console.error("Cannot assign ticket: User information missing");
      alert("You must be logged in to assign tickets");
      return;
    }

    // Validate resolution duration
    if (resolutionDuration < 1 || resolutionDuration > 30) {
      alert("Resolution duration must be between 1 and 30 days");
      return;
    }

    try {
      // Set assignment date to current date
      const currentDate = new Date().toISOString();
      const dueDate = calculateDueDate(
        currentDate,
        resolutionDuration
      ).toISOString();

      // Create a new note for this assignment
      const newNote = {
        note: `Ticket assigned to ${
          selectedWorker.userName
        } with ${resolutionDuration} day(s) to resolve (due by: ${new Date(
          dueDate
        ).toLocaleDateString()})`,
        addedBy: currentUser.userName,
        timestamp: currentDate,
      };

      // Get existing notes to ensure we have the latest
      const { data: currentTicket, error: fetchError } = await supabase
        .from("ticket")
        .select("updateNotes")
        .eq("ticketId", ticket.ticketId)
        .single();

      if (fetchError) {
        console.error("Error fetching current ticket notes:", fetchError);
        alert("Failed to fetch current ticket data. Please try again.");
        return;
      }

      // Parse existing notes or initialize as empty array
      let existingNotes = [];
      if (currentTicket?.updateNotes) {
        try {
          if (typeof currentTicket.updateNotes === "string") {
            existingNotes = JSON.parse(currentTicket.updateNotes);
            if (!Array.isArray(existingNotes)) {
              existingNotes = [existingNotes];
            }
          } else if (Array.isArray(currentTicket.updateNotes)) {
            existingNotes = currentTicket.updateNotes;
          }
        } catch (parseError) {
          console.warn("Could not parse updateNotes:", parseError);
          existingNotes = [];
        }
      }

      // Combine existing notes with the new note
      const updatedNotes = sortNotesByTimestamp([...existingNotes, newNote]);

      // Ensure the ticketId is in the correct format
      // (convert to integer if it's a number in the database)
      const ticketIdForQuery =
        typeof ticket.ticketId === "string" && !isNaN(parseInt(ticket.ticketId))
          ? parseInt(ticket.ticketId)
          : ticket.ticketId;

      // Ensure workerId is in the correct format
      const workerIdForUpdate =
        typeof selectedWorker.userId === "string" &&
        !isNaN(parseInt(selectedWorker.userId))
          ? parseInt(selectedWorker.userId)
          : selectedWorker.userId;

      console.log("Updating ticket with data:", {
        ticketId: ticketIdForQuery,
        workerId: workerIdForUpdate,
        notes: updatedNotes.length,
        dueDate: dueDate,
      });

      // Dispatch the action to assign the ticket
      dispatch(
        assignTicket({
          ticketId: ticketIdForQuery,
          workerId: workerIdForUpdate,
          workerName: selectedWorker.userName, // Make sure we're using the name string
          notes: updatedNotes,
          updatedBy: currentUser.userName,
          assignmentDate: currentDate,
          dueDate: dueDate,
        })
      );

      // Update the database
      const { error } = await supabase
        .from("ticket")
        .update({
          assignedWorkerId: workerIdForUpdate,
          ticketStatus: TicketStatusEnum.ASSIGNED,
          updateNotes: JSON.stringify(updatedNotes),
          updatedBy: currentUser.userName,
          assignmentDate: currentDate,
          ticketDue: dueDate,
        })
        .eq("ticketId", ticketIdForQuery);

      if (error) {
        console.error("Error assigning ticket:", error);
        alert(`Failed to assign ticket: ${error.message}`);
        return;
      }

      // If successful, update UI
      setShowModal(false);

      // Notify the assigned worker
      await sendNotification(
        selectedWorker.userId,
        `You have been assigned to ticket #${ticket.ticketId}: ${
          ticket.ticketTitle
        }. Due in ${resolutionDuration} day(s) by ${new Date(
          dueDate
        ).toLocaleDateString()}.`,
        ticket.ticketId
      );
      await sendNotification(
        ticket.reportedResidentId,
        `Your ticket #${ticket.ticketId} has been assigned to ${
          selectedWorker.userName
        } and is expected to be resolved by ${new Date(
          dueDate
        ).toLocaleDateString()}.`,
        ticket.ticketId
      );
    } catch (exception) {
      console.error("Exception in handleAssignTicket:", exception);
      alert(`An unexpected error occurred: ${exception.message}`);
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

    const currentDate = new Date().toISOString();
    // Check if resolved within due date
    const resolvedOnTime = ticketDueDate
      ? new Date(currentDate) <= new Date(ticketDueDate)
      : true;

    // Create a new note for this resolution
    const noteText = resolvedOnTime
      ? "Ticket marked as resolved on time"
      : "Ticket marked as resolved (past due date)";

    const newNote = {
      note: noteText,
      addedBy: currentUser.userName,
      timestamp: currentDate,
    };

    // Combine existing notes with the new note
    const updatedNotes = sortNotesByTimestamp([...ticketNotes, newNote]);

    // Dispatch action to resolve ticket
    dispatch(
      resolveTicket({
        ticketId: ticket.ticketId,
        updatedBy: currentUser.userName,
        resolutionDate: currentDate,
        notes: updatedNotes,
      })
    );

    // Update the ticket status in the database
    const { error } = await supabase
      .from("ticket")
      .update({
        ticketStatus: TicketStatusEnum.RESOLVED,
        updatedBy: currentUser.userName,
        resolutionDate: currentDate,
        updateNotes: JSON.stringify(updatedNotes),
      })
      .eq("ticketId", ticket.ticketId);

    if (error) {
      console.error("Error resolving ticket:", error);
      alert("Failed to resolve ticket. Please try again.");
    }

    if (!error) {
      // Notify all involved parties about the resolution
      const completionMessage = resolvedOnTime
        ? `Ticket #${ticket.ticketId}: ${ticket.ticketTitle} has been marked as resolved on time`
        : `Ticket #${ticket.ticketId}: ${ticket.ticketTitle} has been marked as resolved (past the due date)`;

      await notifyTicketUpdate(
        ticket.ticketId,
        completionMessage,
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

      // Dispatch action to add note
      dispatch(
        addNote({
          ticketId: ticket.ticketId,
          note: newNote,
          notes: updatedNotes,
          updatedBy: currentUser?.userName || "System",
        })
      );

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
      setNoteText("");
      setShowNotesModal(false);
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

  // Function to get file name from URL
  const getFileNameFromUrl = (url) => {
    if (!url) return "No file";

    try {
      // Make sure url is a string
      const urlString = String(url);
      const parts = urlString.split("/");
      return parts[parts.length - 1];
    } catch (error) {
      console.error("Error getting file name:", error);
      return "File"; // Return a generic name if there's an error
    }
  };

  // Function to render attachment based on file type
  const renderAttachment = () => {
    if (!ticket?.ticketAttachment) {
      return "(No Attachment)";
    }

    const fileName = getFileNameFromUrl(ticket.ticketAttachment);

    switch (attachmentType) {
      case "image":
        return <img src={ticket.ticketAttachment} alt="Attachment" />;
      case "video":
        return (
          <div className="video-container">
            <video controls>
              <source src={ticket.ticketAttachment} />
              Your browser does not support the video tag.
            </video>
          </div>
        );
      case "audio":
        return (
          <div className="audio-container">
            <audio controls>
              <source src={ticket.ticketAttachment} />
              Your browser does not support the audio tag.
            </audio>
          </div>
        );
      case "document":
      case "other":
      default:
        return (
          <div className="file-attachment">
            <div className="file-icon">📎</div>
            <a
              href={ticket.ticketAttachment}
              target="_blank"
              rel="noreferrer noopener"
              className="file-link"
            >
              {fileName}
            </a>
            <div className="file-actions">
              <a
                href={ticket.ticketAttachment}
                download
                className="download-btn"
              >
                Download
              </a>
            </div>
          </div>
        );
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

  // Calculate remaining days until due date
  const getRemainingDays = () => {
    if (!ticketDueDate) return null;

    const now = new Date();
    const due = new Date(ticketDueDate);
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  // Get time status display
  const getTimeStatus = () => {
    if (!ticketDueDate) return null;

    const remainingDays = getRemainingDays();

    if (ticketStatus === TicketStatusEnum.RESOLVED) {
      return <span className="time-status resolved">Resolved</span>;
    } else if (remainingDays < 0) {
      return (
        <span className="time-status overdue">
          Overdue by {Math.abs(remainingDays)} day(s)
        </span>
      );
    } else if (remainingDays === 0) {
      return <span className="time-status due-today">Due today</span>;
    } else if (remainingDays <= 2) {
      return (
        <span className="time-status due-soon">
          Due in {remainingDays} day(s)
        </span>
      );
    } else {
      return (
        <span className="time-status on-track">
          Due in {remainingDays} days
        </span>
      );
    }
  };

  return (
    <div className="ticket-details-page">
      <PageHeader title="Ticket Details" />
      <div className="ticket-container">
        <div className="ticket-header">
          <p>Ticket ID: {ticket.ticketId}</p>
          {ticketDueDate && getTimeStatus()}
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
                >
                  Get Directions
                </button>
              </div>
            )}
            <p>
              <strong>Assigned To:</strong>{" "}
              <h5>{assignedWorkerName || "Not Assigned"}</h5>
            </p>
            {assignmentDate && (
              <p>
                <strong>Assigned On:</strong>{" "}
                <h5>{formatDate(assignmentDate)}</h5>
              </p>
            )}
            {ticketDueDate && (
              <p>
                <strong>Due Date:</strong>{" "}
                <h5
                  className={
                    isOverdue && ticketStatus !== TicketStatusEnum.RESOLVED
                      ? "overdue-text"
                      : ""
                  }
                >
                  {formatDate(ticketDueDate)}
                </h5>
              </p>
            )}
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
              {ticket.ticketAttachment ? renderAttachment() : "(No Attachment)"}
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
            <h3>Assign Ticket</h3>
            <div className="form1-group">
              <label>Select Facility Worker:</label>
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
            </div>

            <div className="form1-group">
              <label>Resolution Time (in days):</label>
              <input
                type="number"
                min="1"
                max="30"
                value={resolutionDuration}
                onChange={(e) =>
                  setResolutionDuration(parseInt(e.target.value, 10) || 1)
                }
              />
              <small>Enter a number between 1 and 30 days</small>
            </div>

            {resolutionDuration > 0 && (
              <p className="due-date-preview">
                Expected due date:{" "}
                {formatDate(calculateDueDate(new Date(), resolutionDuration))}
              </p>
            )}

            <div className="modal-buttons">
              <button onClick={() => setShowModal(false)}>Cancel</button>
              <button
                onClick={handleAssignTicket}
                disabled={
                  !selectedWorker ||
                  resolutionDuration < 1 ||
                  resolutionDuration > 30
                }
              >
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
