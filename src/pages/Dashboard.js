import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for redirection
import Cookies from "js-cookie"; // Import js-cookie for managing cookies
import "./index.css"; // Import CSS file
import PageHeader from "./pageHeader";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  RadialBarChart,
  RadialBar,
  Tooltip,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import "./dashboard.css"; // Import the CSS file

const maintenanceData = [
  { month: "J", cost1: 10, cost2: 20 },
  { month: "F", cost1: 20, cost2: 25 },
  { month: "M", cost1: 30, cost2: 40 },
  { month: "A", cost1: 50, cost2: 45 },
  { month: "M", cost1: 40, cost2: 55 },
  { month: "J", cost1: 60, cost2: 70 },
];

const ticketsResolvedData = [
  { week: "W1", tickets: 30 },
  { week: "W2", tickets: 40 },
  { week: "W3", tickets: 35 },
  { week: "W4", tickets: 50 },
];

const carbonFootprintData = [
  { month: "J", footprint: 300 },
  { month: "F", footprint: 200 },
  { month: "M", footprint: 150 },
  { month: "A", footprint: 176 },
  { month: "M", footprint: 250 },
  { month: "J", footprint: 400 },
];

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
      <div className="dashboard-container">
        <div className="dashboard-grid">
          {/* Maintenance Cost */}
          <div className="dashboard-card wide">
            <h3>Overall Facility Maintenance Cost</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={maintenanceData}>
                <XAxis dataKey="month" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip />
                <Line type="monotone" dataKey="cost1" stroke="#2D89EF" />
                <Line type="monotone" dataKey="cost2" stroke="#666" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Green Technology % */}
          <div className="dashboard-card">
            <h3>Green Technology %</h3>
            <ResponsiveContainer width="100%" height={150}>
              <RadialBarChart
                innerRadius="70%"
                outerRadius="100%"
                data={[{ name: "Usage", value: 58, fill: "#2D89EF" }]}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar minAngle={15} background dataKey="value" />
                <Tooltip />
              </RadialBarChart>
            </ResponsiveContainer>
            <p className="percentage-text">58%</p>
          </div>

          {/* Number of Tickets Resolved */}
          <div className="dashboard-card">
            <h3>Number of Tickets Resolved</h3>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={ticketsResolvedData}>
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="tickets" fill="#2D89EF" />
              </BarChart>
            </ResponsiveContainer>
            <p className="positive-trend">(+23) than last week</p>
          </div>

          {/* Carbon Footprint */}
          <div className="dashboard-card wide">
            <h3>Carbon Footprint</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={carbonFootprintData}>
                <XAxis dataKey="month" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip />
                <Line type="monotone" dataKey="footprint" stroke="#2D89EF" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
