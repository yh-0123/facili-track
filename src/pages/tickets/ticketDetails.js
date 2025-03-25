// import React, { useEffect, useState } from "react";
// import { useParams } from "react-router-dom";
// import { createClient } from "@supabase/supabase-js";

// // Initialize Supabase client
// const supabase = createClient("YOUR_SUPABASE_URL", "YOUR_SUPABASE_ANON_KEY");

// const TicketDetails = () => {
//   const { id } = useParams(); // Get ticket ID from URL
//   const [ticket, setTicket] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchTicket = async () => {
//       setLoading(true);
//       const { data, error } = await supabase
//         .from("tickets") // Assuming your table is named 'tickets'
//         .select("*")
//         .eq("id", id)
//         .single();

//       if (error) {
//         console.error("Error fetching ticket:", error);
//       } else {
//         setTicket(data);
//       }
//       setLoading(false);
//     };

//     fetchTicket();
//   }, [id]);

//   if (loading) {
//     return <p>Loading...</p>;
//   }

//   if (!ticket) {
//     return <p>Ticket not found.</p>;
//   }

//   return (
//     <div className="ticket-details">
//       <h2>Ticket ID: {ticket.id}</h2>
//       <p>
//         <strong>Title:</strong> {ticket.title}
//       </p>
//       <p>
//         <strong>Status:</strong> {ticket.status}
//       </p>
//       <p>
//         <strong>Submitted By:</strong> {ticket.submitted_by}
//       </p>
//       <p>
//         <strong>Submit Date:</strong> {ticket.submit_date}
//       </p>
//       <p>
//         <strong>Description:</strong> {ticket.description}
//       </p>
//       <p>
//         <strong>Location:</strong> {ticket.location}
//       </p>
//       <p>
//         <strong>Assigned To:</strong> {ticket.assigned_to || "Not Assigned"}
//       </p>
//       <p>
//         <strong>Updated By:</strong> {ticket.updated_by || "N/A"}
//       </p>

//       {/* Display image if available */}
//       {ticket.attachment && (
//         <img
//           src={ticket.attachment}
//           alt="Attachment"
//           style={{ maxWidth: "100%" }}
//         />
//       )}
//     </div>
//   );
// };

// export default TicketDetails;
