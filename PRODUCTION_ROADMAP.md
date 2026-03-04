# 🚀 BLOOD BANK SYSTEM - PRODUCTION READY ROADMAP
**Single Developer • University Project • 8-12 Weeks**

---

## 📋 PHASE OVERVIEW

| Phase | Focus | Effort | Timeline |
|-------|-------|--------|----------|
| **Phase 1** | Security Hardening | 40 hrs | Weeks 1-2 |
| **Phase 2** | Code Architecture | 60 hrs | Weeks 3-5 |
| **Phase 3** | Database Optimization | 24 hrs | Week 6 |
| **Phase 4** | Testing & Validation | 50 hrs | Weeks 7-8 |
| **Phase 5** | Documentation & Deployment | 30 hrs | Weeks 9-10 |
| **Phase 6** | Optional Enhancements | 20+ hrs | Weeks 11-12 |

**Total: 224+ hours = ~6 weeks full-time or 12 weeks part-time**

---

---

# ⚠️ PHASE 1: SECURITY HARDENING (Weeks 1-2)
## Priority: CRITICAL — Do This First

### **1.1 Fix CORS Vulnerability - MUST FIX** ⛔
**Status:** HIGH SECURITY RISK  
**Priority:** P0 (Security Breach)  
**Effort:** 0.5 hours

**Current Problem:**
```javascript
// blood-bank-node/configs/express.js
res.header("Access-Control-Allow-Origin", "*");  // ❌ Allows all websites!
```

**What to do:**
1. Open `blood-bank-node/configs/express.js`
2. Replace hardcoded CORS with whitelist:

```javascript
// ✅ FIXED
const allowedOrigins = [
  'http://localhost:3000',           // Dev
  'http://localhost:3001',           // Testing
  process.env.REACT_APP_URL || '',  // Production
].filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
```

3. Add to `.env.dev`:
```
REACT_APP_URL=http://localhost:3000
```

4. Test with curl:
```bash
curl -H "Origin: http://attacker.com" http://localhost:4000/api/users/profile
# Should return NO CORS header
```

---

### **1.2 Add Rate Limiting - MUST FIX** 🔒
**Status:** NO PROTECTION  
**Priority:** P0 (Brute Force Vulnerability)  
**Effort:** 1.5 hours

**What to do:**

1. Install rate-limit package:
```bash
cd blood-bank-node
npm install express-rate-limit
```

2. Create `blood-bank-node/middleware/rateLimiter.js`:
```javascript
const rateLimit = require('express-rate-limit');

// Login attempts: 5 per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Registration: 3 per hour
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Too many registrations, try again later',
});

// OTP: 5 per 5 minutes
const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: 'OTP rate limit exceeded',
});

module.exports = { loginLimiter, registerLimiter, otpLimiter };
```

3. Apply in `blood-bank-node/app/modules/User/Routes.js`:
```javascript
const { loginLimiter, registerLimiter } = require('../../../middleware/rateLimiter');

router.post('/users/register', registerLimiter, (req, res, next) => {
  // ... existing code
});

router.post('/users/login', loginLimiter, (req, res, next) => {
  // ... existing code
});
```

4. Apply in `blood-bank-node/app/modules/OTP/Routes.js`:
```javascript
const { otpLimiter } = require('../../../middleware/rateLimiter');

router.post('/otp/send', otpLimiter, (req, res, next) => {
  // ... existing code
});
```

5. Test:
```bash
# Try login 6 times in 15 minutes
curl -X POST http://localhost:4000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"emailId":"test@test.com","password":"wrong"}' \
  # 6th request should be rate-limited
```

---

### **1.3 Fix Token Management - MUST FIX** 🔐
**Status:** CRITICAL (Allows Replay Attacks)  
**Priority:** P0 (Auth Bypass)  
**Effort:** 3 hours

**Current Problem:**
```javascript
// Tokens stored in MongoDB (bad practice)
// No revocation mechanism
// Token validation has race conditions
```

**What to do:**

1. Install Redis:
```bash
npm install redis
```

2. Create `blood-bank-node/configs/redis.js`:
```javascript
const redis = require('redis');

let client;

const connectRedis = async () => {
  client = redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  });

  client.on('error', (err) => console.error('Redis error:', err));
  await client.connect();
  console.log('✅ Redis connected');
  return client;
};

const getRedis = () => client;

module.exports = { connectRedis, getRedis };
```

3. Update `blood-bank-node/configs/Globals.js`:
```javascript
const { getRedis } = require('./redis');

class Globals {
  async getToken(params) {
    try {
      const redis = getRedis();
      const token = jwt.sign({
        id: params.id,
        algorithm: "HS256",
        exp: Math.floor(Date.now() / 1000) + parseInt(config.tokenExpiry)
      }, config.securityToken);

      params.token = token;
      params.userId = params.id;
      delete params.id;

      // Store in Redis with TTL (not MongoDB!)
      const expiryTime = Math.floor(parseInt(config.tokenExpirationTime) * 60 * 1000);
      await redis.setEx(`token:${token}`, parseInt(config.tokenExpirationTime) * 60, 
                        JSON.stringify(params));

      return { token };
    } catch (err) {
      console.log("Get token error", err);
      return { message: err, status: 0 };
    }
  }

  async isAuthorised(req, res, next) {
    try {
      const token = req.headers.authorization;
      if (!token) return res.status(401).json({ status: 0, message: "Token required" });

      const redis = getRedis();
      
      // Check JWT signature
      const decoded = jwt.verify(token, config.securityToken);
      
      // Check exists in Redis (revocation check)
      const tokenData = await redis.get(`token:${token}`);
      if (!tokenData) {
        return res.status(401).json({ status: 0, message: "Token expired or revoked" });
      }

      const user = await Users.findOne({ _id: decoded.id, isDeleted: false });
      if (!user) {
        return res.status(401).json({ status: 0, message: "User not found" });
      }

      req.currentUser = user;
      next();
    } catch (err) {
      console.log("Auth error", err.message);
      return res.status(401).json({ status: 0, message: "Invalid token" });
    }
  }

  async logout(userId) {
    const redis = getRedis();
    // Delete all user tokens from Redis
    const pattern = `token:*`;
    const keys = await redis.keys(pattern);
    
    for (let key of keys) {
      const data = await redis.get(key);
      if (data && JSON.parse(data).userId === userId) {
        await redis.del(key);
      }
    }
    
    return { status: 1 };
  }
}
```

4. Update logout route:
```javascript
router.get('/users/logout', Globals.isAuthorised, async (req, res, next) => {
  await new Globals().logout(req.currentUser._id);
  return res.send({ status: 1, message: "Logged out successfully" });
});
```

5. Remove `Authentication` collection usage (no longer needed)

6. Update `.env.dev`:
```
REDIS_HOST=localhost
REDIS_PORT=6379
```

7. Test:
```bash
# Get token
TOKEN=$(curl -X POST http://localhost:4000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"emailId":"test@test.com","password":"pass"}' | jq -r '.access_token')

# Before logout: should work
curl http://localhost:4000/api/users/profile \
  -H "Authorization: $TOKEN"

# Logout
curl http://localhost:4000/api/users/logout \
  -H "Authorization: $TOKEN"

# After logout: should fail
curl http://localhost:4000/api/users/profile \
  -H "Authorization: $TOKEN"
```

---

### **1.4 Add Input Validation Schema - MUST FIX** ✅
**Status:** NO VALIDATION  
**Priority:** P0 (Injection Attacks)  
**Effort:** 2.5 hours

**What to do:**

1. Install validation library:
```bash
npm install joi
```

