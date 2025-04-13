// src/redux/reducers/ticketReducer.js
import {
  FETCH_TICKET_SUCCESS,
  FETCH_TICKET_NOTES_SUCCESS,
  UPDATE_TICKET_STATUS,
  UPDATE_TICKET_NOTES,
  SET_ASSIGNED_WORKER,
  SET_SUBMITTED_BY,
  SET_WORKERS_LIST,
  SET_TICKET_DUE_DATE,
  SET_ASSIGNMENT_DATE,
  SET_IS_OVERDUE,
  SET_MAP_CENTER,
  SET_ATTACHMENT_TYPE,
  ASSIGN_TICKET,
  RESOLVE_TICKET,
} from "../actions/ticketActions";

const initialState = {
  ticket: null,
  ticketNotes: [],
  ticketStatus: "",
  assignedWorkerName: "Not Assigned",
  submittedBy: "",
  workers: [],
  ticketDueDate: null,
  assignmentDate: null,
  isOverdue: false,
  mapCenter: null,
  attachmentType: null,
  updatedBy: "N/A",
};

const ticketReducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_TICKET_SUCCESS:
      return {
        ...state,
        ticket: action.payload,
        ticketStatus: action.payload?.ticketStatus || "",
        updatedBy: action.payload?.updatedBy || "N/A",
      };
    case FETCH_TICKET_NOTES_SUCCESS:
      return {
        ...state,
        ticketNotes: action.payload,
      };
    case UPDATE_TICKET_STATUS:
      return {
        ...state,
        ticketStatus: action.payload,
      };
    case UPDATE_TICKET_NOTES:
      return {
        ...state,
        ticketNotes: action.payload,
      };
    case SET_ASSIGNED_WORKER:
      return {
        ...state,
        assignedWorkerName: action.payload.workerName || "Not Assigned",
      };
    case ASSIGN_TICKET:
      return {
        ...state,
        ticketStatus: "ASSIGNED",
        assignedWorkerName: action.payload.workerName,
        ticketDueDate: action.payload.dueDate,
        assignmentDate: action.payload.assignmentDate,
        ticketNotes: action.payload.notes,
        updatedBy: action.payload.updatedBy,
      };
    case RESOLVE_TICKET:
      return {
        ...state,
        ticketStatus: "RESOLVED",
        ticketNotes: action.payload.notes,
        updatedBy: action.payload.updatedBy,
      };
    case SET_SUBMITTED_BY:
      return {
        ...state,
        submittedBy: action.payload,
      };
    case SET_WORKERS_LIST:
      return {
        ...state,
        workers: action.payload,
      };
    case SET_TICKET_DUE_DATE:
      return {
        ...state,
        ticketDueDate: action.payload,
      };
    case SET_ASSIGNMENT_DATE:
      return {
        ...state,
        assignmentDate: action.payload,
      };
    case SET_IS_OVERDUE:
      return {
        ...state,
        isOverdue: action.payload,
      };
    case SET_MAP_CENTER:
      return {
        ...state,
        mapCenter: action.payload,
      };
    case SET_ATTACHMENT_TYPE:
      return {
        ...state,
        attachmentType: action.payload,
      };
    default:
      return state;
  }
};

export default ticketReducer;
