# IMMEDIATE ACTION PLAN - BLOOD BANK DEPLOYMENT

## 🔴 CRITICAL: Do TODAY (Before Any Testing)

### 1. Secure Credentials (2-3 hours)
```bash
# Step 1: Remove .env.dev from git history
cd c:\Users\Dell\OneDrive\Desktop\Blood_Bank_Info\blood-bank-node
git filter-branch --tree-filter 'rm -f .env.dev .env.prod .env.local' HEAD
git push --force-with-lease

# Step 2: Add to .gitignore
echo ".env*
!.env.example
!.env.prod.example" >> .gitignore
git add .gitignore
git commit -m "Add .env files to gitignore"
git push

# Step 3: Rotate ALL credentials (database, Firebase, JWT secrets)
# - Change MongoDB password at MongoDB Atlas
# - Regenerate Firebase service account key
# - Generate new JWT secrets with: openssl rand -hex 32
```

### 2. Remove Hardcoded Secrets (1 hour)
**Files to update:**

[blood-bank-node/configs/configs.js](blood-bank-node/configs/configs.js)
```javascript
// CHANGE FROM:
sessionSecret: process.env.sessionSecret || 'Testing',
securityToken: process.env.securityToken || 'Testing',
securityRefreshToken: process.env.securityRefreshToken || 'Testingrefresh',

// CHANGE TO:
sessionSecret: process.env.sessionSecret || (() => { throw new Error('SESSION_SECRET env var required'); })(),
securityToken: process.env.securityToken || (() => { throw new Error('SECURITY_TOKEN env var required'); })(),
securityRefreshToken: process.env.securityRefreshToken || (() => { throw new Error('SECURITY_REFRESH_TOKEN env var required'); })(),
```

[blood-bank-node/middleware/adminAuth.js](blood-bank-node/middleware/adminAuth.js)
```javascript
// CHANGE FROM:
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'admin-secret-key-change-in-production';

// CHANGE TO:
const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET;

if (!JWT_SECRET || !ADMIN_JWT_SECRET) {
  throw new Error('Missing required JWT secrets in environment variables');
}
```

