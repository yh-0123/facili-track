import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaUpload, FaMapMarkerAlt, FaTimes } from "react-icons/fa";
import PageHeader from "../pageHeader";
import "./createTicket.css";
import supabase from "../../backend/DBClient/SupaBaseClient";
import Cookies from "js-cookie";
import TicketStatusEnum from "./ticketStatusEnum";
import { sendNotification } from "./notification";

// Import Google Maps components (you'll need to install @react-google-maps/api)
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

const CreateTicket = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationText, setLocationText] = useState("");
  const [locationCoords, setLocationCoords] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [mapVisible, setMapVisible] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 1.3521, lng: 103.8198 }); // Default to Singapore
  const user = JSON.parse(Cookies.get("userData"));
  const fileInputRef = useRef(null);

  const MAX_FILE_SIZE = 5242880; // 5MB in bytes
  const MAX_FILES = 3;

  // Google Maps container style
  const mapContainerStyle = {
    width: "100%",
    height: "300px",
    marginBottom: "20px",
    borderRadius: "5px"
  };

  const handleFileUpload = (event) => {
    const selectedFiles = Array.from(event.target.files);
    
    // Check if adding these files would exceed the limit
    if (attachments.length + selectedFiles.length > MAX_FILES) {
      alert(`You can only upload up to ${MAX_FILES} files.`);
      return;
    }

    // Check file sizes
    const oversizedFiles = selectedFiles.filter(file => file.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      alert(`Some files exceed the 5MB size limit: ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }

    // Add new files to the existing attachments
    setAttachments([...attachments, ...selectedFiles]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index) => {
    const updatedAttachments = [...attachments];
    updatedAttachments.splice(index, 1);
    setAttachments(updatedAttachments);
  };

  const toggleMap = () => {
    setMapVisible(!mapVisible);
  };

  const handleMapClick = (event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    setLocationCoords({ lat, lng });
    
    // Update the location text field with coordinates
    const coordsString = `Latitude: ${lat.toFixed(6)}, Longitude: ${lng.toFixed(6)}`;
    setLocationText(locationText ? `${locationText} (${coordsString})` : coordsString);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (attachments.length > MAX_FILES) {
      alert(`You can only upload up to ${MAX_FILES} files.`);
      return;
    }

    try {
      // Prepare the ticket data
      const ticketData = {
        title,
        description,
        location: locationText,
        locationCoords,
        submittedBy: user.userName,
        submissionDate: new Date().toISOString(),
      };

      // Array to store attachment URLs
      const attachmentUrls = [];

      // Upload each attachment to Supabase Storage
      if (attachments.length > 0) {
        for (const file of attachments) {
          // Create a unique file path
          const filePath = `tickets/${user.userId}/${Date.now()}_${file.name}`;
          
          // Upload the file
          const { data: fileData, error: uploadError } = await supabase.storage
            .from("ticket-attachments")
            .upload(filePath, file);

          if (uploadError) {
            throw new Error(`Error uploading ${file.name}: ${uploadError.message}`);
          }

          // Get the public URL
          const { data: urlData } = supabase.storage
            .from("ticket-attachments")
            .getPublicUrl(filePath);

          if (urlData && urlData.publicUrl) {
            attachmentUrls.push(urlData.publicUrl);
          }
        }
      }

      // Insert the ticket data into the Supabase database
      const { data, error } = await supabase
        .from("ticket")
        .insert({
          reportedResidentId: user.userId,
          adminId: user.userId,
          ticketDescription: ticketData.description,
          ticketAttachment: attachmentUrls.length > 0 ? JSON.stringify(attachmentUrls) : null,
          submissionDate: ticketData.submissionDate,
          ticketStatus: TicketStatusEnum.NOT_ASSIGNED,
          ticketTitle: title,
          ticketLocation: locationText,
          locationCoordinates: locationCoords ? JSON.stringify(locationCoords) : null,
        });

      if (error) {
        throw new Error(error.message);
      }

      // Notify admins about the new ticket
      const { data: adminUsers, error: adminError } = await supabase
        .from("users")
        .select("userId")
        .eq("userRole", "0");

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
          placeholder="Enter Ticket Title. Example: Light Defect"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <label>Defect Description</label>
        <textarea
          placeholder="Enter Defect Description with location stated. Example: Light not functioning in 5th floor Gym Room."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        ></textarea>

        <label>Location of Defect</label>
        <div className="location-input">
          <input
            type="text"
            placeholder="Location details or pin on map"
            value={locationText}
            onChange={(e) => setLocationText(e.target.value)}
            required
          />
          <button 
            type="button" 
            className="map-toggle-button"
            onClick={toggleMap}
          >
            <FaMapMarkerAlt /> {mapVisible ? 'Hide Map' : 'Show Map'}
          </button>
        </div>

        {mapVisible && (
          <LoadScript googleMapsApiKey="YOUR_GOOGLE_MAPS_API_KEY">
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={mapCenter}
              zoom={15}
              onClick={handleMapClick}
            >
              {locationCoords && <Marker position={locationCoords} />}
            </GoogleMap>
          </LoadScript>
        )}

        <label>Attachments (Up to 3 files, max 5MB each)</label>
        <div className="file-upload">
          <input 
            type="file" 
            id="file" 
            ref={fileInputRef}
            onChange={handleFileUpload} 
            multiple
            disabled={attachments.length >= MAX_FILES}
          />
          <label htmlFor="file">
            <FaUpload /> Upload Files ({attachments.length}/{MAX_FILES})
          </label>
        </div>

        {attachments.length > 0 && (
          <div className="attachments-preview">
            <ul>
              {attachments.map((file, index) => (
                <li key={index}>
                  {file.name} ({(file.size / 1048576).toFixed(2)} MB)
                  <button 
                    type="button" 
                    className="remove-file-btn" 
                    onClick={() => removeAttachment(index)}
                  >
                    <FaTimes />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="button-group">
          <button type="button" className="back-button" onClick={() => navigate(-1)}>
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