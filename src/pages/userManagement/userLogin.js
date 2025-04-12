import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for redirection
import supabase from "../../backend/DBClient/SupaBaseClient"; // Import Supabase client
import Cookies from "js-cookie"; // Import js-cookie for managing cookies
import bcrypt from "bcryptjs"; // Import bcryptjs for password verification
import "./userLogin.css"; // Import CSS file

const UserLogin = ({ setIsLoggedIn }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate(); // Initialize useNavigate for redirection

  useEffect(() => {
    // Hide top bar and sidebar on login page
    document.body.classList.add("hide-layout");

    return () => {
      // Restore layout when leaving login page
      document.body.classList.remove("hide-layout");
    };
  }, []);

 

  // Function to verify the password hash
  const verifyPassword = async (plainPassword, hashedPassword) => {
    // Returns true if passwords match, false otherwise
    return await bcrypt.compare(plainPassword, hashedPassword);
  };

  const handleLogin = async (e) => {
    e.preventDefault(); // Prevent default form submission
    
    // Clear previous error messages
    setErrorMessage("");
    
    // Basic validation
    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsLoading(true);

    try {
      // Query the custom table for the user
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("userEmail", email)
        .single(); // Ensure the data is not returned as an array

      if (error) {
        setErrorMessage(`Login failed: ${error.message}`);
        return;
      }

      if (!data) {
        setErrorMessage("User not found.");
        return;
      }

      // Verify the hashed password
      const isPasswordValid = await verifyPassword(password, data.userPassword);
      
      if (!isPasswordValid) {
        setErrorMessage("Invalid password.");
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

      // Redirect to the tickets page
      navigate("/tickets"); // Redirect to tickets page
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Welcome To</h1>
        <h2>FaciliTrack</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          {errorMessage && <p className="error-message">{errorMessage}</p>}
          
          <button 
            type="submit" 
            className="login-button" 
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="contact-text">No Account? Contact Your Administrator</p>
      </div>
    </div>
  );
};

export default UserLogin;