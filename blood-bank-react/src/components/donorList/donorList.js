import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import swal from 'sweetalert';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../../assets/logo.png';
import Sidebar from '../sidebar/sidebar';
import './donorList.css';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const DonorList = () => {
    const [pincode, setPincode] = useState("");
    const [bloodGroup, setBloodGroups] = useState("any");
    const [donors, setDonors] = useState([]);

    const fetchDonor = async () => {
        let req = {
            bloodGroup,
            pincode
        };
        const response = await axios.post('http://localhost:4000/api/requests/getDonorsList', req, {
            headers: {
                Authorization: `${localStorage.getItem('token')}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.data.status === 0) {
            setDonors([])
            swal({
                title: "Error",
                text: response.data.message,
                icon: "error",
                button: "Okay"
            });
        } else {
            setDonors(response.data.data);
        }
    };

    useEffect(() => {
        fetchDonor();
    }, []);

    const [selectedDonors, setSelectedDonors] = useState([]);

    const isAllSelected = donors.length > 0 && selectedDonors.length === donors.length;

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedDonors([]);
        } else {
            setSelectedDonors(donors.map(d => d._id));
        }
    };

    const handleCheckboxChange = (donorId) => {
        setSelectedDonors(prev =>
            prev.includes(donorId)
                ? prev.filter(id => id !== donorId)
                : [...prev, donorId]
        );
    };

    const navigate = useNavigate();

    const handleRaiseRequest = () => {
        navigate('/request-form', {
            state: {
                selectedDonors
            },
        });
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

                {/* Main */}
                <div className="donor-list-container">
                    <h2>Donor List</h2>

                    <form
                        className="donor-filter-form-row"
                        onSubmit={(e) => {
                            e.preventDefault();
                            fetchDonor();
                        }}
                    >
                        <div className="form-item">
                            <label htmlFor="pincode">Pincode</label>
                            <input
                                type="text"
                                id="pincode"
                                placeholder="Enter Pincode"
                                value={pincode}
                                onChange={(e) => setPincode(e.target.value)}
                            />
                        </div>

                        <div className="form-item">
                            <label htmlFor="bloodGroup">Blood Group</label>
                            <select
                                id="bloodGroup"
                                value={bloodGroup}
                                onChange={(e) => setBloodGroups(e.target.value)}
                            >
                                <option value="any">All</option>
                                {bloodGroups.map((bg) => (
                                    <option key={bg} value={bg}>{bg}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-item">
                            <label className="invisible">Apply</label>
                            <button type="submit" className="submit-button">Apply Filter</button>
                        </div>
                    </form>

                    <div className="donor-table-wrapper">
                        <motion.table
                            className="donor-table"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <thead>
                                <tr>
                                    <th>
                                        <input
                                            type="checkbox"
                                            checked={isAllSelected}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                    <th>Name</th>
                                    <th>Blood Group</th>
                                    <th>Pincode</th>
                                    <th>Phone Number</th>
                                </tr>
                            </thead>
                            <tbody>
                                {donors.map((donor) => (
                                    <tr key={donor._id}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedDonors.includes(donor._id)}
                                                onChange={() => handleCheckboxChange(donor._id)}
                                            />
                                        </td>
                                        <td>{donor.userName}</td>
                                        <td>{donor.bloodGroup}</td>
                                        <td>{donor.pincode}</td>
                                        <td>{donor.phoneNumber}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </motion.table>
                    </div>

                    <div className="raise-request-action">
                        <button
                            type="button"
                            className="submit-button"
                            disabled={selectedDonors.length === 0}
                            onClick={handleRaiseRequest}
                        >
                            Raise Request
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

};

export default DonorList;