2. Create `blood-bank-node/middleware/validators.js`:
```javascript
const Joi = require('joi');

const validationError = (schema, data) => {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) {
    const messages = error.details.map(e => e.message).join(', ');
    return { valid: false, message: messages };
  }
  return { valid: true, value };
};

// Registration schema
const registerSchema = Joi.object({
  emailId: Joi.string().email().lowercase().required(),
  password: Joi.string().min(8)
    .pattern(/[A-Z]/)
    .pattern(/[0-9]/)
    .pattern(/[^a-zA-Z0-9]/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain uppercase, number, and special char'
    }),
  userName: Joi.string().min(2).max(50).required(),
  phoneNumber: Joi.string().pattern(/^\d{10}$/).required(),
  bloodGroup: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-').required(),
  pincode: Joi.string().pattern(/^\d{6}$/).required(),
  firebaseUid: Joi.string().required(),
  idToken: Joi.string().required(),
});

// Login schema
const loginSchema = Joi.object({
  emailId: Joi.string().email().lowercase().required(),
  password: Joi.string().required(),
});

module.exports = { validationError, registerSchema, loginSchema };
```

3. Create validation middleware `blood-bank-node/middleware/validateRequest.js`:
```javascript
const { validationError } = require('./validators');

const validateRequest = (schema) => {
  return (req, res, next) => {
    const result = validationError(schema, req.body);
    if (!result.valid) {
      return res.status(400).json({ status: 0, message: result.message });
    }
    req.validatedBody = result.value;
    next();
  };
};

module.exports = validateRequest;
```

4. Update routes:
```javascript
// User/Routes.js
const validateRequest = require('../../../middleware/validateRequest');
const { registerSchema, loginSchema } = require('../../../middleware/validators');

router.post('/users/register', 
  registerLimiter,
  validateRequest(registerSchema),
  (req, res, next) => {
    const userObj = (new UsersController()).boot(req, res);
    return userObj.register();
  }
);

router.post('/users/login',
  loginLimiter,
  validateRequest(loginSchema),
  (req, res, next) => {
    const userObj = (new UsersController()).boot(req, res);
    return userObj.login();
  }
);
```

5. Update controller to use `req.validatedBody`:
```javascript
async register() {
  try {
    const data = this.req.validatedBody;  // ← Already validated!
    // ... rest of code
  }
}
```

---

### **1.5 Add Security Headers - SHOULD FIX** 🛡️
**Status:** NO SECURITY HEADERS  
**Priority:** P1 (Medium)  
**Effort:** 1 hour

**What to do:**

1. Install helmet.js:
```bash
npm install helmet
```

2. Update `blood-bank-node/configs/express.js`:
```javascript
const helmet = require('helmet');
const app = express();

// Add security headers
app.use(helmet());
app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true }));
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
  },
}));

// ... rest of middleware
```

---

### **1.6 Remove Twilio Residual Code - MUST FIX** 🧹
**Status:** DANGLING CODE  
**Priority:** P1 (Code Quality)  
**Effort:** 0.5 hours

**What to do:**

1. Open `blood-bank-node/app/modules/Request/Controller.js`
2. Remove lines 14-30 (Twilio initialization):
```javascript
// ❌ DELETE THESE LINES
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

let client;
try {
    if (accountSid && authToken) {
        client = require('twilio')(accountSid, authToken);
    }
} catch (e) {
    console.warn('Twilio package not available...');
}

if (!client) {
    client = {
        messages: {
            create: (opts) => {...}
        }
    };
}
```

3. Replace WhatsApp messaging with queue-based approach (in Phase 2)

4. Remove from `.env.dev`:
```
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

---

### **1.7 Add HTTPS Enforcement - SHOULD FIX** 🔐
**Status:** DEV ONLY, NO REDIRECT  
**Priority:** P1 (Production)  
**Effort:** 1 hour

**What to do:**

1. Update `blood-bank-node/server.js`:
```javascript
const https = require('https');
const fs = require('fs');

const app = express();

// Redirect HTTP to HTTPS (in production)
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

// Listen on HTTPS (in production)
if (process.env.NODE_ENV === 'production' && fs.existsSync('ssl/cert.pem')) {
  const httpsOptions = {
    cert: fs.readFileSync('ssl/cert.pem'),
    key: fs.readFileSync('ssl/key.pem'),
  };
  https.createServer(httpsOptions, app).listen(443);
} else {
  http.createServer(app).listen(config.serverPort);
}
```

---

### **1.8 Add Error Handling Middleware - SHOULD FIX** 🚨
**Status:** NO GLOBAL ERROR HANDLER  
**Priority:** P1 (Stability)  
**Effort:** 1.5 hours

**What to do:**

1. Create `blood-bank-node/middleware/errorHandler.js`:
```javascript
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  // Log error (detailed, not in response)
  console.error(`[${new Date().toISOString()}] Error:`, {
    statusCode,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    requestId: req.id,
  });

  // Send generic response (don't leak internals)
  res.status(statusCode).json({
    status: 0,
    message: process.env.NODE_ENV === 'development' ? message : 'An error occurred',
  });
};

module.exports = { AppError, errorHandler };
```

2. Update `blood-bank-node/configs/express.js`:
```javascript
const { errorHandler } = require('../middleware/errorHandler');

// ... all routes ...

// Error handler (MUST be last)
app.use(errorHandler);
```

3. Update controllers to throw errors:
```javascript
async register() {
  try {
    const data = this.req.validatedBody;
    if (!data.firebaseUid) {
      throw new AppError('Firebase UID required', 400);
    }
    // ...
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(error.message || 'Registration failed', 500);
  }
}
```

---

## ✅ PHASE 1 CHECKLIST

- [ ] CORS whitelist implemented and tested
- [ ] Rate limiting added to all risky endpoints
- [ ] Redis installed and token management migrated
- [ ] Input validation with Joi schema added
- [ ] Security headers added (helmet.js)
- [ ] Twilio dead code removed
- [ ] HTTPS enforcement configured
- [ ] Global error handler implemented
- [ ] All 8 routes tested with new security
- [ ] `.env.dev` updated with new variables

**Phase 1 Complete:** 40 hours ✅

---

---

# 🏗️ PHASE 2: CODE ARCHITECTURE REFACTORING (Weeks 3-5)
## Priority: HIGH — Makes Code Maintainable

### **2.1 Introduce Service Layer - MUST FIX** 🎯
**Status:** NO SERVICE LAYER  
**Priority:** P1 (Maintainability)  
**Effort:** 15 hours

**Current Problem:**
```javascript
// Business logic mixed with HTTP handling
async register() {
  const data = this.req.validatedBody;
  // 20+ lines of validation, DB queries, Firebase calls
}
```

**What to do:**

1. Create `blood-bank-node/app/services/UserService.js`:
```javascript
const Users = require('../modules/User/Schema').Users;
const admin = require('../../configs/firebase');
const CommonService = require('./Common');

class UserService {
  async registerUser(data) {
    // 1. Validate Firebase
    if (!admin || !admin.apps.length) {
      throw new Error('Firebase unavailable');
    }

    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(data.idToken);
    } catch (err) {
      throw new Error('Invalid Firebase token');
    }

    // 2. Check phone mismatch
    if (decodedToken.phone_number) {
      const tokenPhone = decodedToken.phone_number.replace("+91", "");
      if (tokenPhone !== data.phoneNumber) {
        throw new Error('Phone number mismatch');
      }
    }

    // 3. Check duplicates
    const existingEmail = await Users.findOne({
      emailId: data.emailId.toLowerCase(),
      isDeleted: false
    });
    if (existingEmail) {
      throw new Error('Email already registered');
    }

    const existingFirebase = await Users.findOne({
      firebaseUid: data.firebaseUid,
      isDeleted: false
    });
    if (existingFirebase) {
      throw new Error('Account already exists');
    }

    // 4. Encrypt password
    const encryptedPassword = await new CommonService().ecryptPassword({
      password: data.password
    });

    // 5. Create user
    const userData = {
      userName: data.userName,
      phoneNumber: data.phoneNumber,
      pincode: data.pincode,
      emailId: data.emailId.toLowerCase(),
      bloodGroup: data.bloodGroup,
      password: encryptedPassword,
      role: "Donor",
      firebaseUid: data.firebaseUid,
      isPhoneVerified: true
    };

