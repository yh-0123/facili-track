import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import supabase from "../../backend/DBClient/SupaBaseClient";
import { Eye, EyeOff } from "lucide-react";
import "./viewProfile.css";

const ViewProfile = () => {
  const [userName, setName] = useState("");
  const [userEmail, setEmail] = useState("");
  const [userContact, setContact] = useState("");
  const [userHousingUnit, setHousingUnit] = useState(""); // from resident table (TODO - idk how)
  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userData = Cookies.get("userData");
        if (userData) {
          let userInfo;
          try {
            userInfo = JSON.parse(userData);
            if (!userInfo || !userInfo.userId) {
              console.error("Invalid userInfo or missing userId:", userInfo);
              return;
            }
            console.log("Parsed userInfo:", userInfo);
          } catch (parseError) {
            console.error("Error parsing userData:", parseError);
            return;
          }

          const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("userId", userInfo.userId)
            .single();

          if (error) {
            console.error("Error fetching user profile:", error);
          } else {
            setName(data.userName);
            setEmail(data.userEmail);
            setContact(data.userContact);
          }
        } else {
          console.error("No userData found in cookies.");
        }
      } catch (error) {
        console.error("Unexpected error in fetchUserProfile:", error);
      }
    };

    fetchUserProfile();
  }, []);

  const handleSaveChanges = async () => {
    const userData = Cookies.get("userData");
    if (userData) {
      let userInfo;
      try {
        userInfo = JSON.parse(userData);
        if (!userInfo || !userInfo.userId) {
          console.error("Invalid userInfo or missing userId:", userInfo);
          return;
        }
      } catch (parseError) {
        console.error("Error parsing userData:", parseError);
        return;
      }

      const { error } = await supabase
        .from("users")
        .update({
          userName: userName,
          userEmail: userEmail,
          userContact: userContact,
        })
        .eq("userId", userInfo.userId);

      if (error) {
        console.error("Error updating profile:", error);
      } else {
        setIsEditing(false);
        alert("Profile updated successfully!");
      }
    } else {
      console.error("No userData found in cookies.");
    }
  };

  const handleCancelEdit = () => {
    // Cancel the changes and revert to the original values
    setIsEditing(false);
    setName(userName); // Revert name to the original
    setEmail(userEmail); // Revert email to the original
    setContact(userContact); // Revert contact to the original
  };

  const handleChangePassword = () => {
    setIsPasswordModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsPasswordModalOpen(false);
  };

  const handleSubmitPasswordChange = async (e) => {
    e.preventDefault();
    alert("Password changed successfully!");
    setIsPasswordModalOpen(false);
  };

  return (
    <div className="profile1-container">
      <h2>Profile</h2>

      {!isEditing ? (
        <div className="profile1-box">
          <p>
            <strong>Name:</strong>
            <br /> {userName}
          </p>
          <p>
            <strong>Email:</strong>
            <br /> {userEmail}
          </p>
          <p>
            <strong>Contact Number:</strong>
            <br /> {userContact}
          </p>
          <p>
            <strong>Housing Unit:</strong>
            <br /> {}
          </p>

          <button onClick={() => setIsEditing(true)} className="edit-button">
            Edit Profile
          </button>
          <button onClick={handleChangePassword} className="change-password">
            Change Password
          </button>
        </div>
      ) : (
        <div className="profile1-box">
          <div className="input-group">
            <label>Name</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              value={userEmail}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Contact Number</label>
            <input
              type="text"
              value={userContact}
              onChange={(e) => setContact(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Housing Unit</label>
            <input
              type="text"
              value={userHousingUnit}
              onChange={(e) => setHousingUnit(e.target.value)}
            />
          </div>

          <button onClick={handleSaveChanges} className="save-button">
            Save Changes
          </button>
          <button onClick={handleCancelEdit} className="close-button">
            Cancel
          </button>
        </div>
      )}

      {isPasswordModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Change Password</h3>
            <form onSubmit={handleSubmitPasswordChange}>
              <div className="input-group">
                <label>Current Password</label>
                <div className="password-container">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="eye-icon"
                  >
                    {showCurrentPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label>New Password</label>
                <div className="password-container">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="eye-icon"
                  >
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label>Confirm New Password</label>
                <div className="password-container">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="eye-icon"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" className="save-button">
                Save Password
              </button>
              <button
                type="button"
                onClick={handleCloseModal}
                className="close-button"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewProfile;
