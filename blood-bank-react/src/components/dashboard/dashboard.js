import React, { useState, useEffect } from "react";
import axios from 'axios';
import swal from 'sweetalert';
import { Link } from 'react-router-dom';
import Logo from '../../assets/logo.png';

import './dashboard.css'
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

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
    const [chartData, setChartData] = useState({
        labels: ['Pending', 'Accepted', 'Rejected'],
        datasets: [
            {
                label: 'Request Status',
                data: [0, 0, 0],
                backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                ],
                borderColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                ],
                borderWidth: 2,
            },
        ],
    });

    // Feature1 state: selected request and its donors
    const [selectedRequestId, setSelectedRequestId] = useState(null);
    const [requestDonors, setRequestDonors] = useState([]);
    const [loadingDonors, setLoadingDonors] = useState(false);
    const [donorError, setDonorError] = useState(null);

    const fetchDonor = async (activeTab) => {
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                swal({
                    title: "Error",
                    text: "Not authenticated. Please login first.",
                    icon: "error",
                    button: "Okay"
                });
                return;
            }

            let req = {
                status: activeTab
            };

            // Send request using JWT authentication only
            // CSRF is NOT needed for JWT-protected API endpoints
            const response = await axios.post('http://localhost:4000/api/requests/getDonorsListForRequests', req, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.data.status === 0) {
                setDonors([])
                swal({
                    title: "Error",
                    text: typeof response.data.message === 'string' ? response.data.message : JSON.stringify(response.data.message),
                    icon: "error",
                    button: "Okay"
                });
            } else {
                setDonors(response.data.data);
            }
        } catch (err) {
            console.error('Dashboard fetch error:', err.response?.status, err.message);
            if (err.response?.status === 401) {
                swal({
                    title: "Error",
                    text: "Session expired. Please login again.",
                    icon: "error",
                    button: "Okay"
                });
                localStorage.removeItem('token');
                window.location.href = '/login';
            } else {
                swal({
                    title: "Error",
                    text: "Failed to fetch requests",
                    icon: "error",
                    button: "Okay"
                });
            }
            setDonors([]);
        }
    };

    const fetchDonorsForRequest = async (requestId) => {
        setLoadingDonors(true);
        setDonorError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setDonorError('Not authenticated');
                setLoadingDonors(false);
                return;
            }
            const resp = await axios.get(`http://localhost:4000/api/requests/${requestId}/donors`, {
                headers: { Authorization: token }
            });
            if (resp.data.status === 1) {
                setRequestDonors(resp.data.data);
            } else {
                setRequestDonors([]);
                setDonorError(resp.data.message || 'No donors found');
            }
        } catch (err) {
            console.error('Fetch donors for request error', err.response?.status, err.message);
            setDonorError('Failed to load donors');
            setRequestDonors([]);
        }
        setLoadingDonors(false);
    };

    const fetchChartData = async () => {
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                console.warn('No token found for chart data');
                return;
            }

            const headerConfig = {
                headers: {
                    Authorization: token,
                    'Content-Type': 'application/json',
                },
            };

            const pendingRes = await axios.post('http://localhost:4000/api/requests/getDonorsListForRequests', { status: 'pending' }, headerConfig);
            const acceptedRes = await axios.post('http://localhost:4000/api/requests/getDonorsListForRequests', { status: 'accepted' }, headerConfig);
            const rejectedRes = await axios.post('http://localhost:4000/api/requests/getDonorsListForRequests', { status: 'rejected' }, headerConfig);

            const pendingCount = pendingRes.data.status !== 0 ? pendingRes.data.data.length : 0;
            const acceptedCount = acceptedRes.data.status !== 0 ? acceptedRes.data.data.length : 0;
            const rejectedCount = rejectedRes.data.status !== 0 ? rejectedRes.data.data.length : 0;

            setChartData({
                labels: ['Pending', 'Accepted', 'Rejected'],
                datasets: [
                    {
                        label: 'Request Status',
                        data: [pendingCount, acceptedCount, rejectedCount],
                        backgroundColor: [
                            '#FF6384',
                            '#36A2EB',
                            '#FFCE56',
                        ],
                        borderColor: [
                            '#FF6384',
                            '#36A2EB',
                            '#FFCE56',
                        ],
                        borderWidth: 2,
                    },
                ],
            });
        } catch (error) {
            console.error('Chart data fetch error:', error.response?.status, error.message);
            if (error.response?.status === 401) {
                console.warn('Session expired, clearing token');
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        }
    };

    useEffect(() => {
        fetchDonor('pending');
        fetchChartData();
    }, []);

    const handleChange = async (tabName) => {
        setDonors([])
        await fetchDonor(tabName);
    };

    return (
        <div className="dashboard-content">
            {/* Main Content */}
            <div className="my-requests-container">
                    <h2>Dashboard Overview</h2>
                    
                    {/* Pie Chart */}
                    <div className="chart-container">
                        <div className="pie-chart-wrapper">
                            <h3>Request Status Distribution</h3>
                            <Pie data={chartData} options={{
                                responsive: true,
                                plugins: {
                                    legend: {
                                        position: 'bottom',
                                    },
                                    title: {
                                        display: true,
                                        text: 'Blood Request Status Overview'
                                    }
                                }
                            }} />
                        </div>
                    </div>

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
                                    <tr
                                        key={donor._id}
                                        onClick={() => {
                                            setSelectedRequestId(donor.requestId);
                                            fetchDonorsForRequest(donor.requestId);
                                        }}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <td>{index + 1}</td>
                                        <td>{donor.userName}</td>
                                        <td>{donor.bloodGroup}</td>
                                        <td>{donor.pincode}</td>
                                        <td>{donor.phoneNumber}</td>
                                        <td>{donor.requestId}</td>
                                    </tr>
                                )) : <tr><td colSpan="6">No requests found</td></tr>}
                            </tbody>
                        </table>
                        <p style={{ fontSize: '0.8em', marginTop: '4px', color: '#888' }}>
                            * Click a row to view donors notified for that request
                        </p>
                    </div>

                    {selectedRequestId && (
                        <div className="request-donors-section" style={{ marginTop: '30px' }}>
                            <h3>Donors notified for request {selectedRequestId}</h3>
                            <button
                                style={{ marginBottom: '10px' }}
                                onClick={() => {
                                    setSelectedRequestId(null);
                                    setRequestDonors([]);
                                }}
                            >
                                Close
                            </button>

                            {loadingDonors ? (
                                <p>Loading donors...</p>
                            ) : donorError ? (
                                <p style={{ color: 'red' }}>{donorError}</p>
                            ) : requestDonors.length === 0 ? (
                                <p>No donors have been requested for this request.</p>
                            ) : (
                                <table>
                                    <thead>
                                        <tr>
                                            <th>S.No</th>
                                            <th>Name</th>
                                            <th>Blood Group</th>
                                            <th>Phone</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {requestDonors.map((don, idx) => (
                                            <tr key={don.userId || idx}>
                                                <td>{idx + 1}</td>
                                                <td>{don.userName || 'N/A'}</td>
                                                <td>{don.bloodGroup || 'N/A'}</td>
                                                <td>{don.phoneNumber || 'N/A'}</td>
                                                <td>{don.status}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>
        </div>
    );

};

export default Dashboard;
