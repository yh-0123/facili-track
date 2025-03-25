import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaCircle } from 'react-icons/fa';
import "./facilityAssets.css";
import "../index.css";
import PageHeader from "../pageHeader";

const FacilityAssets = () => {
  const [activeTab, setActiveTab] = useState("current");
  const [selectedAsset, setSelectedAsset] = useState(null);
  const navigate = useNavigate();

  const currentAssets = [
    {
      id: "A001",
      name: "Philips LED",
      category: "Lights",
      installationDate: "11 Jun 2022",
      lastMaintenance: "11 Jun 2023",
    },
    {
      id: "A002",
      name: "Philips LED",
      category: "Lights",
      installationDate: "11 Jun 2022",
      lastMaintenance: "11 Jun 2023",
    },
    {
      id: "A003",
      name: "Philips LED",
      category: "Lights",
      installationDate: "11 Jun 2022",
      lastMaintenance: "11 Jun 2023",
    },
  ];

  const disposedAssets = [
    {
      id: "D001",
      name: "Old Fan",
      category: "HVAC",
      disposalDate: "01 Jan 2023",
    },
    {
      id: "D002",
      name: "Broken AC",
      category: "HVAC",
      disposalDate: "15 Mar 2023",
    },
  ];

  return (
    <div className="facility-assets-page">
      <PageHeader title="Facility Assets List" />

      <div className="tabs">
        <span
          className={activeTab === "current" ? "active-tab" : ""}
          onClick={() => setActiveTab("current")}
        >
          Current Asset
        </span>
        <span
          className={activeTab === "disposed" ? "active-tab" : ""}
          onClick={() => setActiveTab("disposed")}
        >
          Disposed Asset
        </span>
      </div>

      <div className="search-container">
        <div className="search-bar-container">
          <FaSearch />
          <input
            className="search-bar"
            type="text"
            placeholder="Search for Facility Asset"
          />
          <button className="search">Search</button>
        </div>
        <button
          className="add-asset-btn"
          onClick={() => navigate("/add-asset")}
        >
          Add New Asset
        </button>
      </div>

      <div className="asset-grid">
        {activeTab === "current" &&
          currentAssets.map((asset) => (
            <div className="asset-card" key={asset.id}>
              <h3>{asset.id}</h3>
              <p>Name: {asset.name}</p>
              <p>Category: {asset.category}</p>
              <p>Installation Date: {asset.installationDate}</p>
              <p>Last Maintenance Date: {asset.lastMaintenance}</p>
              <button className="view-details" onClick={() =>navigate(`/asset-details/${asset.id}`)}>
                View Details
              </button>
            </div>
          ))}

        {activeTab === "disposed" &&
          disposedAssets.map((asset) => (
            <div className="asset-card" key={asset.id}>
              <h3>{asset.id}</h3>
              <p>Name: {asset.name}</p>
              <p>Category: {asset.category}</p>
              <p>Disposal Date: {asset.disposalDate}</p>
              <button className="view-details" onClick={() => navigate(`/asset-details/${asset.id}`)}>
                View Details
              </button>
            </div>
          ))}
      </div>
    </div>
  );
};

export default FacilityAssets;
