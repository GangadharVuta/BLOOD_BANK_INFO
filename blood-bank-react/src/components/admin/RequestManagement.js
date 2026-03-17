/**
 * ============================================
 * REQUEST MANAGEMENT COMPONENT
 * ============================================
 * Manage all blood requests in the system
 * 
 * Features:
 * - View all requests with pagination
 * - Search and filter requests
 * - Update request status
 * - Delete requests
 * - View request details
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import './RequestManagement.css';

const RequestManagement = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  
  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const statusOptions = ['pending', 'active', 'fulfilled', 'cancelled'];

  /**
   * Fetch requests with filters
   */
  useEffect(() => {
    const loadRequests = async () => {
      await fetchRequests();
    };
    loadRequests();
  }, [currentPage, limit, search, status]);

  const fetchRequests = async () => {
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
        ...(status && { status })
      });

      const response = await axios.get(
        `/api/admin/requests?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setRequests(response.data.data.requests);
        setTotalPages(response.data.data.pagination.pages);
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
      if (err.response?.status === 401) {
        navigate('/admin/login');
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load requests'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * View request details
   */
  const handleViewDetails = async (requestId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(
        `/api/admin/requests/${requestId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setSelectedRequest(response.data.data);
        setShowDetails(true);
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load request details'
      });
    }
  };

  /**
   * Update request status
   */
  const handleUpdateStatus = async (requestId, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.put(
        `/api/admin/requests/${requestId}/status`,
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
          text: 'Request status updated'
        });
        fetchRequests();
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update request status'
      });
    }
  };

  /**
   * Delete request
   */
  const handleDeleteRequest = async (requestId) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Confirm Delete',
      text: 'Are you sure you want to delete this request?',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await axios.delete(
          `/api/admin/requests/${requestId}`,
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
            text: 'Request has been deleted'
          });
          fetchRequests();
        }
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete request'
        });
      }
    }
  };

  /**
   * Get status color
   */
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#ff9800';
      case 'active':
        return '#2196f3';
      case 'fulfilled':
        return '#4caf50';
      case 'cancelled':
        return '#f44336';
      default:
        return '#999';
    }
  };

  /**
   * Format urgency badge
   */
  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical':
        return '#f44336';
      case 'high':
        return '#ff9800';
      case 'normal':
        return '#4caf50';
      default:
        return '#999';
    }
  };

  return (
    <div className="request-management">
      {/* Header */}
      <div className="management-header">
        <div>
          <h1>Request Management</h1>
          <p>Manage all blood requests in the system</p>
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
            placeholder="Search by requester name or email..."
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
            <p>Loading requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <p>No requests found</p>
          </div>
        ) : (
          <table className="requests-table">
            <thead>
              <tr>
                <th>Requester</th>
                <th>Blood Group</th>
                <th>Urgency</th>
                <th>Location</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(request => (
                <tr key={request._id}>
                  <td>
                    <strong>{request.requesterName || 'N/A'}</strong>
                  </td>
                  <td>
                    <span className="blood-group-badge">
                      {request.bloodGroup}
                    </span>
                  </td>
                  <td>
                    <span 
                      className="urgency-badge"
                      style={{ background: getUrgencyColor(request.urgency) }}
                    >
                      {(request.urgency || 'normal').charAt(0).toUpperCase() + (request.urgency || 'normal').slice(1)}
                    </span>
                  </td>
                  <td>{request.location || 'N/A'}</td>
                  <td>
                    <select
                      value={request.status || 'pending'}
                      onChange={(e) => handleUpdateStatus(request._id, e.target.value)}
                      className="status-select"
                      style={{ borderColor: getStatusColor(request.status) }}
                    >
                      {statusOptions.map(s => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {new Date(request.createdAt).toLocaleDateString()}
                  </td>
                  <td className="action-cell">
                    <button
                      className="action-btn view-btn"
                      onClick={() => handleViewDetails(request._id)}
                      title="View Details"
                    >
                      👁 View
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={() => handleDeleteRequest(request._id)}
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

      {/* Request Details Modal */}
      {showDetails && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowDetails(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button 
              className="close-btn"
              onClick={() => setShowDetails(false)}
            >
              ✕
            </button>

            <div className="detail-header">
              <h2>Request Details</h2>
            </div>

            <div className="detail-grid">
              <div className="detail-item">
                <label>Requester Name</label>
                <p>{selectedRequest.requesterName}</p>
              </div>
              <div className="detail-item">
                <label>Email</label>
                <p>{selectedRequest.email}</p>
              </div>
              <div className="detail-item">
                <label>Phone</label>
                <p>{selectedRequest.phone}</p>
              </div>
              <div className="detail-item">
                <label>Blood Group</label>
                <p>
                  <span className="blood-group-badge">
                    {selectedRequest.bloodGroup}
                  </span>
                </p>
              </div>
              <div className="detail-item">
                <label>Quantity Needed</label>
                <p>{selectedRequest.quantity} units</p>
              </div>
              <div className="detail-item">
                <label>Urgency</label>
                <p>
                  <span 
                    className="urgency-badge"
                    style={{ background: getUrgencyColor(selectedRequest.urgency) }}
                  >
                    {(selectedRequest.urgency || 'normal').charAt(0).toUpperCase() + (selectedRequest.urgency || 'normal').slice(1)}
                  </span>
                </p>
              </div>
              <div className="detail-item">
                <label>Location</label>
                <p>{selectedRequest.location}</p>
              </div>
              <div className="detail-item">
                <label>Status</label>
                <p>
                  <span 
                    className="status-badge"
                    style={{ background: getStatusColor(selectedRequest.status) }}
                  >
                    {selectedRequest.status}
                  </span>
                </p>
              </div>
              <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                <label>Hospital Name</label>
                <p>{selectedRequest.hospitalName}</p>
              </div>
              <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                <label>Medical Reason</label>
                <p>{selectedRequest.medicalReason}</p>
              </div>
              <div className="detail-item">
                <label>Requested On</label>
                <p>{new Date(selectedRequest.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="modal-btn primary-btn"
                onClick={() => {
                  setShowDetails(false);
                  handleViewDetails(selectedRequest._id);
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

export default RequestManagement;
