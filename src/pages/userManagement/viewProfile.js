import React, { useState } from "react";
import "./viewProfile.css"; // Import the CSS for styling

const ViewProfile = () => {
  const [name, setName] = useState("Alex Ong");
  const [email, setEmail] = useState("alex@gmail.com");

  const handleSaveChanges = () => {
    alert("Profile updated successfully!");
  };

  return (
    <div className="profile1-container">
      <h2>Profile</h2>
      <div className="profile1-box">
        <div className="input-group">
          <label>Name</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
          />
        </div>

        <div className="input-group">
          <label>Email</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
        </div>

        <button onClick={handleSaveChanges} className="save-button">
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default ViewProfile;
