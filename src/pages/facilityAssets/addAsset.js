import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import "./addAsset.css";
import "../index.css";
import PageHeader from "../pageHeader";

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
      const response = await fetch("/api/assets/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to add asset.");

      const assetData = await response.json();
      setQrCodeData(assetData); // Store asset data for QR code generation
    } catch (error) {
      console.error("Error adding asset:", error);
      alert("Error adding asset.");
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
                className={`category-card ${selectedCategory === category ? "selected" : ""}`}
                onClick={() => handleCategoryClick(category)}
              >
                {category}
              </div>
            ))}

            <div className="button-group">
            <button className="back-button" onClick={() => navigate(-1)} >
                Back
                </button>
            <button className="next-button" onClick={handleNext} disabled={!selectedCategory}>
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
          onSubmit={() => console.log("Final Submission", formData)}
          prevPage={() => setCurrentPage(3)} // Pass prevPage
        />
      )}
    </div>
  );
};

const AssetForm = ({ category, setFormData, formData, nextPage, prevPage }) => {
  const [data, setData] = useState({
    name: "",
    purchaseDate: "",
    price: "",
    lifespan: "",
    warrantyDate: "",
    quantity: "",
    status: "Installed",
    installDate: "",
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
      <h1>Add New Asset ({category})</h1>
      <p>Basic Information</p>
      <form>
        <div className="form-group">
          <label>Name</label>
          <input type="text" name="name" value={data.name} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Purchase Date</label>
          <input type="date" name="purchaseDate" value={data.purchaseDate} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Purchase Price</label>
          <input type="number" name="price" value={data.price} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Life Span (years)</label>
          <input type="number" name="lifespan" value={data.lifespan} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Warranty Date</label>
          <input type="date" name="warrantyDate" value={data.warrantyDate} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Quantity (units)</label>
          <input type="number" name="quantity" value={data.quantity} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Status</label>
          <div>
            <label>
              <input type="radio" name="status" value="New" checked={data.status === "New"} onChange={handleChange} /> New
            </label>
            <label>
              <input type="radio" name="status" value="Installed" checked={data.status === "Installed"} onChange={handleChange} /> Installed
            </label>
          </div>
        </div>

        <div className="form-group">
          <label>Installation Date</label>
          <input type="date" name="installDate" value={data.installDate} onChange={handleChange} required />
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

const GreenTechForm = ({ category, setFormData, formData, nextPage, prevPage }) => {
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
      <input type="radio" name="greenTech" value="Yes" onChange={handleChange} /> Yes
      <input type="radio" name="greenTech" value="No" onChange={handleChange} /> No

      <label>Certified by SIRIM Eco Labelling Scheme?</label>
      <input type="radio" name="sirimEco" value="Yes" onChange={handleChange} /> Yes
      <input type="radio" name="sirimEco" value="No" onChange={handleChange} /> No

      <label>Certified by SIRIM Product Carbon Footprint Certification Scheme?</label>
      <input type="radio" name="sirimCarbon" value="Yes" onChange={handleChange} /> Yes
      <input type="radio" name="sirimCarbon" value="No" onChange={handleChange} /> No

      <label>Energy Efficiency Rating (stars)</label>
      <input type="number" name="efficiency" placeholder="if applicable" value={data.efficiency} onChange={handleChange} required />
      
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

const CategorySpecificForm = ({ category, setFormData, formData, onSubmit, prevPage }) => {
  const [data, setData] = useState({});

  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    setFormData({ ...formData, categoryData: data });
    onSubmit();
  };

  return (
    <div className="asset-form">
      <h1>Extended Information ({category})</h1>

      {/* Conditional Fields for Lights */}
      {category === "Lights" && (
        <>
          <div className="form-group">
            <label>Light Type</label>
            <input type="text" name="lightType" onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Serial Number</label>
            <input type="text" name="serialNumber" onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Voltage</label>
            <input type="text" name="voltage" onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Lumens</label>
            <input type="text" name="lumens" onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Estimated Energy Consumption (in kWh/year)</label>
            <input type="text" name="energyConsumption" onChange={handleChange} required />
          </div>
        </>
      )}

      {/* Fields for Elevators */}
      {category === "Elevators" && (
        <>
          <div className="form-group">
            <label>Weight Capacity (kg)</label>
            <input type="text" name="weightCapacity" onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Dimension</label>
            <input type="text" name="dimension" onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Power Mechanism</label>
            <input type="text" name="powerMechanism" onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Speed of Travel</label>
            <input type="text" name="speedOfTravel" onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Estimated Energy Consumption (in kWh/year)</label>
            <input type="text" name="energyConsumption" onChange={handleChange} required />
          </div>
        </>
      )}

    {/* Fields for CCTV */}
    {category === "CCTV" && (
        <>
          <div className="form-group">
            <label>Resolution</label>
            <input type="text" name="resolution" onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Field of View</label>
            <input type="text" name="fieldOfView" onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Recording Capacity</label>
            <input type="text" name="recordingCapacity" onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Frame Rate</label>
            <input type="text" name="frameRate" onChange={handleChange} required />
          </div>
        </>
      )}

      {/* Fields for Gym Equipment */}
        {category === "Gym Equipment" && (
        <>
          <div className="form-group">
            <label>Equipment Type</label>
            <input type="text" name="equipmentType" onChange={handleChange} required />
          </div>
        </>
      )}

      {/* Fields for Miscellaneous */}
      {category === "Miscellaneous" && (
        <>
          <div className="form-group">
            <label>Asset Description</label>
            <input type="text" name="assetDescription" onChange={handleChange} required />
          </div>
        </>
      )}
      
      <div className="button-group">
        <button type="button" className="back-button" onClick={prevPage}>
          Back
        </button>
        <button type="submit" className="submit-button">
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