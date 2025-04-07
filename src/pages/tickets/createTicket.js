import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaUpload } from "react-icons/fa";
import PageHeader from "../pageHeader";
import "./createTicket.css";
import supabase from "../../backend/DBClient/SupaBaseClient"; // Import Supabase client
import Cookies from "js-cookie"; // Import js-cookie for managing cookies
import TicketStatusEnum from "./ticketStatusEnum";
import { sendNotification } from "./notification";

const CreateTicket = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [attachment, setAttachment] = useState(null);
  const user = JSON.parse(Cookies.get("userData"));

  const handleFileUpload = (event) => {
    setAttachment(event.target.files[0]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      // Prepare the ticket data
      const ticketData = {
        title,
        description,
        location,
        attachment: attachment ? attachment.name : null, // Store the file name or URL
        submittedBy: user.userName, // Assuming userName is available in user data
        submissionDate: new Date().toISOString(), // Store the current date in ISO format
      };

      // Check if attachment exists and upload to Supabase Storage
      if (attachment) {
        // Upload the file to Supabase storage
        const { data: fileData, error: uploadError } = await supabase.storage
          .from("ticket-attachments") // Make sure to create a bucket named 'ticket-attachments'
          .upload(`tickets/${ticketData.title}_${attachment.name}`, attachment);

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        // Get the public URL of the uploaded file
        const { publicURL, error: urlError } = supabase.storage
          .from("ticket-attachments")
          .getPublicUrl(fileData.path);

        if (urlError) {
          throw new Error(urlError.message);
        }

        ticketData.attachment = publicURL; // Use the URL of the uploaded file
      }

      // Check if attachment exists and upload to Supabase Storage
      if (attachment) {
        // Upload the file to Supabase storage
        const { data: fileData, error: uploadError } = await supabase.storage
          .from("ticket-attachments") // Make sure to create a bucket named 'ticket-attachments'
          .upload(`tickets/${ticketData.title}_${attachment.name}`, attachment);

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        // Get the public URL of the uploaded file
        const { publicURL, error: urlError } = supabase.storage
          .from("ticket-attachments")
          .getPublicUrl(fileData.path);

        if (urlError) {
          throw new Error(urlError.message);
        }

        ticketData.attachment = publicURL; // Use the URL of the uploaded file
      }

      // Insert the ticket data into the Supabase database
      const { data, error } = await supabase
        .from("ticket") // Replace "ticket" with your actual table name
        .insert({
          reportedResidentId: user.userId,
          adminId: user.userId,
          ticketDescription: ticketData.description,
          ticketAttachment: ticketData.attachment,
          submissionDate: ticketData.submissionDate,
          ticketStatus: TicketStatusEnum.NOT_ASSIGNED,
        });

      if (error) {
        throw new Error(error.message);
      }

      // If successful, navigate back or show a success message
      alert("Ticket submitted successfully!");
      navigate(-1); // Navigate back to the previous page

        // Notify the admin
      const { data: adminUsers, error: adminError } = await supabase
      .from("users")
      .select("userId")
      .eq("userRole", "0"); // assuming you have a role field

      if (adminError) {
      console.error("Error fetching admins:", adminError.message);
      } else {
      const adminIds = adminUsers.map((admin) => admin.userId);
      await sendNotification(
        adminIds,
        `A new ticket has been submitted by ${user.userName}.`
      );
      }

      // If successful, navigate back or show a success message
      alert("Ticket submitted successfully!");
      navigate(-1); // Navigate back to the previous page

    } catch (error) {
      console.error("Error submitting ticket:", error);
      alert("Error submitting ticket: " + error.message);
    }
  };

  

  //TODO need to change button group later, make it diff for mobile and laptop view
  return (
    <div className="create-ticket">
      <PageHeader title="Create New Ticket" />

      <form onSubmit={handleSubmit} className="ticket-form">
        <label>Date of Submission</label>
        <input type="text" value={new Date().toLocaleDateString()} disabled />

        <label>Submitted By</label>
        <input type="text" value={user.userName} disabled />

        <label>Title</label>
        <input
          type="text"
          placeholder="Enter Ticket Title.
Example: Light Defect"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <label>Defect Description</label>
        <textarea
          placeholder="Enter Defect Description with location stated.
Example: Light not functioning in 5th floor Gym Room."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        ></textarea>

        <label>Location of Defect</label>
        <input
          type="text"
          placeholder="Pin Location on Google Map"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
        />

        <label>Attachment</label>
        <div className="file-upload">
          <input type="file" id="file" onChange={handleFileUpload} />
          <label htmlFor="file">
            <FaUpload /> {attachment ? attachment.name : "Upload File"}
          </label>
        </div>

        <div className="button-group">
          <button className="back-button" onClick={() => navigate(-1)}>
            Back
          </button>

          <button type="submit" className="submit-button">
            Submit Ticket
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTicket;
