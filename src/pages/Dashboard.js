import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for redirection
import Cookies from "js-cookie"; // Import js-cookie for managing cookies
import "./index.css"; // Import CSS file
import PageHeader from "./pageHeader";

const Dashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if the user session exists in cookies
    const user = Cookies.get("userData");
    if (!user) {
      // Redirect to login page if no session exists
      alert("You are not logged in. Redirecting to login page.");
      navigate("/"); // Replace "/" with your login route if different
    }
  }, [navigate]);

  return (
    <div className="dashboard-page">
      <div className="content">
        <PageHeader title="Dashboard" />
      </div>
    </div>
  );
};

export default Dashboard;
