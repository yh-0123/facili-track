import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import "./addAsset.css";
import "../index.css";
import PageHeader from "../pageHeader";
import supabase from "../../backend/DBClient/SupaBaseClient";
import Cookies from "js-cookie";
import QRCodeModal from "./qrCodeModal";

const categories = [
  "Lights",
  "Elevators",
  "CCTV",
  "Gym Equipment",
  "Miscellaneous",
];

const AddAsset = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [showQRModal, setShowQRModal] = useState(false);
  const [assetUrl, setAssetUrl] = useState("");
  const navigate = useNavigate();

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
  };

  const handleNext = () => {
    if (currentPage === 1 && selectedCategory) {
      setCurrentPage(2); // Move to the AssetForm page (Page 2)
      return;
    }

    if (currentPage === 2) {
      setCurrentPage(formData.isGreenTech === "Yes" ? 3 : 4);
      return;
    }

    if (currentPage === 3) {
      setCurrentPage(4);
    }
  };

  const handlePrevious = () => {
    if (currentPage === 3) {
      setCurrentPage(2); // Go back to asset form
    } else if (currentPage === 4) {
      // Check if isGreenTech is Yes
      if (formData.isGreenTech === "Yes") {
        setCurrentPage(3); // Go back to the GreenTechForm (Page 3)
      } else {
        setCurrentPage(2); // Skip directly to Asset Form (Page 2)
      }
    } else {
      setCurrentPage(Math.max(1, currentPage - 1));
    }
  };

  useEffect(() => {
    const savedData = localStorage.getItem("formData");
    if (savedData) {
      setFormData(JSON.parse(savedData));
    }
  }, []); // This runs when the component mounts

  useEffect(() => {
    if (formData) {
      localStorage.setItem("formData", JSON.stringify(formData));
    }
  }, [formData]); // This runs whenever formData changes

  const handleSubmit = async () => {
    try {
      const assetData = { ...formData, assetType: selectedCategory };
      const user = JSON.parse(Cookies.get("userData"));

      console.log("About to insert asset with data:", {
        assetType: assetData.assetType,
        assetName: assetData.assetName,
        // Show other fields to verify data
      });

      // 1. Insert basic asset data
      const { data: assetResult, error: assetError } = await supabase
        .from("facility_asset")
        .insert({
          assetType: selectedCategory, // Use the selectedCategory directly
          assetName: assetData.assetName,
          assetPurchaseDate: assetData.assetPurchaseDate,
          assetPurchasePrice: parseFloat(assetData.assetPurchasePrice) || 0,
          assetLifeSpan: parseInt(assetData.assetLifeSpan) || 0,
          assetInstallationDate: assetData.assetInstallationDate || null,
          warrantyDate: assetData.warrantyDate,
          assetQuantity: parseInt(assetData.assetQuantity) || 1, // Use quantity directly with default 1
          assetStatus: assetData.assetStatus,
          isGreenTech: assetData.isGreenTech === "Yes",
        })
        .select('assetId, assetName'); // Explicitly request the ID field

      if (assetError) {
        console.error("Asset insertion error:", assetError);
        throw new Error(`Asset insertion failed: ${assetError.message}`);
      }

      console.log("Raw Supabase response:", assetResult);

      let assetId;
      
      // Try to get the ID from the insert result
      if (assetResult && assetResult.length > 0 && assetResult[0].assetId) {
        assetId = assetResult[0].assetId;
        console.log("Successfully got asset ID from insert:", assetId);
      } else {
        // Fallback: query for the most recently added asset with this name
        console.log("Failed to get ID directly, trying to fetch the asset");
        
        const { data: fetchedAsset, error: fetchError } = await supabase
          .from("facility_asset")
          .select("assetId")
          .eq("assetName", assetData.assetName)
          .order("created_at", { ascending: false })
          .limit(1);
          
        if (fetchError) {
          console.error("Error fetching asset:", fetchError);
          throw new Error(`Failed to fetch asset: ${fetchError.message}`);
        }
        
        if (!fetchedAsset || fetchedAsset.length === 0) {
          throw new Error("Could not find the newly created asset");
        }
        
        assetId = fetchedAsset[0].assetId;
        console.log("Retrieved asset ID via query:", assetId);
      }

      if (!assetId) {
        throw new Error("Asset ID is undefined or null after multiple attempts");
      }

      // 2. Insert green technology data if applicable
      if (assetData.isGreenTech === "Yes") {
        console.log("Inserting green tech data for asset ID:", assetId);
        
        const { data: greenTechData, error: greenTechError } = await supabase
          .from("green_technology")
          .insert({
            assetId: assetId,
            energyRating: parseInt(assetData.energyRating) || 0,
            carbonFootprintCertification: assetData.sirimCarbon === "Yes",
            ecoLabel: assetData.sirimEco === "Yes",
          });

        if (greenTechError) {
          console.error("Green tech insertion error:", greenTechError);
          throw new Error(`Green tech insertion failed: ${greenTechError.message}`);
        }
        
        console.log("Green tech data inserted successfully");
      }

      // 3. Insert category-specific data
      console.log(`Inserting ${selectedCategory} specific data for asset ID:`, assetId);
      
      switch (selectedCategory) {
        case "CCTV": {
          const { data: cctvData, error: cctvError } = await supabase
            .from("cctv")
            .insert({
              assetId: assetId,
              resolution: assetData.resolution,
              fieldOfView: assetData.fieldOfView,
              recordingCapacity: assetData.recordingCapacity,
              frameRate: assetData.frameRate,
            });
            
          if (cctvError) {
            console.error("CCTV insertion error:", cctvError);
            throw new Error(`CCTV data insertion failed: ${cctvError.message}`);
          }
          console.log("CCTV data inserted successfully");
          break;
        }
        case "Elevators": {
          const { data: elevatorData, error: elevatorError } = await supabase
            .from("elevators")
            .insert({
              assetId: assetId,
              weightCapacity: parseFloat(assetData.weightCapacity) || 0,
              dimension: assetData.dimension,
              powerMechanism: assetData.powerMechanism,
              speedOfTravel: parseFloat(assetData.speedOfTravel) || 0,
              estimatedEnergyConsumption: parseFloat(
                assetData.estimatedEnergyConsumption
              ) || 0,
            });
            
          if (elevatorError) {
            console.error("Elevators insertion error:", elevatorError);
            throw new Error(`Elevator data insertion failed: ${elevatorError.message}`);
          }
          console.log("Elevator data inserted successfully");
          break;
        }
        case "Gym Equipment": {
          const { data: gymData, error: gymError } = await supabase
            .from("gym_equipment")
            .insert({
              assetId: assetId,
              equipmentType: assetData.equipmentType,
            });
            
          if (gymError) {
            console.error("Gym equipment insertion error:", gymError);
            throw new Error(`Gym equipment data insertion failed: ${gymError.message}`);
          }
          console.log("Gym equipment data inserted successfully");
          break;
        }
        case "Lights": {
          const { data: lightData, error: lightError } = await supabase
            .from("lights")
            .insert({
              assetId: assetId,
              lightType: assetData.lightType,
              serialNumber: assetData.serialNumber,
              voltage: parseFloat(assetData.voltage) || 0,
              lumens: parseFloat(assetData.lumens) || 0,
              estimatedEnergyConsumption: parseFloat(
                assetData.estimatedEnergyConsumption
              ) || 0,
            });
            
          if (lightError) {
            console.error("Lights insertion error:", lightError);
            throw new Error(`Light data insertion failed: ${lightError.message}`);
          }
          console.log("Light data inserted successfully");
          break;
        }
        case "Miscellaneous": {
          const { data: miscData, error: miscError } = await supabase
            .from("miscellaneous")
            .insert({
              assetId: assetId,
              assetDescription: assetData.assetDescription,
            });
            
          if (miscError) {
            console.error("Miscellaneous insertion error:", miscError);
            throw new Error(`Miscellaneous data insertion failed: ${miscError.message}`);
          }
          console.log("Miscellaneous data inserted successfully");
          break;
        }
      }

      const generatedUrl = `${window.location.origin}/asset/${assetId}`;
      setAssetUrl(generatedUrl);
      setShowQRModal(true);
      
      // Clear local storage after successful submission
      localStorage.removeItem("formData");
      
      alert("Asset added successfully!");
    } catch (error) {
      console.error("Error adding asset:", error);
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div className="add-asset-page">
      {currentPage === 1 && (
        <>
          <header className="add-asset-header">
            <PageHeader title="Add New Asset" />
          </header>
          <h3>Select Asset Category</h3>
          <div className="category-grid">
            {categories.map((category) => (
              <div
                key={category}
                className={`category-card ${
                  selectedCategory === category ? "selected" : ""
                }`}
                onClick={() => handleCategoryClick(category)}
              >
                {category}
              </div>
            ))}

            <div className="button-group">
              <button className="back-button" onClick={() => navigate(-1)}>
                Back
              </button>
              <button
                className="next-button"
                onClick={handleNext}
                disabled={!selectedCategory}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {currentPage === 2 && (
        <AssetForm
          category={selectedCategory}
          setFormData={setFormData}
          formData={formData}
          nextPage={handleNext}
          prevPage={() => setCurrentPage(1)} // Pass prevPage
        />
      )}

      {currentPage === 3 && (
        <GreenTechForm
          category={selectedCategory}
          formData={formData}
          setFormData={setFormData}
          nextPage={() => setCurrentPage(4)}
          prevPage={() => setCurrentPage(2)} // Pass prevPage
        />
      )}

      {currentPage === 4 && (
        <CategorySpecificForm
          category={selectedCategory}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit} // Pass the handleSubmit function here
          prevPage={handlePrevious} // Pass prevPage
        />
      )}

      {showQRModal && (
        <QRCodeModal
          show={showQRModal}
          onClose={() => {
            setShowQRModal(false);
            navigate("/assets"); // Navigate back to assets page after closing modal
          }}
          assetUrl={assetUrl}
        />
      )}
    </div>
  );
};

const AssetForm = ({ category, setFormData, formData, nextPage, prevPage }) => {
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="add-asset-page">
      <h2 className="form-header">Add New {category}</h2>
      <div className="asset-form">
        {/* <h3>Basic Information ({category})</h3> */}
        <form>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              name="assetName"
              value={formData.assetName || ""}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Purchase Date</label>
            <input
              type="date"
              name="assetPurchaseDate"
              value={formData.assetPurchaseDate || ""}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Purchase Price (RM)</label>
            <input
              type="number"
              name="assetPurchasePrice"
              value={formData.assetPurchasePrice || ""}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Life Span (years)</label>
            <input
              type="number"
              name="assetLifeSpan"
              value={formData.assetLifeSpan || ""}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Warranty Date</label>
            <input
              type="date"
              name="warrantyDate"
              value={formData.warrantyDate || ""}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Quantity (units)</label>
            <input
              type="number"
              name="assetQuantity"
              value={formData.assetQuantity || ""}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Status</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="assetStatus"
                  value="New"
                  checked={formData.assetStatus === "New"}
                  onChange={handleChange}
                />{" "}
                New
              </label>
              <label>
                <input
                  type="radio"
                  name="assetStatus"
                  value="Installed"
                  checked={formData.assetStatus === "Installed"}
                  onChange={handleChange}
                />{" "}
                Installed
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Installation Date</label>
            <input
              type="date"
              name="assetInstallationDate"
              value={formData.assetInstallationDate || ""}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Is it using Green Technology?</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="isGreenTech"
                  value="Yes"
                  checked={formData.isGreenTech === "Yes"}
                  onChange={handleChange}
                />{" "}
                Yes
              </label>
              <label>
                <input
                  type="radio"
                  name="isGreenTech"
                  value="No"
                  checked={formData.isGreenTech === "No"}
                  onChange={handleChange}
                />{" "}
                No
              </label>
            </div>
          </div>
        </form>
      </div>
      <div className="button-group">
        <button type="button" className="back-button" onClick={prevPage}>
          Back
        </button>
        <button type="button" className="next-button" onClick={nextPage}>
          Next
        </button>
      </div>
    </div>
  );
};

