import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import { useState } from "react";
import Dashboard from "./pages/dashboard";
import FacilityAssets from "./pages/facilityAssets";
import Tickets from "./pages/tickets";
import CreateAccount from "./pages/createAccount";
import UserLogin from "./pages/userManagement/userLogin";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Track login status
  return (
    <Router>
      <div className="app-container">
        {isLoggedIn && (
          <nav className="sidebar">
            <h2 style={{ color: "white" }}>FaciliTrack</h2>
            <ul>
              <li>
                <Link to="/dashboard">Dashboard</Link>
              </li>
              <li>
                <Link to="/assets">Facility Assets</Link>
              </li>
              <li>
                <Link to="/tickets">Tickets</Link>
              </li>
              <li>
                <Link to="/create-account">Create New Account</Link>
              </li>
            </ul>
          </nav>
        )}

        <div className="content">
          <Routes>
            <Route path="/" element={<UserLogin />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/assets" element={<FacilityAssets />} />
            <Route path="/tickets" element={<Tickets />} />
            <Route path="/create-account" element={<CreateAccount />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
