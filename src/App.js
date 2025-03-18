import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  Navigate,
} from "react-router-dom";
import { useState, useEffect } from "react";
import Dashboard from "./pages/Dashboard";
import FacilityAssets from "./pages/facilityAssets";
import Tickets from "./pages/tickets";
import CreateAccount from "./pages/createAccount";
import UserLogin from "./pages/userManagement/userLogin";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Track login status

  useEffect(() => {
    const userCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("user="));
    if (userCookie) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, []); // Add an empty dependency array to run only once

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
            <Route
              path="/"
              element={
                isLoggedIn ? (
                  <Navigate to="/dashboard" />
                ) : (
                  <UserLogin setIsLoggedIn={setIsLoggedIn} />
                )
              }
            />
            <Route
              path="/dashboard"
              element={isLoggedIn ? <Dashboard /> : <Navigate to="/" />}
            />
            <Route
              path="/assets"
              element={isLoggedIn ? <FacilityAssets /> : <Navigate to="/" />}
            />
            <Route
              path="/tickets"
              element={isLoggedIn ? <Tickets /> : <Navigate to="/" />}
            />
            <Route
              path="/create-account"
              element={isLoggedIn ? <CreateAccount /> : <Navigate to="/" />}
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
