import React, { useState, useEffect } from "react";
import supabase from "../../backend/DBClient/SupaBaseClient";
import { AlertCircle } from "lucide-react";
import "./viewProfile.css";

const TermsAndConditionsPopup = ({ userId, onAgree, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [checked, setChecked] = useState(false);

  const handleAgree = async () => {
    if (!checked) {
      setError("You must agree to the Terms and Conditions to proceed.");
      return;
    }

    setIsLoading(true);
    try {
      // Update the user's agreement status in the database
      const { error } = await supabase
        .from("users")
        .update({ isAgreeTnC: true })
        .eq("userId", userId);

      if (error) {
        console.error("Error updating T&C agreement status:", error);
        setError("Failed to record your agreement. Please try again.");
      } else {
        // Call the onAgree callback to notify parent component
        onAgree();
      }
    } catch (error) {
      console.error("Unexpected error recording T&C agreement:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal tc-modal">
        <h3>Terms and Conditions</h3>
        
        {error && (
          <div className="error-container">
            <AlertCircle size={16} />
            <p className="error-message">{error}</p>
          </div>
        )}

        <div className="tc-content">
          <h4>Personal Data Protection Notice</h4>
          <p>In accordance with the Malaysian Personal Data Protection Act 2010 (PDPA), this notice informs you about our practices regarding the collection, use, and protection of your personal data.</p>
          
          <h5>1. Collection of Personal Information</h5>
          <p>We collect personal information including but not limited to your name, email address, contact number, and housing unit details to provide you with our services. By editing your profile, you consent to our collection and processing of this information.</p>
          
          <h5>2. Purpose of Collection</h5>
          <p>Your personal information will be used for:</p>
          <ul>
            <li>Managing your user account</li>
            <li>Providing housing-related services</li>
            <li>Communication regarding community announcements</li>
            <li>Processing of facility bookings and maintenance requests</li>
            <li>Statistical analysis and reporting (in anonymized form)</li>
          </ul>
          
          <h5>3. Disclosure of Information</h5>
          <p>Your personal information may be disclosed to:</p>
          <ul>
            <li>Property management staff</li>
            <li>Service providers and contractors as necessary</li>
            <li>Relevant regulatory authorities when legally required</li>
          </ul>
          
          <h5>4. Data Security</h5>
          <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
          
          <h5>5. Data Retention</h5>
          <p>Your personal information will be retained for as long as necessary to fulfill the purposes outlined in this notice or as required by law.</p>
          
          <h5>6. Your Rights</h5>
          <p>Under the PDPA, you have the right to:</p>
          <ul>
            <li>Access your personal data</li>
            <li>Correct inaccurate personal data</li>
            <li>Withdraw consent for processing of your personal data</li>
            <li>Limit the processing of your personal data for specific purposes</li>
          </ul>
          
          <h5>7. Changes to This Notice</h5>
          <p>We may update this notice periodically. Any significant changes will be communicated through appropriate channels.</p>
          
          <h5>8. Contact Information</h5>
          <p>For inquiries or requests regarding your personal data, please contact our Data Protection Officer at dpo@ourhousingapp.com</p>
        </div>

        <div className="agreement-checkbox">
          <input
            type="checkbox"
            id="agree-tc"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
          <label htmlFor="agree-tc">
            I have read, understood and agree to the Terms and Conditions and consent to the collection and processing of my personal data as described.
          </label>
        </div>

        <div className="modal-buttons">
          <button
            onClick={handleAgree}
            className="save-button"
            disabled={isLoading || !checked}
          >
            {isLoading ? "Processing..." : "Agree & Continue"}
          </button>
          <button
            onClick={onClose}
            className="close-button"
            disabled={isLoading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditionsPopup;