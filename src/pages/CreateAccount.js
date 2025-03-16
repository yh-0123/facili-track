import React, { useState } from 'react';
import '../index.css';

const CreateAccount = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add your form submission logic here
    console.log({ email, password, confirmPassword });
  };

  return (
    <div className="create-account-page">
      <h2>Create New User Account</h2>
      <div className="tabs">
        <span className="active-tab">New Resident</span>
        <span>New Facility Worker</span>
        <span>New Admin</span>
      </div>
      <form onSubmit={handleSubmit} className="account-form">
        <label>Email</label>
        <textarea
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email"
        />
        <label>Password</label>
        <textarea
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
        />
        <label>Confirm Password</label>
        <textarea
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm password"
        />
        <button type="submit" className="create-account-btn">
          Create New Resident Account
        </button>
      </form>
    </div>
  );
};

export default CreateAccount;