    const newUser = await Users.create(userData);
    return {
      id: newUser._id,
      userName: newUser.userName,
      emailId: newUser.emailId,
      bloodGroup: newUser.bloodGroup
    };
  }

  async loginUser(emailId, password) {
    const user = await Users.findOne({
      emailId: emailId.toLowerCase(),
      isDeleted: false
    });

    if (!user) {
      throw new Error('User not found');
    }

    const valid = await new CommonService().verifyPassword({
      password,
      savedPassword: user.password
    });

    if (!valid) {
      throw new Error('Incorrect password');
    }

    return {
      id: user._id,
      userName: user.userName,
      emailId: user.emailId,
      bloodGroup: user.bloodGroup
    };
  }

  async getUserProfile(userId) {
    const user = await Users.findOne({
      _id: userId,
      isDeleted: false
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user._id,
      userName: user.userName,
      emailId: user.emailId,
      phoneNumber: user.phoneNumber,
      bloodGroup: user.bloodGroup,
      pincode: user.pincode,
      role: user.role
    };
  }

  async updateProfile(userId, data) {
    const allowedFields = ['userName', 'phoneNumber', 'bloodGroup', 'pincode'];
    const updateData = {};
    
    allowedFields.forEach(field => {
      if (data[field]) updateData[field] = data[field];
    });

    const updated = await Users.findByIdAndUpdate(userId, updateData, { new: true });
    if (!updated) {
      throw new Error('Update failed');
    }

    return updated;
  }

  async saveFcmToken(userId, fcmToken) {
    await Users.findByIdAndUpdate(userId, { fcmToken }, { new: true });
    return { status: 1 };
  }
}

module.exports = UserService;
```

2. Update `blood-bank-node/app/modules/User/Controller.js`:
```javascript
const UserService = require('../../services/UserService');
const Globals = require('../../../configs/Globals');
const { AppError } = require('../../../middleware/errorHandler');

class UsersController extends Controller {
  async register() {
    try {
      const userService = new UserService();
      const data = this.req.validatedBody;
      
      const newUser = await userService.registerUser(data);
      return this.res.send({
        status: 1,
        message: "User registered successfully",
        data: newUser
      });
    } catch (error) {
      throw new AppError(error.message, 400);
    }
  }

  async login() {
    try {
      const userService = new UserService();
      const { emailId, password } = this.req.validatedBody;
      
      const user = await userService.loginUser(emailId, password);
      const { token } = await new Globals().getToken({ id: user.id });
      
      return this.res.send({
        status: 1,
        message: "Login successful",
        access_token: token,
        data: user
      });
    } catch (error) {
      throw new AppError(error.message, 401);
    }
  }

  async userProfile() {
    try {
      const userService = new UserService();
      const user = await userService.getUserProfile(this.req.currentUser._id);
      
      return this.res.send({
        status: 1,
        data: user
      });
    } catch (error) {
      throw new AppError(error.message, 404);
    }
  }

  async editUserProfile() {
    try {
      const userService = new UserService();
      const updated = await userService.updateProfile(
        this.req.currentUser._id,
        this.req.validatedBody
      );
      
      return this.res.send({
        status: 1,
        message: "Profile updated",
        data: updated
      });
    } catch (error) {
      throw new AppError(error.message, 400);
    }
  }

  async saveFcmToken() {
    try {
      const userService = new UserService();
      await userService.saveFcmToken(
        this.req.currentUser._id,
        this.req.body.fcmToken
      );
      
      return this.res.send({ status: 1, message: "FCM token saved" });
    } catch (error) {
      throw new AppError(error.message, 400);
    }
  }

  async logout() {
    try {
      const globals = new Globals();
      await globals.logout(this.req.currentUser._id);
      
      return this.res.send({
        status: 1,
        message: "Logged out successfully"
      });
    } catch (error) {
      throw new AppError(error.message, 400);
    }
  }
}

module.exports = UsersController;
```

3. Create `blood-bank-node/app/services/RequestService.js`:
```javascript
const Requests = require('../modules/Request/Schema').Requests;
const Users = require('../modules/User/Schema').Users;
const { AppError } = require('../../middleware/errorHandler');

class RequestService {
  async getDonorsList(userId, filters) {
    const query = [{ _id: { $nin: [userId] } }];
    
    if (filters.pincode) {
      query.push({ pincode: filters.pincode });
    }
    
    if (filters.bloodGroup && filters.bloodGroup !== "any") {
      query.push({ bloodGroup: filters.bloodGroup });
    }

    const donors = await Users.find(
      { $and: query },
      { password: 0, fcmToken: 0 }  // Exclude sensitive fields
    );

    return donors;
  }

  async createRequest(userId, requestData) {
    const { userIds, bloodGroup, pincode, address } = requestData;

    if (!userIds || userIds.length === 0) {
      throw new AppError('No donors selected', 400);
    }

    const requestsCount = await Requests.countDocuments({ isDeleted: false });
    const requestId = `BCREQ${requestsCount + 1}`;

    const createdRequests = [];
    for (let donorId of userIds) {
      const request = await Requests.create({
        requestedBy: userId,
        donorId,
        pincode,
        bloodGroup,
        address,
        requestId
      });
      createdRequests.push(request);
    }

    // ⚠️ TODO: Queue notifications (Phase 2.3)
    return { status: 1, message: "Requests sent", requestId };
  }

  async getRequestStatus(userId, status = 'pending') {
    const query = { requestedBy: userId, isDeleted: false };

    if (status === 'accepted') {
      query.isAcceptedByUser = true;
      query.isRejectedByUser = false;
    } else if (status === 'rejected') {
      query.isRejectedByUser = true;
      query.isAcceptedByUser = false;
    } else {
      query.isAcceptedByUser = false;
      query.isRejectedByUser = false;
    }

    const requests = await Requests.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "users",
          localField: "donorId",
          foreignField: "_id",
          as: "donor"
        }
      },
      { $unwind: "$donor" },
      {
        $project: {
          requestId: 1,
          userId: "$donor._id",
          userName: "$donor.userName",
          phoneNumber: "$donor.phoneNumber",
          bloodGroup: "$donor.bloodGroup",
          pincode: "$donor.pincode",
          status: {
            $cond: [
              "$isAcceptedByUser",
              "accepted",
              { $cond: ["$isRejectedByUser", "rejected", "pending"] }
            ]
          }
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    return requests;
  }

  async acceptRequest(donorId, requestId) {
    const request = await Requests.findOneAndUpdate(
      { donorId, requestId },
      { isAcceptedByUser: true },
      { new: true }
    );

    if (!request) {
      throw new AppError('Request not found', 404);
    }

    // ⚠️ TODO: Notify requester (Phase 2.3)
    return { status: 1, message: "Request accepted" };
  }

  async rejectRequest(donorId, requestId) {
    const request = await Requests.findOneAndUpdate(
      { donorId, requestId },
      { isRejectedByUser: true },
      { new: true }
    );

    if (!request) {
      throw new AppError('Request not found', 404);
    }

    return { status: 1, message: "Request rejected" };
  }

  async cancelRequest(userId, requestId) {
    await Requests.updateMany(
      { requestId, requestedBy: userId },
      { isDeleted: true }
    );

    return { status: 1, message: "Request cancelled" };
  }
}

module.exports = RequestService;
```

4. Update `blood-bank-node/app/modules/Request/Controller.js` similarly

---

### **2.2 Remove Base Controller Pattern - SHOULD FIX** 🗑️
**Status:** UNNECESSARY ABSTRACTION  
**Priority:** P2 (Code Clarity)  
**Effort:** 2 hours

**Current Problem:**
```javascript
class UsersController extends Controller {
  constructor() {
    super();
  }
  
