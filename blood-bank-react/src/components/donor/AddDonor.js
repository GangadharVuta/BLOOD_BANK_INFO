import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import swal from "sweetalert";
import "./AddDonor.css";

const AddDonor = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    bloodGroup: "",
    phone: "",
    pincode: "",
    lastDonationDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Name is required");
      return false;
    }
    if (!formData.bloodGroup) {
      setError("Blood group is required");
      return false;
    }
    if (!formData.phone.trim() || formData.phone.length < 10) {
      setError("Valid phone number is required (minimum 10 digits)");
      return false;
    }
    if (!formData.pincode.trim() || formData.pincode.length !== 6) {
      setError("Valid 6-digit pincode is required");
      return false;
    }
    if (!formData.lastDonationDate) {
      setError("Last donation date is required");
      return false;
    }

    // Validate phone number (only digits)
    if (!/^\d+$/.test(formData.phone)) {
      setError("Phone number should contain only digits");
      return false;
    }

    // Validate pincode (only digits)
    if (!/^\d{6}$/.test(formData.pincode)) {
      setError("Pincode should be exactly 6 digits");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const authToken = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      if (!authToken) {
        setError("Authentication token not found. Please login again.");
        setLoading(false);
        return;
      }

      if (!userId) {
        setError("User ID not found. Please login again.");
        setLoading(false);
        return;
      }

      console.log("📝 Submitting donor data:", {
        name: formData.name,
        bloodGroup: formData.bloodGroup,
        phone: formData.phone,
        pincode: formData.pincode,
        lastDonationDate: formData.lastDonationDate,
        addedBy: userId,
      });

      const payloadData = {
        name: formData.name.trim(),
        bloodGroup: formData.bloodGroup,
        phone: formData.phone.trim(),
        pincode: formData.pincode.trim(),
        lastDonationDate: formData.lastDonationDate,
        addedBy: userId, // Current user's ID
      };

      const response = await axios.post(
        "http://localhost:4000/api/donors",
        payloadData,
        {
          headers: {
            Authorization: authToken,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Response:", response.data);

      if (response.data.status === 1 || response.data.success) {
        swal({
          title: "Success!",
          text: "Donor added successfully",
          icon: "success",
          button: "Okay",
        }).then(() => {
          navigate("/list-donors");
        });
      } else {
        setError(
          response.data.message || "Failed to add donor. Please try again."
        );
      }
    } catch (err) {
      console.error("❌ Error adding donor:", err);
      console.error("❌ Response data:", err.response?.data);
      
      if (err.response?.status === 401) {
        setError("Session expired. Please login again.");
        localStorage.removeItem("token");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "An error occurred while adding the donor";
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: "",
      bloodGroup: "",
      phone: "",
      pincode: "",
      lastDonationDate: "",
    });
    setError(null);
  };

  const handleCancel = () => {
    navigate("/list-donors");
  };

  return (
    <div className="add-donor-container">
      <div className="add-donor-wrapper">
        <div className="add-donor-header">
          <h1>🩸 Add New Donor</h1>
          <p>Register a new donor in the system</p>
        </div>

        {error && (
          <div className="error-alert">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="add-donor-form">
          <div className="form-group">
            <label htmlFor="name">Full Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter donor name"
              disabled={loading}
              className="form-input"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="bloodGroup">Blood Group *</label>
              <select
                id="bloodGroup"
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleInputChange}
                disabled={loading}
                className="form-input"
              >
                <option value="">Select Blood Group</option>
                {bloodGroups.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter phone number"
                disabled={loading}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="pincode">Pincode *</label>
              <input
                type="text"
                id="pincode"
                name="pincode"
                value={formData.pincode}
                onChange={handleInputChange}
                placeholder="Enter 6-digit pincode"
                disabled={loading}
                className="form-input"
                maxLength="6"
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastDonationDate">Last Donation Date *</label>
              <input
                type="date"
                id="lastDonationDate"
                name="lastDonationDate"
                value={formData.lastDonationDate}
                onChange={handleInputChange}
                disabled={loading}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Adding Donor..." : "Add Donor"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleReset}
              disabled={loading}
            >
              Reset
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDonor;