const GreenTechForm = ({
  category,
  setFormData,
  formData,
  nextPage,
  prevPage,
}) => {
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="add-asset-page">
      <h2 className="form-header">Add New {category}</h2>
      <div className="asset-form">
        <h3>Green Tech-Related Information ({category})</h3>
        <label>Certified by SIRIM Eco Labelling Scheme?</label>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              name="sirimEco"
              value="Yes"
              checked={formData.sirimEco === "Yes"}
              onChange={handleChange}
            />{" "}
            Yes
          </label>
          <label>
            <input
              type="radio"
              name="sirimEco"
              value="No"
              checked={formData.sirimEco === "No"}
              onChange={handleChange}
            />{" "}
            No
          </label>
        </div>

        <label>
          Certified by SIRIM Product Carbon Footprint Certification Scheme?
        </label>

        <div className="radio-group">
          <label>
            <input
              type="radio"
              name="sirimCarbon"
              value="Yes"
              checked={formData.sirimCarbon === "Yes"}
              onChange={handleChange}
            />{" "}
            Yes
          </label>
          <label>
            <input
              type="radio"
              name="sirimCarbon"
              value="No"
              checked={formData.sirimCarbon === "No"}
              onChange={handleChange}
            />{" "}
            No
          </label>
        </div>

        <label>Energy Efficiency Rating (stars)</label>
        <input
          type="number"
          name="energyRating"
          placeholder="if applicable"
          value={formData.energyRating || ""}
          onChange={handleChange}
          required
        />
      </div>
      <div className="button-group">
        <button type="button" className="back-button" onClick={prevPage}>
          Back
        </button>
        <button type="button" className="next-button" onClick={nextPage}>
          Next
        </button>
      </div>
    </div>
  );
};

