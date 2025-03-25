import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const AssetDetails = () => {
  const { id } = useParams();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`/api/assets/${id}`)
      .then((response) => {
        setAsset(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching asset details:", error);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <p>Loading asset details...</p>;
  if (!asset) return <p>Asset not found.</p>;

  return (
    <div className="asset-details">
      <h2>Asset Details</h2>

      {/* Basic Asset Information */}
      <h3>Basic Information</h3>
      <p><strong>ID:</strong> {asset.id}</p>
      <p><strong>Name:</strong> {asset.name}</p>
      <p><strong>Category:</strong> {asset.category}</p>
      <p><strong>Purchase Date:</strong> {asset.purchaseDate}</p>
      <p><strong>Purchase Price:</strong> {asset.price}</p>
      <p><strong>Life Span (years):</strong> {asset.lifespan}</p>
      <p><strong>Warranty Expiry Date:</strong> {asset.warrantyDate}</p>
      <p><strong>Quantity:</strong> {asset.quantity}</p>
      <p><strong>Status:</strong> {asset.status}</p>
      <p><strong>Installation Date:</strong> {asset.installDate}</p>

      {/* Green Technology Information */}
      <h3>Green Technology Information</h3>
      <p><strong>Uses Green Technology:</strong> {asset.greenTech}</p>
      <p><strong>SIRIM Eco Labelling Certified:</strong> {asset.sirimEco}</p>
      <p><strong>SIRIM Carbon Footprint Certified:</strong> {asset.sirimCarbon}</p>
      <p><strong>Energy Efficiency Rating:</strong> {asset.efficiency} stars</p>

      {/* Category-Specific Information */}
      <h3>Category-Specific Details</h3>
      {asset.category === "Lights" && (
        <>
          <p><strong>Light Type:</strong> {asset.categoryData?.lightType}</p>
          <p><strong>Serial Number:</strong> {asset.categoryData?.serialNumber}</p>
          <p><strong>Voltage:</strong> {asset.categoryData?.voltage}</p>
          <p><strong>Lumens:</strong> {asset.categoryData?.lumens}</p>
          <p><strong>Estimated Energy Consumption:</strong> {asset.categoryData?.energyConsumption} kWh/year</p>
        </>
      )}

      {asset.category === "Elevators" && (
        <>
          <p><strong>Weight Capacity:</strong> {asset.categoryData?.weightCapacity} kg</p>
          <p><strong>Dimension:</strong> {asset.categoryData?.dimension}</p>
          <p><strong>Power Mechanism:</strong> {asset.categoryData?.powerMechanism}</p>
          <p><strong>Speed of Travel:</strong> {asset.categoryData?.speedOfTravel}</p>
          <p><strong>Estimated Energy Consumption:</strong> {asset.categoryData?.energyConsumption} kWh/year</p>
        </>
      )}

      {asset.category === "CCTV" && (
        <>
          <p><strong>Resolution:</strong> {asset.categoryData?.resolution}</p>
          <p><strong>Field of View:</strong> {asset.categoryData?.fieldOfView}</p>
          <p><strong>Recording Capacity:</strong> {asset.categoryData?.recordingCapacity}</p>
          <p><strong>Frame Rate:</strong> {asset.categoryData?.frameRate}</p>
        </>
      )}

      {asset.category === "Gym Equipment" && (
        <>
          <p><strong>Equipment Type:</strong> {asset.categoryData?.equipmentType}</p>
        </>
      )}

      {asset.category === "Miscellaneous" && (
        <>
          <p><strong>Asset Description:</strong> {asset.categoryData?.assetDescription}</p>
        </>
      )}

      <button onClick={() => window.history.back()}>Back</button>
    </div>
  );
};

export default AssetDetails;
