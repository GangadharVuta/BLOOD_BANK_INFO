import React, { useState } from 'react';
import axios from 'axios';
import swal from 'sweetalert';
import { Link, useNavigate } from 'react-router-dom';
import '../donorProfile/donorProfile.css';
import Logo from '../../assets/logo.png';
import Sidebar from '../sidebar/sidebar';
import './changePassword.css';

const ChangePassword = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const navigate = useNavigate();
    const handleSubmit = async (e) => {
        e.preventDefault();
        // Add validation or API call here
        if (newPassword !== confirmPassword) {
            swal({
                title: "Error",
                text: "New passwords do not match!",
                icon: "error",
                button: "Okay"
            });
            return;
        }

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

            const passwordDetails = {
                oldPassword: currentPassword,
                newPassword: newPassword
            };

            const response = await axios.post('http://localhost:4000/api/users/changePassword', passwordDetails, {
                headers: {
                    Authorization: token,
                    'Content-Type': 'application/json',
                }
            });
            console.log(`response: ${JSON.stringify(response)}`)

            if (response.data.status === 0) {
                swal({
                    title: "Error",
                    text: typeof response.data.message === 'string' ? response.data.message : JSON.stringify(response.data.message),
                    icon: "error",
                    button: "Okay"
                });
            } else {
                localStorage.removeItem('token'); // Remove token from localStorage
                swal(typeof response.data.message === 'string' ? response.data.message : JSON.stringify(response.data.message))
                navigate('/login')
            }
        } catch (error) {
            console.error('Change password error:', error.response?.status, error.message);
            if (error.response?.status === 401) {
                swal({
                    title: "Error",
                    text: "Session expired. Please login again.",
                    icon: "error",
                    button: "Okay"
                });
                localStorage.removeItem('token');
                navigate('/login');
            } else {
                swal({
                    title: "Error",
                    text: error.response?.data?.message || "Failed to change password",
                    icon: "error",
                    button: "Okay"
                });
            }
        }
    };

    return (
        <div>
            <div className="dashboard responsive-layout">
                {/* Sidebar */}
                <Sidebar />
                {/* Main */}
                <div className="change-password-container">
                    <h2>Change Password</h2>
                    <form className="change-password-form" onSubmit={handleSubmit}>
                        <label htmlFor="currentPassword">Current Password</label>
                        <input
                            type="password"
                            id="currentPassword"
                            placeholder="Enter current password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                        />

                        <label htmlFor="newPassword">New Password</label>
                        <input
                            type="password"
                            id="newPassword"
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />

                        <label htmlFor="confirmPassword">Confirm New Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />

                        <button type="submit">Update Password</button>
                    </form>
                </div>
            </div>
        </div>

    );
};

export default ChangePassword;
