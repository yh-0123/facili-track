import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import "./facilityAssets.css";
import "../index.css";
import PageHeader from "../pageHeader";
import supabase from "../../backend/DBClient/SupaBaseClient"; // Import your Supabase client

const FacilityAssets = () => {
  const [activeTab, setActiveTab] = useState("current");
  const [currentAssets, setCurrentAssets] = useState([]);
  const [disposedAssets, setDisposedAssets] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const [currentAssetStatusFilter, setCurrentAssetStatusFilter] = useState("All");

  // Fetch assets from the Supabase database
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        // Fetch current assets
        const { data: currentData, error: currentError } = await supabase
          .from("facility_asset")
          .select("*")
          .in("assetStatus", ["New", "Installed"]); // Filter for current assets

        if (currentError) {
          console.error("Error fetching current assets:", currentError.message);
        } else {
          setCurrentAssets(currentData || []);
        }

        // Fetch disposed assets
        const { data: disposedData, error: disposedError } = await supabase
          .from("facility_asset")
          .select("*")
          .eq("assetStatus", "Disposed"); // Filter for disposed assets

        if (disposedError) {
          console.error(
            "Error fetching disposed assets:",
            disposedError.message
          );
        } else {
          setDisposedAssets(disposedData || []);
        }
      } catch (error) {
        console.error("Unexpected error fetching assets:", error);
      }
    };

    fetchAssets();
  }, []);

  // Filter assets based on the search query
  const filteredCurrentAssets = currentAssets
  .filter((asset) =>
    asset.assetName.toLowerCase().includes(searchQuery.toLowerCase())
  )
  .filter((asset) =>
    currentAssetStatusFilter === "All"
      ? true
      : asset.assetStatus === currentAssetStatusFilter
  );

  const filteredDisposedAssets = disposedAssets.filter((asset) =>
    asset.assetName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  //TODO: change to search based on assetId

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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button
          className="add-asset-btn"
          onClick={() => navigate("/add-asset")}
        >
          Add New Asset
        </button>
      </div>

      {activeTab === "current" && (
        <div className="status-filter">
          <button
            className={currentAssetStatusFilter === "All" ? "active-filter" : ""}
            onClick={() => setCurrentAssetStatusFilter("All")}
          >
            All
          </button>
          <button
            className={currentAssetStatusFilter === "New" ? "active-filter" : ""}
            onClick={() => setCurrentAssetStatusFilter("New")}
          >
            New
          </button>
          <button
            className={currentAssetStatusFilter === "Installed" ? "active-filter" : ""}
            onClick={() => setCurrentAssetStatusFilter("Installed")}
          >
            Installed
          </button>
        </div>
      )}

      <div className="asset-grid">
      {activeTab === "current" &&
        filteredCurrentAssets.map((asset) => (
          <div className="asset-card" key={asset.id}>
            <h3>{asset.id}</h3>
            <p>Asset ID: {asset.assetId}</p>
            <p>Name: {asset.assetName}</p>
            <p>Category: {asset.assetType}</p>
            <p>Status: {asset.assetStatus}</p>
            <p>Last Maintenance Date: {asset.lastMaintenance || "N/A"}</p>

            <Link
                  to={`/asset-details/${asset.assetId}`}
                  state={{ asset }} // Pass the ticket details as state
                  className="view-details"
                >
                  View Details
                </Link>
          </div>
        ))}

      {activeTab === "disposed" &&
        filteredDisposedAssets.map((asset) => (
          <div className="asset-card" key={asset.id}>
            <p>Asset ID: {asset.assetId}</p>
            <p>Name: {asset.assetName}</p>
            <p>Category: {asset.assetType}</p>
            <p>Disposal Date: {asset.assetDisposalDate || "N/A"}</p>
            <Link
                  to={`/asset-details/${asset.assetId}`}
                  state={{ asset }} // Pass the ticket details as state
                  className="view-details"
                >
                  View Details
                </Link>
          </div>
          ))}
      </div>
    </div>
  );
};

export default FacilityAssets;
