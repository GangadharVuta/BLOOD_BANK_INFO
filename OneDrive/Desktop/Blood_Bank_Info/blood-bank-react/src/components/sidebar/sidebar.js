import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import swal from 'sweetalert';

const Sidebar = () => {
    const navigate = useNavigate()
    const location = useLocation(); // Get current location

    const handleLogout = async () => {
        const token = localStorage.getItem('token'); // Remove token from localStorage
        const response = await axios.get('http://localhost:4000/api/users/logout', {
            headers: {
                'Authorization': `${token}`, // Send the token in the Authorization header
                'Content-Type': 'application/json',  // Specify content type (optional)
            }
        },);
        if (response.data.status === 0) {
            swal({
                title: "Error",
                text: typeof response.data.message === 'string' ? response.data.message : JSON.stringify(response.data.message),
                icon: "error",
                button: "Okay"
            });
        } else {
            localStorage.removeItem('token'); // Remove token from localStorage
            swal("Logout successfully")
            navigate(`/`);
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
    const isChangePasswordPage = location.pathname === '/change-password';
    const isProfilePage = location.pathname === '/profile';
    const isDashboardPage = location.pathname === '/dashboard';
    const isRequestBloodPage = location.pathname === '/request-blood';
    const isBloodBanksPage = location.pathname === '/nearby-blood-banks';
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
