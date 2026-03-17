/**
 * ============================================
 * FEEDBACK FORM COMPONENT
 * ============================================
 * Form for users to submit feedback after donation
 */

import React, { useState } from 'react';
import axios from 'axios';
import swal from 'sweetalert';
import './FeedbackForm.css';

const FeedbackForm = ({ onSubmitSuccess }) => {
  const [formData, setFormData] = useState({
    role: 'Donor',
    bloodGroup: 'O+',
    rating: 5,
    message: '',
    donationId: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const bloodGroups = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
  const roles = ['Donor', 'Recipient'];

  /**
   * Handle input change
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError(null);
  };

  /**
   * Handle rating change
   */
  const handleRatingChange = (newRating) => {
    setFormData(prev => ({
      ...prev,
      rating: newRating
    }));
  };

  /**
   * Validate form
   */
  const validateForm = () => {
    if (!formData.message.trim()) {
      setError('Please write a feedback message');
      return false;
    }

    if (formData.message.trim().length < 10) {
      setError('Feedback message must be at least 10 characters');
      return false;
    }

    if (formData.message.trim().length > 500) {
      setError('Feedback message cannot exceed 500 characters');
      return false;
    }

    return true;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        swal('Error', 'Please login to submit feedback', 'error');
        return;
      }

      const response = await axios.post(
        '/api/feedback',
        formData,
        {
          headers: { Authorization: token }
        }
      );

      if (response.data.status === 1) {
        swal('Success', 'Thank you! Your feedback has been submitted. It will appear on our homepage after admin review.', 'success');
        
        // Reset form
        setFormData({
          role: 'Donor',
          bloodGroup: 'O+',
          rating: 5,
          message: '',
          donationId: ''
        });

        if (onSubmitSuccess) {
          onSubmitSuccess();
        }
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="feedback-form-container">
      <div className="feedback-form-card">
        <h2 className="form-title">Share Your Experience</h2>
        <p className="form-subtitle">Help us improve Blood Connect by sharing your feedback</p>

        <form onSubmit={handleSubmit} className="feedback-form">
          {/* Error Message */}
          {error && (
            <div className="form-error">
              <span>❌ {error}</span>
            </div>
          )}

          {/* Role Selection */}
          <div className="form-group">
            <label htmlFor="role" className="form-label">
              Your Role <span className="required">*</span>
            </label>
            <div className="role-selector">
              {roles.map(r => (
                <button
                  key={r}
                  type="button"
                  className={`role-btn ${formData.role === r ? 'active' : ''}`}
                  onClick={() => handleChange({ target: { name: 'role', value: r } })}
                >
                  {r === 'Donor' ? '🩸' : '❤️'} {r}
                </button>
              ))}
            </div>
          </div>

          {/* Blood Group Selection */}
          <div className="form-group">
            <label htmlFor="bloodGroup" className="form-label">
              Blood Group <span className="required">*</span>
            </label>
            <select
              name="bloodGroup"
              value={formData.bloodGroup}
              onChange={handleChange}
              className="form-select"
            >
              {bloodGroups.map(bg => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>

          {/* Rating Selection */}
          <div className="form-group">
            <label className="form-label">
              Rating <span className="required">*</span>
            </label>
            <div className="rating-selector">
              {[1, 2, 3, 4, 5].map(num => (
                <button
                  key={num}
                  type="button"
                  className={`rating-star ${num <= formData.rating ? 'filled' : 'empty'}`}
                  onClick={() => handleRatingChange(num)}
                  title={`${num} star${num > 1 ? 's' : ''}`}
                >
                  ⭐
                </button>
              ))}
            </div>
            <p className="rating-label">{formData.rating} star{formData.rating > 1 ? 's' : ''}</p>
          </div>

          {/* Feedback Message */}
          <div className="form-group">
            <label htmlFor="message" className="form-label">
              Your Feedback <span className="required">*</span>
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Share your experience with Blood Connect... (10-500 characters)"
              className="form-textarea"
              rows="5"
              maxLength="500"
            />
            <p className="char-count">
              {formData.message.length}/500 characters
            </p>
          </div>

          {/* Donation ID (Optional) */}
          <div className="form-group">
            <label htmlFor="donationId" className="form-label">
              Donation ID (Optional)
            </label>
            <input
              type="text"
              name="donationId"
              value={formData.donationId}
              onChange={handleChange}
              placeholder="Enter donation ID if available"
              className="form-input"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`submit-btn ${isLoading ? 'loading' : ''}`}
          >
            {isLoading ? 'Submitting...' : 'Submit Feedback'}
          </button>

          {/* Privacy Notice */}
          <div className="privacy-notice">
            <p>
              🔒 <strong>Your Privacy:</strong> We don't display your name, phone number, or address. 
              Only your role, blood group, rating, and message are shown publicly after admin approval.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackForm;
