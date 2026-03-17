/**
 * ============================================
 * DONOR MANAGEMENT COMPONENT
 * ============================================
 * Manage all registered donors in the system
 * 
 * Features:
 * - View all donors with pagination
 * - Search and filter donors
 * - Update donor status
 * - Delete donor profiles
 * - View donor details
 * - Activity tracking
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import './DonorManagement.css';

const DonorManagement = () => {
  const navigate = useNavigate();
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  
  // Filters
  const [search, setSearch] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [status, setStatus] = useState('');
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const bloodGroups = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
  const statusOptions = ['active', 'suspended', 'inactive'];

  /**
   * Fetch donors with filters
   */
  useEffect(() => {
    const loadDonors = async () => {
      await fetchDonors();
    };
    loadDonors();
  }, [currentPage, limit, search, bloodGroup, status]);

  const fetchDonors = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');

      if (!token) {
        navigate('/admin/login');
        return;
      }

      const params = new URLSearchParams({
        page: currentPage,
        limit,
        ...(search && { search }),
        ...(bloodGroup && { bloodGroup }),
        ...(status && { status })
      });

      const response = await axios.get(
        `/api/admin/donors?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setDonors(response.data.data.donors);
        setTotalPages(response.data.data.pagination.pages);
      }
    } catch (err) {
      console.error('Error fetching donors:', err);
      if (err.response?.status === 401) {
        navigate('/admin/login');
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load donors'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * View donor details
   */
  const handleViewDetails = async (donorId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(
        `/api/admin/donors/${donorId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setSelectedDonor(response.data.data);
        setShowDetails(true);
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load donor details'
      });
    }
  };

  /**
   * Update donor status
   */
  const handleUpdateStatus = async (donorId, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.put(
        `/api/admin/donors/${donorId}/status`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Donor status updated'
        });
        fetchDonors();
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update donor status'
      });
    }
  };

  /**
   * Delete donor
   */
  const handleDeleteDonor = async (donorId) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Confirm Delete',
      text: 'Are you sure you want to delete this donor?',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await axios.delete(
          `/api/admin/donors/${donorId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (response.data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Deleted',
            text: 'Donor has been deleted'
          });
          fetchDonors();
        }
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete donor'
        });
      }
    }
  };

  /**
   * Get status badge color
   */
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#4caf50';
      case 'suspended':
        return '#ff9800';
      case 'inactive':
        return '#f44336';
      default:
        return '#999';
    }
  };

  return (
    <div className="donor-management">
      {/* Header */}
      <div className="management-header">
        <div>
          <h1>Donor Management</h1>
          <p>Manage all registered donors in the system</p>
        </div>
        <button 
          className="back-btn"
          onClick={() => navigate('/admin/dashboard')}
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <select
            value={bloodGroup}
            onChange={(e) => {
              setBloodGroup(e.target.value);
              setCurrentPage(1);
            }}
            className="filter-select"
          >
            <option value="">All Blood Groups</option>
            {bloodGroups.map(bg => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="filter-select"
          >
            <option value="">All Statuses</option>
            {statusOptions.map(s => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <button 
          className="reset-btn"
          onClick={() => {
            setSearch('');
            setBloodGroup('');
            setStatus('');
            setCurrentPage(1);
          }}
        >
          Reset Filters
        </button>
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading donors...</p>
          </div>
        ) : donors.length === 0 ? (
          <div className="empty-state">
            <p>No donors found</p>
          </div>
        ) : (
          <table className="donors-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Blood Group</th>
                <th>Location</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {donors.map(donor => (
                <tr key={donor._id}>
                  <td>
                    <strong>{donor.name || 'N/A'}</strong>
                  </td>
                  <td>{donor.email || 'N/A'}</td>
                  <td>{donor.phone || 'N/A'}</td>
                  <td>
                    <span className="blood-group-badge">
                      {donor.bloodGroup}
                    </span>
                  </td>
                  <td>{donor.city || 'N/A'}</td>
                  <td>
                    <select
                      value={donor.status || 'active'}
                      onChange={(e) => handleUpdateStatus(donor._id, e.target.value)}
                      className="status-select"
                      style={{ borderColor: getStatusColor(donor.status) }}
                    >
                      {statusOptions.map(s => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="action-cell">
                    <button
                      className="action-btn view-btn"
                      onClick={() => handleViewDetails(donor._id)}
                      title="View Details"
                    >
                      👁 View
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={() => handleDeleteDonor(donor._id)}
                      title="Delete"
                    >
                      🗑 Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="page-btn"
          >
            ← Previous
          </button>

          <div className="page-info">
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
          </div>

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="page-btn"
          >
            Next →
          </button>

          <select
            value={limit}
            onChange={(e) => {
              setLimit(parseInt(e.target.value));
              setCurrentPage(1);
            }}
            className="limit-select"
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
      )}

      {/* Donor Details Modal */}
      {showDetails && selectedDonor && (
        <div className="modal-overlay" onClick={() => setShowDetails(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button 
              className="close-btn"
              onClick={() => setShowDetails(false)}
            >
              ✕
            </button>

            <div className="detail-header">
              <h2>Donor Details</h2>
            </div>

            <div className="detail-grid">
              <div className="detail-item">
                <label>Name</label>
                <p>{selectedDonor.name}</p>
              </div>
              <div className="detail-item">
                <label>Email</label>
                <p>{selectedDonor.email}</p>
              </div>
              <div className="detail-item">
                <label>Phone</label>
                <p>{selectedDonor.phone}</p>
              </div>
              <div className="detail-item">
                <label>Blood Group</label>
                <p>
                  <span className="blood-group-badge">
                    {selectedDonor.bloodGroup}
                  </span>
                </p>
              </div>
              <div className="detail-item">
                <label>Location</label>
                <p>{selectedDonor.city}, {selectedDonor.state}</p>
              </div>
              <div className="detail-item">
                <label>Status</label>
                <p>
                  <span 
                    className="status-badge"
                    style={{ background: getStatusColor(selectedDonor.status) }}
                  >
                    {selectedDonor.status}
                  </span>
                </p>
              </div>
              <div className="detail-item">
                <label>Registered On</label>
                <p>{new Date(selectedDonor.createdAt).toLocaleDateString()}</p>
              </div>
              {selectedDonor.lastDonationDate && (
                <div className="detail-item">
                  <label>Last Donation</label>
                  <p>{new Date(selectedDonor.lastDonationDate).toLocaleDateString()}</p>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button 
                className="modal-btn primary-btn"
                onClick={() => {
                  setShowDetails(false);
                  handleViewDetails(selectedDonor._id);
                }}
              >
                Refresh
              </button>
              <button 
                className="modal-btn cancel-btn"
                onClick={() => setShowDetails(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonorManagement;
