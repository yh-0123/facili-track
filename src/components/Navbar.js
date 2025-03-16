import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="navbar">
      <h2>FaciliTrack</h2>
      <ul>
        <li><Link to="/">Dashboard</Link></li>
        <li><Link to="/facility-assets">Facility Assets</Link></li>
        <li><Link to="/tickets">Tickets</Link></li>
        <li><Link to="/create-account">Create Account</Link></li>
      </ul>
    </nav>
  );
};

export default Navbar;
