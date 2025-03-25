import React, { useState } from "react";
import "../index.css";
import "./createAccount.css";
import supabase from "../../backend/DBClient/SupaBaseClient";
import USER_ROLES from "./userRolesEnum"; // Import ENUM
import PageHeader from "../pageHeader";

const CreateAccount = () => {
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userRole, setUserRole] = useState(USER_ROLES.RESIDENT); // Default role
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match!");
      return;
    }

    try {
      const { error } = await supabase.from("Users").insert([
        {
          userName: userName,
          userPassword: password,
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
    }
  };

  return (
    <div className="create-account-page">
      <PageHeader title="Create New User Account" />
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
      <form onSubmit={handleSubmit} className="account-form">
        <label>Username</label>
        <input
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="Enter username"
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
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          required
        />
        <label>Confirm Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm password"
          required
        />
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}
        <button type="submit" className="create-account-btn">
          Create New{" "}
          {userRole === USER_ROLES.RESIDENT
            ? "Resident"
            : userRole === USER_ROLES.FACILITY_WORKER
            ? "Facility Worker"
            : "Admin"}{" "}
          Account
        </button>
      </form>
    </div>
  );
};

export default CreateAccount;