  async register() {
    // 'this.req', 'this.res' auto-magically available
  }
}
```

**What to do:**

1. Replace with standard Express pattern:
```javascript
// ✅ SIMPLER
async register(req, res, next) {
  try {
    const userService = new UserService();
    const data = req.validatedBody;
    const newUser = await userService.registerUser(data);
    
    return res.json({
      status: 1,
      message: "User registered successfully",
      data: newUser
    });
  } catch (error) {
    next(error);  // Pass to error handler
  }
}
```

2. Update routes:
```javascript
router.post('/users/register',
  registerLimiter,
  validateRequest(registerSchema),
  async (req, res, next) => {
    const userService = new UserService();
    const newUser = await userService.registerUser(req.validatedBody);
    res.json({ status: 1, data: newUser });
  }
);
```

---

### **2.3 Add Message Queue for Async Tasks - SHOULD FIX** 📤
**Status:** BLOCKING REQUESTS  
**Priority:** P2 (Performance)  
**Effort:** 4 hours

**Current Problem:**
```javascript
// WhatsApp/email calls block the request
await client.messages.create({...});  // 5+ second delay
return res.send({status: 1});  // User waits unnecessarily
```

**What to do:**

1. Install Bull queue:
```bash
npm install bull
```

2. Create `blood-bank-node/queue/notificationQueue.js`:
```javascript
const Queue = require('bull');
const { getRedis } = require('../configs/redis');

const notificationQueue = new Queue('notifications', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
  }
});

// Process notifications
notificationQueue.process(async (job) => {
  const { type, to, message } = job.data;
  
  try {
    if (type === 'whatsapp') {
      // Call WhatsApp API
      console.log(`📤 Sending WhatsApp to ${to}: ${message}`);
      // await client.messages.create({...});
    } else if (type === 'email') {
      console.log(`📧 Sending Email to ${to}: ${message}`);
      // await sendEmail({...});
    }
    
    return { success: true };
  } catch (error) {
    console.error(`Failed to send ${type}:`, error);
    throw error;  // Will retry
  }
});

notificationQueue.on('completed', (job) => {
  console.log(`✅ Notification sent: ${job.id}`);
});

notificationQueue.on('failed', (job, err) => {
  console.error(`❌ Notification failed: ${job.id}`, err.message);
});

module.exports = notificationQueue;
```

3. Update RequestService to queue notifications:
```javascript
// blood-bank-node/app/services/RequestService.js
const notificationQueue = require('../../queue/notificationQueue');

async createRequest(userId, requestData) {
  const { userIds, bloodGroup, pincode, address } = requestData;
  
  const requestId = `BCREQ${Date.now()}`;

  for (let donorId of userIds) {
    await Requests.create({
      requestedBy: userId,
      donorId,
      pincode,
      bloodGroup,
      address,
      requestId
    });

    // Queue notification (don't wait)
    await notificationQueue.add(
      {
        type: 'whatsapp',
        to: '+91XXXXX',  // Fetch from DB
        message: `Blood request for ${bloodGroup}`
      },
      { delay: 0, attempts: 3, backoff: { type: 'exponential', delay: 2000 } }
    );
  }

  return { status: 1, message: "Requests sent", requestId };
}
```

---

### **2.4 Create Data Transfer Objects (DTOs) - SHOULD FIX** 📦
**Status:** LEAKING DB SCHEMA  
**Priority:** P2 (Security/Consistency)  
**Effort:** 3 hours

**Current Problem:**
```javascript
const user = await Users.findOne({...});
return res.send({status: 1, data: user});  // All fields exposed!
// Includes password (encrypted but still), fcmToken, etc.
```

**What to do:**

1. Create `blood-bank-node/dto/UserDTO.js`:
```javascript
class UserDTO {
  constructor(user) {
    this.id = user._id;
    this.userName = user.userName;
    this.emailId = user.emailId;
    this.bloodGroup = user.bloodGroup;
    this.pincode = user.pincode;
    this.phoneNumber = user.phoneNumber;
    this.role = user.role;
    // ❌ NOT INCLUDED: password, fcmToken, firebaseUid
  }

  static fromUser(user) {
    return new UserDTO(user);
  }

  static fromArray(users) {
    return users.map(u => UserDTO.fromUser(u));
  }
}

module.exports = UserDTO;
```

2. Update services to return DTOs:
```javascript
async getUserProfile(userId) {
  const user = await Users.findOne({_id: userId});
  if (!user) throw new Error('Not found');
  return UserDTO.fromUser(user);
}
```

---

### **2.5 Add Request/Response Logging - SHOULD FIX** 📊
**Status:** NO VISIBILITY  
**Priority:** P2 (Debugging)  
**Effort:** 2 hours

**What to do:**

1. Create `blood-bank-node/middleware/logger.js`:
```javascript
const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

const log = (level, message, data = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...data
  };

  console.log(JSON.stringify(logEntry));

  // Also write to file (optional)
  fs.appendFileSync(
    path.join(logsDir, `app-${new Date().toISOString().split('T')[0]}.log`),
    JSON.stringify(logEntry) + '\n'
  );
};

const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    log('info', 'Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.currentUser?._id || 'anonymous'
    });
  });

  next();
};

module.exports = { log, requestLogger };
```

2. Use in `express.js`:
```javascript
const { requestLogger } = require('../middleware/logger');
app.use(requestLogger);
```

---

## ✅ PHASE 2 CHECKLIST

- [ ] Service layer created for User and Request
- [ ] Controllers simplified to 5-10 lines each
- [ ] Base Controller pattern removed
- [ ] Message queue (Bull) installed and tested
- [ ] Async notifications working (no request blocks)
- [ ] DTOs created and used in responses
- [ ] Request/response logging implemented
- [ ] All routes refactored to use services
- [ ] Code duplication reduced

**Phase 2 Complete:** 60 hours ✅

---

---

# 📊 PHASE 3: DATABASE OPTIMIZATION (Week 6)
## Priority: MEDIUM — Improves Performance

### **3.1 Add Indexes - MUST FIX** ⚡
**Status:** NO INDEXES  
**Priority:** P1 (Performance)  
**Effort:** 1.5 hours

**Current Problem:**
```javascript
// Every login scans entire Users collection
Users.findOne({emailId: data.emailId})  // O(n) — SLOW!
```

**What to do:**

1. Update `blood-bank-node/app/modules/User/Schema.js`:
```javascript
var user = new schema({
  userName: { type: String },
  phoneNumber: { type: String, index: true },  // ✅ Add index
  pincode: { type: String },
  emailId: { type: String, index: true, unique: true, sparse: true },  // ✅ Unique index
  role: { type: String, enum: ['Donor', 'Recipient'], default: 'Donor' },
  bloodGroup: { type: String, index: true },  // ✅ For filtering
  isDeleted: { type: Boolean, default: false, index: true },  // ✅ For soft deletes
  isActive: { type: Boolean, default: true },
  password: { type: String },
  firebaseUid: { type: String, unique: true, sparse: true, index: true },  // ✅ Index
  isPhoneVerified: { type: Boolean, default: false },
  fcmToken: { type: String },
}, { timestamps: true });

// Compound indexes for common queries
user.index({pincode: 1, bloodGroup: 1});  // ✅ For donor search
user.index({isDeleted: 1, role: 1});      // ✅ For filtering active donors

let Users = mongoose.model('User', user);
```

2. Update `blood-bank-node/app/modules/Request/Schema.js`:
```javascript
var request = new schema({
  requestedBy: { type: schema.Types.ObjectId, ref: 'Users', index: true },  // ✅
  donorId: { type: schema.Types.ObjectId, ref: 'Users', index: true },      // ✅
  pincode: { type: String },
  bloodGroup: { type: String },
  address: { type: String },
  requestId: { type: String, index: true },  // ✅
  isAcceptedByUser: { type: Boolean, default: false },
  isRejectedByUser: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false, index: true },  // ✅
}, { timestamps: true });

// Compound indexes
request.index({requestedBy: 1, isDeleted: 1});   // ✅
request.index({donorId: 1, requestId: 1});       // ✅
request.index({requestId: 1, isDeleted: 1});     // ✅

let Requests = mongoose.model('requests', request);
```

3. Update `blood-bank-node/app/modules/Donor/Schema.js`:
```javascript
var donor = new schema({
  name: { type: String, required: true, index: true },  // ✅
  bloodGroup: { type: String, required: true, index: true },  // ✅
  phone: { type: String, required: true, index: true },  // ✅
  pincode: { type: String, required: true, index: true },  // ✅
  lastDonationDate: { type: Date, required: true },
  addedBy: { type: schema.Types.ObjectId, ref: 'Users', required: true, index: true },  // ✅
  isDeleted: { type: Boolean, default: false, index: true },  // ✅
}, { timestamps: true });

