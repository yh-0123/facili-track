// src/App.js
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  Link
} from "react-router-dom";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { loginUser } from "./redux/actions/authActions";
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
import CreateTicket from "./pages/tickets/createTicket";
import userRolesEnum from "./pages/userManagement/userRolesEnum";
import Cookies from "js-cookie";
import { LoadScript } from "@react-google-maps/api";

import "./pages/index.css";

function App() {
  const dispatch = useDispatch();
  const { isLoggedIn, userRole } = useSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false); // side bar state

  useEffect(() => {
    // Load user data from cookies if available
    const userData = Cookies.get("userData");
    
    if (userData) {
      try {
        const userInfo = JSON.parse(userData);
        dispatch(loginUser(userInfo));
      } catch (parseError) {
        console.error("Error parsing userData:", parseError);
      }
    }
  }, [dispatch]);

  return (
    <LoadScript googleMapsApiKey="api-key">
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
                <ProfileDropdown />
              </div>
            </>
          )}

          <div className="content">
            <Routes>
              <Route
                path="/"
                element={
                  isLoggedIn ? <Navigate to="/Tickets" /> : <UserLogin />
                }
              />
              <Route
                path="/tickets"
                element={isLoggedIn ? <Tickets /> : <Navigate to="/" />}
              />
              <Route path="/tickets/:id" element={<TicketDetails />} />
              {userRole === userRolesEnum.ADMIN && (
              <Route
                path="/dashboard"
                element={isLoggedIn ? <Dashboard /> : <Navigate to="/" />}
              />)}
              <Route
                path="/assets"
                element={isLoggedIn ? <FacilityAssets /> : <Navigate to="/" />}
              />
              <Route path="/asset-details/:id" element={<AssetDetails />} />
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
              <Route
                path="/login"
                element={<UserLogin />}
              />
              <Route path="/create-ticket" element={<CreateTicket />} />
            </Routes>
          </div>
        </div>
      </Router>
    </LoadScript>
  );
}

export default App;