import React, { useState, useEffect } from 'react';
import axios from 'axios';
import swal from 'sweetalert';
import { Link, useNavigate } from 'react-router-dom';
import '../donorProfile/donorProfile.css';
import Logo from '../../assets/logo.png';
import Sidebar from '../sidebar/sidebar';

const EditProfile = () => {
  const navigate = useNavigate();
  const [donor, setDonor] = useState({
    userName: '',
    phoneNumber: '',
    emailId: '',
    pincode: '',
    bloodGroup: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const id = localStorage.getItem('userId')

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
        console.log(`response: ${JSON.stringify(response)}`);
        setDonor(response.data.data);
        setLoading(false);
      } catch (err) {
        console.error('Profile fetch error:', err.response?.status, err.message);
        if (err.response?.status === 401) {
          setError('Session expired. Please login again.');
          localStorage.removeItem('token');
          setTimeout(() => window.location.href = '/login', 1500);
        } else {
          setError('Unable to fetch donor data');
        }
        setLoading(false);
      }
    };

    fetchDonor();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDonor({ ...donor, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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

      // Update donor data on the backend
      const response = await axios.post(`http://localhost:4000/api/users/updateUserProfile`, { ...donor, userId: id }, {
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
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
        swal(typeof response.data.message === 'string' ? response.data.message : JSON.stringify(response.data.message))
        navigate('/profile')
      }
    } catch (err) {
      console.error('Update profile error:', err.response?.status, err.message);
      if (err.response?.status === 401) {
        swal({
          title: "Error",
          text: "Session expired. Please login again.",
          icon: "error",
          button: "Okay"
        });
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError('Failed to update profile');
      }
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      {/* Dashboard Layout */}
      <div className="dashboard responsive-layout">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div className="edit-profile-container">
          <h2>Edit Profile</h2>
          <form onSubmit={handleSubmit}>
            <div>
              <label>Name</label>
              <input
                type="text"
                name="userName"
                value={donor.userName}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label>Phone No</label>
              <input
                type="text"
                name="phoneNumber"
                value={donor.phoneNumber}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label>Email</label>
              <input
                type="email"
                name="emailId"
                value={donor.emailId}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label>Pincode</label>
              <input
                type="text"
                name="pincode"
                value={donor.pincode}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label>Blood Group:</label>
              <select name="bloodGroup" id="bloodGroup" value={donor.bloodGroup} onChange={handleChange} required>
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
            <button type="submit">Save Changes</button>
          </form>
        </div>
      </div >
    </div >
  );

};

export default EditProfile;