// Compound index
donor.index({pincode: 1, bloodGroup: 1, isDeleted: 1});  // ✅

let Donors = mongoose.model('donors', donor);
```

4. Test indexes:
```bash
# In MongoDB shell
db.users.getIndexes()
# Should show: emailId, phoneNumber, firebaseUid, etc.
```

---

### **3.2 Add Data Validation in Schema - SHOULD FIX** ✅
**Status:** MINIMAL VALIDATION  
**Priority:** P2 (Data Quality)  
**Effort:** 2 hours

**What to do:**

1. Update User schema with validation:
```javascript
var user = new schema({
  userName: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 50,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    match: /^\d{10}$/,
    index: true
  },
  pincode: {
    type: String,
    required: true,
    match: /^\d{6}$/
  },
  emailId: {
    type: String,
    required: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    lowercase: true,
    unique: true,
    sparse: true,
    index: true
  },
  bloodGroup: {
    type: String,
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
  },
  role: {
    type: String,
    enum: ['Donor', 'Recipient'],
    default: 'Donor'
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false  // Don't return by default
  },
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  fcmToken: {
    type: String,
    select: false  // Don't return by default
  }
}, { timestamps: true });

// Prevent modification of critical fields
user.pre('findOneAndUpdate', function(next) {
  this.set({ firebaseUid: undefined, emailId: undefined });
  next();
});
```

2. Update Donor schema:
```javascript
var donor = new schema({
  name: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 50,
    trim: true,
    index: true
  },
  bloodGroup: {
    type: String,
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
    index: true
  },
  phone: {
    type: String,
    required: true,
    match: /^\d{10}$/,
    index: true
  },
  pincode: {
    type: String,
    required: true,
    match: /^\d{6}$/,
    index: true
  },
  lastDonationDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(v) {
        return v <= new Date();
      },
      message: 'Donation date cannot be in the future'
    }
  },
  addedBy: {
    type: schema.Types.ObjectId,
    ref: 'Users',
    required: true,
    index: true
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  }
}, { timestamps: true });

// Auto-calculate next eligible donation date (90 days)
donor.virtual('nextEligibleDate').get(function() {
  const nextDate = new Date(this.lastDonationDate);
  nextDate.setDate(nextDate.getDate() + 90);
  return nextDate;
});
```

---

### **3.3 Add Pagination to Routes - SHOULD FIX** 📄
**Status:** NO PAGINATION  
**Priority:** P2 (Performance)  
**Effort:** 2 hours

**What to do:**

1. Create pagination helper `blood-bank-node/utils/pagination.js`:
```javascript
const getPagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(parseInt(query.limit) || 10, 100);  // Max 100
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

module.exports = { getPagination };
```

2. Update RequestService:
```javascript
async getDonorsList(userId, filters) {
  const { page, limit, skip } = filters.pagination;
  
  const query = [{ _id: { $nin: [userId] } }];
  if (filters.pincode) query.push({ pincode: filters.pincode });
  if (filters.bloodGroup !== "any") query.push({ bloodGroup: filters.bloodGroup });

  const total = await Users.countDocuments({$and: query});
  const donors = await Users.find({$and: query})
    .skip(skip)
    .limit(limit)
    .select('-password -fcmToken');

  return {
    donors,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}
```

3. Update route:
```javascript
router.post('/requests/donors-list', Globals.isAuthorised, async (req, res, next) => {
  const { page, limit, skip } = getPagination(req.query);
  
  const result = await requestService.getDonorsList(
    req.currentUser._id,
    {
      ...req.validatedBody,
      pagination: { page, limit, skip }
    }
  );

  res.json(result);
});
```

---

### **3.4 Add Query Optimization - SHOULD FIX** 🚀
**Status:** UNOPTIMIZED AGGREGATIONS  
**Priority:** P2 (Performance)  
**Effort:** 1.5 hours

**What to do:**

1. Update Request aggregation (fix N+1):
```javascript
// ❌ BEFORE: Joins after match (inefficient)
let requests = await Requests.aggregate([
  { $match: query },
  { $lookup: {...} },
  { $unwind: "$users" },
  { $project: {...} }
]);

// ✅ AFTER: Optimize
let requests = await Requests.aggregate([
  // Join first (use index)
  { $lookup: {
      from: "users",
      localField: "donorId",
      foreignField: "_id",
      as: "donor",
      pipeline: [{ $match: {isDeleted: false} }]
    }
  },
  { $unwind: "$donor" },
  // Then filter
  { $match: {
      requestedBy: ObjectId(userId),
      isDeleted: false
    }
  },
  // Project only needed fields
  { $project: {
      requestId: 1,
      status: {$cond: [
        "$isAcceptedByUser",
        "accepted",
        {$cond: ["$isRejectedByUser", "rejected", "pending"]}
      ]},
      donor: {
        _id: 1,
        userName: 1,
        phoneNumber: 1,
        bloodGroup: 1
      }
    }
  },
  { $sort: {createdAt: -1} },
  { $limit: 10 }  // Always limit
]);
```

2. Add query monitoring:
```javascript
// In mongoose connection
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected');
});

// Log slow queries
if (process.env.NODE_ENV === 'development') {
  mongoose.set('debug', true);
}
```

---

## ✅ PHASE 3 CHECKLIST

- [ ] All indexes created on query fields
- [ ] Unique indexes on emailId, firebaseUid, phone
- [ ] Compound indexes for common filters
- [ ] Schema validation added (match, enum, min/max)
- [ ] Pagination implemented with page/limit
- [ ] Query optimization applied
- [ ] Tested with explain() for index usage
- [ ] Query performance improved (< 100ms)

**Phase 3 Complete:** 24 hours ✅

---

---

# ✔️ PHASE 4: TESTING & QUALITY ASSURANCE (Weeks 7-8)
## Priority: HIGH — Confidence in Code

### **4.1 Set Up Testing Framework - MUST FIX** 🧪
**Status:** NO TESTS  
**Priority:** P1 (Confidence)  
**Effort:** 3 hours

**What to do:**

1. Install Jest:
```bash
npm install --save-dev jest supertest @testing-library/react
npm install --save-dev jest-mongodb
```

2. Create `jest.config.js` (root):
```javascript
module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: ['app/**/*.js'],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  }
};
```

3. Add to `package.json`:
```json
{
  "scripts": {
    "test": "jest --coverage",
    "test:watch": "jest --watch"
  }
}
```

---

### **4.2 Write Unit Tests for Services - SHOULD FIX** ✔️
**Status:** NO UNIT TESTS  
**Priority:** P1 (Code Quality)  
**Effort:** 15 hours

**What to do:**

1. Create `blood-bank-node/app/services/__tests__/UserService.test.js`:
```javascript
const UserService = require('../UserService');
const Users = require('../../modules/User/Schema').Users;
const admin = require('../../../configs/firebase');

// Mock Firebase
jest.mock('../../../configs/firebase');

// Mock Database
jest.mock('../../modules/User/Schema');

