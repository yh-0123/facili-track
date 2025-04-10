import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import supabase from "../../backend/DBClient/SupaBaseClient";
import "./assetDetails.css";
import QRCodeModal from "./qrCodeModal";
import PageHeader from "../pageHeader";
import Cookies from "js-cookie";
import userRolesEnum from "../userManagement/userRolesEnum";

const AssetDetails = () => {
  const { id } = useParams();
  const [asset, setAsset] = useState(null);
  const [categoryData, setCategoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedAsset, setEditedAsset] = useState({});
  const [editedCategoryData, setEditedCategoryData] = useState({});
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);

  // Add state for user authentication and role
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Check user authentication status from cookies
    const userData = Cookies.get("userData");
    if (userData) {
      try {
        const userInfo = JSON.parse(userData);
        setIsLoggedIn(true);
        setUserRole(userInfo.userRole);
      } catch (parseError) {
        console.error("Error parsing userData:", parseError);
        setIsLoggedIn(false);
        setUserRole(null);
      }
    } else {
      setIsLoggedIn(false);
      setUserRole(null);
    }

    const fetchAssetDetails = async () => {
      try {
        // Fetch basic asset information
        const { data: assetData, error: assetError } = await supabase
          .from("facility_asset")
          .select("*")
          .eq("assetId", id)
          .single();

        if (assetError) {
          console.error("Error fetching asset details:", assetError.message);
          setLoading(false);
          return;
        }

        setAsset(assetData);
        setEditedAsset(assetData);

        // Now fetch category-specific data based on the asset type
        const assetType = assetData.assetType;
        let tableName = "";

        switch (assetType) {
          case "Lights":
            tableName = "lights";
            break;
          case "CCTV":
            tableName = "cctv";
            break;
          case "Elevators":
            tableName = "elevators";
            break;
          case "Gym Equipment":
            tableName = "gym_equipment";
            break;
          case "Miscellaneous":
            tableName = "miscellaneous";
            break;
          default:
            break;
        }

        if (tableName) {
          const { data: specificData, error: specificError } = await supabase
            .from(tableName)
            .select("*")
            .eq("assetId", id)
            .single();

          if (specificError) {
            console.error(
              `Error fetching ${assetType} details:`,
              specificError.message
            );
          } else {
            setCategoryData(specificData);
            setEditedCategoryData(specificData);
          }
        }

        // If it's a green tech, fetch that data too
        if (assetData.isGreenTech) {
          const { data: greenTechData, error: greenTechError } = await supabase
            .from("green_technology")
            .select("*")
            .eq("assetId", id)
            .single();

          if (greenTechError) {
            console.error(
              "Error fetching green tech details:",
              greenTechError.message
            );
          } else if (greenTechData) {
            // Add green tech data to the asset object
            setAsset((prev) => ({
              ...prev,
              energyRating: greenTechData.energyRating,
              ecoLabel: greenTechData.ecoLabel,
              carbonFootprintCertification:
                greenTechData.carbonFootprintCertification,
            }));

            setEditedAsset((prev) => ({
              ...prev,
              energyRating: greenTechData.energyRating,
              ecoLabel: greenTechData.ecoLabel,
              carbonFootprintCertification:
                greenTechData.carbonFootprintCertification,
            }));
          }
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssetDetails();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedAsset({ ...editedAsset, [name]: value });
  };

  const handleCategoryInputChange = (e) => {
    const { name, value } = e.target;
    setEditedCategoryData({ ...editedCategoryData, [name]: value });
  };

  const handleSave = async () => {
    try {
      // Update basic asset data
      const { error: assetError } = await supabase
        .from("facility_asset")
        .update(editedAsset)
        .eq("assetId", id);

      if (assetError) {
        console.error("Error updating asset:", assetError.message);
        return;
      }

      // Update category-specific data if it exists
      if (categoryData) {
        const assetType = asset.assetType;
        let tableName = "";

        switch (assetType) {
          case "Lights":
            tableName = "lights";
            break;
          case "CCTV":
            tableName = "cctv";
            break;
          case "Elevators":
            tableName = "elevators";
            break;
          case "Gym Equipment":
            tableName = "gym_equipment";
            break;
          case "Miscellaneous":
            tableName = "miscellaneous";
            break;
          default:
            break;
        }

        if (tableName) {
          const { error: categoryError } = await supabase
            .from(tableName)
            .update(editedCategoryData)
            .eq("assetId", id);

          if (categoryError) {
            console.error(
              `Error updating ${assetType} details:`,
              categoryError.message
            );
            return;
          }
        }
      }

      // Update green technology data if applicable
      if (editedAsset.isGreenTech) {
        const greenTechData = {
          energyRating: editedAsset.energyRating,
          ecoLabel: editedAsset.ecoLabel,
          carbonFootprintCertification:
            editedAsset.carbonFootprintCertification,
        };

        const { error: greenTechError } = await supabase
          .from("green_technology")
          .update(greenTechData)
          .eq("assetId", id);

        if (greenTechError) {
          console.error(
            "Error updating green tech details:",
            greenTechError.message
          );
          return;
        }
      }

      // Update state after successful save
      setAsset(editedAsset);
      setCategoryData(editedCategoryData);
      setIsEditing(false);

      alert("Asset updated successfully!");
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("Failed to update asset. Please try again.");
    }
  };

  const handleCancelEdit = () => {
    setEditedAsset(asset);
    setEditedCategoryData(categoryData);
    setIsEditing(false);
  };

  const handleGenerateQRCode = () => {
    setShowQRCodeModal(true);
  };

  // Function to check if action buttons should be shown
  const shouldShowActionButtons = () => {
    return isLoggedIn && userRole !== userRolesEnum.RESIDENT;
  };

  if (loading) return <p>Loading asset details...</p>;
  if (!asset) return <p>Asset not found.</p>;

  return (
    <div className="asset-details-page">
      <div className="content">
        <PageHeader title="Asset Details" />

        <div className="asset-details">
          {/* Basic Asset Information */}
          <h3>Basic Information</h3>
          <div className="details-grid">
            <p>
              <strong>ID:</strong> {asset.assetId}
            </p>
            <p>
              <strong>Name:</strong>{" "}
              {isEditing ? (
                <input
                  type="text"
                  name="assetName"
                  value={editedAsset.assetName}
                  onChange={handleInputChange}
                />
              ) : (
                asset.assetName
              )}{" "}
            </p>
            <p>
              <strong>Category:</strong>{" "}
              {isEditing ? (
                <select name="assetType"
                  value={editedAsset.assetType}
                  onChange={handleInputChange}
                >
                  <option value="Lights">Lights</option>
                  <option value="Elevators">Elevators</option>
                  <option value="CCTV">CCTV</option>
                  <option value="Gym Equipment">Gym Equipment</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
              ) : (
                asset.assetType
              )}
            </p>
            <p>
              <strong>Purchase Date:</strong>{" "}
              {isEditing ? (
                <input
                  type="date"
                  name="assetPurchaseDate"
                  value={editedAsset.assetPurchaseDate}
                  onChange={handleInputChange}
                />
              ) : (
                asset.assetPurchaseDate
              )}
            </p>
            <p>
              <strong>Purchase Price (RM):</strong>{" "}
              {isEditing ? (
                <input
                  type="number"
                  name="assetPurchasePrice"
                  value={editedAsset.assetPurchasePrice}
                  onChange={handleInputChange}
                />
              ) : (
                asset.assetPurchasePrice
              )}
            </p>
            <p>
              <strong>Life Span (years):</strong>{" "}
              {isEditing ? (
                <input
                  type="number"
                  name="assetLifeSpan"
                  value={editedAsset.assetLifeSpan}
                  onChange={handleInputChange}
                />
              ) : (
                asset.assetLifeSpan
              )}
            </p>
            <p>
              <strong>Warranty Expiry Date:</strong>{" "}
              {isEditing ? (
                <input
                  type="date"
                  name="warrantyDate"
                  value={editedAsset.warrantyDate}
                  onChange={handleInputChange}
                />
              ) : (
                asset.warrantyDate
              )}
            </p>
            <p>
              <strong>Status:</strong>
              {isEditing ? (
                <select
                  name="assetStatus"
                  value={editedAsset.assetStatus}
                  onChange={handleInputChange}
                >
                  <option value="New">New</option>
                  <option value="Installed">Installed</option>
                  <option value="Disposed">Disposed</option>
                </select>
              ) : (
                asset.assetStatus
              )}
            </p>
            <p>
              <strong>Installation Date:</strong>{" "}
              {isEditing ? (
                <input
                  type="date"
                  name="assetInstallationDate"
                  value={editedAsset.assetInstallationDate}
                  onChange={handleInputChange}
                />
              ) : (
                asset.assetInstallationDate
              )}
            </p>
            <p>
              <strong>Quantity:</strong>{" "}
              {isEditing ? (
                <input
                  type="number"
                  name="assetQuantity"
                  value={editedAsset.assetQuantity}
                  onChange={handleInputChange}
                />
              ) : (
                asset.assetQuantity
              )}
            </p>
            <p>
              <strong>Last Maintenance Date:</strong>{" "}
              {isEditing ? (
                <input
                  type="date"
                  name="assetLastMaintenanceDate"
                  value={editedAsset.assetLastMaintenanceDate}
                  onChange={handleInputChange}
                />
              ) : (
                asset.assetLastMaintenanceDate
              )}
            </p>
          </div>

          {/* Green Technology Information - Only show if it's a green tech asset */}
          {asset.isGreenTech && (
            <>
              <h3>Green Technology Information</h3>
              <div className="details-grid">
                <p>
                  <strong>Uses Green Technology:</strong> Yes
                </p>
                <p>
                  <strong>SIRIM Eco Labelling Certified:</strong>
                  {isEditing ? (
                    <select
                      name="ecoLabel"
                      value={editedAsset.ecoLabel}
                      onChange={handleInputChange}
                    >
                      <option value={true}>Yes</option>
                      <option value={false}>No</option>
                    </select>
                  ) : asset.ecoLabel ? (
                    "Yes"
                  ) : (
                    "No"
                  )}
                </p>
                <p>
                  <strong>SIRIM Carbon Footprint Certified:</strong>
                  {isEditing ? (
                    <select
                      name="carbonFootprintCertification"
                      value={editedAsset.carbonFootprintCertification}
                      onChange={handleInputChange}
                    >
                      <option value={true}>Yes</option>
                      <option value={false}>No</option>
                    </select>
                  ) : asset.carbonFootprintCertification ? (
                    "Yes"
                  ) : (
                    "No"
                  )}
                </p>
                <p>
                  <strong>Energy Efficiency Rating (stars):</strong>
                  {isEditing ? (
                    <input
                      type="number"
                      name="energyRating"
                      value={editedAsset.energyRating}
                      onChange={handleInputChange}
                    />
                  ) : (
                    asset.energyRating
                  )}
                </p>
              </div>
            </>
          )}

          {/* Category-Specific Information */}
          {categoryData && (
            <>
              <h3>Category-Specific Details</h3>
              <div className="details-grid">
                {asset.assetType === "Lights" && (
                  <>
                    <p>
                      <strong>Light Type:</strong>
                      {isEditing ? (
                        <input
                          type="text"
                          name="lightType"
                          value={editedCategoryData.lightType}
                          onChange={handleCategoryInputChange}
                        />
                      ) : (
                        categoryData.lightType
                      )}
                    </p>
                    <p>
                      <strong>Serial Number:</strong>
                      {isEditing ? (
                        <input
                          type="text"
                          name="serialNumber"
                          value={editedCategoryData.serialNumber}
                          onChange={handleCategoryInputChange}
                        />
                      ) : (
                        categoryData.serialNumber
                      )}
                    </p>
                    <p>
                      <strong>Voltage (V):</strong>
                      {isEditing ? (
                        <input
                          type="number"
                          name="voltage"
                          value={editedCategoryData.voltage}
                          onChange={handleCategoryInputChange}
                        />
                      ) : (
                        categoryData.voltage
                      )}
                    </p>
                    <p>
                      <strong>Lumens (lm):</strong>
                      {isEditing ? (
                        <input
                          type="number"
                          name="lumens"
                          value={editedCategoryData.lumens}
                          onChange={handleCategoryInputChange}
                        />
                      ) : (
                        categoryData.lumens
                      )}
                    </p>
                    <p>
                      <strong>Estimated Energy Consumption (kWh/year):</strong>
                      {isEditing ? (
                        <input
                          type="number"
                          name="estimatedEnergyConsumption"
                          value={editedCategoryData.estimatedEnergyConsumption}
                          onChange={handleCategoryInputChange}
                        />
                      ) : (
                        categoryData.estimatedEnergyConsumption
                      )}
                    </p>
                  </>
                )}

                {asset.assetType === "Elevators" && (
                  <>
                    <p>
                      <strong>Weight Capacity (kg):</strong>
                      {isEditing ? (
                        <input
                          type="number"
                          name="weightCapacity"
                          value={editedCategoryData.weightCapacity}
                          onChange={handleCategoryInputChange}
                        />
                      ) : (
                        categoryData.weightCapacity
                      )}
                    </p>
                    <p>
                      <strong>Dimension (m):</strong>
                      {isEditing ? (
                        <input
                          type="text"
                          name="dimension"
                          value={editedCategoryData.dimension}
                          onChange={handleCategoryInputChange}
                        />
                      ) : (
                        categoryData.dimension
                      )}
                    </p>
                    <p>
                      <strong>Power Mechanism:</strong>
                      {isEditing ? (
                        <input
                          type="text"
                          name="powerMechanism"
                          value={editedCategoryData.powerMechanism}
                          onChange={handleCategoryInputChange}
                        />
                      ) : (
                        categoryData.powerMechanism
                      )}
                    </p>
                    <p>
                      <strong>Speed of Travel (m/s):</strong>
                      {isEditing ? (
                        <input
                          type="number"
                          name="speedOfTravel"
                          value={editedCategoryData.speedOfTravel}
                          onChange={handleCategoryInputChange}
                        />
                      ) : (
                        categoryData.speedOfTravel
                      )}
                    </p>
                    <p>
                      <strong>Estimated Energy Consumption (kWh/year):</strong>
                      {isEditing ? (
                        <input
                          type="number"
                          name="estimatedEnergyConsumption"
                          value={editedCategoryData.estimatedEnergyConsumption}
                          onChange={handleCategoryInputChange}
                        />
                      ) : (
                        categoryData.estimatedEnergyConsumption
                      )}
                    </p>
                  </>
                )}

                {asset.assetType === "CCTV" && (
                  <>
                    <p>
                      <strong>Resolution:</strong>
                      {isEditing ? (
                        <input
                          type="text"
                          name="resolution"
                          value={editedCategoryData.resolution}
                          onChange={handleCategoryInputChange}
                        />
                      ) : (
                        categoryData.resolution
                      )}
                    </p>
                    <p>
                      <strong>Field of View:</strong>
                      {isEditing ? (
                        <input
                          type="text"
                          name="fieldOfView"
                          value={editedCategoryData.fieldOfView}
                          onChange={handleCategoryInputChange}
                        />
                      ) : (
                        categoryData.fieldOfView
                      )}
                    </p>
                    <p>
                      <strong>Recording Capacity (GB):</strong>
                      {isEditing ? (
                        <input
                          type="number"
                          name="recordingCapacity"
                          value={editedCategoryData.recordingCapacity}
                          onChange={handleCategoryInputChange}
                        />
                      ) : (
                        categoryData.recordingCapacity
                      )}
                    </p>
                    <p>
                      <strong>Frame Rate (fps):</strong>
                      {isEditing ? (
                        <input
                          type="number"
                          name="frameRate"
                          value={editedCategoryData.frameRate}
                          onChange={handleCategoryInputChange}
                        />
                      ) : (
                        categoryData.frameRate
                      )}
                    </p>
                  </>
                )}

                {asset.assetType === "Gym Equipment" && (
                  <>
                    <p>
                      <strong>Equipment Type:</strong>
                      {isEditing ? (
                        <input
                          type="text"
                          name="equipmentType"
                          value={editedCategoryData.equipmentType}
                          onChange={handleCategoryInputChange}
                        />
                      ) : (
                        categoryData.equipmentType
                      )}
                    </p>
                  </>
                )}

                {asset.assetType === "Miscellaneous" && (
                  <>
                    <p>
                      <strong>Asset Description:</strong>
                      {isEditing ? (
                        <input
                          type="text"
                          name="assetDescription"
                          value={editedCategoryData.assetDescription}
                          onChange={handleCategoryInputChange}
                        />
                      ) : (
                        categoryData.assetDescription
                      )}
                    </p>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Only show action buttons if user is logged in and not a resident */}
        {shouldShowActionButtons() && (
          <div className="button-group">
            {isEditing ? (
              <>
                <button className="cancel-btn" onClick={handleCancelEdit}>
                  Cancel
                </button>
                <button className="save-btn" onClick={handleSave}>
                  Save
                </button>
              </>
            ) : (
              <>
                <button
                  className="back-btn"
                  onClick={() => window.history.back()}
                >
                  Back
                </button>
                <button className="edit-btn" onClick={() => setIsEditing(true)}>
                  Edit Details
                </button>
                <button className="qr-btn" onClick={handleGenerateQRCode}>
                  Generate QR Code
                </button>
              </>
            )}
          </div>
        )}

        {/* Always show back button for residents or non-logged in users */}
        {!shouldShowActionButtons() && (
          <div className="button-group">
            <button className="back-btn" onClick={() => window.history.back()}>
              Back
            </button>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {showQRCodeModal && (
        <QRCodeModal
          assetUrl={`/asset-details/${asset.assetId}`}
          onClose={() => setShowQRCodeModal(false)}
        />
      )}
    </div>
  );
};

export default AssetDetails;
