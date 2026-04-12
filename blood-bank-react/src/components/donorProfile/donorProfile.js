import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import './donorProfile.css';
import UserLogo from '../../assets/user.png';
import { FaPen } from 'react-icons/fa'; // Pencil Icon
import swal from 'sweetalert';


const DonorProfile = () => {
  const [donor, setDonor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Calculate if donor is available based on last donation date
  const isAvailable = (donor) => {
    if (!donor || !donor.lastDonationDate) return true; // Assume available if no history
    const lastDonation = dayjs(donor.lastDonationDate);
    const today = dayjs();
    const monthsPassed = today.diff(lastDonation, 'month');
    return monthsPassed >= 3;
  };

  useEffect(() => {
    const fetchDonor = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('Not authenticated. Please login first.');
          setLoading(false);
          return;
        }

        const response = await axios.get('http://localhost:4000/api/users/profile', {
          headers: {
            Authorization: token,
            'Content-Type': 'application/json',
          },
        });

        if (response.data.status === 0) {
          swal({
            title: "Error",
            text: typeof response.data.message === 'string' ? response.data.message : JSON.stringify(response.data.message),
            icon: "error",
            button: "Okay"
          });
          setError('Failed to load profile');
        } else {
          setDonor(response.data.data);
          setLoading(false);
        }

      } catch (err) {
        console.error('Profile fetch error:', err.response?.status, err.message);
        if (err.response?.status === 401) {
          setError('Session expired. Please login again.');
          localStorage.removeItem('token');
        } else {
          setError('Unable to fetch donor data');
        }
        setLoading(false);
      }
    };

    fetchDonor();
  }, []);

  if (loading) return <div className="p-6">Loading profile...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <>
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
        <div className="profile-card">
          <img className="profile-pic" src={UserLogo} alt="profile" />
          <p>Name: <strong>{donor.userName}</strong></p>
          <p>Phone No: <strong>{donor.phoneNumber}</strong></p>
          <p>Email: <strong>{donor.emailId}</strong></p>
          <p>Pincode: <strong>{donor.pincode}</strong></p>
          <p>Blood Group: <strong>{donor.bloodGroup}</strong></p>
          <p>Last Donation Date: <strong>{donor.lastDonationDate ? dayjs(donor.lastDonationDate).format('DD MMM YYYY') : 'No donation history'}</strong></p>
          <p>Donation Status: <strong>{isAvailable(donor) ? '✅ Available' : '⏳ Not Available (3-month cooldown)'}</strong></p>
        </div>
      </div>
    </>
  );
};

export default DonorProfile;
