import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import swal from 'sweetalert';

const Sidebar = () => {
    const navigate = useNavigate()
    const location = useLocation(); // Get current location
    const [isDonorExpanded, setIsDonorExpanded] = useState(false);

    const handleLogout = async () => {
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                localStorage.removeItem('token');
                localStorage.removeItem('userId');
                swal("Logged out successfully");
                navigate('/');
                return;
            }

            const response = await axios.get('http://localhost:4000/api/users/logout', {
                headers: {
                    'Authorization': `${token}`,
                    'Content-Type': 'application/json',
                }
            });

            // Clear localStorage regardless of response
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            
            if (response.data.status === 1) {
                swal("Logout successfully");
            } else {
                swal({
                    title: "Error",
                    text: typeof response.data.message === 'string' ? response.data.message : JSON.stringify(response.data.message),
                    icon: "error",
                    button: "Okay"
                });
            }
            navigate('/');
        } catch (error) {
            console.error('Logout error:', error);
            // Clear tokenfrom localStorage anyway
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            swal("Logged out successfully");
            navigate('/');
        }
    };
    const handleChangePassword = async () => {
        navigate(`/change-password`);
    };
    const handleChangeProfile = async () => {
        navigate(`/profile`);
    };

    const handleChangeDashboard = async () => {
        navigate(`/dashboard`);
    };

    const handleChangeRequestBlood = async () => {
        navigate(`/request-blood`);
    };
    const handleFindBloodBanks = async () => {
        navigate(`/nearby-blood-banks`);
    };
    const handleAddDonor = async () => {
        navigate(`/add-donor`);
    };
    const handleListDonors = async () => {
        navigate(`/list-donors`);
    };
    const handleDonorToggle = () => {
        setIsDonorExpanded(!isDonorExpanded);
    };
    const isChangePasswordPage = location.pathname === '/change-password';
    const isProfilePage = location.pathname === '/profile';
    const isDashboardPage = location.pathname === '/dashboard';
    const isRequestBloodPage = location.pathname === '/request-blood';
    const isBloodBanksPage = location.pathname === '/nearby-blood-banks';
    const isAddDonorPage = location.pathname === '/add-donor';
    const isListDonorsPage = location.pathname === '/list-donors';
    const isDonorActivePage = isAddDonorPage || isListDonorsPage;
    return (
        <div>
            <aside className="sidebar">
                <nav>
                    <ul>
                        <li
                            className={isProfilePage ? "active" : ""}
                            onClick={handleChangeProfile}
                        >
                            Profile
                        </li>
                        <li
                            className={`donor-menu ${isDonorActivePage ? "active" : ""} ${isDonorExpanded ? "expanded" : ""}`}
                            onClick={handleDonorToggle}
                        >
                            <span className="donor-label">🩸 Donor</span>
                            <span className={`dropdown-arrow ${isDonorExpanded ? "open" : ""}`}>▼</span>
                            {isDonorExpanded && (
                                <ul className="submenu">
                                    <li
                                        className={`submenu-item ${isAddDonorPage ? "active" : ""}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleAddDonor();
                                        }}
                                    >
                                        ➕ Add Donor
                                    </li>
                                    <li
                                        className={`submenu-item ${isListDonorsPage ? "active" : ""}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleListDonors();
                                        }}
                                    >
                                        📋 List Donors
                                    </li>
                                </ul>
                            )}
                        </li>
                        <li
                            className={isDashboardPage ? "active" : ""}
                            onClick={handleChangeDashboard}
                        >
                            Dashboard
                        </li>
                        <li
                            className={isRequestBloodPage ? "active" : ""}
                            onClick={handleChangeRequestBlood}
                        >
                            Request Blood
                        </li>
                        <li
                            className={isBloodBanksPage ? "active" : ""}
                            onClick={handleFindBloodBanks}
                        >
                            Find Blood Banks
                        </li>
                        <li
                            className={isChangePasswordPage ? "active" : ""}
                            onClick={handleChangePassword}
                        >
                            Change Password
                        </li>
                        <li
                            onClick={handleLogout}
                        >
                            Logout
                        </li>
                    </ul>
                </nav>
            </aside>
        </div>
    );
};

export default Sidebar;
