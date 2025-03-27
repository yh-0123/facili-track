import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import "./addAsset.css";
import "../index.css";
import PageHeader from "../pageHeader";
import supabase from "../../backend/DBClient/SupaBaseClient";
import Cookies from "js-cookie";

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
  const [qrCodeData, setQrCodeData] = useState(null);
  const navigate = useNavigate();

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
  };

  const handleNext = () => {
    if (selectedCategory) {
      setCurrentPage(2);
    }
  };

  const handleSubmit = async () => {
    try {
      // Add the selected category to the form data
      const assetData = { ...formData, assetType: selectedCategory };
      const user = JSON.parse(Cookies.get("userData"));
      console.log(assetData);
      // Insert the asset data into the Supabase database
      const { data, error } = await supabase
        .from("facility_asset") // Replace "assets" with your actual table name
        .insert({
          adminId: user.userId,
          //TODO add worker id
          assetType: assetData.assetType,
          assetName: assetData.assetName,
          assetPurchaseDate: assetData.assetPurchaseDate,
          assetPurchasePrice: assetData.assetPurchasePrice,
          assetLifeSpan: assetData.assetLifeSpan,
          assetInstallationDate: assetData.assetInstallationDate,
          warrantyDate: assetData.warrantyDate,
          assetStatus: assetData.assetStatus,
          isGreenTech: assetData.isGreenTech === "Yes" ? true : false,
        });
      if (error) {
        throw new Error(error.message);
      }

      // If successful, set the QR code data and reset the form
      setQrCodeData(data[0]); // Assuming the first inserted row is returned
      setFormData({});
      alert("Asset added successfully!");
    } catch (error) {
      console.error("Error adding asset:", error);
      alert("Error adding asset: " + error.message);
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
          nextPage={() => setCurrentPage(3)}
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
          prevPage={() => setCurrentPage(3)} // Pass prevPage
        />
      )}
    </div>
  );
};

const AssetForm = ({ category, setFormData, formData, nextPage, prevPage }) => {
  const [data, setData] = useState({
    assetName: "",
    assetPurchaseDate: "",
    assetPurchasePrice: "",
    assetLifeSpan: 0,
    warrantyDate: "",
    quantity: 0,
    assetStatus: "Installed",
    assetInstallationDate: "",
  });

  const handleChange = (e) => {
    console.log(e.target.value);
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const handleNext = () => {
    setFormData({ ...formData, ...data });
    nextPage();
  };

  return (
    <div className="asset-form">
      <h1>Add New Asset ({category})</h1>
      <p>Basic Information</p>
      <form>
        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            name="assetName"
            value={data.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Purchase Date</label>
          <input
            type="date"
            name="assetPurchaseDate"
            value={data.purchaseDate}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Purchase Price (RM)</label>
          <input
            type="number"
            name="assetPurchasePrice"
            value={data.price}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Life Span (years)</label>
          <input
            type="number"
            name="assetLifeSpan"
            value={data.assetLifeSpan}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Warranty Date</label>
          <input
            type="date"
            name="warrantyDate"
            value={data.warrantyDate}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Quantity (units)</label>
          <input
            type="number"
            name="quantity"
            value={data.quantity}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Status</label>
          <div>
            <label>
              <input
                type="radio"
                name="assetStatus"
                value="New"
                checked={data.assetStatus === "New"}
                onChange={handleChange}
              />{" "}
              New
            </label>
            <label>
              <input
                type="radio"
                name="assetStatus"
                value="Installed"
                checked={data.assetStatus === "Installed"}
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
            value={data.installDate}
            onChange={handleChange}
            required
          />
        </div>
        <div className="button-group">
          <button type="button" className="back-button" onClick={prevPage}>
            Back
          </button>
          <button type="button" className="next-button" onClick={handleNext}>
            Next
          </button>
        </div>
      </form>
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
  const [data, setData] = useState({
    greenTech: "",
    sirimEco: "",
    sirimCarbon: "",
    efficiency: "",
  });

  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const handleNext = () => {
    setFormData({ ...formData, ...data });
    nextPage();
  };

  return (
    <div className="asset-form">
      <h1>Green Tech-Related Information ({category})</h1>
      <label>Is it using Green Technology?</label>
      <input
        type="radio"
        name="isGreenTech"
        value="Yes"
        onChange={handleChange}
      />{" "}
      Yes
      <input
        type="radio"
        name="isGreenTech"
        value="No"
        onChange={handleChange}
      />{" "}
      No
      <label>Certified by SIRIM Eco Labelling Scheme?</label>
      <input
        type="radio"
        name="sirimEco"
        value="Yes"
        onChange={handleChange}
      />{" "}
      Yes
      <input
        type="radio"
        name="sirimEco"
        value="No"
        onChange={handleChange}
      />{" "}
      No
      <label>
        Certified by SIRIM Product Carbon Footprint Certification Scheme?
      </label>
      <input
        type="radio"
        name="sirimCarbon"
        value="Yes"
        onChange={handleChange}
      />{" "}
      Yes
      <input
        type="radio"
        name="sirimCarbon"
        value="No"
        onChange={handleChange}
      />{" "}
      No
      <label>Energy Efficiency Rating (stars)</label>
      <input
        type="number"
        name="efficiency"
        placeholder="if applicable"
        value={data.efficiency}
        onChange={handleChange}
        required
      />
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
  const [data, setData] = useState({});

  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    setFormData({ ...formData, categoryData: data });
    onSubmit(); // Call the parent `handleSubmit` function
  };

  return (
    <div className="asset-form">
      <h1>Extended Information ({category})</h1>

      {/* Conditional Fields for Lights */}
      {category === "Lights" && (
        <>
          <div className="form-group">
            <label>Light Type</label>
            <input
              type="text"
              name="lightType"
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Serial Number</label>
            <input
              type="text"
              name="serialNumber"
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Voltage</label>
            <input
              type="text"
              name="voltage"
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Lumens</label>
            <input type="text" name="lumens" onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Estimated Energy Consumption (in kWh/year)</label>
            <input
              type="text"
              name="estimatedEnergyConsumption"
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
              type="text"
              name="weightCapacity"
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Dimension</label>
            <input
              type="text"
              name="dimension"
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Power Mechanism</label>
            <input
              type="text"
              name="powerMechanism"
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Speed of Travel</label>
            <input
              type="text"
              name="speedOfTravel"
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Estimated Energy Consumption (in kWh/year)</label>
            <input
              type="text"
              name="estimatedEnergyConsumption"
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
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Field of View</label>
            <input
              type="text"
              name="fieldOfView"
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Recording Capacity</label>
            <input
              type="text"
              name="recordingCapacity"
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Frame Rate</label>
            <input
              type="text"
              name="frameRate"
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
              onChange={handleChange}
              required
            />
          </div>
        </>
      )}

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

const QrCodePopup = ({ assetData, onClose }) => {
  const [showQr, setShowQr] = useState(false);

  return (
    <div className="qr-popup">
      <div className="qr-popup-content">
        {!showQr ? (
          <>
            <h2>Asset added successfully!</h2>
            <p>Would you like to generate a QR code for this asset?</p>
            <button onClick={() => setShowQr(true)}>Generate QR Code</button>
            <button onClick={onClose}>Close</button>
          </>
        ) : (
          <>
            <h2>Asset QR Code</h2>
            <QRCodeSVG value={JSON.stringify(assetData)} size={200} />
            <p>Scan this QR code to access asset details.</p>
            <button onClick={onClose}>Close</button>
          </>
        )}
      </div>
    </div>
  );
};

export default AddAsset;
