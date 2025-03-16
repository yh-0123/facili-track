import React from 'react';
import '../index.css';

const FacilityAssets = () => {
  const assets = [
    { id: 'A001', name: 'Philips LED', category: 'Lights', installationDate: '11 Jun 2022', lastMaintenance: '11 Jun 2023' },
    { id: 'A002', name: 'Philips LED', category: 'Lights', installationDate: '11 Jun 2022', lastMaintenance: '11 Jun 2023' },
    { id: 'A003', name: 'Philips LED', category: 'Lights', installationDate: '11 Jun 2022', lastMaintenance: '11 Jun 2023' },
    { id: 'A004', name: 'Philips LED', category: 'Lights', installationDate: '11 Jun 2022', lastMaintenance: '11 Jun 2023' },
    { id: 'A005', name: 'Philips LED', category: 'Lights', installationDate: '11 Jun 2022', lastMaintenance: '11 Jun 2023' },
    { id: 'A006', name: 'Philips LED', category: 'Lights', installationDate: '11 Jun 2022', lastMaintenance: '11 Jun 2023' }
  ];

  return (
    <div className="facility-assets-page">
      <header className="header">
        <h2>Facility Assets List</h2>
        <div className="user-section">
          <p>Welcome! Alex Ong</p>
          <div className="notification-icon">🔔</div>
          <div className="user-avatar">Alex Ong ▾</div>
        </div>
      </header>
      <div className="content">
        <div className="tabs">
          <span className="active-tab">Current Asset</span>
          <span>Disposed Asset</span>
        </div>
        <input className="search-bar" type="text" placeholder="🔍 Search for Facility Asset" />
        <button className="add-asset-btn">Add New Asset</button>
        <div className="asset-grid">
          {assets.map(asset => (
            <div className="asset-card" key={asset.id}>
              <h3>{asset.id}</h3>
              <p>Name: {asset.name}</p>
              <p>Category: {asset.category}</p>
              <p>Installation Date: {asset.installationDate}</p>
              <p>Last Maintenance Date: {asset.lastMaintenance}</p>
              <a href="#" className="view-details">View Details</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FacilityAssets;
