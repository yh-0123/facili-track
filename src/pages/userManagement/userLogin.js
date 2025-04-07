import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for redirection
import supabase from "../../backend/DBClient/SupaBaseClient"; // Import Supabase client
import Cookies from "js-cookie"; // Import js-cookie for managing cookies
import "./userLogin.css"; // Import CSS file

const UserLogin = ({ setIsLoggedIn }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate(); // Initialize useNavigate for redirection

  useEffect(() => {
    // Hide top bar and sidebar on login page
    document.body.classList.add("hide-layout");

    return () => {
      // Restore layout when leaving login page
      document.body.classList.remove("hide-layout");
    };
  }, []);

  useEffect(() => {
    // Check if user cookie exists
    const userCookie = Cookies.get("user");
    if (userCookie) {
      setIsLoggedIn(true);
    }
  }, []); // Empty dependency array to run only once on mount

  const handleLogin = async () => {
    // Basic validation
    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }

    try {
      // Query the custom table for the user

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("userEmail", email)
        .single(); // Ensure the data is not returned as an array

      if (error) {
        alert(`Login failed: ${error.message}`);
        return;
      }

      if (!data) {
        alert("User not found.");
        return;
      }

      // Validate the password (if stored as plain text, compare directly; otherwise, use bcrypt)
      if (data.userPassword !== password) {
        // Access data directly
        alert("Invalid password.");
        return;
      }

      // Successful login
      console.log("User logged in:", data);

      var userData = {
        userId: data.userId,
        userName: data.userName,
        userRole: data.userRole,
      };
      // Store user session in cookies
      Cookies.set("userData", JSON.stringify(userData), { expires: 7 }); // Store session for 7 days

      // Set isLoggedIn to true
      setIsLoggedIn(true);

      // Redirect to the dashboard page
      alert("Login successful!");
      navigate("/dashboard"); // Replace "/dashboard" with your dashboard route
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Welcome To</h1>
        <h2>FaciliTrack</h2>
        <input
          type="email"
          placeholder="Email"
          className="input-field"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="input-field"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="login-button" onClick={handleLogin}>
          Login
        </button>
        <p className="contact-text">No Account? Contact Your Administrator</p>
      </div>
    </div>
  );
};

export default UserLogin;
