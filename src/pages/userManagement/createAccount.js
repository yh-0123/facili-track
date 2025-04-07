import React, { useState } from "react";
import "../index.css";
import "./createAccount.css";
import supabase from "../../backend/DBClient/SupaBaseClient";
import PageHeader from "../pageHeader";
import USER_ROLES from "./userRolesEnum"; // Import ENUM
import { Eye, EyeOff } from "lucide-react"; // Import icons
import bcrypt from "bcryptjs"; // Import bcryptjs for password hashing

const CreateAccount = () => {
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userRole, setUserRole] = useState(USER_ROLES.RESIDENT); // Default role
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const togglePasswordVisibility = (field) => {
    if (field === "password") {
      setShowPassword(!showPassword);
    } else if (field === "confirmPassword") {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  // Function to validate username as a single word
  const isValidUsername = (username) => {
    // Check if username contains spaces or special characters
    const singleWordRegex = /^[a-zA-Z0-9_]+$/;
    return singleWordRegex.test(username);
  };

  // Handle username input change with validation
  const handleUsernameChange = (e) => {
    const value = e.target.value;
    setUserName(value);
    
    // Clear any existing error messages when user starts typing again
    if (errorMessage && errorMessage.includes("Username")) {
      setErrorMessage("");
    }
  };

  // Function to hash password using bcrypt
  const hashPassword = async (plainPassword) => {
    // Generate a salt with cost factor 10 (can be adjusted for security/performance balance)
    const salt = await bcrypt.genSalt(10);
    // Hash the password with the generated salt
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    return hashedPassword;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate username format first
    if (!isValidUsername(userName)) {
      setErrorMessage("Username must be a single word with no spaces or special characters (only letters, numbers, and underscores allowed).");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match!");
      return;
    }

    // Password validation (example: minimum length of 8 characters)
    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true); // Start loading state

    try {
      // Hash the password before storing
      const hashedPassword = await hashPassword(password);

      const { error } = await supabase.from("users").insert([
        {
          userName: userName,
          userPassword: hashedPassword, // Store the hashed password instead of plain text
          userRole: userRole, // Use ENUM value
          userAccountStatus: 1,
          userEmail: email,
        },
      ]);

      if (error) throw error;

      setSuccessMessage("Account created successfully!");
      setErrorMessage("");
      setUserName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error:", error.message);
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false); // End loading state
    }
  };

  return (
    <div className="create-account">
      <PageHeader title="Create New User Account" />
      <div className="create-account-page">
        <div className="content">
          <div className="tabs">
            <span
              className={userRole === USER_ROLES.RESIDENT ? "active-tab" : ""}
              onClick={() => setUserRole(USER_ROLES.RESIDENT)}
              style={{ cursor: "pointer" }}
            >
              New Resident
            </span>
            <span
              className={
                userRole === USER_ROLES.FACILITY_WORKER ? "active-tab" : ""
              }
              onClick={() => setUserRole(USER_ROLES.FACILITY_WORKER)}
              style={{ cursor: "pointer" }}
            >
              New Facility Worker
            </span>
            <span
              className={userRole === USER_ROLES.ADMIN ? "active-tab" : ""}
              onClick={() => setUserRole(USER_ROLES.ADMIN)}
              style={{ cursor: "pointer" }}
            >
              New Admin
            </span>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="account-form">
          <label>Username (single word)</label>
          <input
            type="text"
            value={userName}
            onChange={handleUsernameChange}
            placeholder="Enter username (letters, numbers, underscores only)"
            required
          />
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email"
            required
          />
          <label>Password</label>
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"} // Dynamically set the type
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
            <span
              onClick={() => togglePasswordVisibility("password")}
              className="eye-icon"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </span>
          </div>

          <label>Confirm Password</label>
          <div className="password-wrapper">
            <input
              type={showConfirmPassword ? "text" : "password"} // Dynamically set the type
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              required
            />
            <span
              onClick={() => togglePasswordVisibility("confirmPassword")}
              className="eye-icon"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </span>
          </div>

          {errorMessage && <p className="error-message">{errorMessage}</p>}
          {successMessage && <p className="success-message">{successMessage}</p>}
          <button type="submit" className="create-account-btn" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create New "}
            {userRole === USER_ROLES.RESIDENT
              ? "Resident"
              : userRole === USER_ROLES.FACILITY_WORKER
              ? "Facility Worker"
              : "Admin"}{" "}
            Account
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateAccount;