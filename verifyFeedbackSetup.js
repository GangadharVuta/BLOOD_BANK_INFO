#!/usr/bin/env node

/**
 * ============================================
 * HOMEPAGE FEEDBACK SETUP VERIFICATION
 * ============================================
 * Run this to verify all components are in place
 * Usage: node verifyFeedbackSetup.js
 */

const fs = require('fs');
const path = require('path');

const BACKEND_PATH = './blood-bank-node';
const FRONTEND_PATH = './blood-bank-react/src';

// Configuration
const config = {
  backend: {
    controller: `${BACKEND_PATH}/app/modules/Feedback/DonationFeedback.Controller.js`,
    routes: `${BACKEND_PATH}/app/modules/Feedback/DonationFeedback.Routes.js`,
    serverFile: `${BACKEND_PATH}/server.js`
  },
  frontend: {
    carousel: `${FRONTEND_PATH}/components/home/FeedbackCarousel.js`,
    css: `${FRONTEND_PATH}/components/home/FeedbackCarousel.css`
  }
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    return false;
  }
}

function checkFileContent(filePath, searchString) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.includes(searchString);
  } catch (err) {
    return false;
  }
}

// Verification checks
const checks = [
  {
    name: 'Backend Controller File Exists',
    check: () => checkFileExists(config.backend.controller),
    details: config.backend.controller
  },
  {
    name: 'Backend Routes File Exists',
    check: () => checkFileExists(config.backend.routes),
    details: config.backend.routes
  },
  {
    name: 'Controller has getPublicApprovedFeedback() method',
    check: () => checkFileContent(config.backend.controller, 'getPublicApprovedFeedback'),
    details: 'Method should be in DonationFeedback.Controller.js'
  },
  {
    name: 'Controller has getPlatformStats() method',
    check: () => checkFileContent(config.backend.controller, 'getPlatformStats'),
    details: 'Method should be in DonationFeedback.Controller.js'
  },
  {
    name: 'Routes has /public/approved endpoint',
    check: () => checkFileContent(config.backend.routes, '/public/approved'),
    details: 'Route should be registered before authenticated routes'
  },
  {
    name: 'Routes has /stats/platform endpoint',
    check: () => checkFileContent(config.backend.routes, '/stats/platform'),
    details: 'Route should be registered before authenticated routes'
  },
  {
    name: 'Frontend Carousel Component Exists',
    check: () => checkFileExists(config.frontend.carousel),
    details: config.frontend.carousel
  },
  {
    name: 'Frontend CSS File Exists',
    check: () => checkFileExists(config.frontend.css),
    details: config.frontend.css
  },
  {
    name: 'Carousel has new API endpoint calls',
    check: () =>
      checkFileContent(config.frontend.carousel, '/api/donation-feedback/public/approved') &&
      checkFileContent(config.frontend.carousel, '/api/donation-feedback/stats/platform'),
    details: 'Both endpoints should be called in FeedbackCarousel.js'
  },
  {
    name: 'Carousel has recommend badge styling',
    check: () => checkFileContent(config.frontend.css, 'recommend-badge'),
    details: 'CSS should include .recommend-badge class'
  },
  {
    name: 'Carousel has loading spinner added',
    check: () => checkFileContent(config.frontend.css, '@keyframes spin'),
    details: 'CSS should include spin animation'
  }
];

// Run all checks
log('\n' + '='.repeat(60), 'blue');
log('HOMEPAGE FEEDBACK SETUP VERIFICATION', 'blue');
log('='.repeat(60) + '\n', 'blue');

let passed = 0;
let failed = 0;
const results = [];

checks.forEach((check, index) => {
  const result = check.check();
  const status = result ? '✓ PASS' : '✗ FAIL';
  const statusColor = result ? 'green' : 'red';

  log(`[${index + 1}/${checks.length}] ${status}: ${check.name}`, statusColor);

  if (!result) {
    log(`    → ${check.details}`, 'yellow');
    failed++;
    results.push({ check: check.name, status: 'FAIL', details: check.details });
  } else {
    passed++;
    results.push({ check: check.name, status: 'PASS' });
  }
});

// Summary
log('\n' + '='.repeat(60), 'blue');
log('SUMMARY', 'blue');
log('='.repeat(60), 'blue');
log(`Total Checks: ${passed + failed}`, 'reset');
log(`Passed: ${passed}`, 'green');
log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');

if (failed === 0) {
  log('\n✓ All checks passed! Setup is complete.', 'green');
  log('Next steps:', 'blue');
  log('1. Restart your backend server: pm2 restart blood-bank-server', 'yellow');
  log('2. Refresh your browser to see the feedback section', 'yellow');
  log('3. Approve some feedback in database to see it displayed', 'yellow');
} else {
  log('\n✗ Some checks failed. Please review the issues above.', 'red');
  log('Need help? Check the documentation:', 'yellow');
  log('- HOMEPAGE_FEEDBACK_IMPLEMENTATION_SUMMARY.md', 'yellow');
  log('- HOMEPAGE_FEEDBACK_QUICK_START.md', 'yellow');
}

log('\n' + '='.repeat(60) + '\n', 'blue');
