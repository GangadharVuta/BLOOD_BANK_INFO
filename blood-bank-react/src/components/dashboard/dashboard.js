import React, { useState, useEffect } from "react";
import axios from 'axios';
import swal from 'sweetalert';
import { Link } from 'react-router-dom';
import Logo from '../../assets/logo.png';
import Sidebar from '../sidebar/sidebar';
import './dashboard.css'
// Sample data for tables
const tableData1 = [
    { id: 1, name: "John Doe", age: 28 },
    { id: 2, name: "Jane Smith", age: 34 },
    { id: 3, name: "Sam Brown", age: 22 }
];

const tableData2 = [
    { id: 1, product: "Laptop", price: "$1000" },
    { id: 2, product: "Phone", price: "$600" },
    { id: 3, product: "Tablet", price: "$400" }
];

const Dashboard = () => {
    // State to manage which tab is selected
    const [donors, setDonors] = useState([]);

    const fetchDonor = async (activeTab) => {
        let req = {
            status: activeTab
        };
        const response = await axios.post('http://localhost:4000/api/requests/getDonorsListForRequests', req, {
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
        fetchDonor('pending');
    }, []);

    const handleChange = async (tabName) => {
        setDonors([])
        await fetchDonor(tabName);
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

                {/* Main Content */}
                <div className="my-requests-container">
                    <h2>My Requests</h2>
                    <div className="filter-buttons">
                        <button onClick={() => handleChange("pending")}>Pending</button>
                        <button onClick={() => handleChange("accepted")}>Accepted</button>
                        <button onClick={() => handleChange("rejected")}>Rejected</button>
                        {/* <button onClick={() => handleChange("cancelled")}>Cancelled</button> */}
                    </div>
                    <div className="donor-table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>S.No</th>
                                    <th>Name</th>
                                    <th>Blood Group</th>
                                    <th>Pincode</th>
                                    <th>Phone Number</th>
                                    <th>Request No</th>
                                </tr>
                            </thead>
                            <tbody>
                                {donors && donors.length > 0 ? donors.map((donor, index) => (
                                    <tr key={donor._id}>
                                        <td>{index + 1}</td>
                                        <td>{donor.userName}</td>
                                        <td>{donor.bloodGroup}</td>
                                        <td>{donor.pincode}</td>
                                        <td>{donor.phoneNumber}</td>
                                        <td>{donor.requestId}</td>
                                    </tr>
                                )) : <p>No requests found</p>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );

};

export default Dashboard;
