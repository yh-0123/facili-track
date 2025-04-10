import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaUpload,
  FaMapMarkerAlt,
  FaTimes,
  FaLocationArrow,
} from "react-icons/fa";
import PageHeader from "../pageHeader";
import "./createTicket.css";
import supabase from "../../backend/DBClient/SupaBaseClient";
import Cookies from "js-cookie";
import TicketStatusEnum from "./ticketStatusEnum";
import { sendNotification, getAdminUserIds } from "./notificationService";
import userRolesEnum from "../userManagement/userRolesEnum";

// Import Google Maps components
import { GoogleMap, Marker } from "@react-google-maps/api";

const CreateTicket = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationText, setLocationText] = useState("");
  const [locationCoords, setLocationCoords] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [mapVisible, setMapVisible] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 1.3521, lng: 103.8198 }); // Default to Singapore
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const user = JSON.parse(Cookies.get("userData"));
  const fileInputRef = useRef(null);

  const MAX_FILE_SIZE = 5242880; // 5MB in bytes
  const MAX_FILES = 3;

  // Google Maps container style
  const mapContainerStyle = {
    width: "100%",
    height: "300px",
    marginBottom: "20px",
    borderRadius: "5px",
  };

  // Get current user location
  const getCurrentLocation = () => {
    setIsGettingLocation(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          setLocationCoords({ lat, lng });
          setMapCenter({ lat, lng });

          // Update location text with a friendly name instead of coordinates
          setLocationText("My Current Location");

          setMapVisible(true); // Show map after getting location
          setIsGettingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          alert(
            "Unable to get your current location. Please enable location services or select location on map."
          );
          setIsGettingLocation(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
      setIsGettingLocation(false);
    }
  };

  const handleFileUpload = (event) => {
    const selectedFiles = Array.from(event.target.files);

    // Check if adding these files would exceed the limit
    if (attachments.length + selectedFiles.length > MAX_FILES) {
      alert(`You can only upload up to ${MAX_FILES} files.`);
      return;
    }

    // Check file sizes
    const oversizedFiles = selectedFiles.filter(
      (file) => file.size > MAX_FILE_SIZE
    );
    if (oversizedFiles.length > 0) {
      alert(
        `Some files exceed the 5MB size limit: ${oversizedFiles
          .map((f) => f.name)
          .join(", ")}`
      );
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

    // Update the location text field with a simple label
    setLocationText("Selected Location on Map");
  };

  const clearLocation = () => {
    setLocationCoords(null);
    setLocationText("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

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

      // Upload each attachment to Supabase Storage (if any)
      if (attachments.length > 0) {
        for (const file of attachments) {
          try {
            // Clean filename to avoid path issues
            const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
            const filePath = `tickets/${
              user.userId
            }/${Date.now()}_${safeFileName}`;

            console.log(
              "Attempting to upload file:",
              safeFileName,
              "to path:",
              filePath
            );

            // Upload with explicit options
            const { data: fileData, error: uploadError } =
              await supabase.storage
                .from("ticket-attachments")
                .upload(filePath, file, {
                  cacheControl: "3600",
                  upsert: true,
                });

            if (uploadError) {
              console.error("Upload error details:", uploadError);
              throw new Error(
                `Error uploading ${file.name}: ${uploadError.message}`
              );
            }

            console.log("File uploaded successfully:", fileData);

            // Get the public URL
            const { data: urlData } = supabase.storage
              .from("ticket-attachments")
              .getPublicUrl(filePath);

            if (urlData && urlData.publicUrl) {
              attachmentUrls.push(urlData.publicUrl);
              console.log("Got public URL:", urlData.publicUrl);
            } else {
              console.warn("Could not get public URL for file:", filePath);
            }
          } catch (error) {
            console.error("File upload error:", error);
            alert(`Error uploading file ${file.name}: ${error.message}`);
          }
        }
      }

      // Insert the ticket data into the Supabase database
      const { data, error } = await supabase
        .from("ticket")
        .insert({
          reportedResidentId: user.userId,
          ticketDescription: ticketData.description,
          ticketAttachment: attachmentUrls.length > 0 ? attachmentUrls : null,
          submissionDate: ticketData.submissionDate,
          ticketStatus: TicketStatusEnum.NOT_ASSIGNED,
          ticketTitle: title,
          ticketLocation: locationText || null,
          locationCoordinates: locationCoords
            ? JSON.stringify(locationCoords)
            : null,
        })
        .select();

      if (error) {
        throw new Error(error.message);
      }

      const ticketId = data[0]?.ticketId; // Assuming Supabase returns the inserted record

      // Notify admins about the new ticket
      try {
        const adminIds = await getAdminUserIds();
        if (adminIds && adminIds.length > 0) {
          console.log('Sending notifications to admins:', adminIds); // Debug log
          const notificationSent = await sendNotification(
            adminIds,
            `New ticket "${title}" submitted by ${user.userName}`,
            ticketId
          );
          if (!notificationSent) {
            console.warn('Failed to send notifications to admins');
          }
        } else {
          console.warn('No admin users found to notify');
        }
      } catch (notificationError) {
        console.error('Error in notification process:', notificationError);
        // Don't throw the error - just log it since notifications aren't critical
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
          placeholder="Enter Detailed Defect Description. Example: 2 light not malfunctioning, it is flickering since yesterday."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        ></textarea>

        <label>Location of Defect (Optional)</label>
        <div className="location-input">
          <input
            type="text"
            placeholder="Enter location details (you may state the location of defect or it will be filled automatically when you select on map)"
            value={locationText}
            onChange={(e) => setLocationText(e.target.value)}
          />
          <div className="location-buttons">
            <button
              type="button"
              className="map-toggle-button"
              onClick={toggleMap}
            >
              <FaMapMarkerAlt /> {mapVisible ? "Hide Map" : "Show Map"}
            </button>
            <button
              type="button"
              className="current-location-button"
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
            >
              <FaLocationArrow />{" "}
              {isGettingLocation ? "Getting Location..." : "Use My Location"}
            </button>
            {locationCoords && (
              <button
                type="button"
                className="clear-location-button"
                onClick={clearLocation}
              >
                <FaTimes /> Clear Location
              </button>
            )}
          </div>
        </div>

        {mapVisible && (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={15}
            onClick={handleMapClick}
          >
            {locationCoords && <Marker position={locationCoords} />}
          </GoogleMap>
        )}

        <label>Attachments (Optional, up to 3 files, max 5MB each)</label>
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
          <button
            type="button"
            className="back-button"
            onClick={() => navigate(-1)}
          >
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
