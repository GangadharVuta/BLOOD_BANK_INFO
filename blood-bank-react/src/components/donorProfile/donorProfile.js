import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import './donorProfile.css';
import Logo from '../../assets/logo.png';
import UserLogo from '../../assets/user.png';
import { FaPen } from 'react-icons/fa'; // Pencil Icon
import Sidebar from '../sidebar/sidebar';
import swal from 'sweetalert';


const DonorProfile = () => {
  const [donor, setDonor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDonor = async () => {
      try {
        const response = await axios.get('http://localhost:4000/api/users/profile', {
          headers: {
            Authorization: `${localStorage.getItem('token')}`,
          },
        });

        if (response.data.status === 0) {
          swal({
            title: "Error",
            text: response.data.message,
            icon: "error",
            button: "Okay"
          });
        } else {
          const donorData = response.data.data;
          const lastDonation = dayjs(donorData.lastDonationDate);
          const today = dayjs();
          const monthsPassed = today.diff(lastDonation, 'month');
          donorData.isAvailable = monthsPassed >= 3;
          setDonor(donorData);
          setLoading(false);
        }

      } catch (err) {
        setError('Unable to fetch donor data');
        setLoading(false);
      }
    };

    fetchDonor();
  }, []);

  if (loading) return <div className="p-6">Loading profile...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="donor-profile-container">
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
        {/* Main */}
        <main className="main">
          <header className="header">
            <div>
              <h2>User Profile</h2>
              <p>Welcome to Blood Connect Portal</p>
            </div>
            <Link to={`/edit-profile`} className="edit-icon" title="Edit Profile">
              <FaPen size={20} />
            </Link>
          </header>

          <div className="grid profile-grid">
            <div className="card profile-card">
              <img className="profile-pic" src={UserLogo} alt="profile" />
              <p>Name: <strong>{donor.userName}</strong></p>
              <p>Phone No: <strong>{donor.phoneNumber}</strong></p>
              <p>Email: <strong>{donor.emailId}</strong></p>
              <p>Pincode: <strong>{donor.pincode}</strong></p>
              <p>Blood Group: <strong>{donor.bloodGroup}</strong></p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DonorProfile;
