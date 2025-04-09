import supabase from "../../backend/DBClient/SupaBaseClient";

/**
 * Send a notification to specified users
 * @param {Array|number} recipientIds - User ID(s) to receive the notification
 * @param {string} message - The notification message
 * @param {number|null} ticketId - Optional ticket ID associated with the notification
 */
export const sendNotification = async (recipientIds, message, ticketId = null) => {
  try {
    // Convert single recipient to array for consistent processing
    const recipients = Array.isArray(recipientIds) ? recipientIds : [recipientIds];
    
    // Create notification objects for each recipient
    const notifications = recipients.map(recipientId => ({
      recipient_id: recipientId,
      message: message,
      created_at: new Date().toISOString(),
      is_read: false,
      ticket_id: ticketId // This links the notification to a specific ticket
    }));
    
    // Insert notifications into the database
    const { data, error } = await supabase
      .from("notifications")
      .insert(notifications);
      
    if (error) {
      console.error("Error sending notifications:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Unexpected error in sendNotification:", error);
    return false;
  }
};

/**
 * Get all admins in the system
 * @returns {Array} Array of admin user IDs
 */
export const getAdminUserIds = async () => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("userId")
      .eq("userRole", "0"); // Admin role
      
    if (error) {
      console.error("Error fetching admin users:", error);
      return [];
    }
    
    return data.map(admin => admin.userId);
  } catch (error) {
    console.error("Unexpected error in getAdminUserIds:", error);
    return [];
  }
};

/**
 * Get users involved with a specific ticket
 * @param {number} ticketId - The ticket ID
 * @returns {Object} Object containing arrays of different user types (admin, worker, resident)
 */
export const getTicketInvolvedUsers = async (ticketId) => {
  try {
    // Fetch the ticket details
    const { data: ticket, error: ticketError } = await supabase
      .from("ticket")
      .select("reportedResidentId, assignedWorkerId")
      .eq("ticketId", ticketId)
      .single();
    
    if (ticketError) {
      console.error("Error fetching ticket data:", ticketError);
      return { adminIds: [], workerId: null, residentId: null };
    }
    
    // Get all admin users
    const adminIds = await getAdminUserIds();
    
    return {
      adminIds,
      workerId: ticket.assignedWorkerId,
      residentId: ticket.reportedResidentId
    };
  } catch (error) {
    console.error("Unexpected error in getTicketInvolvedUsers:", error);
    return { adminIds: [], workerId: null, residentId: null };
  }
};

/**
 * Notify all users involved with a ticket about an update
 * @param {number} ticketId - The ticket ID
 * @param {string} message - The notification message
 * @param {number|null} excludeUserId - Optional user ID to exclude from notifications
 */
export const notifyTicketUpdate = async (ticketId, message, excludeUserId = null) => {
  try {
    const { adminIds, workerId, residentId } = await getTicketInvolvedUsers(ticketId);
    
    // Collect all recipient IDs
    let recipientIds = [...adminIds];
    
    if (workerId) recipientIds.push(workerId);
    if (residentId) recipientIds.push(residentId);
    
    // Filter out the excluded user if any
    if (excludeUserId) {
      recipientIds = recipientIds.filter(id => id !== excludeUserId);
    }
    
    // Remove duplicates (in case an admin is also assigned as worker)
    recipientIds = [...new Set(recipientIds)];
    
    // Send the notification
    return await sendNotification(recipientIds, message, ticketId);
  } catch (error) {
    console.error("Error in notifyTicketUpdate:", error);
    return false;
  }
};