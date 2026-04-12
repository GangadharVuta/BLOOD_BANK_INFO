/**
 * ============================================
 * DONOR FEEDBACK FORM
 * ============================================
 * Form for donors to submit feedback about recipients
 */

import React, { useState, useEffect } from 'react';
import feedbackService from '../../services/feedbackService';
import './FeedbackForm.css';

const DonorFeedbackForm = ({
  requestId,
  recipientId,
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
    recipientBehavior: 3,
    recipientResponsiveness: 3,
    processSmoothness: 3,
    donorOverallRating: 3,
    donorComments: '',
    wouldRecommend: false
  });

  // Check if feedback already exists
  useEffect(() => {
    const checkExisting = async () => {
      const result = await feedbackService.checkFeedbackExists(requestId, 'donor');
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
    if (formData.recipientBehavior < 1 || formData.recipientBehavior > 5) {
      newErrors.recipientBehavior = 'Rating must be between 1 and 5';
    }
    if (formData.recipientResponsiveness < 1 || formData.recipientResponsiveness > 5) {
      newErrors.recipientResponsiveness = 'Rating must be between 1 and 5';
    }
    if (formData.processSmoothness < 1 || formData.processSmoothness > 5) {
      newErrors.processSmoothness = 'Rating must be between 1 and 5';
    }
    if (formData.donorOverallRating < 1 || formData.donorOverallRating > 5) {
      newErrors.donorOverallRating = 'Overall rating must be between 1 and 5';
    }

    // Validate comments if provided
    if (formData.donorComments.trim().length > 1000) {
      newErrors.donorComments = 'Comments must not exceed 1000 characters';
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

    const result = await feedbackService.submitDonorFeedback({
      requestId,
      recipientId,
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
          <p>You have already submitted your feedback for this donation. Thank you for your contribution!</p>
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
          <p>We appreciate your feedback about our recipients!</p>
        </div>
      </div>
    );
  }

  return (
    <form className="feedback-form donor-feedback-form" onSubmit={handleSubmit}>
      <h2>Share Your Experience</h2>
      <p className="form-subtitle">Help us improve by sharing feedback about your donation experience</p>

      {errors.submit && (
        <div className="alert alert-error">
          {errors.submit}
        </div>
      )}

      {/* Recipient Behavior Rating */}
      <div className="form-group">
        <label htmlFor="recipientBehavior">
          How was the recipient's behavior? <span className="required">*</span>
        </label>
        <div className="rating-container">
          <div className="rating-scale">
            {[1, 2, 3, 4, 5].map(value => (
              <button
                key={value}
                type="button"
                className={`rating-btn ${formData.recipientBehavior === value ? 'active' : ''}`}
                onClick={() => handleRatingChange('recipientBehavior', value)}
                title={`${value} star${value > 1 ? 's' : ''}`}
              >
                {value}
              </button>
            ))}
          </div>
          <div className="rating-labels">
            <span>Poor</span>
            <span>Excellent</span>
          </div>
        </div>
        {errors.recipientBehavior && (
          <span className="error-text">{errors.recipientBehavior}</span>
        )}
      </div>

      {/* Recipient Responsiveness Rating */}
      <div className="form-group">
        <label htmlFor="recipientResponsiveness">
          How responsive was the recipient? <span className="required">*</span>
        </label>
        <div className="rating-container">
          <div className="rating-scale">
            {[1, 2, 3, 4, 5].map(value => (
              <button
                key={value}
                type="button"
                className={`rating-btn ${formData.recipientResponsiveness === value ? 'active' : ''}`}
                onClick={() => handleRatingChange('recipientResponsiveness', value)}
                title={`${value} star${value > 1 ? 's' : ''}`}
              >
                {value}
              </button>
            ))}
          </div>
          <div className="rating-labels">
            <span>Unresponsive</span>
            <span>Very Responsive</span>
          </div>
        </div>
        {errors.recipientResponsiveness && (
          <span className="error-text">{errors.recipientResponsiveness}</span>
        )}
      </div>

      {/* Process Smoothness Rating */}
      <div className="form-group">
        <label htmlFor="processSmoothness">
          How smooth was the donation process? <span className="required">*</span>
        </label>
        <div className="rating-container">
          <div className="rating-scale">
            {[1, 2, 3, 4, 5].map(value => (
              <button
                key={value}
                type="button"
                className={`rating-btn ${formData.processSmoothness === value ? 'active' : ''}`}
                onClick={() => handleRatingChange('processSmoothness', value)}
                title={`${value} star${value > 1 ? 's' : ''}`}
              >
                {value}
              </button>
            ))}
          </div>
          <div className="rating-labels">
            <span>Difficult</span>
            <span>Very Smooth</span>
          </div>
        </div>
        {errors.processSmoothness && (
          <span className="error-text">{errors.processSmoothness}</span>
        )}
      </div>

      {/* Overall Rating */}
      <div className="form-group">
        <label htmlFor="donorOverallRating">
          Overall Experience Rating <span className="required">*</span>
        </label>
        <div className="rating-container">
          <div className="rating-scale">
            {[1, 2, 3, 4, 5].map(value => (
              <button
                key={value}
                type="button"
                className={`rating-btn large ${formData.donorOverallRating === value ? 'active' : ''}`}
                onClick={() => handleRatingChange('donorOverallRating', value)}
                title={`${value} star${value > 1 ? 's' : ''}`}
              >
                {'⭐'.repeat(value)}
              </button>
            ))}
          </div>
        </div>
        {errors.donorOverallRating && (
          <span className="error-text">{errors.donorOverallRating}</span>
        )}
      </div>

      {/* Comments */}
      <div className="form-group">
        <label htmlFor="donorComments">
          Additional Comments (Optional)
        </label>
        <textarea
          id="donorComments"
          name="donorComments"
          value={formData.donorComments}
          onChange={handleTextChange}
          placeholder="Share your experience, suggestions, or additional feedback..."
          maxLength={1000}
          rows={4}
          className="form-control"
        />
        <small className="char-count">
          {formData.donorComments.length}/1000 characters
        </small>
        {errors.donorComments && (
          <span className="error-text">{errors.donorComments}</span>
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
          <span>I would recommend this recipient to other donors</span>
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

export default DonorFeedbackForm;
