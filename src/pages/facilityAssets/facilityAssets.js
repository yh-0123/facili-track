import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaSearch, FaChevronDown } from "react-icons/fa";
import "./facilityAssets.css";
import "../index.css";
import PageHeader from "../pageHeader";
import supabase from "../../backend/DBClient/SupaBaseClient";
import Cookies from "js-cookie";
import userRolesEnum from "../userManagement/userRolesEnum";

const FacilityAssets = () => {
  const [assets, setAssets] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [categories, setCategories] = useState([]);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // Fetch user role from cookies
  useEffect(() => {
    const userData = Cookies.get("userData");
    if (userData) {
      try {
        const userInfo = JSON.parse(userData);
        setUserRole(userInfo.userRole);
      } catch (parseError) {
        console.error("Error parsing userData:", parseError);
        setUserRole(null);
      }
    }
  }, []);

  // Check if user can add new assets (only ADMIN can)
  const canAddNewAsset = userRole === userRolesEnum.ADMIN;

  // Fetch all assets from the Supabase database
  useEffect(() => {
    const fetchAssets = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch all assets regardless of status
        const { data, error } = await supabase
          .from("facility_asset")
          .select("*");

        if (error) {
          console.error("Error fetching assets:", error.message);
          setError("Failed to load assets");
        } else {
          setAssets(data || []);
          
          // Extract unique categories from all assets
          const uniqueCategories = [...new Set(data.map(asset => asset.assetType))];
          setCategories(uniqueCategories);
        }
      } catch (error) {
        console.error("Unexpected error fetching assets:", error);
        setError("An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssets();
    
    // Close dropdowns when clicking outside
    const handleClickOutside = (event) => {
      const statusDropdown = document.getElementById("status-dropdown");
      const categoryDropdown = document.getElementById("category-dropdown");
      
      if (statusDropdown && !statusDropdown.contains(event.target)) {
        setStatusDropdownOpen(false);
      }
      
      if (categoryDropdown && !categoryDropdown.contains(event.target)) {
        setCategoryDropdownOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter assets based on search query, status, and category
  const filteredAssets = assets
    .filter((asset) =>
      asset.assetId.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.assetName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((asset) =>
      statusFilter === "All"
        ? true
        : asset.assetStatus === statusFilter
    )
    .filter((asset) =>
      categoryFilter === "All"
        ? true
        : asset.assetType === categoryFilter
    );

  // Format date for consistent display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("All");
    setCategoryFilter("All");
    setStatusDropdownOpen(false);
    setCategoryDropdownOpen(false);
  };

  // Toggle dropdown visibility
  const toggleStatusDropdown = () => {
    setStatusDropdownOpen(!statusDropdownOpen);
    setCategoryDropdownOpen(false);
  };

  const toggleCategoryDropdown = () => {
    setCategoryDropdownOpen(!categoryDropdownOpen);
    setStatusDropdownOpen(false);
  };

  // Handle filter selection
  const handleStatusSelect = (status) => {
    setStatusFilter(status);
    setStatusDropdownOpen(false);
  };

  const handleCategorySelect = (category) => {
    setCategoryFilter(category);
    setCategoryDropdownOpen(false);
  };

  return (
    <div className="facility-assets-page">
      <PageHeader title="Facility Assets List" />

      <div className="search-container">
        <div className="search-bar-container">
          <FaSearch />
          <input
            className="search-bar"
            type="text"
            placeholder="Search by Asset ID or Name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Only show Add New Asset button for admins */}
        {canAddNewAsset && (
          <button
            className="add-asset-btn"
            onClick={() => navigate("/add-asset")}
          >
            Add New Asset
          </button>
        )}
      </div>

      <div className="filters-row">
        {/* Category Filter Dropdown */}
        <div className="filter-dropdown" id="category-dropdown">
          <button 
            className="dropdown-toggle" 
            onClick={toggleCategoryDropdown}
          >
            Category: {categoryFilter}
            <FaChevronDown className={`dropdown-icon ${categoryDropdownOpen ? 'rotated' : ''}`} />
          </button>
          {categoryDropdownOpen && (
            <div className="dropdown-menu">
              <div 
                className={`dropdown-item ${categoryFilter === "All" ? "active" : ""}`}
                onClick={() => handleCategorySelect("All")}
              >
                All Categories
              </div>
              {categories.map((category) => (
                <div
                  key={category}
                  className={`dropdown-item ${categoryFilter === category ? "active" : ""}`}
                  onClick={() => handleCategorySelect(category)}
                >
                  {category}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Status Filter Dropdown */}
        <div className="filter-dropdown" id="status-dropdown">
          <button 
            className="dropdown-toggle" 
            onClick={toggleStatusDropdown}
          >
            Status: {statusFilter}
            <FaChevronDown className={`dropdown-icon ${statusDropdownOpen ? 'rotated' : ''}`} />
          </button>
          {statusDropdownOpen && (
            <div className="dropdown-menu">
              <div 
                className={`dropdown-item ${statusFilter === "All" ? "active" : ""}`}
                onClick={() => handleStatusSelect("All")}
              >
                All Status
              </div>
              <div 
                className={`dropdown-item ${statusFilter === "New" ? "active" : ""}`}
                onClick={() => handleStatusSelect("New")}
              >
                New
              </div>
              <div 
                className={`dropdown-item ${statusFilter === "Installed" ? "active" : ""}`}
                onClick={() => handleStatusSelect("Installed")}
              >
                Installed
              </div>
              <div 
                className={`dropdown-item ${statusFilter === "Disposed" ? "active" : ""}`}
                onClick={() => handleStatusSelect("Disposed")}
              >
                Disposed
              </div>
            </div>
          )}
        </div>
        
        {/* Reset Filters Button */}
        <button className="reset-filters-btn" onClick={resetFilters}>
          Reset Filters
        </button>
      </div>

      {isLoading && <div className="loading-message">Loading assets...</div>}
      {error && <div className="error-message">{error}</div>}
      
      <div className="asset-grid">
        {!isLoading && filteredAssets.length === 0 && (
          <div className="no-results">No assets found matching your search criteria</div>
        )}
        
        {filteredAssets.map((asset) => (
          <div 
            className="asset-card" 
            key={asset.id}
            data-status={asset.assetStatus}
          >
            <h3>{asset.assetName}</h3>
            <p>Asset ID: {asset.assetId}</p>
            <p>Category: {asset.assetType}</p>
            <p>Status: {asset.assetStatus}</p>
            
            {/* Show different date fields based on status */}
            {asset.assetStatus === "Disposed" ? (
              <p>Disposal Date: {formatDate(asset.assetDisposalDate)}</p>
            ) : (
              <p>Last Maintenance: {formatDate(asset.lastMaintenance)}</p>
            )}
            
            <Link
              to={`/asset-details/${asset.assetId}`}
              state={{ asset }}
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