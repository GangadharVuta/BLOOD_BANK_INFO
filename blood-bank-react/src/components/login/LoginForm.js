import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './Loginpage.css';
import swal from 'sweetalert';


// ... inside return block

const LoginPage = () => {
    const [emailId, setEmailId] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const handleLogin = async () => {
        try {
            const response = await axios.post('http://localhost:4000/api/users/login', { emailId, password });
            if (response.data.status === 0) {
                swal({
                    title: "Error",
                    text: typeof response.data.message === 'string' ? response.data.message : JSON.stringify(response.data.message),
                    icon: "error",
                    button: "Okay"
                });
            } else {
                localStorage.setItem('token', response.data.access_token);
                localStorage.setItem('userId', response.data.data._id);
                swal(typeof response.data.message === 'string' ? response.data.message : JSON.stringify(response.data.message));
                navigate(`/`);
            }
        } catch (error) {
            console.error('Login error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Login failed. Please try again.';
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
                {/* <p>
                    <Link to="/forgot-password">Forgot Password?</Link>
                </p> */}
                {/* Optional Forgot Password link */}
                {/* Register link */}
                <p>
                    Don’t have an account? <Link to="/register">Register here</Link>
                </p>
            </div>
        </div>

    );
};

export default LoginPage;
