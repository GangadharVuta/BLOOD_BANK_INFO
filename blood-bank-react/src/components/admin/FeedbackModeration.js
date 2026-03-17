/**
 * ============================================
 * FEEDBACK MODERATION COMPONENT
 * ============================================
 * Moderate and approve/reject feedback
 * 
 * Features:
 * - View pending feedback
 * - View approved feedback
 * - Approve pending feedback
 * - Reject feedback
 * - Pagination and filtering
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import './FeedbackModeration.css';

const FeedbackModeration = () => {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchRole, setSearchRole] = useState('');

  /**
   * Fetch feedback with filters
   */
  useEffect(() => {
    const loadFeedback = async () => {
      await fetchFeedback();
    };
    loadFeedback();
  }, [currentPage, limit, statusFilter, searchRole]);

  const fetchFeedback = async () => {
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
        status: statusFilter
      });

      const response = await axios.get(
        `/api/admin/feedback?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        let data = response.data.data.feedback;
        
        // Filter by role if set
        if (searchRole) {
          data = data.filter(f => 
            f.role.toLowerCase().includes(searchRole.toLowerCase())
          );
        }
        
        setFeedback(data);
        setTotalPages(response.data.data.pagination.pages);
      }
    } catch (err) {
      console.error('Error fetching feedback:', err);
      if (err.response?.status === 401) {
        navigate('/admin/login');
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load feedback'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Approve feedback
   */
  const handleApproveFeedback = async (feedbackId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.put(
        `/api/admin/feedback/${feedbackId}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Approved',
          text: 'Feedback has been approved'
        });
        fetchFeedback();
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to approve feedback'
      });
    }
  };

  /**
   * Reject feedback
   */
  const handleRejectFeedback = async (feedbackId) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Confirm Rejection',
      text: 'Are you sure you want to reject this feedback?',
      showCancelButton: true,
      confirmButtonText: 'Reject',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await axios.delete(
          `/api/admin/feedback/${feedbackId}/reject`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (response.data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Rejected',
            text: 'Feedback has been rejected'
          });
          fetchFeedback();
        }
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to reject feedback'
        });
      }
    }
  };

  /**
   * Get role badge styling
   */
  const getRoleBadgeColor = (role) => {
    const colors = {
      'patient': '#e91e63',
      'donor': '#2196f3',
      'blood_bank': '#ff9800',
      'doctor': '#4caf50',
      'nurse': '#9c27b0',
      'admin': '#f44336'
    };
    return colors[role?.toLowerCase()] || '#999';
  };

  return (
    <div className="feedback-moderation">
      {/* Header */}
      <div className="management-header">
        <div>
          <h1>Feedback Moderation</h1>
          <p>Approve or reject user feedback before display</p>
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
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="filter-select"
          >
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
          </select>
        </div>

        <div className="filter-group">
          <input
            type="text"
            placeholder="Filter by role (patient, donor, etc)..."
            value={searchRole}
            onChange={(e) => {
              setSearchRole(e.target.value);
              setCurrentPage(1);
            }}
            className="search-input"
          />
        </div>

        <button 
          className="reset-btn"
          onClick={() => {
            setStatusFilter('pending');
            setSearchRole('');
            setCurrentPage(1);
          }}
        >
          Reset Filters
        </button>
      </div>

      {/* Feedback Cards */}
      <div className="feedback-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading feedback...</p>
          </div>
        ) : feedback.length === 0 ? (
          <div className="empty-state">
            <p>No feedback to display</p>
          </div>
        ) : (
          <div className="feedback-grid">
            {feedback.map(item => (
              <div key={item._id} className="feedback-card">
                <div className="feedback-header">
                  <div className="feedback-meta">
                    <span 
                      className="role-badge"
                      style={{ background: getRoleBadgeColor(item.role) }}
                    >
                      {(item.role || 'user').charAt(0).toUpperCase() + (item.role || 'user').slice(1)}
                    </span>
                    <span className="blood-group-badge">{item.bloodGroup}</span>
                  </div>
                  <div className="feedback-rating">
                    {'⭐'.repeat(item.rating || 0)}
                  </div>
                </div>

                <p className="feedback-message">{item.message}</p>

                <div className="feedback-footer">
                  <small>
                    {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString()}
                  </small>
                  {statusFilter === 'pending' && (
                    <div className="action-buttons">
                      <button 
                        className="approve-btn"
                        onClick={() => handleApproveFeedback(item._id)}
                      >
                        ✓ Approve
                      </button>
                      <button 
                        className="reject-btn"
                        onClick={() => handleRejectFeedback(item._id)}
                      >
                        ✕ Reject
                      </button>
                    </div>
                  )}
                  {statusFilter === 'approved' && (
                    <span className="approved-badge">✓ Approved</span>
                  )}
                </div>
              </div>
            ))}
          </div>
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
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
          </select>
        </div>
      )}
    </div>
  );
};

export default FeedbackModeration;
