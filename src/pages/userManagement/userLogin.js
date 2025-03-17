import React from "react";
import './userLogin.css'; // Import CSS file

const UserLogin = () => {
  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Welcome To</h1>
        <h2>FaciliTrack</h2>
        <input type="email" placeholder="Email" className="input-field" />
        <input type="password" placeholder="Password" className="input-field" />
        <button className="login-button">Login</button>
        <p className="contact-text">No Account? Contact Your Administrator</p>
      </div>
    </div>
  );
};

export default UserLogin;
