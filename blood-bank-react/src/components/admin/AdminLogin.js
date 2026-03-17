/**
 * ============================================
 * ADMIN LOGIN COMPONENT
 * ============================================
 * Secure admin authentication portal
 * 
 * Features:
 * - Email/password authentication
 * - Form validation
 * - Error handling with Sweetalert
 * - Loading states
 * - Redirect to dashboard on success
 * - Stores JWT in localStorage
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import './AdminLogin.css';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  /**
   * Redirect if already logged in as admin
   */
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      navigate('/admin/dashboard');
    }
  }, [navigate]);

  /**
   * Update form field
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Validate form
   */
  const validateForm = () => {
    const { email, password } = formData;

    if (!email || !password) {
      Swal.fire({
        icon: 'error',
        title: 'Missing Fields',
        text: 'Please fill in all fields'
      });
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Email',
        text: 'Please enter a valid email address'
      });
      return false;
    }

    if (password.length < 6) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Password',
        text: 'Password must be at least 6 characters'
      });
      return false;
    }

    return true;
  };

  /**
   * Handle login submission
   */
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await axios.post(
        '/api/admin/login',
        formData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        const { token, admin } = response.data.data;

        // Store token and admin info
        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminId', admin._id);
        localStorage.setItem('adminEmail', admin.email);
        localStorage.setItem('adminRole', admin.role);

        Swal.fire({
          icon: 'success',
          title: 'Login Successful',
          text: `Welcome, ${admin.name}!`
        });

        // Redirect to dashboard
        navigate('/admin/dashboard');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <h1>BloodConnect Admin</h1>
          <p>Secure Administration Portal</p>
        </div>

        <form onSubmit={handleLogin} className="admin-login-form">
          <div className="form-group">
            <label htmlFor="email">Admin Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your admin email"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="admin-login-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Logging in...
              </>
            ) : (
              'Login to Dashboard'
            )}
          </button>
        </form>

        <div className="admin-login-footer">
          <p>For support, contact: support@bloodconnect.com</p>
        </div>
      </div>

      {/* Background decoration */}
      <div className="admin-login-bg">
        <div className="circle circle-1"></div>
        <div className="circle circle-2"></div>
        <div className="circle circle-3"></div>
      </div>
    </div>
  );
};

export default AdminLogin;
