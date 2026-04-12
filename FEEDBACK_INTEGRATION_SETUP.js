/**
 * ============================================
 * FEEDBACK SYSTEM CONFIGURATION
 * ============================================
 * Integration setup for backend routes
 * Add this to your main server.js or routes/index.js
 */

// In blood-bank-node/server.js or app/routes/index.js, add:

// ============= IMPORT ROUTES =============
const DonationFeedbackRoutes = require('./app/modules/Feedback/DonationFeedback.Routes');

// ============= REGISTER ROUTES =============
// Add these lines after other route registrations
app.use('/api/donation-feedback', DonationFeedbackRoutes);

// Example full routing setup:
/*
const express = require('express');
const app = express();

// Other route imports...
const DonationFeedbackRoutes = require('./app/modules/Feedback/DonationFeedback.Routes');

// Middleware...
app.use(express.json());

// Route registrations
app.use('/api/auth', AuthRoutes);
app.use('/api/users', UserRoutes);
app.use('/api/requests', RequestRoutes);
app.use('/api/chat', ChatRoutes);
app.use('/api/donation-feedback', DonationFeedbackRoutes);  // ADD THIS LINE

// Server start...
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
*/

// ============= ENVIRONMENT VARIABLES =============
// Ensure these are in your .env file:
// MONGODB_URI=your_mongodb_uri
// JWT_SECRET=your_jwt_secret
// REACT_APP_API_URL=http://localhost:4000

// ============= DATABASE MODEL REGISTRATION =============
// In blood-bank-node/configs/mongoose.js, ensure the DonationFeedback model is loaded:
require('../app/modules/Feedback/DonationFeedback.Schema');  // Add this line

// ============= REACT SETUP =============
// In blood-bank-react/src/App.js or main component, ensure feedbackService is imported:
import feedbackService from './services/feedbackService';

// When rendering feedback forms:
import DonorFeedbackForm from './components/feedback/DonorFeedbackForm';
import RecipientFeedbackForm from './components/feedback/RecipientFeedbackForm';

// ============= USAGE EXAMPLE =============
// In your donation completion component:

import React, { useState } from 'react';
import DonorFeedbackForm from './components/feedback/DonorFeedbackForm';
import RecipientFeedbackForm from './components/feedback/RecipientFeedbackForm';

function DonationComplete() {
  const [showFeedback, setShowFeedback] = useState(true);
  const [feedbackType, setFeedbackType] = useState(null); // 'donor' or 'recipient'

  const handleFeedbackSubmit = () => {
    setShowFeedback(false);
    // Additional logic to mark request as complete, etc.
  };

  // Get from request data
  const requestId = 'request123'; // from request object
  const donorId = 'donor123';
  const recipientId = 'recipient123';
  const bloodGroup = 'B+';

  return (
    <div>
      {showFeedback && feedbackType === 'donor' && (
        <DonorFeedbackForm
          requestId={requestId}
          recipientId={recipientId}
          bloodGroup={bloodGroup}
          onSubmitSuccess={handleFeedbackSubmit}
          onClose={() => setShowFeedback(false)}
        />
      )}

      {showFeedback && feedbackType === 'recipient' && (
        <RecipientFeedbackForm
          requestId={requestId}
          donorId={donorId}
          bloodGroup={bloodGroup}
          onSubmitSuccess={handleFeedbackSubmit}
          onClose={() => setShowFeedback(false)}
        />
      )}

      {!showFeedback && (
        <div>
          <h2>Thank you for your feedback!</h2>
          <p>Your feedback helps improve our blood bank community.</p>
        </div>
      )}
    </div>
  );
}

export default DonationComplete;
