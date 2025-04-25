import React, { useState } from 'react';
import axios from 'axios';
import swal from 'sweetalert';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../donorProfile/donorProfile.css';
import Logo from '../../assets/logo.png';
import Sidebar from '../sidebar/sidebar';
import './requestForm.css';


const RequestForm = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { selectedDonors } = location.state || {};
    const [formData, setFormData] = useState({
        userIds: selectedDonors,
        bloodGroup: 'any',
        address: '',
        pincode: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const response = await axios.post('http://localhost:4000/api/requests/requestDonors', formData, {
            headers: {
                Authorization: `${localStorage.getItem('token')}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.data.status === 0) {
            swal({
                title: "Error",
                text: response.data.message,
                icon: "error",
                button: "Okay"
            });
        } else {
            swal(response.data.message)
            navigate('/dashboard')
        }
    };
    return (
        <div>
            <nav className="navbar">
                <img src={Logo} alt="Logo" className="logo" />
                <div className="nav-links">
                    <Link to="/">Home</Link>
                    <Link to="/about">About Us</Link>
                    <Link to="/faq">FAQs</Link>
                </div>
            </nav>

            <div className="dashboard responsive-layout">
                {/* Sidebar */}
                <Sidebar />

                <div className="form-container col">
                    <h2>Blood Request Form</h2>
                    <form onSubmit={handleSubmit} className="responsive-form">
                        <div className="form-group">
                            <label htmlFor="pincode">Pincode</label>
                            <input
                                type="text"
                                name="pincode"
                                value={formData.pincode}
                                onChange={handleChange}
                                required
                                className="w-full p-2 border rounded"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="address">Address</label>
                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                required
                                rows="3"
                                className="w-[500px] p-2 border rounded"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="bloodGroup">Blood Group:</label>
                            <select
                                name="bloodGroup"
                                value={formData.bloodGroup}
                                onChange={handleChange}
                                required
                                className="w-full p-2 border rounded"
                            >
                                <option value="any">Any</option>
                                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                                    <option key={bg} value={bg}>{bg}</option>
                                ))}
                            </select>
                        </div>
                        <button type="submit"> Submit </button>
                    </form>
                </div>
            </div>
        </div >
    );
};

export default RequestForm;
