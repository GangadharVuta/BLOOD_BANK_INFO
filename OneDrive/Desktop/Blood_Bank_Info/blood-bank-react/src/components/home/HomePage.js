import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './HomePage.css';
import Logo from '../../assets/logo.png';
import 'font-awesome/css/font-awesome.min.css';
import swal from 'sweetalert';
import axios from 'axios';


function HomePage() {
    const advantages = [
        {
            title: "Quick Donor Matching",
            description: "Easily find matching blood donors based on your location and blood group."
        },
        {
            title: "Real-time Listings",
            description: "Access live donor data to ensure fast communication and timely donations."
        },
        {
            title: "Secure & Verified",
            description: "User details are verified and securely stored for your protection."
        },
        {
            title: "Community Support",
            description: "Join a helpful community ready to respond in emergencies."
        }
    ];
    const navigate = useNavigate();

    const handleLogout = async () => {
        const token = localStorage.getItem('token'); // Remove token from localStorage
        await axios.get('http://localhost:4000/api/users/logout',  {headers: {
            'Authorization': `${token}`, // Send the token in the Authorization header
            'Content-Type': 'application/json',  // Specify content type (optional)
          }},);
          localStorage.removeItem('token'); // Remove token from localStorage
        swal("Logout successfully")
        navigate(`/`);
      };
    
    const token =  localStorage.getItem('token')

    return (
        <div className="home-container">
            <nav className="navbar">
                <img src={Logo} alt="Form src folder" className="logo" />
                <div className="nav-links">
                    <Link to="/">Home</Link>
                    <Link to="/about" href="http://localhost:3000" target="_blank">About Us</Link>
                    <Link to="/faqs" href="http://localhost:3000" target="_blank">FAQs</Link>
                    <Link to="/nearby-blood-banks">Find Blood Banks</Link>
                    {token && token !== "" && token !== undefined && token !== 'undefined' ? 
                    <>
                    <Link onClick={handleLogout}>Logout</Link>
                    <Link to="/profile" className="fa fa-user-circle"></Link>
                    </>
                    :
                    <>
                    <Link to="/register">Register</Link>
                    {<Link to="/login">Login</Link> }
                    </>
                    
                    }
                    
                    {/* {isRegistered && <Link to="/donor-profile">Donor Profile</Link>}
                    <button onClick={handleRegister} disabled={isRegistered} className="register-nav-btn">
                        {isRegistered ? 'Registered' : 'Register'}
                    </button> */}
                </div>
            </nav>

            <div className="advantages-section">
                <h2>Why Use BloodConnect?</h2>
                <div className="advantages-cards">
                    {advantages.map((adv, index) => (
                        <div key={index} className="advantage-card">
                            <h3>{adv.title}</h3>
                            <p>{adv.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* <div className="card-section">
                {cards.map((card, index) => (
                    <div key={index} className="info-card">
                        <h3>{card.title}</h3>
                        <p>{card.description}</p>
                    </div>
                ))}
            </div> */}

            {/* <div className="button-group center-button">
                <button onClick={handleLogin} className="login-btn">
                    Login
                </button>
            </div> */}
        </div>
    );
}

export default HomePage;
