// src/utils/notification.js
import supabase from "../../backend/DBClient/SupaBaseClient";

export const sendNotification = async (recipientId, message) => {
  const { error } = await supabase.from("notifications").insert([
    {
      recipientId: recipientId,
      message,
    },
  ]);

  if (error) {
    console.error("Error sending notification:", error.message);
  }
};
