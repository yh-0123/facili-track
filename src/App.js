import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  Navigate,
} from "react-router-dom";
import { useState, useEffect } from "react";
import Dashboard from "./pages/dashboard";
import FacilityAssets from "./pages/facilityAssets/facilityAssets";
import Tickets from "./pages/tickets/tickets";
import CreateAccount from "./pages/userManagement/createAccount";
import UserLogin from "./pages/userManagement/userLogin";
import ViewProfile from "./pages/userManagement/viewProfile";
import ProfileDropdown from "./pages/userManagement/profileDropdown";
import AddAsset from "./pages/facilityAssets/addAsset";
import AssetDetails from "./pages/facilityAssets/assetDetails";
import TicketDetails from "./pages/tickets/ticketDetails";
import ResidentHome from "./pages/residentHome";
import CreateTicket from "./pages/tickets/createTicket";
import userRolesEnum from "./pages/userManagement/userRolesEnum";
import Cookies from "js-cookie";

import "./pages/index.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Track login status
  const [sidebarOpen, setSidebarOpen] = useState(false); // side bar state
  const [userRole, setUserRole] = useState(null); // Track user role
  // Add a state to track when login/logout occurs
  const [authChangeCounter, setAuthChangeCounter] = useState(0);

  // Function to update login state and trigger effect
  const updateLoginState = (loggedIn) => {
    setIsLoggedIn(loggedIn);
    // Increment counter to trigger useEffect
    setAuthChangeCounter(prev => prev + 1);
  };

  useEffect(() => {
    const userData = Cookies.get("userData");

    if (userData) {
      let userInfo;
      try {
        userInfo = JSON.parse(userData);
        setIsLoggedIn(true);
        setUserRole(userInfo.userRole); // Set user role from cookie
      } catch (parseError) {
        console.error("Error parsing userData:", parseError);
        setIsLoggedIn(false);
        setUserRole(null);
      }
    } else {
      setIsLoggedIn(false);
      setUserRole(null);
    }
  }, [authChangeCounter]); // Now depends on authChangeCounter which will update on login/logout

  return (
    <Router>
      <div className="app-container">
        {isLoggedIn && (
          <>
            {/* Sidebar Navigation */}
            <nav className={`sidebar ${sidebarOpen ? "open" : ""}`}>
              <h2 style={{ color: "white" }}>FaciliTrack</h2>
              <ul>
                {userRole === userRolesEnum.ADMIN && (
                  <>
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
                  </>
                )}
                {userRole === userRolesEnum.FACILITY_WORKER && (
                  <>
                    <li>
                      <Link to="/assets">Facility Assets</Link>
                    </li>
                    <li>
                      <Link to="/tickets">Tickets</Link>
                    </li>
                  </>
                )}

                {userRole === userRolesEnum.RESIDENT && (
                  <>
                    <li>
                      <Link to="/create-ticket">Create New Ticket</Link>
                    </li>
                    <li>
                      <Link to="/tickets">Ticket History</Link>
                    </li>
                    
                  </>
                )}  
              </ul>
            </nav>

            {/* Overlay */}
            {sidebarOpen && (
              <div
                className="sidebar-overlay"
                onClick={() => setSidebarOpen(false)}
              ></div>
            )}

            {/* Topbar with Hamburger */}
            <div className="topbar">
              <div
                className="hamburger"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                ☰
              </div>
              <ProfileDropdown updateLoginState={updateLoginState} />
            </div>
          </>
        )}

        <div className="content">
          <Routes>
            <Route
              path="/"
              element={
                isLoggedIn ? (
                  <Navigate to="/Tickets" />
                ) : (
                  <UserLogin setIsLoggedIn={updateLoginState} />
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
            <Route
              path="/view-profile"
              element={isLoggedIn ? <ViewProfile /> : <Navigate to="/" />}
            />
            <Route
              path="/add-asset"
              element={isLoggedIn ? <AddAsset /> : <Navigate to="/" />}
            />
            <Route path="/asset-details/:id" element={<AssetDetails />} />
            <Route path="/ticket/:id" element={<TicketDetails />} />
            <Route path="/resident-home" element={<ResidentHome />} />
            <Route
              path="/login"
              element={<UserLogin setIsLoggedIn={updateLoginState} />}
            />
            <Route path="/create-ticket" element={<CreateTicket />} />
            
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;