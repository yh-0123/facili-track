import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for redirection
import Cookies from "js-cookie"; // Import js-cookie for managing cookies

const Dashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if the user session exists in cookies
    const user = Cookies.get("user");
    if (!user) {
      // Redirect to login page if no session exists
      alert("You are not logged in. Redirecting to login page.");
      navigate("/"); // Replace "/" with your login route if different
    }
  }, [navigate]);

  return <h1>Dashboard Page</h1>;
};

export default Dashboard;
