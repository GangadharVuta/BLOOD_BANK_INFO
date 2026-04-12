import React, { useState, useEffect } from 'react';
import axios from 'axios';
import swal from 'sweetalert';
import { useNavigate } from 'react-router-dom';
import './DonorRequests.css';
import Logo from '../../assets/logo.png';

const DonorRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const navigate = useNavigate();

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

  useEffect(() => {
    fetchDonorRequests();
  }, []);

  const fetchDonorRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      if (!token) {
        swal({
          title: 'Error',
          text: 'Please login to view your requests',
          icon: 'error',
          button: 'Okay'
        });
        navigate('/login');
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/requests/donor/received`,
        {
          headers: {
            Authorization: token,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status === 1) {
        setRequests(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch requests');
        setRequests([]);
      }
    } catch (err) {
      console.error('Error fetching donor requests:', err);
      if (err.response?.status === 401) {
        swal({
          title: 'Error',
          text: 'Session expired. Please login again.',
          icon: 'error',
          button: 'Okay'
        });
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch requests');
      }
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/requests/accept/${requestId}`,
        {},
        {
          headers: {
            Authorization: token,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status === 1) {
        swal({
          title: 'Success',
          text: 'You have accepted this request!',
          icon: 'success',
          button: 'Okay'
        });
        fetchDonorRequests();
      } else {
        swal({
          title: 'Error',
          text: response.data.message || 'Failed to accept request',
          icon: 'error',
          button: 'Okay'
        });
      }
    } catch (err) {
      console.error('Error accepting request:', err);
      swal({
        title: 'Error',
        text: err.response?.data?.message || 'Failed to accept request',
        icon: 'error',
        button: 'Okay'
      });
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/requests/reject/${requestId}`,
        {},
        {
          headers: {
            Authorization: token,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status === 1) {
        swal({
          title: 'Success',
          text: 'You have rejected this request.',
          icon: 'success',
          button: 'Okay'
        });
        fetchDonorRequests();
      } else {
        swal({
          title: 'Error',
          text: response.data.message || 'Failed to reject request',
          icon: 'error',
          button: 'Okay'
        });
      }
    } catch (err) {
      console.error('Error rejecting request:', err);
      swal({
        title: 'Error',
        text: err.response?.data?.message || 'Failed to reject request',
        icon: 'error',
        button: 'Okay'
      });
    }
  };

  const getStatusBadge = (request) => {
    if (request.isAcceptedByUser) {
      return <span className="badge badge-accepted">✓ Accepted</span>;
    }
    if (request.isRejectedByUser) {
      return <span className="badge badge-rejected">✗ Rejected</span>;
    }
    return <span className="badge badge-pending">⏳ Pending</span>;
  };

  const getFilteredRequests = () => {
    if (statusFilter === 'pending') {
      return requests.filter(r => !r.isAcceptedByUser && !r.isRejectedByUser);
    }
    if (statusFilter === 'accepted') {
      return requests.filter(r => r.isAcceptedByUser);
    }
    if (statusFilter === 'rejected') {
      return requests.filter(r => r.isRejectedByUser);
    }
    return requests;
  };

  const filteredRequests = getFilteredRequests();

  return (
    <div className="donor-requests-container">
      {/* Header */}
      <div className="requests-header">
        <div className="header-content">
          <h1>🩸 Blood Requests Received</h1>
          <p>These are the blood donation requests you've received</p>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="filter-section">
        <div className="filter-buttons">
          <button
            className={`filter-btn ${statusFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setStatusFilter('pending')}
          >
            ⏳ Pending ({requests.filter(r => !r.isAcceptedByUser && !r.isRejectedByUser).length})
          </button>
          <button
            className={`filter-btn ${statusFilter === 'accepted' ? 'active' : ''}`}
            onClick={() => setStatusFilter('accepted')}
          >
            ✓ Accepted ({requests.filter(r => r.isAcceptedByUser).length})
          </button>
          <button
            className={`filter-btn ${statusFilter === 'rejected' ? 'active' : ''}`}
            onClick={() => setStatusFilter('rejected')}
          >
            ✗ Rejected ({requests.filter(r => r.isRejectedByUser).length})
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your requests...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="error-state">
          <p>⚠️ {error}</p>
          <button onClick={fetchDonorRequests} className="retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* No Requests State */}
      {!loading && !error && filteredRequests.length === 0 && (
        <div className="empty-state">
          <p>
            {statusFilter === 'pending'
              ? 'No pending requests at the moment.'
              : statusFilter === 'accepted'
              ? 'You haven\'t accepted any requests yet.'
              : 'You haven\'t rejected any requests.'}
          </p>
        </div>
      )}

      {/* Requests List */}
      {!loading && !error && filteredRequests.length > 0 && (
        <div className="requests-list">
          {filteredRequests.map((request) => (
            <div key={request._id} className="request-card">
              <div className="request-header">
                <h3>Request ID: {request.requestId}</h3>
                {getStatusBadge(request)}
              </div>

              <div className="request-details">
                <div className="detail-row">
                  <span className="label">Requester:</span>
                  <span className="value">{request.requesterName || 'Unknown'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Blood Group Needed:</span>
                  <span className="value blood-group">{request.bloodGroup}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Location:</span>
                  <span className="value">{request.address || 'Not specified'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Pincode:</span>
                  <span className="value">{request.pincode || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Requester Contact:</span>
                  <span className="value">{request.requesterPhone || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Requested On:</span>
                  <span className="value">
                    {new Date(request.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              {!request.isAcceptedByUser && !request.isRejectedByUser && (
                <div className="request-actions">
                  <button
                    className="btn btn-accept"
                    onClick={() => handleAcceptRequest(request._id)}
                  >
                    ✓ Accept Request
                  </button>
                  <button
                    className="btn btn-reject"
                    onClick={() => handleRejectRequest(request._id)}
                  >
                    ✗ Reject Request
                  </button>
                </div>
              )}

              {request.isAcceptedByUser && (
                <div className="request-note success">
                  <p>✓ You accepted this request. The requester has been notified.</p>
                </div>
              )}

              {request.isRejectedByUser && (
                <div className="request-note rejected">
                  <p>✗ You rejected this request.</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DonorRequests;
