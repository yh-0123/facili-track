import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaUpload } from "react-icons/fa";
import "./createTicket.css"; // Import the CSS file

const CreateTicket = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [attachment, setAttachment] = useState(null);

  const handleFileUpload = (event) => {
    setAttachment(event.target.files[0]);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    // Submit ticket logic here
    console.log({ title, description, location, attachment });
  };

  return (
    <div className="create-ticket">
      <button className="back1-button" onClick={() => navigate(-1)}>
        <FaArrowLeft />
      </button>
      <h2 className="title">Create New Ticket</h2>

      <form onSubmit={handleSubmit} className="ticket-form">
        <label>Date of Submission</label>
        <input type="text" value={new Date().toLocaleDateString()} disabled />

        <label>Submitted By</label>
        <input type="text" value="(Fetch User Name)" disabled />

        <label>Title</label>
        <input
          type="text"
          placeholder="Enter Ticket Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <label>Defect Description</label>
        <textarea
          placeholder="Enter Defect Description"
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

        <button type="submit" className="submit1-button">
          Submit Ticket
        </button>
      </form>
    </div>
  );
};

export default CreateTicket;
