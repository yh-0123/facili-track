import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import supabase from "../../backend/DBClient/SupaBaseClient"; // Import your Supabase client
import "./assetDetails.css";
import QRCodeModal from "./qrCodeModal"; // Import the QRCodeModal component
import PageHeader from "../pageHeader";

const AssetDetails = () => {
  const { id } = useParams(); // Get asset ID from URL
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedAsset, setEditedAsset] = useState({});
  const [showQRCodeModal, setShowQRCodeModal] = useState(false); // State to show the QR modal
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAssetDetails = async () => {
      try {
        const { data, error } = await supabase
          .from("facility_asset")
          .select("*")
          .eq("assetId", id)
          .single(); // Fetch single asset based on ID

        if (error) {
          console.error("Error fetching asset details:", error.message);
        } else {
          setAsset(data);
          setEditedAsset(data);
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

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from("facility_asset")
        .update(editedAsset)
        .eq("assetId", id);

      if (error) {
        console.error("Error updating asset:", error.message);
      } else {
        setAsset(editedAsset);
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  };

  const handleCancelEdit = () => {
    setEditedAsset(asset);
    setIsEditing(false);
  };

  const handleGenerateQRCode = () => {
    setShowQRCodeModal(true); // Show the QR code modal
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
            <p><strong>ID:</strong> {asset.assetId}</p>
            <p><strong>Name:</strong> {isEditing ? <input type="text" name="assetName" value={editedAsset.assetName} onChange={handleInputChange} /> : asset.assetName} </p>
            <p><strong>Category:</strong> {isEditing ? <input type="text" name="assetType" value={editedAsset.assetType} onChange={handleInputChange} /> : asset.assetType}</p>
            <p><strong>Purchase Date:</strong> {isEditing ? <input type="date" name="assetPurchaseDate" value={editedAsset.assetPurchaseDate} onChange={handleInputChange} /> : asset.assetPurchaseDate}</p>
            <p><strong>Purchase Price:</strong> {isEditing ? <input type="number" name="assetPurchasePrice" value={editedAsset.assetPurchasePrice} onChange={handleInputChange} /> : asset.assetPurchasePrice}</p>
            <p><strong>Life Span (years):</strong> {isEditing ? <input type="number" name="assetLifeSpan" value={editedAsset.assetLifeSpan} onChange={handleInputChange} /> : asset.assetLifeSpan}</p>
            <p><strong>Warranty Expiry Date:</strong> {isEditing ? <input type="date" name="assetWarrantyDate" value={editedAsset.assetWarrantyDate} onChange={handleInputChange} /> : asset.assetWarrantyDate}</p>
            <p><strong>Status:</strong> {isEditing ? <input type="text" name="assetStatus" value={editedAsset.assetStatus} onChange={handleInputChange} /> : asset.assetStatus}</p>
            <p><strong>Installation Date:</strong> {isEditing ? <input type="date" name="assetInstallationDate" value={editedAsset.assetInstallationDate} onChange={handleInputChange} /> : asset.assetInstallationDate}</p>
            <p><strong>Quantity:</strong> {isEditing ? <input type="number" name="assetQuantity" value={editedAsset.assetQuantity} onChange={handleInputChange} /> : asset.assetQuantity}</p>
            <p><strong>Last Maintenance Date:</strong> {isEditing ? <input type="date" name="assetLastMaintenanceDate" value={editedAsset.assetLastMaintenanceDate} onChange={handleInputChange} /> : asset.assetLastMaintenanceDate}</p>
          </div>

          {/* Green Technology Information */}
          <h3>Green Technology Information</h3>
          <div className="details-grid">
            <p><strong>Uses Green Technology:</strong> {isEditing ? <input type="boolean" name="isGreenTech" value={editedAsset.isGreenTech} onChange={handleInputChange} /> : asset.isGreenTech}</p>
            <p><strong>SIRIM Eco Labelling Certified:</strong> {isEditing ?<input type="boolean" name="ecoLabel" value={editedAsset.ecoLabel} onChange={handleInputChange} /> :asset.ecoLabel} </p>
            <p><strong>SIRIM Carbon Footprint Certified:</strong> {isEditing ? <input type="boolean" name="carbonFootprintCertification" value={editedAsset.carbonFootprintCertification} onChange={handleInputChange} /> :asset.carbonFootprintCertification} </p>
            <p><strong>Energy Efficiency Rating (stars):</strong> {isEditing ? <input type="number" name="energyRating" value={editedAsset.energyRating} onChange={handleInputChange} /> :asset.energyRating}</p>
          </div>

          {/* Category-Specific Information */}
          <h3>Category-Specific Details</h3>
          <div className="details-grid">
            {asset.assetType === "Lights" && (
              <>
                <p><strong>Light Type:</strong> {isEditing ? <input type="text" name="lightType" value={editedAsset.lightType} onChange={handleInputChange} /> :asset.categoryData?.lightType}</p>
                <p><strong>Serial Number:</strong> {isEditing ? <input type="text" name="serialNumber" value={editedAsset.serialNumber} onChange={handleInputChange} /> :asset.categoryData?.serialNumber}</p>
                <p><strong>Voltage (V):</strong> {isEditing ? <input type="number" name="voltage" value={editedAsset.voltage} onChange={handleInputChange} /> :asset.categoryData?.voltage}</p>
                <p><strong>Lumens (lm):</strong> {isEditing ? <input type="text" name="lumens" value={editedAsset.lumens} onChange={handleInputChange} /> :asset.categoryData?.lumens}</p>
                <p><strong>Estimated Energy Consumption (kWh/year):</strong> {isEditing ? <input type="number" name="energyConsumption" value={editedAsset.energyConsumption} onChange={handleInputChange} /> :asset.categoryData?.energyConsumption}</p>
              </>
            )}

            {asset.assetType === "Elevators" && (
              <>
                <p><strong>Weight Capacity (kg):</strong> {isEditing ? <input type="number" name="weightCapacity" value={editedAsset.weightCapacity} onChange={handleInputChange} /> :asset.categoryData?.weightCapacity}</p>
                <p><strong>Dimension (m):</strong> {isEditing ? <input type="text" name="dimension" value={editedAsset.dimension} onChange={handleInputChange} /> :asset.categoryData?.dimension}</p>
                <p><strong>Power Mechanism:</strong> {isEditing ? <input type="text" name="powerMechanism" value={editedAsset.powerMechanism} onChange={handleInputChange} /> :asset.categoryData?.powerMechanism}</p>
                <p><strong>Speed of Travel (m/s):</strong> {isEditing ? <input type="text" name="speedOfTravel" value={editedAsset.speedOfTravel} onChange={handleInputChange} /> :asset.categoryData?.speedOfTravel}</p>
                <p><strong>Estimated Energy Consumption (kWh/year):</strong> {isEditing ? <input type="text" name="energyConsumption" value={editedAsset.energyConsumption} onChange={handleInputChange} /> :asset.categoryData?.energyConsumption}</p>
              </>
            )}

            {asset.assetType === "CCTV" && (
              <>
                <p><strong>Resolution:</strong> {isEditing ? <input type="text" name="resolution" value={editedAsset.resolution} onChange={handleInputChange} /> :asset.categoryData?.resolution}</p>
                <p><strong>Field of View:</strong> {isEditing ? <input type="text" name="fieldOfView" value={editedAsset.fieldOfView} onChange={handleInputChange} /> :asset.categoryData?.fieldOfView}</p>
                <p><strong>Recording Capacity (GB):</strong> {isEditing ? <input type="number" name="recordingCapacity" value={editedAsset.recordingCapacity} onChange={handleInputChange} /> :asset.categoryData?.recordingCapacity} </p>
                <p><strong>Frame Rate (fps):</strong> {isEditing ? <input type="number" name="frameRate" value={editedAsset.frameRate} onChange={handleInputChange} /> :asset.categoryData?.frameRate}</p>
              </>
            )}

            {asset.assetType === "Gym Equipment" && (
              <>
                <p><strong>Equipment Type:</strong> {isEditing ? <input type="text" name="equipmentType" value={editedAsset.equipmentType} onChange={handleInputChange} /> :asset.categoryData?.equipmentType}</p>
              </>
            )}

            {asset.assetType === "Miscellaneous" && (
              <>
                <p><strong>Asset Description:</strong> {isEditing ? <input type="text" name="assetDescription" value={editedAsset.assetDescription} onChange={handleInputChange} /> :asset.categoryData?.assetDescription}</p>
              </>
            )}

          </div>

          
        </div>
        {/* Action Buttons */}
        <div className="button-group">
            {isEditing ? (
            <>
              <button className="cancel-btn" onClick={handleCancelEdit}>Cancel</button>
              <button className="save-btn" onClick={handleSave}>Save</button>
            </>
          ) : (
            <button className="back-btn" onClick={() => window.history.back()}>Back</button>
          )}
          {isEditing ? null : <button className="edit-btn" onClick={() => setIsEditing(true)}>Edit Details</button>}
          <button className="qr-btn" onClick={handleGenerateQRCode}>Generate QR Code</button>
          </div>
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