describe('UserService', () => {
  let userService;

  beforeEach(() => {
    userService = new UserService();
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        emailId: 'test@example.com',
        password: 'SecurePass123!',
        userName: 'Test User',
        phoneNumber: '9876543210',
        firebaseUid: 'fb123',
        idToken: 'token123',
        bloodGroup: 'O+',
        pincode: '123456'
      };

      // Mock Firebase verification
      admin.auth().verifyIdToken.mockResolvedValue({
        uid: 'fb123',
        phone_number: '+919876543210'
      });

      // Mock database
      Users.findOne.mockResolvedValueOnce(null);  // No existing email
      Users.findOne.mockResolvedValueOnce(null);  // No existing Firebase
      Users.create.mockResolvedValue({
        _id: 'user123',
        emailId: userData.emailId,
        userName: userData.userName
      });

      const result = await userService.registerUser(userData);

      expect(result.id).toBe('user123');
      expect(result.emailId).toBe('test@example.com');
      expect(Users.create).toHaveBeenCalled();
    });

    it('should reject if email already exists', async () => {
      const userData = {
        emailId: 'existing@example.com',
        password: 'SecurePass123!',
        userName: 'Test User',
        phoneNumber: '9876543210',
        firebaseUid: 'fb123',
        idToken: 'token123',
        bloodGroup: 'O+',
        pincode: '123456'
      };

      admin.auth().verifyIdToken.mockResolvedValue({
        uid: 'fb123',
        phone_number: '+919876543210'
      });

      Users.findOne.mockResolvedValueOnce({
        emailId: 'existing@example.com'
      });

      await expect(userService.registerUser(userData))
        .rejects.toThrow('Email already registered');
    });

    it('should reject if Firebase token is invalid', async () => {
      const userData = {
        emailId: 'test@example.com',
        password: 'SecurePass123!',
        userName: 'Test User',
        phoneNumber: '9876543210',
        firebaseUid: 'fb123',
        idToken: 'invalid_token',
        bloodGroup: 'O+',
        pincode: '123456'
      };

      admin.auth().verifyIdToken.mockRejectedValue(new Error('Invalid token'));

      await expect(userService.registerUser(userData))
        .rejects.toThrow('Invalid Firebase token');
    });
  });

  describe('loginUser', () => {
    it('should login user with correct credentials', async () => {
      // Mock
      Users.findOne.mockResolvedValue({
        _id: 'user123',
        emailId: 'test@example.com',
        userName: 'Test User',
        password: 'hashedPassword'
      });

      // Mock password verification
      const commonService = require('../Common');
      commonService.verifyPassword = jest.fn().mockResolvedValue(true);

      const result = await userService.loginUser('test@example.com', 'password123');

      expect(result.id).toBe('user123');
      expect(result.emailId).toBe('test@example.com');
    });

    it('should reject user not found', async () => {
      Users.findOne.mockResolvedValue(null);

      await expect(userService.loginUser('test@example.com', 'password123'))
        .rejects.toThrow('User not found');
    });
  });
});
```

2. Create `blood-bank-node/app/services/__tests__/RequestService.test.js`:
```javascript
const RequestService = require('../RequestService');
const Requests = require('../../modules/Request/Schema').Requests;
const Users = require('../../modules/User/Schema').Users;

jest.mock('../../modules/Request/Schema');
jest.mock('../../modules/User/Schema');
jest.mock('../../../queue/notificationQueue');

describe('RequestService', () => {
  let requestService;

  beforeEach(() => {
    requestService = new RequestService();
    jest.clearAllMocks();
  });

  describe('getDonorsList', () => {
    it('should return donors with filters', async () => {
      const donors = [
        { _id: 'donor1', userName: 'Donor 1', bloodGroup: 'O+' },
        { _id: 'donor2', userName: 'Donor 2', bloodGroup: 'O+' }
      ];

      Users.find.mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(donors)
        })
      });

      const result = await requestService.getDonorsList('user1', {
        pincode: '123456',
        bloodGroup: 'O+'
      });

      expect(result).toHaveLength(2);
      expect(result[0].bloodGroup).toBe('O+');
    });
  });

  describe('createRequest', () => {
    it('should create requests for donors', async () => {
      const requestData = {
        userIds: ['donor1', 'donor2'],
        bloodGroup: 'O+',
        pincode: '123456',
        address: 'Hospital ABC'
      };

      Requests.countDocuments.mockResolvedValue(5);
      Requests.create.mockResolvedValue({ _id: 'req123' });

      const result = await requestService.createRequest('user1', requestData);

      expect(result.status).toBe(1);
      expect(result.message).toBe('Requests sent');
      expect(Requests.create).toHaveBeenCalledTimes(2);
    });

    it('should reject if no donors selected', async () => {
      const requestData = {
        userIds: [],
        bloodGroup: 'O+',
        pincode: '123456',
        address: 'Hospital ABC'
      };

      await expect(requestService.createRequest('user1', requestData))
        .rejects.toThrow('No donors selected');
    });
  });
});
```

---

### **4.3 Write API Integration Tests - SHOULD FIX** 🔗
**Status:** NO API TESTS  
**Priority:** P1 (Regression Prevention)  
**Effort:** 12 hours

**What to do:**

1. Create `blood-bank-node/__tests__/integration/auth.test.js`:
```javascript
const request = require('supertest');
const app = require('../../server');
const Users = require('../../app/modules/User/Schema').Users;
const { connectRedis, getRedis } = require('../../configs/redis');