const CategorySpecificForm = ({
  category,
  setFormData,
  formData,
  onSubmit,
  prevPage,
}) => {
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    onSubmit(); // Call the parent `handleSubmit` function
  };

  return (
    <div className="add-asset-page">
      <h2 className="form-header">Add New {category}</h2>
      <div className="asset-form">
        <h3>Extended Information ({category})</h3>

        {/* Conditional Fields for Lights */}
        {category === "Lights" && (
          <>
            <div className="form-group">
              <label>Light Type</label>
              <input
                type="text"
                name="lightType"
                value={formData.lightType || ""} // Pre-fill with existing data
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Serial Number</label>
              <input
                type="text"
                name="serialNumber"
                value={formData.serialNumber || ""}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Voltage (V)</label>
              <input
                type="number"
                name="voltage"
                value={formData.voltage || ""}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Lumens (lm)</label>
              <input
                type="number"
                name="lumens"
                value={formData.lumens || ""}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Estimated Energy Consumption (kWh/year)</label>
              <input
                type="number"
                name="estimatedEnergyConsumption"
                value={formData.estimatedEnergyConsumption || ""}
                onChange={handleChange}
                required
              />
            </div>
          </>
        )}

        {/* Fields for Elevators */}
        {category === "Elevators" && (
          <>
            <div className="form-group">
              <label>Weight Capacity (kg)</label>
              <input
                type="number"
                name="weightCapacity"
                value={formData.weightCapacity || ""}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Dimension (m)</label>
              <input
                type="text"
                name="dimension"
                value={formData.dimension || ""}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Power Mechanism</label>
              <input
                type="text"
                name="powerMechanism"
                value={formData.powerMechanism || ""}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Speed of Travel (m/s)</label>
              <input
                type="number"
                name="speedOfTravel"
                value={formData.speedOfTravel || ""}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Estimated Energy Consumption (in kWh/year)</label>
              <input
                type="text"
                name="estimatedEnergyConsumption"
                value={formData.estimatedEnergyConsumption || ""}
                onChange={handleChange}
                required
              />
            </div>
          </>
        )}

        {/* Fields for CCTV */}
        {category === "CCTV" && (
          <>
            <div className="form-group">
              <label>Resolution</label>
              <input
                type="text"
                name="resolution"
                value={formData.resolution || ""}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Field of View</label>
              <input
                type="text"
                name="fieldOfView"
                value={formData.fieldOfView || ""}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Recording Capacity (GB)</label>
              <input
                type="text"
                name="recordingCapacity"
                value={formData.recordingCapacity || ""}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Frame Rate (fps)</label>
              <input
                type="text"
                name="frameRate"
                value={formData.frameRate || ""}
                onChange={handleChange}
                required
              />
            </div>
          </>
        )}

        {/* Fields for Gym Equipment */}
        {category === "Gym Equipment" && (
          <>
            <div className="form-group">
              <label>Equipment Type</label>
              <input
                type="text"
                name="equipmentType"
                value={formData.equipmentType || ""}
                onChange={handleChange}
                required
              />
            </div>
          </>
        )}

        {/* Fields for Miscellaneous */}
        {category === "Miscellaneous" && (
          <>
            <div className="form-group">
              <label>Asset Description</label>
              <input
                type="text"
                name="assetDescription"
                value={formData.assetDescription || ""}
                onChange={handleChange}
                required
              />
            </div>
          </>
        )}
      </div>
      <div className="button-group">
        <button type="button" className="back-button" onClick={prevPage}>
          Back
        </button>
        <button
          type="button"
          className="submit-button"
          onClick={handleSubmit} // Attach the handleSubmit function here
        >
          Add New {category}
        </button>
      </div>
    </div>
  );
};

export default AddAsset;