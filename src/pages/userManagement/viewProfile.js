import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import bcrypt from "bcryptjs"; // Import bcrypt for password comparison
import supabase from "../../backend/DBClient/SupaBaseClient";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import USER_ROLES from "./userRolesEnum"; // Import user roles enum with correct casing
import "./viewProfile.css";

const ViewProfile = () => {
  const [userName, setName] = useState("");
  const [userEmail, setEmail] = useState("");
  const [userContact, setContact] = useState("");
  const [userHousingUnit, setHousingUnit] = useState("");
  const [userRole, setUserRole] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [userId, setUserId] = useState(null);
  const [storedHashedPassword, setStoredHashedPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Error states
  const [contactError, setContactError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [nameError, setNameError] = useState("");
  const [housingUnitError, setHousingUnitError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);
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
            setUserId(userInfo.userId);
            setUserRole(userInfo.userRole); // Set user role from cookie directly
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
            setErrorMessage("Failed to load user profile. Please try again.");
          } else {
            setName(data.userName);
            setEmail(data.userEmail);
            setContact(data.userContact || "");
            // Only set housing unit if present in data
            if (data.userHousingUnit) {
              setHousingUnit(data.userHousingUnit);
            }
            setStoredHashedPassword(data.userPassword || "");
            setSuccessMessage("Profile loaded successfully!");
            setTimeout(() => setSuccessMessage(""), 3000);
          }
        } else {
          console.error("No userData found in cookies.");
          setErrorMessage("User session not found. Please log in again.");
        }
      } catch (error) {
        console.error("Unexpected error in fetchUserProfile:", error);
        setErrorMessage("An unexpected error occurred. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Validate Malaysian phone number
  const validateMalaysianPhoneNumber = (phoneNumber) => {
    // Malaysian phone number formats:
    // Mobile: 01x-xxxxxxx (where x can be 0-9)
    // Landline: 0x-xxxxxxx (where x can be 2-9)
    const mobileRegex = /^01[0-9]-[0-9]{7,8}$/;
    const landlineRegex = /^0[2-9]-[0-9]{7,8}$/;
    
    // Remove spaces for validation
    const cleanedNumber = phoneNumber.replace(/\s+/g, "");
    
    return mobileRegex.test(cleanedNumber) || landlineRegex.test(cleanedNumber);
  };

  // Validate email format
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate username as a single word (same as in CreateAccount)
  const isValidUsername = (username) => {
    const singleWordRegex = /^[a-zA-Z0-9_]+$/;
    return singleWordRegex.test(username);
  };

  // Check if user is a resident
  const isResident = () => {
    return userRole === USER_ROLES.RESIDENT;
  };

  // Handle username input change with validation (align with CreateAccount)
  const handleUsernameChange = (e) => {
    const value = e.target.value;
    setName(value);
    
    // Clear any existing error messages when user starts typing again
    if (nameError) {
      setNameError("");
    }
  };

  // Validate input fields before saving
  const validateInputs = () => {
    let isValid = true;

    // Reset all errors
    setNameError("");
    setEmailError("");
    setContactError("");
    setHousingUnitError("");
    setErrorMessage("");

    // Validate name (username) using the same format as CreateAccount
    if (!userName.trim()) {
      setNameError("Name cannot be empty");
      isValid = false;
    } else if (!isValidUsername(userName)) {
      setNameError("Username must be a single word with no spaces or special characters (only letters, numbers, and underscores allowed).");
      isValid = false;
    }

    // Validate email
    if (!userEmail.trim()) {
      setEmailError("Email cannot be empty");
      isValid = false;
    } else if (!validateEmail(userEmail)) {
      setEmailError("Please enter a valid email address");
      isValid = false;
    }

    // Validate contact number
    if (userContact && !validateMalaysianPhoneNumber(userContact)) {
      setContactError("Please enter a valid Malaysian phone number (e.g., 012-3456789)");
      isValid = false;
    }

    // Validate housing unit only if user is a resident
    if (isResident() && !userHousingUnit.trim()) {
      setHousingUnitError("Housing unit cannot be empty for residents");
      isValid = false;
    }

    return isValid;
  };

  const handleSaveChanges = async () => {
    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);
    try {
      const updateData = {
        userName: userName,
        userEmail: userEmail,
        userContact: userContact,
      };

      // Only include housing unit in the update if user is a resident
      if (isResident()) {
        updateData.userHousingUnit = userHousingUnit;
      }

      const { error } = await supabase
        .from("users")
        .update(updateData)
        .eq("userId", userId);

      if (error) {
        console.error("Error updating profile:", error);
        setErrorMessage("Failed to update profile. Please try again.");
      } else {
        setIsEditing(false);
        setSuccessMessage("Profile updated successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (error) {
      console.error("Unexpected error in handleSaveChanges:", error);
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset all error states
    setNameError("");
    setEmailError("");
    setContactError("");
    setHousingUnitError("");
    setErrorMessage("");
    
    // Cancel the changes and revert to the original values
    setIsEditing(false);
  };

  const handleChangePassword = () => {
    // Reset password states
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
    setPasswordSuccess("");
    setIsPasswordModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsPasswordModalOpen(false);
  };

  const validatePassword = (password) => {
    // Password validation that aligns with CreateAccount
    if (password.length < 8) {
      return { valid: false, message: "Password must be at least 8 characters." };
    }
    
    // Additional validation: at least one uppercase, one lowercase, one number, and one special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return { 
        valid: false, 
        message: "Password must have at least one uppercase letter, one lowercase letter, one number, and one special character." 
      };
    }
    
    return { valid: true };
  };

  const handleSubmitPasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    setIsLoading(true);
    try {
      // Check if passwords match
      if (newPassword !== confirmPassword) {
        setPasswordError("Passwords do not match!");
        setIsLoading(false);
        return;
      }

      // Validate new password
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.valid) {
        setPasswordError(passwordValidation.message);
        setIsLoading(false);
        return;
      }

      // Compare current password with stored password
      const isCurrentPasswordCorrect = await bcrypt.compare(
        currentPassword,
        storedHashedPassword
      );

      if (!isCurrentPasswordCorrect) {
        setPasswordError("Current password is incorrect");
        setIsLoading(false);
        return;
      }

      // Check if new password is same as old password
      const isSamePassword = await bcrypt.compare(
        newPassword,
        storedHashedPassword
      );

      if (isSamePassword) {
        setPasswordError("New password cannot be the same as the current password");
        setIsLoading(false);
        return;
      }

      // Hash the new password using the same method as CreateAccount
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update password in the database
      const { error } = await supabase
        .from("users")
        .update({ userPassword: hashedPassword })
        .eq("userId", userId);

      if (error) {
        console.error("Error updating password:", error);
        setPasswordError("Failed to update password. Please try again.");
      } else {
        setPasswordSuccess("Password changed successfully!");
        setStoredHashedPassword(hashedPassword);
        
        // Clear the form fields after successful password change
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        
        // Close modal after a short delay for the user to see the success message
        setTimeout(() => {
          setIsPasswordModalOpen(false);
        }, 2000);
      }
    } catch (error) {
      console.error("Unexpected error in handleSubmitPasswordChange:", error);
      setPasswordError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="profile1-container">
      <h2>Profile</h2>

      {successMessage && <p className="success-message">{successMessage}</p>}
      {errorMessage && <p className="error-message">{errorMessage}</p>}

      {isLoading && !isEditing && !isPasswordModalOpen ? (
        <div className="loading">Loading profile data...</div>
      ) : !isEditing ? (
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
            <br /> {userContact || "Not specified"}
          </p>
          {isResident() && (
            <p>
              <strong>Housing Unit:</strong>
              <br /> {userHousingUnit || "Not specified"}
            </p>
          )}

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
            <label>Name (Username)</label>
            <input
              type="text"
              value={userName}
              onChange={handleUsernameChange}
              placeholder="Enter username (letters, numbers, underscores only)"
            />
            {nameError && <p className="error-message">{nameError}</p>}
          </div>

          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              value={userEmail}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email"
            />
            {emailError && <p className="error-message">{emailError}</p>}
          </div>

          <div className="input-group">
            <label>Contact Number</label>
            <input
              type="text"
              value={userContact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="e.g., 012-3456789"
            />
            {contactError && <p className="error-message">{contactError}</p>}
          </div>

          {isResident() && (
            <div className="input-group">
              <label>Housing Unit</label>
              <input
                type="text"
                value={userHousingUnit}
                onChange={(e) => setHousingUnit(e.target.value)}
                placeholder="Enter housing unit"
              />
              {housingUnitError && (
                <p className="error-message">{housingUnitError}</p>
              )}
            </div>
          )}

          <button 
            onClick={handleSaveChanges} 
            className="save-button"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
          <button 
            onClick={handleCancelEdit} 
            className="close-button"
            disabled={isLoading}
          >
            Cancel
          </button>
        </div>
      )}

      {isPasswordModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Change Password</h3>
            {passwordSuccess && (
              <div className="success-message">{passwordSuccess}</div>
            )}
            {passwordError && (
              <div className="error-container">
                <AlertCircle size={16} />
                <p className="error-message">{passwordError}</p>
              </div>
            )}
            <form onSubmit={handleSubmitPasswordChange}>
              <div className="input-group">
                <label>Current Password</label>
                <div className="password-container">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
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
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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
                <small className="password-hint">
                  Password must be at least 8 characters with at least one uppercase letter, one lowercase letter, one number, and one special character.
                </small>
              </div>

              <div className="input-group">
                <label>Confirm New Password</label>
                <div className="password-container">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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

              <button 
                type="submit" 
                className="save-button"
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save Password"}
              </button>
              <button
                type="button"
                onClick={handleCloseModal}
                className="close-button"
                disabled={isLoading}
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