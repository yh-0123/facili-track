import React, { useState } from "react";
import "./viewProfile.css"; // Import the CSS for styling

const ViewProfile = () => {
  const [name, setName] = useState("Alex Ong");
  const [email, setEmail] = useState("alex@gmail.com");
  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const handleSaveChanges = () => {
    setIsEditing(false);
    alert("Profile updated successfully!");
  };

  const handleChangePassword = () => {
    setIsPasswordModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsPasswordModalOpen(false);
  };

  const handleSubmitPasswordChange = (e) => {
    e.preventDefault();
    alert("Password changed successfully!");
    setIsPasswordModalOpen(false);
  };

  return (
    <div className="profile1-container">
      <h2>Profile</h2>

      {!isEditing ? (
        // View Mode
        <div className="profile1-box">
          <p><strong>Name</strong><br /> {name}</p>
          <p><strong>Email</strong><br /> {email}</p>
          
          <button onClick={() => setIsEditing(true)} className="edit-button">
            Edit Profile
          </button>
          <button onClick={handleChangePassword} className="change-password">
            Change Password
          </button>
        </div>
      ) : (
        // Edit Mode
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
      )}

      {/* Password Change Modal */}
      {isPasswordModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Change Password</h3>
            <form onSubmit={handleSubmitPasswordChange}>
              <div className="input-group">
                <label>Current Password</label>
                <input type="password" required />
              </div>
              <div className="input-group">
                <label>New Password</label>
                <input type="password" required />
              </div>
              <div className="input-group">
                <label>Confirm New Password</label>
                <input type="password" required />
              </div>
              <button type="submit" className="save-button">Save Password</button>
              <button type="button" onClick={handleCloseModal} className="close-button">Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewProfile;
