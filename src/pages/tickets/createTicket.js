import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaUpload,
  FaMapMarkerAlt,
  FaTimes,
  FaLocationArrow,
  FaSearch,
} from "react-icons/fa";
import PageHeader from "../pageHeader";
import "./createTicket.css";
import supabase from "../../backend/DBClient/SupaBaseClient";
import Cookies from "js-cookie";
import TicketStatusEnum from "./ticketStatusEnum";
import { sendNotification, getAdminUserIds } from "./notificationService";
import userRolesEnum from "../userManagement/userRolesEnum";

// Import Google Maps components
import { GoogleMap, Marker, Circle, useJsApiLoader } from "@react-google-maps/api";

// Define the libraries we need
const libraries = ["places"];

const CreateTicket = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationText, setLocationText] = useState("");
  const [searchAddress, setSearchAddress] = useState("");
  const [locationCoords, setLocationCoords] = useState(null);
  const [locationAccuracy, setLocationAccuracy] = useState(null); // Store the accuracy
  const [attachments, setAttachments] = useState([]);
  const [mapVisible, setMapVisible] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 1.3521, lng: 103.8198 }); // Default to Singapore
  const [mapZoom, setMapZoom] = useState(15);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [watchId, setWatchId] = useState(null); // For tracking the watchPosition ID
  const user = JSON.parse(Cookies.get("userData"));
  const fileInputRef = useRef(null);
  const mapRef = useRef(null); // Reference to the map instance
  const autocompleteRef = useRef(null); // Reference for the autocomplete

  const MAX_FILE_SIZE = 5242880; // 5MB in bytes
  const MAX_FILES = 3;

  // Load the Google Maps JavaScript API
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });

  // Google Maps container style
  const mapContainerStyle = {
    width: "100%",
    height: "300px",
    marginBottom: "20px",
    borderRadius: "5px",
  };

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      // Clear any active geolocation watching
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  // Set up Autocomplete once the map is loaded
  useEffect(() => {
    if (isLoaded && mapVisible) {
      // Initialize autocomplete after a short delay to ensure DOM is ready
      setTimeout(() => {
        const autocompleteInput = document.getElementById('map-search-input');
        if (autocompleteInput && window.google && window.google.maps && window.google.maps.places) {
          const autocomplete = new window.google.maps.places.Autocomplete(autocompleteInput);
          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            
            if (place.geometry && place.geometry.location) {
              const lat = place.geometry.location.lat();
              const lng = place.geometry.location.lng();
              
              // Update location coordinates and map center
              setLocationCoords({ lat, lng });
              setMapCenter({ lat, lng });
              
              // Update location text
              setLocationText(place.formatted_address || place.name || `Location (${lat.toFixed(6)}, ${lng.toFixed(6)})`);
              
              // Set appropriate zoom level
              setMapZoom(17);
              
              // If we have a map reference and viewport, fit bounds
              if (mapRef.current && place.geometry.viewport) {
                mapRef.current.fitBounds(place.geometry.viewport);
              } else if (mapRef.current) {
                mapRef.current.panTo({ lat, lng });
                mapRef.current.setZoom(17);
              }
              
              // Clear any active location watch
              stopWatchingLocation();
              
              // Reset location accuracy since this is from search
              setLocationAccuracy(null);
            }
          });
          autocompleteRef.current = autocomplete;
        } else {
          console.warn("Google Maps Places library not fully loaded yet");
        }
      }, 500);
    }
  }, [isLoaded, mapVisible]);

  // Function to handle map load and store reference
  const onMapLoad = (map) => {
    mapRef.current = map;
  };

  // Function to geocode address (manually triggered)
  const geocodeAddress = () => {
    if (!searchAddress.trim()) {
      alert("Please enter an address to search");
      return;
    }
    
    if (isLoaded && window.google) {
      const geocoder = new window.google.maps.Geocoder();
      
      geocoder.geocode({ address: searchAddress }, (results, status) => {
        if (status === "OK" && results[0]) {
          const location = results[0].geometry.location;
          const lat = location.lat();
          const lng = location.lng();
          
          // Update location coordinates and map center
          setLocationCoords({ lat, lng });
          setMapCenter({ lat, lng });
          
          // Update location text
          setLocationText(results[0].formatted_address || `Location (${lat.toFixed(6)}, ${lng.toFixed(6)})`);
          
          // Make map visible if it's not already
          if (!mapVisible) {
            setMapVisible(true);
          }
          
          // Handle viewport safely
          if (results[0].geometry.viewport && mapRef.current) {
            // Safe check for mapRef before using fitBounds
            mapRef.current.fitBounds(results[0].geometry.viewport);
          } else {
            setMapZoom(17);
            if (mapRef.current) {
              mapRef.current.setZoom(17);
            }
          }
          
          // Clear any active location watch
          stopWatchingLocation();
          
          // Reset search field
          setSearchAddress("");
        } else {
          alert("Could not find location: " + status);
        }
      });
    } else {
      alert("Google Maps API is not loaded yet. Please try again in a moment.");
    }
  };

  // Get current user location with better accuracy handling
  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    
    if (navigator.geolocation) {
      // Create a watch position that continuously updates until we get good accuracy
      const id = navigator.geolocation.watchPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const accuracy = position.coords.accuracy; // in meters
          
          console.log(`Got location with accuracy: ${accuracy} meters`);
          
          setLocationCoords({ lat, lng });
          setMapCenter({ lat, lng });
          setLocationAccuracy(accuracy);
          
          // Update location text with accuracy info
          setLocationText(`My Current Location (±${Math.round(accuracy)}m)`);
          
          setMapVisible(true);
          
          // If we have a map reference, update it
          if (mapRef.current) {
            mapRef.current.panTo({ lat, lng });
            
            // Adjust zoom based on accuracy
            const newZoom = calculateZoomLevel(accuracy);
            setMapZoom(newZoom);
            mapRef.current.setZoom(newZoom);
          }
          
          // If we get good accuracy (less than 100m), stop watching
          if (accuracy < 100) {
            navigator.geolocation.clearWatch(id);
            setIsGettingLocation(false);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          navigator.geolocation.clearWatch(id);
          alert(`Location error: ${error.message}`);
          setIsGettingLocation(false);
        },
        { 
          enableHighAccuracy: true,
          timeout: 30000,  // 30 seconds
          maximumAge: 0    // Don't use cached positions
        }
      );
      
      // Store the watch ID so we can clear it later
      setWatchId(id);
      
      // Add a timeout to stop watching after 30 seconds regardless
      setTimeout(() => {
        navigator.geolocation.clearWatch(id);
        if (isGettingLocation) {
          setIsGettingLocation(false);
          alert("Could not get an accurate location. Using best available position.");
        }
      }, 30000);
    } else {
      alert("Geolocation is not supported by your browser.");
      setIsGettingLocation(false);
    }
  };

  // Calculate appropriate zoom level based on accuracy
  const calculateZoomLevel = (accuracy) => {
    if (accuracy < 10) return 19;    // Extremely precise
    if (accuracy < 50) return 18;    // Very accurate
    if (accuracy < 100) return 17;   // Good accuracy
    if (accuracy < 300) return 16;   // Decent accuracy
    if (accuracy < 500) return 15;   // Moderate accuracy
    if (accuracy < 1000) return 14;  // Poor accuracy
    if (accuracy < 3000) return 13;  // Very poor accuracy
    return 12;                       // Default for inaccurate readings
  };

  // Stop watching location
  const stopWatchingLocation = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
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
    // Stop watching location if we were doing that
    stopWatchingLocation();
    
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    setLocationCoords({ lat, lng });
    setLocationAccuracy(null); // Clear accuracy since this is manual
    
    // Update the location text field with coordinates for better precision
    setLocationText(`Selected Location (${lat.toFixed(6)}, ${lng.toFixed(6)})`);
    
    // Optionally reverse geocode the coordinates to get address
    reverseGeocode(lat, lng);
  };
  
  // Function to reverse geocode coordinates to address
  const reverseGeocode = (lat, lng) => {
    if (isLoaded && window.google) {
      const geocoder = new window.google.maps.Geocoder();
      
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === "OK" && results[0]) {
          setLocationText(results[0].formatted_address);
        }
        // If geocoding fails, we already have the coordinates as text
      });
    }
  };

  const clearLocation = () => {
    stopWatchingLocation();
    setLocationCoords(null);
    setLocationAccuracy(null);
    setLocationText("");
    setSearchAddress("");
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
        locationAccuracy,
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

      // Store the accuracy information if available
      const locationData = locationCoords
        ? {
            ...locationCoords,
            accuracy: locationAccuracy || 0,
          }
        : null;

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
          locationCoordinates: locationData
            ? JSON.stringify(locationData)
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

  // Show loading or error state while Google Maps API is loading
  if (loadError) {
    return (
      <div className="create-ticket">
        <PageHeader title="Create New Ticket" />
        <div className="error-message">
          Error loading Google Maps: {loadError.message}. Please refresh the page or try again later.
        </div>
      </div>
    );
  }

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
          
          {/* Add address search input and button */}
          <div className="address-search">
            <input
              type="text"
              placeholder="Search for an address or place"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  geocodeAddress();
                }
              }}
            />
            <button
              type="button"
              className="search-button"
              onClick={geocodeAddress}
            >
              <FaSearch /> Search
            </button>
          </div>
          
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

        {mapVisible && isLoaded && (
          <div className="map-container">
            {/* Search input inside map */}
            <div className="map-search-box">
              <input
                id="map-search-input"
                type="text"
                placeholder="Search for places inside map"
                style={{
                  boxSizing: "border-box",
                  border: "1px solid transparent",
                  width: "100%",
                  height: "40px",
                  padding: "0 12px",
                  borderRadius: "5px",
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.3)",
                  fontSize: "14px",
                  outline: "none",
                  textOverflow: "ellipses",
                  position: "absolute",
                  top: "10px",
                  left: "50%",
                  marginLeft: "-120px",
                  width: "240px",
                  zIndex: "1"
                }}
              />
            </div>
            
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={mapCenter}
              zoom={mapZoom}
              onClick={handleMapClick}
              onLoad={onMapLoad}
              options={{
                mapTypeControl: true,
                streetViewControl: true,
                fullscreenControl: true,
                zoomControl: true,
              }}
            >
              {locationCoords && (
                <>
                  <Marker 
                    position={locationCoords} 
                    draggable={true}
                    onDragEnd={(e) => {
                      const lat = e.latLng.lat();
                      const lng = e.latLng.lng();
                      setLocationCoords({ lat, lng });
                      setLocationText(`Adjusted Location (${lat.toFixed(6)}, ${lng.toFixed(6)})`);
                      setLocationAccuracy(null);
                      
                      // Reverse geocode the new position
                      reverseGeocode(lat, lng);
                    }}
                  />
                  {locationAccuracy && (
                    <Circle
                      center={locationCoords}
                      radius={locationAccuracy}
                      options={{
                        fillColor: "#4285F4",
                        fillOpacity: 0.2,
                        strokeColor: "#4285F4",
                        strokeOpacity: 0.5,
                        strokeWeight: 1,
                      }}
                    />
                  )}
                </>
              )}
            </GoogleMap>
          </div>
        )}

        <label>Attachments (Optional. You may attach image, videos, documents or audio files, up to 3 files, max 5MB each)</label>
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