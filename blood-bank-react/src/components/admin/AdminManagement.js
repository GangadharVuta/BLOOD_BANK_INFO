/**
 * ============================================
 * ADMIN MANAGEMENT COMPONENT
 * ============================================
 * Allows super admins to:
 * - Create new admin accounts
 * - View all admins
 * - Change existing admin passwords
 */

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import './AdminManagement.css';

const AdminManagement = () => {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin'
  });

  const adminRole = localStorage.getItem('adminRole') || '';

  useEffect(() => {
    if (adminRole !== 'super_admin') {
      return;
    }

    fetchAdmins();
  }, [adminRole]);

  const getToken = () => localStorage.getItem('adminToken');

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        navigate('/admin/login');
        return;
      }

      const response = await axios.get('/api/admin/list', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setAdmins(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching admins:', err);
      if (err.response?.status === 401) {
        navigate('/admin/login');
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load admin list'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.password) {
      Swal.fire('Error', 'Name, email, and password are required', 'error');
      return;
    }

    if (form.password.length < 6) {
      Swal.fire('Error', 'Password must be at least 6 characters', 'error');
      return;
    }

    try {
      setCreating(true);
      const token = getToken();
      const response = await axios.post(
        '/api/admin/create-admin',
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        Swal.fire('Success', 'New admin created', 'success');
        setForm({ name: '', email: '', password: '', role: 'admin' });
        fetchAdmins();
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to create admin';
      Swal.fire('Error', errorMessage, 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAdmin = async (admin) => {
    if (admin.role === 'super_admin') {
      Swal.fire('Error', 'Cannot delete super admin accounts', 'error');
      return;
    }

    const result = await Swal.fire({
      icon: 'warning',
      title: 'Confirm Delete',
      text: `Are you sure you want to delete admin "${admin.email}"?`,
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        const token = getToken();
        const response = await axios.delete(
          `/api/admin/${admin._id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (response.data.success) {
          Swal.fire('Success', 'Admin deleted', 'success');
          fetchAdmins();
        }
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Failed to delete admin';
        Swal.fire('Error', errorMessage, 'error');
      }
    }
  };

  const handleChangePassword = async (admin) => {
    const { value: formValues } = await Swal.fire({
      title: `Change password for ${admin.email}`,
      html:
        '<input id="swal-input1" type="password" class="swal2-input" placeholder="New password" />' +
        '<input id="swal-input2" type="password" class="swal2-input" placeholder="Confirm password" />',
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => {
        const newPassword = document.getElementById('swal-input1').value;
        const confirmPassword = document.getElementById('swal-input2').value;

        if (!newPassword || !confirmPassword) {
          Swal.showValidationMessage('Both fields are required');
          return null;
        }

        if (newPassword !== confirmPassword) {
          Swal.showValidationMessage('Passwords do not match');
          return null;
        }

        if (newPassword.length < 6) {
          Swal.showValidationMessage('Password must be at least 6 characters');
          return null;
        }

        return newPassword;
      }
    });

    if (!formValues) return;

    try {
      const token = getToken();
      const response = await axios.put(
        `/api/admin/${admin._id}`,
        { password: formValues },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        Swal.fire('Success', 'Password updated', 'success');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update password';
      Swal.fire('Error', errorMessage, 'error');
    }
  };

  if (adminRole !== 'super_admin') {
    return (
      <div className="admin-management">
        <h2>Admin Management</h2>
        <p>Access denied. Only Super Admins can manage admins.</p>
      </div>
    );
  }

  return (
    <div className="admin-management">
      <div className="admin-management-header">
        <h2>Admin Users</h2>
        <p>Manage admin accounts (create new admins, change passwords)</p>
      </div>

      <section className="admin-management-form">
        <h3>Create New Admin</h3>
        <form onSubmit={handleCreateAdmin}>
          <div className="form-row">
            <label>Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleInputChange}
              placeholder="Full name"
            />
          </div>

          <div className="form-row">
            <label>Email</label>
            <input
              name="email"
              value={form.email}
              onChange={handleInputChange}
              placeholder="admin@example.com"
              type="email"
            />
          </div>

          <div className="form-row">
            <label>Password</label>
            <input
              name="password"
              value={form.password}
              onChange={handleInputChange}
              placeholder="Password"
              type="password"
            />
          </div>

          <div className="form-row">
            <label>Role</label>
            <select name="role" value={form.role} onChange={handleInputChange}>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          <button type="submit" className="btn-primary" disabled={creating}>
            {creating ? 'Creating...' : 'Create Admin'}
          </button>
        </form>
      </section>

      <section className="admin-management-list">
        <h3>Existing Admins</h3>

        {loading ? (
          <p>Loading admins...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin._id}>
                  <td>{admin.name}</td>
                  <td>{admin.email}</td>
                  <td>{admin.role}</td>
                  <td>{admin.isActive ? 'Active' : 'Disabled'}</td>
                  <td>
                    <button
                      className="btn-secondary"
                      onClick={() => handleChangePassword(admin)}
                    >
                      Change Password
                    </button>
                    {admin.role !== 'super_admin' && (
                      <button
                        className="btn-danger"
                        onClick={() => handleDeleteAdmin(admin)}
                        style={{ marginLeft: '8px' }}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

export default AdminManagement;