### 3. Fix NODE_ENV (5 minutes)
[blood-bank-node/.env.dev](blood-bank-node/.env.dev#L7)
```
# CHANGE FROM:
NODE_ENV=Development

# CHANGE TO:
NODE_ENV=production
```

### 4. Add Security Headers (30 minutes)
Install helmet:
```bash
cd blood-bank-node
npm install helmet
```

Update [blood-bank-node/configs/express.js](blood-bank-node/configs/express.js):
```javascript
const helmet = require('helmet');
const compression = require('compression');
const express = require('express');

module.exports = function () {
  const app = express();
  
  // Security headers MUST be first
  app.use(helmet());
  
  // Compression
  app.use(compression());
  
  // Request size limits
  app.use(bodyParser.json({ limit: '10kb' }));
  app.use(bodyParser.urlencoded({ limit: '10kb', extended: true }));
  
  // ... rest of code
```

---

## 🟠 HIGH PRIORITY: Do This Week

### 5. Add Rate Limiting to Auth Endpoints (1 hour)
Add to [blood-bank-node/app/modules/User/Routes.js](blood-bank-node/app/modules/User/Routes.js):
```javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts. Try again later.',
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour
  message: 'Too many accounts created. Try again later.',
});

// Apply to routes
router.post('/users/login', loginLimiter, (req, res, next) => {
  const userObj = (new UsersController()).boot(req, res);
  return userObj.login();
});

router.post('/users/register', registerLimiter, (req, res, next) => {
  const userObj = (new UsersController()).boot(req, res);
  return userObj.register();
});
```

### 6. Add Database Connection Error Handling (30 minutes)
Update [blood-bank-node/configs/mongoose.js](blood-bank-node/configs/mongoose.js):
```javascript
module.exports = function () {
  return mongoose.connect(config.db)
    .then((connect) => {
      console.log('✅ MongoDB connected');
      return connect;
    })
    .catch((err) => {
      console.error('❌ MongoDB connection failed:', err.message);
      console.error('Exiting application - database required for operation');
      process.exit(1);
    });
};
```

### 7. Replace console.log with Logger (2-3 hours)
Example in [blood-bank-node/app/modules/User/Controller.js](blood-bank-node/app/modules/User/Controller.js#L411):
```javascript
// CHANGE FROM:
console.log(`[PASSWORD RESET OTP] Email: ${emailId}, OTP: ${otp}`);

// CHANGE TO:
const Logger = require('../../utils/Logger');
Logger.info('Password reset OTP generated', { 
  email: emailId, 
  expiresIn: '10 minutes',
  // DO NOT log the actual OTP to prevent exposure
});
```

Apply to all files:
- [User/Controller.js](blood-bank-node/app/modules/User/Controller.js) - 5 console.log calls
- [Request/Controller.js](blood-bank-node/app/modules/Request/Controller.js) - 10+ console.log calls
- [OTP/Controller.js](blood-bank-node/app/modules/OTP/Controller.js) - 1 console.log call
- All React components - 25+ console.log calls

### 8. Implement Input Validation (3-4 hours)
Install validator:
```bash
npm install joi express-validator
```

Example for [blood-bank-node/app/modules/User/Controller.js](blood-bank-node/app/modules/User/Controller.js#L71-L77):
```javascript
const { body, validationResult } = require('express-validator');

const validateRegister = [
  body('emailId').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/),
  body('phoneNumber').isMobilePhone(),
  body('userName').trim().isLength({ min: 2, max: 50 }),
  body('bloodGroup').matches(/^(O|A|B|AB)[+-]$/),
];

router.post('/users/register', validateRegister, (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 0, errors: errors.array() });
  }
  
  const userObj = (new UsersController()).boot(req, res);
  return userObj.register();
});
```

### 9. Add Error Boundaries in React (1-2 hours)
Create [blood-bank-react/src/components/common/ErrorBoundary.js](blood-bank-react/src/components/common/ErrorBoundary.js):
```javascript
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught:', error, errorInfo);
    // TODO: Send to error tracking service (Sentry)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h1>⚠️ Something went wrong</h1>
          <p>Please refresh the page or contact support</p>
          <button onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

Update [blood-bank-react/src/App.js](blood-bank-react/src/App.js):
```javascript
import ErrorBoundary from './components/common/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <LanguageProvider>
          <ThemeProvider>
            {/* ... routes ... */}
          </ThemeProvider>
        </LanguageProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
}
```

### 10. Configure Firebase Security Rules (1 hour)
Go to Firebase Console → Database → Rules, set:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Block all by default
    match /{document=**} {
      allow read: if false;
      allow write: if false;
    }
    
    // Allow specific collections
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId;
    }
  }
}
```

For Realtime Database, set restrictive defaults in Rules tab.

---

## 🟡 MEDIUM PRIORITY: Before Launch (Week 2)

### 11. Implement Email Service (2-3 hours)
```bash
npm install nodemailer
# OR for SendGrid:
npm install @sendgrid/mail
```

Update [blood-bank-node/app/modules/User/Controller.js](blood-bank-node/app/modules/User/Controller.js#L409-L420):
```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // or SendGrid, AWS SES
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// In forgotPasswordSendOtp():
await transporter.sendMail({
  from: process.env.EMAIL_USER,
  to: emailId,
  subject: 'Blood Bank - Password Reset OTP',
  html: `<p>Your OTP: <strong>${otp}</strong></p><p>Valid for 10 minutes</p>`
});
```

### 12. Add Password Strength Validation (30 minutes)
Add to [blood-bank-node/app/modules/User/Controller.js](blood-bank-node/app/modules/User/Controller.js):
```javascript
const validatePasswordStrength = (password) => {
  const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return strongRegex.test(password);
};

// In register():
if (!validatePasswordStrength(data.password)) {
  return this.res.send({
    status: 0,
    message: 'Password must be: 8+ characters, 1 uppercase, 1 number, 1 special character'
  });
}
```

### 13. Add CSRF Protection (1 hour)
```bash
npm install csurf
```

Update [blood-bank-node/configs/express.js](blood-bank-node/configs/express.js):
```javascript
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: false }); // Use session instead

app.use(csrfProtection);

// Make token available to frontend
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

### 14. Fix CORS for Production (15 minutes)
Update [blood-bank-node/configs/express.js](blood-bank-node/configs/express.js):
```javascript
const corsWhitelist = (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',');

app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  if (corsWhitelist.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-CSRF-Token');
  }
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});
```

### 15. Add Comprehensive Logging (2 hours)
Update config to use Logger instead of console:
- Review [blood-bank-node/app/utils/Logger.js](blood-bank-node/app/utils/Logger.js)
- Replace all console.log with Logger.info/error/warn
- Set LOG_LEVEL env var to 'info' in production

---

## 📦 PACKAGES TO INSTALL

```bash
cd blood-bank-node

# Security
npm install helmet
npm install csurf

# Validation
npm install joi express-validator

# Email
npm install nodemailer
# OR: npm install @sendgrid/mail

# Optional but recommended
npm install dotenv-safe  # Enforce required env vars
npm install compression  # Already should be installed
npm install express-async-errors  # Handle async errors

# Remove unused:
npm uninstall crypto  # Built-in, don't need package
npm audit fix
```

---

## ✅ VERIFICATION CHECKLIST

After making changes, verify:

```bash
# 1. Check no secrets in code
grep -r "Testing" blood-bank-node --exclude-dir=node_modules --exclude-dir=.git
grep -r "your-secret-key" blood-bank-node --exclude-dir=node_modules --exclude-dir=.git
grep -r "password.*@" blood-bank-node --exclude-dir=node_modules --exclude-dir=.git

# 2. Check .env files not in git
git status | grep ".env"  # Should be empty

# 3. Verify NODE_ENV
grep "NODE_ENV" blood-bank-node/.env.dev  # Should be "production"

# 4. Check dependencies
npm audit

# 5. Lint check
# npm install --save-dev eslint
# npx eslint app/**/*.js
```

---

## TIMELINE

| Phase | Duration | Tasks |
|-------|----------|-------|
| **Critical** | Today (2-3 days) | 1-4: Secure credentials, remove hardcodes, add helmet, fix NODE_ENV |
| **High** | This week (3-5 days) | 5-10: Rate limiting, error handling, validation, error boundaries |
| **Medium** | Week 2 (3-4 days) | 11-15: Email service, password strength, CSRF, CORS, logging |
| **Testing** | Week 3 (3-5 days) | Integration testing, security audit, load testing, UAT |
| **Deployment** | Week 4 | Production deployment with monitoring |

---

## DEPLOYMENT PREREQUISITES

Before deploying to production, ensure:

1. ✅ All credentials rotated
2. ✅ All hardcoded secrets removed
3. ✅ HTTPS certificate ready
4. ✅ MongoDB backups configured
5. ✅ Error tracking (Sentry) configured
6. ✅ Email service working
7. ✅ Firebase Security Rules configured
8. ✅ Load testing passed (1000+ concurrent users)
9. ✅ Security audit completed
10. ✅ Runbook documented for troubleshooting

---

## CONTACTS

- **Deployment Lead**: [Your name]
- **Security Team**: [Contact]
- **DevOps**: [Contact]
- **On-Call**: [Contact]

---

**Last Updated**: March 2026  
**Next Review**: Before each deployment
