import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './RegisterPage.css';
import axios from 'axios';
import swal from 'sweetalert';
import Logo from '../../assets/logo.png';

function RegisterPage() {
    const [userName, setUserName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [pincode, setPincode] = useState('');
    const [emailId, setEmailId] = useState('');
    const [bloodGroup, setBloodGroup] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!/^\d{10}$/.test(phoneNumber)) {
            swal("Invalid phone number. Please enter a valid 10-digit number.", "error");
            return;
        }

        if (!/^\d{6}$/.test(pincode)) {
            swal("Invalid pincode. Please enter a valid 6-digit pincode.", "error");
            return;
        }

        if (password.length < 6) {
            swal("Password should be at least 6 characters.", "error");
            return;
        }

        if (password !== confirmPassword) {
            swal("Passwords do not match.", "error");
            return;
        }


        try {
            const userObj = {
                userName,
                phoneNumber,
                pincode,
                emailId,
                bloodGroup,
                password,
                role: 'Donor'
            };

            const response = await axios.post('http://localhost:4000/api/users/register', userObj);
            if (response.data.status === 0) {
                swal({
                    title: "Error",
                    text: response.data.message,
                    icon: "error",
                    button: "Okay"
                });
            } else {
                resetForm();
                swal(response.data.message);
                navigate(`/login`);
            }

        } catch (error) {
            console.error('Error during API call:', error);
            swal('Failed to submit the form. Please try again later.', 'error');
        }
    };

    const resetForm = () => {
        setUserName('');
        setPhoneNumber('');
        setPincode('');
        setEmailId('');
        setBloodGroup('');
        setPassword('');
        setConfirmPassword('');
    };

    return (
        <div>
            {/* Navbar */}
            <nav className="navbar">
                <img src={Logo} alt="Logo" className="logo" />
                <div className="nav-links">
                    <Link to="/">Home</Link>
                    <Link to="/about">About Us</Link>
                    <Link to="/faq">FAQs</Link>
                </div>
            </nav>

            {/* Registration Form */}
            <div className="form-container col">
                <h2>Register</h2>
                <form onSubmit={handleSubmit} className="responsive-form">
                    <div className="form-group">
                        <label htmlFor="name">Name:</label>
                        <input type="text" id="name" value={userName} onChange={(e) => setUserName(e.target.value)} required />
                    </div>

                    <div className="form-group">
                        <label htmlFor="phone">Phone Number:</label>
                        <input type="text" id="phone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
                    </div>

                    <div className="form-group">
                        <label htmlFor="pincode">Pincode:</label>
                        <input type="text" id="pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} required />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email:</label>
                        <input type="email" id="email" value={emailId} onChange={(e) => setEmailId(e.target.value)} required />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password:</label>
                        <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password:</label>
                        <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                    </div>

                    <div className="form-group">
                        <label htmlFor="bloodGroup">Blood Group:</label>
                        <select id="bloodGroup" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} required>
                            <option value="">Select Blood Group</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                        </select>
                    </div>

                    <button type="submit"> Submit </button>
                </form>
                <p>
                    Do you have an account? <Link to="/login">Login here</Link>
                </p>
            </div>
        </div>
    );
}

export default RegisterPage;
