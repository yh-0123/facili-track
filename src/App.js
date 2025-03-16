import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import FacilityAssets from './pages/FacilityAssets';
import Tickets from './pages/Tickets';
import CreateAccount from './pages/CreateAccount';

function App() {
  return (
    <Router>
      <div className="app-container">
        <nav className="sidebar">
          <h2>FaciliTrack</h2>
          <ul>
            <li><Link to="/">Dashboard</Link></li>
            <li><Link to="/assets">Facility Assets</Link></li>
            <li><Link to="/tickets">Tickets</Link></li>
            <li><Link to="/create-account">Create New Account</Link></li>
          </ul>
        </nav>

        <div className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
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
