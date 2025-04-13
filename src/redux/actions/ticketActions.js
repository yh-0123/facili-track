// src/redux/actions/ticketActions.js
import supabase from "../../backend/DBClient/SupaBaseClient";
import {
  sendNotification,
  notifyTicketUpdate,
} from "../../pages/tickets/notificationService";

export const FETCH_TICKET_SUCCESS = "FETCH_TICKET_SUCCESS";
export const FETCH_TICKET_NOTES_SUCCESS = "FETCH_TICKET_NOTES_SUCCESS";
export const UPDATE_TICKET_STATUS = "UPDATE_TICKET_STATUS";
export const UPDATE_TICKET_NOTES = "UPDATE_TICKET_NOTES";
export const SET_ASSIGNED_WORKER = "SET_ASSIGNED_WORKER";
export const SET_SUBMITTED_BY = "SET_SUBMITTED_BY";
export const SET_WORKERS_LIST = "SET_WORKERS_LIST";
export const SET_TICKET_DUE_DATE = "SET_TICKET_DUE_DATE";
export const SET_ASSIGNMENT_DATE = "SET_ASSIGNMENT_DATE";
export const SET_IS_OVERDUE = "SET_IS_OVERDUE";
export const SET_MAP_CENTER = "SET_MAP_CENTER";
export const SET_ATTACHMENT_TYPE = "SET_ATTACHMENT_TYPE";
export const ASSIGN_TICKET = "ASSIGN_TICKET";
export const RESOLVE_TICKET = "RESOLVE_TICKET";

export const fetchTicketSuccess = (ticket) => ({
  type: "FETCH_TICKET_SUCCESS",
  payload: ticket,
});

export const fetchTicketNotesSuccess = (notes) => ({
  type: FETCH_TICKET_NOTES_SUCCESS,
  payload: notes,
});

export const updateTicketStatus = (status) => ({
  type: UPDATE_TICKET_STATUS,
  payload: status,
});

export const updateTicketNotes = (notes) => ({
  type: UPDATE_TICKET_NOTES,
  payload: notes,
});

export const setAssignedWorker = (worker) => ({
  type: SET_ASSIGNED_WORKER,
  payload: worker,
});

export const setSubmittedBy = (name) => ({
  type: SET_SUBMITTED_BY,
  payload: name,
});

export const setWorkersList = (workers) => ({
  type: SET_WORKERS_LIST,
  payload: workers,
});

export const setTicketDueDate = (date) => ({
  type: SET_TICKET_DUE_DATE,
  payload: date,
});

export const setAssignmentDate = (date) => ({
  type: SET_ASSIGNMENT_DATE,
  payload: date,
});

export const setIsOverdue = (isOverdue) => ({
  type: SET_IS_OVERDUE,
  payload: isOverdue,
});

export const setMapCenter = (center) => ({
  type: SET_MAP_CENTER,
  payload: center,
});

export const setAttachmentType = (type) => ({
  type: SET_ATTACHMENT_TYPE,
  payload: type,
});

// Update the assignTicket thunk
export const assignTicket = ({
  ticketId,
  workerId,
  workerName,
  notes,
  updatedBy,
  assignmentDate,
  dueDate,
}) => ({
  type: ASSIGN_TICKET,
  payload: {
    ticketId,
    workerId,
    workerName,
    notes,
    updatedBy,
    assignmentDate,
    dueDate,
  },
});

// Update the resolveTicket thunk
export const resolveTicket = ({
  ticketId,
  updatedBy,
  resolutionDate,
  notes,
}) => ({
  type: RESOLVE_TICKET,
  payload: { ticketId, updatedBy, resolutionDate, notes },
});

// Thunk for assigning a ticket
export const assignTicketThunk =
  (ticket, selectedWorker, resolutionDuration, currentUser) =>
  async (dispatch) => {
    if (!ticket?.ticketId || !selectedWorker) return;

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

      // Get existing notes
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

      // Update the database
      const { data, error } = await supabase
        .from("ticket")
        .update({
          assignedWorkerId: workerIdForUpdate,
          ticketStatus: "ASSIGNED",
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

      // If successful, update Redux state
      dispatch(updateTicketStatus("ASSIGNED"));
      dispatch(updateTicketNotes(updatedNotes));
      dispatch(setAssignedWorker(selectedWorker.userName));
      dispatch(setAssignmentDate(currentDate));
      dispatch(setTicketDueDate(dueDate));

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

      return true;
    } catch (exception) {
      console.error("Exception in assignTicket:", exception);
      alert(`An unexpected error occurred: ${exception.message}`);
      return false;
    }
  };

// Thunk for resolving a ticket
export const resolveTicketThunk =
  (ticket, currentUser, ticketNotes, ticketDueDate) => async (dispatch) => {
    if (!ticket?.ticketId) return;

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

    // Update the ticket status in the database
    const { data, error } = await supabase
      .from("ticket")
      .update({
        ticketStatus: "RESOLVED",
        updatedBy: currentUser.userName,
        resolutionDate: currentDate,
        updateNotes: JSON.stringify(updatedNotes),
      })
      .eq("ticketId", ticket.ticketId);

    if (error) {
      console.error("Error resolving ticket:", error);
      alert("Failed to resolve ticket. Please try again.");
      return false;
    }

    // Update Redux state
    dispatch(updateTicketStatus("RESOLVED"));
    dispatch(updateTicketNotes(updatedNotes));
    dispatch(setIsOverdue(false));

    // Notify all involved parties about the resolution
    const completionMessage = resolvedOnTime
      ? `Ticket #${ticket.ticketId}: ${ticket.ticketTitle} has been marked as resolved on time`
      : `Ticket #${ticket.ticketId}: ${ticket.ticketTitle} has been marked as resolved (past the due date)`;

    await notifyTicketUpdate(
      ticket.ticketId,
      completionMessage,
      currentUser.userId // Don't notify the person who resolved it
    );

    return true;
  };

// Thunk for adding a note
export const addNote =
  (ticket, noteText, currentUser, ticketNotes) => async (dispatch) => {
    if (!noteText.trim() || !ticket?.ticketId) return;

    try {
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
        return false;
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
        return false;
      }

      // Update Redux state
      dispatch(updateTicketNotes(updatedNotes));

      // Notify all involved parties about the new note
      await notifyTicketUpdate(
        ticket.ticketId,
        `New note added to ticket #${ticket.ticketId}: ${noteText.substring(
          0,
          30
        )}${noteText.length > 30 ? "..." : ""}`,
        currentUser.userId // Don't notify the person who added the note
      );

      return true;
    } catch (e) {
      console.error("Exception in addNote:", e);
      alert(`An error occurred: ${e.message}`);
      return false;
    }
  };

// Helper function to sort notes chronologically
const sortNotesByTimestamp = (notes) => {
  return [...notes].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );
};

// Helper function to calculate due date
const calculateDueDate = (assignmentDate, durationDays) => {
  const dueDate = new Date(assignmentDate);
  dueDate.setDate(dueDate.getDate() + parseInt(durationDays, 10));
  return dueDate;
};
