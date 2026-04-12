import React, { useState, useEffect } from "react";
import axios from "axios";
import swal from "sweetalert";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../donorProfile/donorProfile.css";
import "./RequestForm.css";
import Logo from "../../assets/logo.png";
import Sidebar from "../sidebar/sidebar";

const RequestForm = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const { selectedDonors = [], selectedBloodGroup = "any" } = location.state || {};

    const [formData, setFormData] = useState({
        userIds: selectedDonors,
        bloodGroup: selectedBloodGroup,
        address: "",
        pincode: ""
    });

    useEffect(() => {
        if (!selectedDonors || selectedDonors.length === 0) {
            swal("Error", "No donors selected", "error");
            navigate("/dashboard");
        }
    }, [selectedDonors, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate form data
        if (!formData.pincode || !formData.address) {
            swal("Error", "Please fill in all fields (Pincode and Address)", "error");
            return;
        }

        if (!formData.userIds || formData.userIds.length === 0) {
            swal("Error", "No donors selected", "error");
            return;
        }

        // Validate pincode (numeric, between 5-6 digits)
        if (!/^\d{5,6}$/.test(formData.pincode)) {
            swal("Error", "Please enter a valid pincode", "error");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            
            if (!token) {
                swal("Error", "Not authenticated. Please login first.", "error");
                return;
            }

            // Send blood request using JWT authentication only
            // CSRF is NOT needed for JWT-protected API endpoints
            const response = await axios.post(
                "http://localhost:4000/api/requests/requestDonors",
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            if (response.data.status === 0) {
                swal("Error", response.data.message, "error");
            } else {
                swal({
                    title: "Success!",
                    text: "Blood request sent successfully",
                    icon: "success",
                    button: "OK"
                }).then(() => {
                    navigate("/dashboard");
                });
            }
        } catch (error) {
            if (error.response?.status === 401) {
                swal("Error", "Session expired. Please login again.", "error");
                localStorage.removeItem("token");
                navigate("/login");
            } else {
                swal("Error", error.response?.data?.message || "Failed to send request. Please try again.", "error");
            }
        }
    };

    return (
        <div>
            <div className="dashboard responsive-layout">
                <Sidebar />

                <div className="form-container">
                    <h2>Blood Request</h2>

                    <form onSubmit={handleSubmit} className="request-form">
                        {/* Pincode */}
                        <div className="form-group">
                            <label>Pincode</label>
                            <input
                                type="text"
                                name="pincode"
                                value={formData.pincode}
                                onChange={handleChange}
                                required
                                maxLength="6"
                            />
                        </div>

                        {/* Address */}
                        <div className="form-group">
                            <label>Hospital / Address</label>
                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                required
                                rows="3"
                            />
                        </div>

                        {/* Submit */}
                        <button type="submit" className="submit-btn">
                            Send Blood Request
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RequestForm;
