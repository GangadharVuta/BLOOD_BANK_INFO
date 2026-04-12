/**
 * ============================================
 * RECIPIENT FEEDBACK FORM
 * ============================================
 * Form for recipients to submit feedback about donors
 */

import React, { useState, useEffect } from 'react';
import feedbackService from '../../services/feedbackService';
import './FeedbackForm.css';

const RecipientFeedbackForm = ({
  requestId,
  donorId,
  bloodGroup = 'O+',
  onSubmitSuccess,
  onClose
}) => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [feedbackExists, setFeedbackExists] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    donorHelpfulness: 3,
    donorResponseTime: 3,
    recipientOverallRating: 3,
    recipientComments: '',
    wouldRecommend: false
  });

  // Check if feedback already exists
  useEffect(() => {
    const checkExisting = async () => {
      const result = await feedbackService.checkFeedbackExists(requestId, 'recipient');
      if (result.exists) {
        setFeedbackExists(true);
      }
    };

    if (requestId) {
      checkExisting();
    }
  }, [requestId]);

  const handleRatingChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: parseInt(value)
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleCheckboxChange = (e) => {
    setFormData(prev => ({
      ...prev,
      wouldRecommend: e.target.checked
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate ratings
    if (formData.donorHelpfulness < 1 || formData.donorHelpfulness > 5) {
      newErrors.donorHelpfulness = 'Rating must be between 1 and 5';
    }
    if (formData.donorResponseTime < 1 || formData.donorResponseTime > 5) {
      newErrors.donorResponseTime = 'Rating must be between 1 and 5';
    }
    if (formData.recipientOverallRating < 1 || formData.recipientOverallRating > 5) {
      newErrors.recipientOverallRating = 'Overall rating must be between 1 and 5';
    }

    // Validate comments if provided
    if (formData.recipientComments.trim().length > 1000) {
      newErrors.recipientComments = 'Comments must not exceed 1000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const result = await feedbackService.submitRecipientFeedback({
      requestId,
      donorId,
      bloodGroup,
      ...formData
    });

    setLoading(false);

    if (result.success) {
      setSuccessMessage('Feedback submitted successfully!');
      setSubmitted(true);
      setTimeout(() => {
        if (onSubmitSuccess) {
          onSubmitSuccess();
        }
        if (onClose) {
          onClose();
        }
      }, 2000);
    } else {
      if (result.isDuplicate) {
        setErrors({ submit: 'You have already submitted feedback for this donation' });
        setFeedbackExists(true);
      } else {
        setErrors({ submit: result.error });
      }
    }
  };

  if (feedbackExists && !submitted) {
    return (
      <div className="feedback-form feedback-form-exists">
        <div className="alert alert-info">
          <h3>Feedback Already Submitted</h3>
          <p>You have already submitted your feedback for this donation. Thank you for using our service!</p>
          {onClose && (
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="feedback-form feedback-form-success">
        <div className="alert alert-success">
          <h3>✓ {successMessage}</h3>
          <p>Your feedback helps us recognize great donors and maintain quality service!</p>
        </div>
      </div>
    );
  }

  return (
    <form className="feedback-form recipient-feedback-form" onSubmit={handleSubmit}>
      <h2>Rate Your Donor</h2>
      <p className="form-subtitle">Help us recognize our amazing donors with your feedback</p>

      {errors.submit && (
        <div className="alert alert-error">
          {errors.submit}
        </div>
      )}

      {/* Donor Helpfulness Rating */}
      <div className="form-group">
        <label htmlFor="donorHelpfulness">
          How helpful was the donor? <span className="required">*</span>
        </label>
        <div className="rating-container">
          <div className="rating-scale">
            {[1, 2, 3, 4, 5].map(value => (
              <button
                key={value}
                type="button"
                className={`rating-btn ${formData.donorHelpfulness === value ? 'active' : ''}`}
                onClick={() => handleRatingChange('donorHelpfulness', value)}
                title={`${value} star${value > 1 ? 's' : ''}`}
              >
                {value}
              </button>
            ))}
          </div>
          <div className="rating-labels">
            <span>Not Helpful</span>
            <span>Very Helpful</span>
          </div>
        </div>
        {errors.donorHelpfulness && (
          <span className="error-text">{errors.donorHelpfulness}</span>
        )}
      </div>

      {/* Donor Response Time Rating */}
      <div className="form-group">
        <label htmlFor="donorResponseTime">
          How quick was the donor's response? <span className="required">*</span>
        </label>
        <div className="rating-container">
          <div className="rating-scale">
            {[1, 2, 3, 4, 5].map(value => (
              <button
                key={value}
                type="button"
                className={`rating-btn ${formData.donorResponseTime === value ? 'active' : ''}`}
                onClick={() => handleRatingChange('donorResponseTime', value)}
                title={`${value} star${value > 1 ? 's' : ''}`}
              >
                {value}
              </button>
            ))}
          </div>
          <div className="rating-labels">
            <span>Very Slow</span>
            <span>Immediate</span>
          </div>
        </div>
        {errors.donorResponseTime && (
          <span className="error-text">{errors.donorResponseTime}</span>
        )}
      </div>

      {/* Overall Rating */}
      <div className="form-group">
        <label htmlFor="recipientOverallRating">
          Overall Experience Rating <span className="required">*</span>
        </label>
        <div className="rating-container">
          <div className="rating-scale">
            {[1, 2, 3, 4, 5].map(value => (
              <button
                key={value}
                type="button"
                className={`rating-btn large ${formData.recipientOverallRating === value ? 'active' : ''}`}
                onClick={() => handleRatingChange('recipientOverallRating', value)}
                title={`${value} star${value > 1 ? 's' : ''}`}
              >
                {'⭐'.repeat(value)}
              </button>
            ))}
          </div>
        </div>
        {errors.recipientOverallRating && (
          <span className="error-text">{errors.recipientOverallRating}</span>
        )}
      </div>

      {/* Comments */}
      <div className="form-group">
        <label htmlFor="recipientComments">
          Tell Us More (Optional)
        </label>
        <textarea
          id="recipientComments"
          name="recipientComments"
          value={formData.recipientComments}
          onChange={handleTextChange}
          placeholder="Share what went well, or areas where the donor could improve..."
          maxLength={1000}
          rows={4}
          className="form-control"
        />
        <small className="char-count">
          {formData.recipientComments.length}/1000 characters
        </small>
        {errors.recipientComments && (
          <span className="error-text">{errors.recipientComments}</span>
        )}
      </div>

      {/* Would Recommend */}
      <div className="form-group checkbox-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={formData.wouldRecommend}
            onChange={handleCheckboxChange}
            className="form-checkbox"
          />
          <span>I would recommend this donor to other recipients</span>
        </label>
      </div>

      {/* Buttons */}
      <div className="form-actions">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit Feedback'}
        </button>
        {onClose && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default RecipientFeedbackForm;
