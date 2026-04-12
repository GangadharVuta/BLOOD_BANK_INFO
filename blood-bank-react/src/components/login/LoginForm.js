import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import './Loginpage.css';
import swal from 'sweetalert';


// ... inside return block

const LoginPage = () => {
    const [emailId, setEmailId] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const handleLogin = async () => {
        try {
            console.log('Attempting login with:', { emailId, password });
            const response = await apiService.post('/api/users/login', { emailId, password });
            console.log('Login response:', response.data);
            if (response.data.status === 0) {
                swal({
                    title: "Error",
                    text: typeof response.data.message === 'string' ? response.data.message : JSON.stringify(response.data.message),
                    icon: "error",
                    button: "Okay"
                });
            } else {
                // Store token and user data
                localStorage.setItem('token', response.data.access_token);
                localStorage.setItem('userId', response.data.data._id);
                swal(typeof response.data.message === 'string' ? response.data.message : JSON.stringify(response.data.message));
                navigate(`/`);
            }
        } catch (error) {
            console.error('Login error details:', error);
            console.error('Error response:', error.response);
            console.error('Error message:', error.message);

            let errorMessage = 'Login failed. Please try again.';

            if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
                errorMessage = 'Network Error: Cannot connect to server. Please check if the backend is running on port 4000.';
            } else if (error.response) {
                // Server responded with error status
                errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
            } else if (error.request) {
                // Request was made but no response received
                errorMessage = 'No response from server. Please check your internet connection.';
            }

            swal('Login Error', errorMessage, 'error');
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>Login</h2>
                <input type="email" placeholder="EmailId" value={emailId} onChange={(e) => setEmailId(e.target.value)} />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button onClick={handleLogin}>Login</button>
                <p>
                    <Link to="/forgot-password">Forgot Password?</Link>
                </p>
                {/* Register link */}
                <p>
                    Don’t have an account? <Link to="/register">Register here</Link>
                </p>
            </div>
        </div>

    );
};

export default LoginPage;
