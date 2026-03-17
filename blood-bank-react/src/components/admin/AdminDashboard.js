/**
 * ============================================
 * ADMIN DASHBOARD COMPONENT
 * ============================================
 * Main admin panel with statistics and navigation
 * 
 * Features:
 * - Dashboard statistics cards
 * - Navigation to management sections
 * - Admin profile info
 * - Logout functionality
 * - Real-time data updates
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState('');
  const [adminRole, setAdminRole] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /**
   * Fetch dashboard statistics
   */
  useEffect(() => {
    const adminNameStored = localStorage.getItem('adminEmail')?.split('@')[0] || 'Admin';
    setAdminName(adminNameStored.charAt(0).toUpperCase() + adminNameStored.slice(1));
    setAdminRole(localStorage.getItem('adminRole') || 'admin');
    
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        navigate('/admin/login');
        return;
      }

      const response = await axios.get(
        '/api/admin/dashboard/stats',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      if (err.response?.status === 401) {
        navigate('/admin/login');
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load dashboard statistics'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle logout
   */
  const handleLogout = () => {
    Swal.fire({
      icon: 'question',
      title: 'Logout',
      text: 'Are you sure you want to logout?',
      showCancelButton: true,
      confirmButtonText: 'Yes, logout',
      cancelButtonText: 'Cancel'
    }).then(result => {
      if (result.isConfirmed) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminId');
        localStorage.removeItem('adminEmail');
        localStorage.removeItem('adminRole');
        navigate('/admin/login');
      }
    });
  };

  /**
   * Navigate to section
   */
  const navigateTo = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  if (loading) {
    return (
      <div className="admin-dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-content">
      <div className="welcome-section">
        <h2>Welcome back, {adminName}! 👋</h2>
        <p>Here's your platform overview</p>
      </div>

      {/* Statistics Grid */}
      <div className="stats-grid">
          {/* Total Users */}
          <div className="stat-card">
            <div className="stat-icon users-icon">👥</div>
            <div className="stat-info">
              <h3>{stats.totalStats.totalUsers}</h3>
              <p>Total Users</p>
            </div>
            <div className="stat-trend">↑ Active</div>
          </div>

          {/* Total Donors */}
          <div className="stat-card">
            <div className="stat-icon donors-icon">🩸</div>
            <div className="stat-info">
              <h3>{stats.totalStats.totalDonors}</h3>
              <p>Registered Donors</p>
            </div>
            <div className="stat-trend">↑ Growing</div>
          </div>

          {/* Total Requests */}
          <div className="stat-card">
            <div className="stat-icon requests-icon">📋</div>
            <div className="stat-info">
              <h3>{stats.totalStats.totalRequests}</h3>
              <p>Blood Requests</p>
            </div>
            <div className="stat-trend">Active: {stats.requestStats.active}</div>
          </div>

              {/* Average Rating */}
              <div className="stat-card">
                <div className="stat-icon rating-icon">⭐</div>
                <div className="stat-info">
                  <h3>{stats.feedbackStats.averageRating.toFixed(1)}</h3>
                  <p>Average Rating</p>
                </div>
                <div className="stat-trend">{stats.totalStats.totalFeedback} reviews</div>
              </div>

              {/* Pending Feedback */}
              <div className="stat-card pending">
                <div className="stat-icon feedback-icon">💬</div>
                <div className="stat-info">
                  <h3>{stats.feedbackStats.pending}</h3>
                  <p>Pending Reviews</p>
                </div>
                <button 
                  className="stat-action"
                  onClick={() => navigateTo('/admin/feedback')}
                >
                  Review
                </button>
              </div>

              {/* Blood Bank Count */}
              <div className="stat-card">
                <div className="stat-icon bank-icon">🏥</div>
                <div className="stat-info">
                  <h3>{stats.totalStats.totalFeedback}</h3>
                  <p>Total Feedback</p>
                </div>
                <div className="stat-trend">Approved: {stats.feedbackStats.approved}</div>
              </div>
            </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <h3>Quick Actions</h3>
            <div className="actions-grid">
              <button
                className="action-btn"
                onClick={() => navigate('/admin/donors')}
              >
                <span>👥</span>
                Manage Donors
              </button>
              <button
                className="action-btn"
                onClick={() => navigate('/admin/requests')}
              >
                <span>🩸</span>
                View Requests
              </button>
              <button
                className="action-btn"
                onClick={() => navigate('/admin/feedback')}
              >
                <span>⭐</span>
                Moderate Feedback
              </button>
              <button
                className="action-btn"
                onClick={() => navigate('/admin/chat')}
              >
                <span>💬</span>
                Monitor Chats
              </button>
            </div>
          </div>

          {/* Blood Distribution */}
          {stats && stats.bloodGroupStats && Object.keys(stats.bloodGroupStats).length > 0 && (
            <div className="blood-distribution">
              <h3>Blood Group Distribution</h3>
              <div className="distribution-bars">
                {Object.entries(stats.bloodGroupStats).map(([group, count]) => {
                  const percentage = stats.totalStats.totalDonors > 0
                    ? Math.round((count / stats.totalStats.totalDonors) * 100)
                    : 0;
                  return (
                    <div key={group} className="distribution-item">
                      <label>{group}</label>
                      <div className="bar-container">
                        <div
                          className="bar-fill"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="recent-activity">
            <div className="recent-section">
              <h3>Recent Feedback</h3>
              {stats?.recentFeedback && stats.recentFeedback.length > 0 ? (
                <div className="activity-list">
                  {stats.recentFeedback.slice(0, 5).map(feedback => (
                    <div key={feedback.id} className="activity-item">
                      <div className="activity-icon">⭐</div>
                      <div className="activity-details">
                        <p className="activity-title">{feedback.bloodGroup} - {feedback.role}</p>
                        <small>{feedback.message}</small>
                      </div>
                      <span className="activity-date">
                        {new Date(feedback.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-activity">No recent feedback</p>
              )}
            </div>

            <div className="recent-section">
              <h3>Recent Requests</h3>
              {stats?.recentRequests && stats.recentRequests.length > 0 ? (
                <div className="activity-list">
                  {stats.recentRequests.slice(0, 5).map(request => (
                    <div key={request.id} className="activity-item">
                      <div className="activity-icon">🩸</div>
                      <div className="activity-details">
                        <p className="activity-title">New Request - {request.urgency || 'Normal'}</p>
                        <small>Status: {request.status}</small>
                      </div>
                      <span className="activity-date">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-activity">No recent requests</p>
              )}
            </div>
          </div>
    </div>
  );
};

export default AdminDashboard;