describe('Auth API Integration Tests', () => {
  let server;
  let redis;

  beforeAll(async () => {
    server = app.listen(5000);
    redis = await connectRedis();
  });

  afterAll(async () => {
    server.close();
    await redis.flushDb();
    await redis.disconnect();
  });

  describe('POST /api/users/register', () => {
    it('should register a new user', async () => {
      const userData = {
        emailId: 'newuser@example.com',
        password: 'SecurePass123!',
        userName: 'New User',
        phoneNumber: '9876543210',
        firebaseUid: 'fb123',
        idToken: 'mock_token',
        bloodGroup: 'O+',
        pincode: '123456'
      };

      const response = await request(server)
        .post('/api/users/register')
        .send(userData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(1);
      expect(response.body.data.emailId).toBe('newuser@example.com');
    });

    it('should reject duplicate email', async () => {
      const userData = {
        emailId: 'existing@example.com',
        password: 'SecurePass123!',
        userName: 'User',
        phoneNumber: '9876543210',
        firebaseUid: 'fb456',
        idToken: 'token',
        bloodGroup: 'O+',
        pincode: '123456'
      };

      // First registration
      await request(server).post('/api/users/register').send({
        ...userData,
        phoneNumber: '1234567890',
        firebaseUid: 'fb123'
      });

      // Duplicate attempt
      const response = await request(server)
        .post('/api/users/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Email already');
    });

    it('should fail with weak password', async () => {
      const userData = {
        emailId: 'user@example.com',
        password: 'weak',  // Too short
        userName: 'User',
        phoneNumber: '9876543210',
        firebaseUid: 'fb123',
        idToken: 'token',
        bloodGroup: 'O+',
        pincode: '123456'
      };

      const response = await request(server)
        .post('/api/users/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Password');
    });

    it('should block after 3 registrations per hour', async () => {
      // Make 3 registrations
      for (let i = 0; i < 3; i++) {
        await request(server)
          .post('/api/users/register')
          .send({
            emailId: `user${i}@example.com`,
            password: 'SecurePass123!',
            userName: 'User',
            phoneNumber: `987654321${i}`,
            firebaseUid: `fb${i}`,
            idToken: 'token',
            bloodGroup: 'O+',
            pincode: '123456'
          });
      }

      // 4th should be rate-limited
      const response = await request(server)
        .post('/api/users/register')
        .send({
          emailId: 'user4@example.com',
          password: 'SecurePass123!',
          userName: 'User',
          phoneNumber: '9876543214',
          firebaseUid: 'fb4',
          idToken: 'token',
          bloodGroup: 'O+',
          pincode: '123456'
        });

      expect(response.status).toBe(429);  // Too many requests
    });
  });

  describe('POST /api/users/login', () => {
    it('should login with valid credentials', async () => {
      // First create a user
      await Users.create({
        emailId: 'login@example.com',
        password: 'hashed_password',
        userName: 'User',
        phoneNumber: '9876543210',
        bloodGroup: 'O+',
        pincode: '123456',
        firebaseUid: 'fb123'
      });

      const response = await request(server)
        .post('/api/users/login')
        .send({
          emailId: 'login@example.com',
          password: 'correct_password'
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(1);
      expect(response.body.access_token).toBeDefined();
    });

    it('should reject wrong password', async () => {
      const response = await request(server)
        .post('/api/users/login')
        .send({
          emailId: 'login@example.com',
          password: 'wrong_password'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('password');
    });

    it('should enforce rate limit (5 per 15 mins)', async () => {
      for (let i = 0; i < 5; i++) {
        await request(server)
          .post('/api/users/login')
          .send({
            emailId: 'test@example.com',
            password: 'wrong'
          });
      }

      const response = await request(server)
        .post('/api/users/login')
        .send({
          emailId: 'test@example.com',
          password: 'wrong'
        });

      expect(response.status).toBe(429);
    });
  });

  describe('GET /api/users/profile', () => {
    it('should require valid token', async () => {
      const response = await request(server)
        .get('/api/users/profile');

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('token');
    });

    it('should return user profile with valid token', async () => {
      // Login to get token
      const loginResponse = await request(server)
        .post('/api/users/login')
        .send({
          emailId: 'login@example.com',
          password: 'correct_password'
        });

      const token = loginResponse.body.access_token;

      const response = await request(server)
        .get('/api/users/profile')
        .set('Authorization', token);

      expect(response.status).toBe(200);
      expect(response.body.data.emailId).toBe('login@example.com');
    });

    it('should reject expired token', async () => {
      // Simulate expired token
      const expiredToken = 'eyJhbGc...expired';

      const response = await request(server)
        .get('/api/users/profile')
        .set('Authorization', expiredToken);

      expect(response.status).toBe(401);
    });
  });
});
```

---

### **4.4 Frontend Testing - OPTIONAL ENHANCEMENT** ⚛️
**Status:** NOT STARTED  
**Priority:** P3 (Nice to Have)  
**Effort:** 10 hours

**What to do (briefly):**

1. Create React component tests:
```bash
cd blood-bank-react
npm install --save-dev @testing-library/react @testing-library/jest-dom jest
```

2. Create `blood-bank-react/src/components/register/__tests__/RegisterPage.test.js`:
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import RegisterPage from '../RegisterPage';

describe('RegisterPage', () => {
  it('should render registration form', () => {
    render(<RegisterPage />);
    expect(screen.getByText(/phone number/i)).toBeInTheDocument();
  });

  it('should validate phone number', () => {
    render(<RegisterPage />);
    const input = screen.getByPlaceholderText(/phone/i);
    fireEvent.change(input, {target: {value: 'abc'}});
    expect(screen.getByText(/invalid/i)).toBeInTheDocument();
  });
});
```

---

### **4.5 Create Test Coverage Report - SHOULD FIX** 📊
**Status:** NO COVERAGE TRACKING  
**Priority:** P2 (Quality Metrics)  
**Effort:** 0.5 hours

**What to do:**

1. Run tests with coverage:
```bash
npm test -- --coverage
```

2. Output will show:
```
Filename          Lines    Functions    Branches    Statements
services/User     85.2%    92.1%        78.5%       86.1%
services/Request  72.3%    65.4%        60.2%       71.8%
-------------------------------------------------------------
TOTAL             79.8%    78.8%        69.4%       79.0%
```

3. Set minimum threshold in `jest.config.js`:
```javascript
coverageThreshold: {
  global: {
    branches: 70,
    functions: 80,
    lines: 80,
    statements: 80
  }
}
```

---

## ✅ PHASE 4 CHECKLIST

- [ ] Jest configured with test scripts
- [ ] Unit tests created (>50% coverage)
- [ ] UserService tests: register, login, profile
- [ ] RequestService tests: getDonors, createRequest
- [ ] API integration tests: auth flow, protected routes
- [ ] Rate limiting tested
- [ ] Token expiration tested
- [ ] Validation tested
- [ ] Coverage report generated (>70%)
- [ ] Tests run in CI/CD (GitHub Actions)

**Phase 4 Complete:** 50 hours ✅

---

---

# 📚 PHASE 5: DOCUMENTATION & CLEANUP (Weeks 9-10)
## Priority: MEDIUM — Professional Standards

### **5.1 Create API Documentation (Swagger/OpenAPI) - SHOULD FIX** 📖
**Status:** NO API DOCS  
**Priority:** P2 (Developer Experience)  
**Effort:** 4 hours

**What to do:**

1. Install Swagger:
```bash
npm install swagger-jsdoc swagger-ui-express
```

2. Create `blood-bank-node/swagger/swaggerDef.js`:
```javascript
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Blood Bank Management API',
      version: '1.0.0',
      description: 'API for blood donation requests and management'
    },
    servers: [
      {
        url: 'http://localhost:4000/api',
        description: 'Development server'
      },
      {
        url: 'https://api.bloodbank.com/api',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userName: { type: 'string' },
            emailId: { type: 'string', format: 'email' },
            phoneNumber: { type: 'string', pattern: '^[0-9]{10}$' },
            bloodGroup: { type: 'string', enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] },
            pincode: { type: 'string', pattern: '^[0-9]{6}$' }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['emailId', 'password'],
          properties: {
            emailId: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            status: { type: 'integer' },
            message: { type: 'string' },
            access_token: { type: 'string' },
            data: { $ref: '#/components/schemas/User' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            status: { type: 'integer' },
            message: { type: 'string' }
          }
        }
      }
    }
  },
  apis: ['./app/modules/**/Routes.js']
};

module.exports = swaggerJsdoc(options);
```

3. Update routes with Swagger comments:
```javascript
/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emailId:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: SecurePass123!
 *               userName:
 *                 type: string
 *                 example: John Doe
 *               phoneNumber:
 *                 type: string
 *                 example: "9876543210"
 *               bloodGroup:
 *                 type: string
 *                 enum: [A+, B+, O+, AB+]
 *               pincode:
 *                 type: string
 *                 example: "123456"
 *             required:
 *               - emailId
 *               - password
 *               - userName
 *               - phoneNumber
 *               - bloodGroup
 *               - pincode
 *     responses:
 *       200:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many requests
 */
router.post('/users/register', registerLimiter, validateRequest(registerSchema), ...);
```

4. Setup Swagger UI in `express.js`:
```javascript
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../swagger/swaggerDef');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
```

5. Access at: `http://localhost:4000/api-docs`

---

### **5.2 Write README with Setup Instructions - SHOULD FIX** 📝
**Status:** BASIC README  
**Priority:** P2 (Onboarding)  
**Effort:** 1.5 hours

**What to do:**

Update `blood-bank-node/README.md`:
```markdown
# Blood Bank Management System - Backend

A secure Node.js/Express API for blood donation management with Firebase authentication.

## 🚀 Quick Start

### Prerequisites
- Node.js 14+
- MongoDB Atlas account
- Firebase project
- Redis server

### Installation

1. **Clone & Install**
   git clone https://github.com/yourrepo/blood-bank.git
   cd blood-bank-node
   npm install

2. **Environment Setup**
   cp .env.dev.example .env.dev
   # Fill in your credentials:
   # - MongoDB connection string
   # - Firebase keys
   # - Redis host/port
   # - JWT secrets

3. **Start Server**
   npm start
   # Server runs on http://localhost:4000

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection | `mongodb+srv://...` |
| `FIREBASE_PROJECT_ID` | Firebase project | `blood-bank-app-97b45` |
| `REDIS_HOST` | Redis server | `localhost` |
| `JWT_SECRET` | JWT signing key | `your-secret` |

...
```

---

### **5.3 Create Architecture Documentation - SHOULD FIX** 🏗️
**Status:** NO ARCH DOCS  
**Priority:** P2 (Understanding)  
**Effort:** 2 hours

**What to do:**

Create `blood-bank-node/ARCHITECTURE.md`:
```markdown
# System Architecture

## Component Diagram

```
┌─────────────────────────────────────────────────────┐
│              React Frontend (3000)                  │
│  RegisterPage | LoginForm | Dashboard | Requests   │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS/REST
┌────────────────────┴────────────────────────────────┐
│       Express API Server (4000)                     │
│  ┌──────────────────────────────────────────────┐  │
│  │  Routes Layer                                │  │
│  │  /api/users, /api/requests, /api/otp        │  │
│  └──────────────┬───────────────────────────────┘  │
│                 │                                  │
│  ┌──────────────▼───────────────────────────────┐  │
│  │  Service Layer                               │  │
│  │  UserService, RequestService, OTPService    │  │
│  └──────────────┬───────────────────────────────┘  │
│                 │                                  │
│  ┌──────────────▼───────────────────────────────┐  │
│  │  Data Layer                                  │  │
│  │  MongoDB Schemas, Repositories              │  │
│  └──────────────────────────────────────────────┘  │
└────┬──────────────────────────────┬────────────│───┘
     │                              │            │
     ▼                              ▼            ▼
┌─────────────┐          ┌──────────────────┐  ┌──────┐
│ MongoDB     │          │  Firebase        │  │Redis │
│ Atlas       │          │  Auth & Cloud    │  │Queue │
│ (Data)      │          │  Messaging       │  │Tokens│
└─────────────┘          └──────────────────┘  └──────┘
```

## Data Flow

### Registration Flow
1. User enters phone + OTP (Firebase)
2. Firebase returns idToken
3. Frontend sends idToken + profile to /register
4. Backend verifies idToken against Firebase
5. Backend creates user in MongoDB
6. JWT token returned for session

### Request Blood Flow
1. User searches for donors (filtered by pincode/blood group)
2. Selects multiple donors
3. Creates request → stored in MongoDB
4. Notification queued in Redis/Bull
5. Background worker sends WhatsApp messages
6. Donations accept/reject request

## Technology Stack

- **Frontend**: React |Angular | Vue
- **Backend**: Node.js, Express
- **Database**: MongoDB Atlas
- **Auth**: Firebase Authentication
- **Cache**: Redis (tokens, queue)
- **Queue**: Bull (notifications)
- **Validation**: Joi
- **Testing**: Jest, Supertest

...
```

---

### **5.4 Create Deployment Guide - SHOULD FIX** 🚀
**Status:** NO DEPLOYMENT INFO  
**Priority:** P2 (Production)  
**Effort:** 2 hours

**What to do:**

Create `blood-bank-node/DEPLOYMENT.md`:
```markdown
# Deployment Guide

## Production Checklist

Before deploying to production:

- [ ] All secrets in environment variables (no hardcoded values)
- [ ] HTTPS enabled with SSL certificate
- [ ] CORS whitelist updated
- [ ] Database backups configured
- [ ] Error monitoring (Sentry) setup
- [ ] Logging aggregation (ELK/CloudWatch) active
- [ ] Rate limiting tuned for expected traffic
- [ ] Database indexes verified
- [ ] Tests passing (>70% coverage)
- [ ] Security headers configured

## Deployment to Heroku

1. **Create Heroku App**
   heroku create blood-bank-api

2. **Set Environment Variables**
   heroku config:set MONGODB_URI=mongodb+srv://...
   heroku config:set JWT_SECRET=your-secret
   heroku config:set NODE_ENV=production

3. **Deploy**
   git push heroku main

4. **Check Logs**
   heroku logs --tail

##Deployment to AWS (EC2 + RDS)

...
```

---

### **5.5 Update .env Example Files - MUST FIX** 🔑
**Status:** NO EXAMPLE ENV  
**Priority:** P1 (Onboarding)  
**Effort:** 0.5 hours

**What to do:**

Create `blood-bank-node/.env.dev.example`:
```
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bloodbank?retryWrites=true

# Firebase
FIREBASE_PROJECT_ID=blood-bank-app-97b45
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

---

### **5.6 Create GitHub Actions CI/CD - OPTIONAL ENHANCEMENT** 🔄
**Status:** NO CI/CD  
**Priority:** P3 (Professional)  
**Effort:** 3 hours

**What to do:**

Create `.github/workflows/test.yml`:
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo
        options: >-
          --health-cmd mongosh
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 16
      
      - run: npm install
      - run: npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## ✅ PHASE 5 CHECKLIST

- [ ] Swagger/OpenAPI docs created and working
- [ ] README with setup instructions updated
- [ ] Architecture document created
- [ ] Deployment guide written
- [ ] .env example files created
- [ ] CHANGELOG updated
- [ ] Code commented (complex sections)
- [ ] GitHub Actions pipeline configured
- [❌] (Phase 6: Optional enhancements)

**Phase 5 Complete:** 30 hours ✅

---

---

# 🎉 PHASE 6: OPTIONAL ENHANCEMENTS (Weeks 11-12)
## Priority: LOW — Nice to Have

### **6.1 Add Search & Advanced Filtering - OPTIONAL** 🔍
**Effort:** 6 hours
```javascript
// Add text indexes
donorSchema.index({name: 'text', address: 'text'});

// Search endpoint
router.get('/donors/search?q=name', async (req, res) => {
  const donors = await Donors.find({$text: {$search: req.query.q}});
  res.json(donors);
});
```

### **6.2 Add Notifications History - OPTIONAL** 📬
**Effort:** 4 hours
Add `NotificationHistory` collection to track delivered/read messages.

### **6.3 Admin Dashboard - OPTIONAL** 👨‍💼
**Effort:** 8 hours
Create admin endpoints to:
- View all users
- View donation statistics
- Manage donor approvals
- View system health

### **6.4 Email Notifications - OPTIONAL** 📧
**Effort:** 3 hours
Use SendGrid/Nodemailer for email confirmations.

### **6.5 Two-Factor Authentication (2FA) - OPTIONAL** 🔐
**Effort:** 4 hours
Add TOTP-based 2FA using `speakeasy` library.

### **6.6 Mobile App (React Native) - OPTIONAL** 📱
**Effort:** 40+ hours
(Beyond scope of this roadmap)

---

---

# ✅ FINAL PRODUCTION CHECKLIST

## Security ✅
- [✅] CORS whitelist (not `*`)
- [✅] Rate limiting on login/register/OTP
- [✅] Input validation with Joi
- [✅] Security headers (Helmet.js)
- [✅] HTTPS enforcement
- [✅] Token management with Redis
- [✅] Password hashing (bcrypt)
- [✅] Secrets in environment variables
- [✅] No credentials in code/repo
- [✅] Global error handler (no stack traces)

## Architecture ✅
- [✅] Service layer (business logic separated)
- [✅] Controllers simplified
- [✅] Middleware for cross-cutting concerns
- [✅] Error handling consistent
- [✅] Logging structured
- [✅] DTOs for responses
- [✅] Async queue for notifications
- [✅] No code duplication

## Database ✅
- [✅] Indexes on query fields
- [✅] Schema validation
- [✅] Soft deletes implemented
- [✅] Pagination support
- [✅] Queries optimized

## Testing ✅
- [✅] Unit tests (>70% coverage)
- [✅] Integration tests for APIs
- [✅] Rate limiting tested
- [✅] Token expiration tested
- [✅] Validation tested
- [✅] Tests run in CI/CD

## Documentation ✅
- [✅] API docs (Swagger)
- [✅] README with setup
- [✅] Architecture document
- [✅] Deployment guide
- [✅] .env example
- [✅] Code comments

## DevOps ✅
- [✅] Environment parity (dev/prod)
- [✅] .gitignore proper
- [✅] Health check endpoint
- [✅] Graceful shutdown
- [✅] Error monitoring ready
- [✅] CI/CD pipeline

---

# 📊 EFFORT SUMMARY

| Phase | Task | Hours | Status |
|-------|------|-------|--------|
| **Phase 1** | Security Hardening | 40 | ⭐⭐⭐⭐⭐ CRITICAL |
| **Phase 2** | Code Architecture | 60 | ⭐⭐⭐⭐⭐ CRITICAL |
| **Phase 3** | Database Optimization | 24 | ⭐⭐⭐⭐ HIGH |
| **Phase 4** | Testing | 50 | ⭐⭐⭐⭐ HIGH |
| **Phase 5** | Documentation | 30 | ⭐⭐⭐ MEDIUM |
| **Phase 6** | Optional Enhancements | 20+ | ⭐ OPTIONAL |
| | **TOTAL** | **224+** | |

**Timeline: 6 weeks full-time OR 12 weeks part-time**

---

## 📞 Questions?

For each phase:
1. Read the section
2. Follow exact steps in order
3. Test before moving on
4. Check the checklist
5. Commit to git

Good luck! 🚀
