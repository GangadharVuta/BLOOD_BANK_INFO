import React, { useState, useEffect } from "react";
import axios from 'axios';
import swal from 'sweetalert';
import { Link } from 'react-router-dom';
import Logo from '../../assets/logo.png';
import Sidebar from '../sidebar/sidebar';
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
                text: typeof response.data.message === 'string' ? response.data.message : JSON.stringify(response.data.message),
                icon: "error",
                button: "Okay"
            });
        } else {
            setDonors(response.data.data);
        }
    };

    const fetchChartData = async () => {
        try {
            const pendingRes = await axios.post('http://localhost:4000/api/requests/getDonorsListForRequests', { status: 'pending' }, {
                headers: {
                    Authorization: `${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
            });
            const acceptedRes = await axios.post('http://localhost:4000/api/requests/getDonorsListForRequests', { status: 'accepted' }, {
                headers: {
                    Authorization: `${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
            });
            const rejectedRes = await axios.post('http://localhost:4000/api/requests/getDonorsListForRequests', { status: 'rejected' }, {
                headers: {
                    Authorization: `${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
            });

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
            console.log('Error fetching chart data:', error);
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
