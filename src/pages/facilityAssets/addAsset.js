import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import "./addAsset.css";
import "../index.css";
import PageHeader from "../pageHeader";
import supabase from "../../backend/DBClient/SupaBaseClient";
import Cookies from "js-cookie";
import QRCodeModal from './qrCodeModal';

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
  const [assetUrl, setAssetUrl] = useState('');
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
      // Check if isGreenTech is Yes
    if (formData.isGreenTech === "Yes") {
      setCurrentPage(3); // Navigate to the GreenTechForm (Page 3)
    } else {
      setCurrentPage(2); // Skip directly to Asset Form (Page 2)
    }
  };

  useEffect(() => {
    const savedData = localStorage.getItem('formData');
    if (savedData) {
      setFormData(JSON.parse(savedData));
    }
  }, []); // This runs when the component mounts
  
  useEffect(() => {
    if (formData) {
      localStorage.setItem('formData', JSON.stringify(formData));
    }
  }, [formData]); // This runs whenever formData changes
  
  const handleSubmit = async () => {
    try {
      // Add the selected category to the form data
      const assetData = { ...formData, assetType: selectedCategory };
      const user = JSON.parse(Cookies.get("userData"));
      // Insert the asset data into the Supabase database
      const { data, error } = await supabase
        .from("facility_asset") // Replace "assets" with your actual table name
        .insert({
          // adminId: user.userId,
          //TODO add worker id
          assetType: assetData.assetType,
          assetName: assetData.assetName,
          assetPurchaseDate: assetData.assetPurchaseDate,
          assetPurchasePrice: assetData.assetPurchasePrice,
          assetLifeSpan: assetData.assetLifeSpan,
          assetInstallationDate: assetData.assetInstallationDate,
          warrantyDate: assetData.warrantyDate,
          quantity: assetData.assetQuantity,
          assetStatus: assetData.assetStatus,
          isGreenTech: assetData.isGreenTech === "Yes" ? true : false,
        });
      if (error) {
        throw new Error(error.message);
      }

    const assetId = data[0].id;
    const generatedUrl =  `${window.location.origin}/asset/${assetId}`;
   
    setAssetUrl(generatedUrl);
    setShowQRModal(true); // trigger QR modal

    alert("Asset added successfully!");

    } catch (error) {
      console.error("Error adding asset:", error.message);
      alert("Error: " + error.message);
    }

  
  };

 

  const nextPage = () => setCurrentPage((prev) => prev + 1);
  const prevPage = () => setCurrentPage((prev) => Math.max(1, prev - 1));

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
              name="quantity"
              value={formData.quantity || ""}
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
          name="efficiency"
          placeholder="if applicable"
          value={formData.efficiency || ""}
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
