# 🔍 403 Forbidden Error Investigation Report
## `/api/requests/requestDonors` Endpoint

**Date**: April 7, 2026  
**Status**: ✅ ROOT CAUSE IDENTIFIED  
**Error Code**: 403 Forbidden

---

## 📋 Executive Summary

The 403 Forbidden error on `/api/requests/requestDonors` is caused by **CSRF Token validation failure**. The frontend is sending the request without the required CSRF token, while the backend has global CSRF protection enabled for all POST endpoints (except authentication endpoints).

---

## 🔴 Problem: How the Error Occurs

### Flow Diagram
```
Frontend Request (requestForm.js:67)
    ↓
POST /api/requests/requestDonors
    ↓
Express CSRF Protection Middleware
    ↓
❌ CSRF Token NOT found in request
    ↓
Return 403 Forbidden "CSRF token invalid or expired"
```

---

## 📍 File Locations & Code Snippets

### 1️⃣ Frontend Request (React Form)

**File**: [blood-bank-react/src/components/requestForm/requestForm.js](blood-bank-react/src/components/requestForm/requestForm.js#L37-L67)

```javascript
const handleSubmit = async (e) => {
    e.preventDefault();

    try {
        const token = localStorage.getItem("token");
        
        if (!token) {
            swal("Error", "Not authenticated. Please login first.", "error");
            return;
        }

        const response = await axios.post(
            "http://localhost:4000/api/requests/requestDonors",
            formData,
            {
                headers: {
                    Authorization: token,                    // ✅ Authentication token
                    "Content-Type": "application/json"       // ✅ Content type
                    // ❌ MISSING: CSRF token header!
                }
            }
        );
        // ... rest of code
    } catch (error) {
        // ...
    }
};
```

**Issues**:
- ✅ Sends `Authorization` header with JWT token
- ✅ Sends `Content-Type` header
- ❌ **MISSING**: CSRF token (should be in `x-csrf-token` header or form data)

---

### 2️⃣ Backend Route Definition

**File**: [blood-bank-node/app/modules/Request/Routes.js](blood-bank-node/app/modules/Request/Routes.js#L15)

```javascript
router.post('/requests/requestDonors', Globals.isAuthorised, (req, res, next) => {
    const requestObj = (new RequestsController()).boot(req, res);
    return requestObj.requestDonors();
});
```

**Middleware Chain**:
1. ✅ `Globals.isAuthorised` - validates JWT token (PASSES)
2. ❌ CSRF Protection Middleware - validates CSRF token (FAILS)
3. ❌ `requestDonors()` controller - never reached due to 403 error

---

### 3️⃣ Backend Controller Implementation

**File**: [blood-bank-node/app/modules/Request/Controller.js](blood-bank-node/app/modules/Request/Controller.js#L85-L160)

```javascript
async requestDonors() {
    try {
        let fieldsArray = ["userIds", "bloodGroup", "pincode", "address"];
        let emptyFields = await (new RequestBody()).checkEmptyWithFields(this.req.body, fieldsArray);
        
        if (emptyFields && Array.isArray(emptyFields) && emptyFields.length) {
            return this.res.send({ status: 0, message: "Please send proper data" + " " + emptyFields.toString() + " fields required." });
        }
        
        const currentUser = this.req.currentUser && this.req.currentUser._id ? this.req.currentUser._id : "";
        // ... implementation
    } catch (error) {
        logger.error("Error in sendRequests:", { error: error.message, stack: error.stack });
        this.res.send({ status: 0, message: error.message || 'An error occurred while sending requests' });
    }
}
```

**Note**: This code never executes because CSRF protection blocks the request first.

---

### 4️⃣ Authentication Middleware

**File**: [blood-bank-node/configs/Globals.js](blood-bank-node/configs/Globals.js#L54-L75)

```javascript
static async isAuthorised(req, res, next) {
    try {
        const token = req.headers.authorization;
        if (!token) return res.status(401).json({ status: 0, message: "Please send authorization token" });

        const authenticate = new Globals();
        const tokenCheck = await authenticate.checkTokenInDB(token);
        if (!tokenCheck) return res.status(401).json({ status: 0, message: "Invalid token" });

        const tokenExpire = await authenticate.checkExpiration(token);
        if (!tokenExpire) return res.status(401).json({ status: 0, message: "Token expired" });

        const userExist = await authenticate.checkUserInDB(token);
        if (!userExist) return res.status(401).json({ status: 0, message: "User details not found" });

        if (userExist._id) {
            req.currentUser = userExist;
        }
        next();
    } catch (err) {
        console.log("Token authentication", err);
        return res.send({ status: 0, message: err });
    }
}
```

**Status**: ✅ JWT authentication middleware **PASSES** (returns 401 on failure, not 403)

---

### 5️⃣ CSRF Protection Middleware (The Culprit!)

**File**: [blood-bank-node/middleware/csrfProtection.js](blood-bank-node/middleware/csrfProtection.js#L1-50)

```javascript
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600000 // 1 hour
  }
});

// Error handler for CSRF token errors
const csrfErrorHandler = (err, req, res, next) => {
  if (err.code !== 'EBADCSRFTOKEN') {
    return next(err);
  }

  logger.warn('CSRF token validation failed:', {
    ip: req.ip,
    path: req.path,
    method: req.method
  });

  // Return 403 if token is invalid
  res.status(403).json({
    status: 0,
    message: 'CSRF token invalid or expired'      // ← This is the error message!
  });
};
```

**This is where 403 Forbidden is returned!**

---

### 6️⃣ CSRF Protection Setup in Express

**File**: [blood-bank-node/configs/express.js](blood-bank-node/configs/express.js#L112-135)

```javascript
// ======= CSRF PROTECTION WITH EXEMPTIONS =======
// Skip CSRF for auth endpoints (they have rate limiting) and OPTIONS requests
const csrfExcludePaths = [
  '/api/users/login',
  '/api/users/register',
  '/api/users/forgot-password-send-otp',
  '/api/users/reset-password',
  '/api/admin/login',
  '/api/csrf-token'
];

app.use((req, res, next) => {
  // Skip CSRF protection for exempted paths
  if (csrfExcludePaths.includes(req.path) || req.method === 'OPTIONS' || req.method === 'GET') {
    return next();
  }
  // Apply CSRF protection to other routes
  csrfProtection(req, res, next);
});

app.use(csrfErrorHandler);
```

**Key Finding**: `/api/requests/requestDonors` is **NOT** in the exemption list!

---

### 7️⃣ CSRF Token Retrieval Endpoint

**File**: [blood-bank-node/server.js](blood-bank-node/server.js#L100-101)

```javascript
// ======= CSRF TOKEN ENDPOINT =======
const { getCsrfToken } = require('./middleware/csrfProtection');
app.post('/api/csrf-token', getCsrfToken);
```

**Available Endpoint**: 
- `POST /api/csrf-token` - Returns CSRF token in response JSON

---

## 📊 Comparison: Working vs Non-Working Endpoints

### ❌ NOT WORKING: requestDonors (POST with Auth + CSRF)
```javascript
router.post('/requests/requestDonors', Globals.isAuthorised, (req, res, next) => {
    // ...
});
```
- Middleware: `Globals.isAuthorised` ✅
- CSRF Required: ✅ YES (not exempted)
- Token in Frontend: ❌ NOT SENT
- **Result**: 403 Forbidden

---

### ✅ WORKING: accept/reject (GET without Auth or CSRF)
```javascript
router.get('/requests/accept/:requestId/donor/:donorId', (req, res, next) => {
    // No middleware!
});

router.get('/requests/reject/:requestId/donor/:donorId', (req, res, next) => {
    // No middleware!
});
```
- Middleware: None ✅
- CSRF Required: ✅ NO (GET requests exempt)
- Token Needed: ❌ NO
- **Result**: 200 Success

**Note**: These endpoints should also have `Globals.isAuthorised` middleware!

---

### ✅ WORKING: Other Protected POST Endpoints
```javascript
router.post('/requests/getDonorsList', Globals.isAuthorised, (req, res, next) => {
    // ...
});
```

**Possible Reasons for Working**:
1. Frontend might be sending CSRF token for these
2. OR they have a different error handling that doesn't return 403
3. Need to verify if frontend sends CSRF token consistently

---

## 🔐 Authentication Flow Comparison

| Aspect | requestDonors | Accept Request | GetDonorsList |
|--------|---------------|----------------|---------------|
| **HTTP Method** | POST | GET | POST |
| **Auth Middleware** | ✅ Globals.isAuthorised | ❌ None | ✅ Globals.isAuthorised |
| **CSRF Required** | ✅ YES | ❌ NO | ✅ YES |
| **Frontend Token** | Authorization only | ❌ Not needed | ❌ Unknown |
| **Frontend CSRF** | ❌ NOT SENT | ❌ Not needed | ❓ Unknown |
| **Status Code** | 403 Forbidden | 200/400 | ❓ Check |

---

## 🎯 Root Cause Analysis

### Primary Cause
**CSRF Token Missing from Frontend Request**

The `requestForm.js` component at line 50 is making a POST request without including a CSRF token, but the backend's CSRF protection middleware requires it.

### Secondary Cause
**CSRF Description is Not Clear**

The frontend developer may not be aware that:
1. CSRF protection is enabled globally
2. POST requests require CSRF tokens
3. The `/api/csrf-token` endpoint exists to retrieve tokens

### Why This Wasn't Caught Earlier
1. ✅ Authentication middleware returns 401 (not 403)
2. ✅ CSRF is a second-level check
3. ✅ No clear error message distinguishing 403 from 401
4. ❌ Frontend doesn't implement CSRF token retrieval

---

## 🛠️ Solutions (In Order of Recommendation)

### Solution 1: Add CSRF Token to Frontend Request (RECOMMENDED)
**Pros**: Maintains security without changing backend  
**Cons**: More code in frontend, requires token retrieval  

**File**: [blood-bank-react/src/components/requestForm/requestForm.js](blood-bank-react/src/components/requestForm/requestForm.js)

```javascript
const handleSubmit = async (e) => {
    e.preventDefault();

    try {
        const token = localStorage.getItem("token");
        
        if (!token) {
            swal("Error", "Not authenticated. Please login first.", "error");
            return;
        }

        // 1. Retrieve CSRF token from backend
        const csrfResponse = await axios.post("http://localhost:4000/api/csrf-token");
        const csrfToken = csrfResponse.data.token;

        // 2. Send request with CSRF token
        const response = await axios.post(
            "http://localhost:4000/api/requests/requestDonors",
            formData,
            {
                headers: {
                    Authorization: token,
                    "Content-Type": "application/json",
                    "x-csrf-token": csrfToken        // ✅ ADD THIS
                }
            }
        );

        if (response.data.status === 0) {
            swal("Error", response.data.message, "error");
        } else {
            swal("Success", "Blood request sent successfully", "success");
            navigate("/dashboard");
        }
    } catch (error) {
        console.error('Request form error:', error);
        if (error.response?.status === 401) {
            swal("Error", "Session expired. Please login again.", "error");
            localStorage.removeItem("token");
            navigate("/login");
        } else {
            swal("Error", "Failed to send request. Please try again.", "error");
        }
    }
};
```

---

### Solution 2: Exempt requestDonors from CSRF (SECURITY RISK)
**Pros**: Simple backend change  
**Cons**: Reduces security, vulnerable to CSRF attacks  

**File**: [blood-bank-node/configs/express.js](blood-bank-node/configs/express.js#L112-120)

```javascript
const csrfExcludePaths = [
  '/api/users/login',
  '/api/users/register',
  '/api/users/forgot-password-send-otp',
  '/api/users/reset-password',
  '/api/admin/login',
  '/api/csrf-token',
  '/api/requests/requestDonors'    // ❌ NOT RECOMMENDED - reduces security
];
```

**NOT RECOMMENDED** - This endpoint handles sensitive blood request operations and should NOT bypass CSRF protection.

---

### Solution 3: Create a Service to Handle CSRF Token Management (BEST PRACTICE)

**File**: [blood-bank-react/src/services/csrfService.js](blood-bank-react/src/services/csrfService.js)

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000';

class CSRFService {
  constructor() {
    this.csrfToken = null;
    this.tokenExpiry = null;
  }

  async getCSRFToken() {
    try {
      // Return cached token if still valid
      if (this.csrfToken && this.tokenExpiry > Date.now()) {
        return this.csrfToken;
      }

      const response = await axios.post(`${API_BASE_URL}/api/csrf-token`);
      
      if (response.data.status === 1) {
        this.csrfToken = response.data.token;
        // Cache for 55 minutes (token expires in 60)
        this.tokenExpiry = Date.now() + (55 * 60 * 1000);
        return this.csrfToken;
      }
      
      throw new Error('Failed to retrieve CSRF token');
    } catch (error) {
      console.error('CSRF token retrieval error:', error);
      throw error;
    }
  }

  clearToken() {
    this.csrfToken = null;
    this.tokenExpiry = null;
  }
}

export default new CSRFService();
```

**Then use in requestForm.js**:
```javascript
import csrfService from '../../services/csrfService';

const handleSubmit = async (e) => {
    e.preventDefault();

    try {
        const token = localStorage.getItem("token");
        const csrfToken = await csrfService.getCSRFToken();
        
        const response = await axios.post(
            "http://localhost:4000/api/requests/requestDonors",
            formData,
            {
                headers: {
                    Authorization: token,
                    "x-csrf-token": csrfToken
                }
            }
        );
        // ... rest of code
    } catch (error) {
        // ... error handling
    }
};
```

---

## 📋 Authorization & Middleware Verification

### Routes with `Globals.isAuthorised`

**File**: [blood-bank-node/app/modules/Request/Routes.js](blood-bank-node/app/modules/Request/Routes.js)

| Endpoint | Method | Protected | CSRF Required | Status |
|----------|--------|-----------|---------------|--------|
| `/requests/getDonorsList` | POST | ✅ isAuthorised | ✅ YES | Need CSRF |
| `/requests/requestDonors` | POST | ✅ isAuthorised | ✅ YES | **403 ERROR** |
| `/requests/accept/:requestId/donor/:donorId` | GET | ❌ NONE | ❌ NO (GET) | ✅ Works |
| `/requests/reject/:requestId/donor/:donorId` | GET | ❌ NONE | ❌ NO (GET) | ✅ Works |
| `/requests/cancel/:requestId` | GET | ✅ isAuthorised | ❌ NO (GET) | ✅ Works |
| `/requests/getDonorsListForRequests` | POST | ✅ isAuthorised | ✅ YES | Need CSRF |
| `/requests/getRequestIds` | GET | ✅ isAuthorised | ❌ NO (GET) | ✅ Works |

---

## 🔍 Security Analysis

### Current State
- ✅ JWT token validation working
- ✅ CSRF protection implemented
- ✅ Token expiry checks in place
- ✅ User existence verification
- ❌ Frontend not sending CSRF token
- ⚠️ GET endpoints (accept/reject) have NO authentication

### Security Recommendations

1. **Add CSRF Token to Frontend** (CRITICAL)
   - Implement Solution 3 (CSRFService)
   - Ensures CSRF attacks are prevented

2. **Add Authentication to Accept/Reject** (HIGH)
   - Add `Globals.isAuthorised` to accept/reject endpoints
   - Prevent unauthorized request acceptance/rejection

   ```javascript
   // Change from:
   router.get('/requests/accept/:requestId/donor/:donorId', (req, res, next) => {

   // To:
   router.get('/requests/accept/:requestId/donor/:donorId', Globals.isAuthorised, (req, res, next) => {
   ```

3. **Use POST for Accept/Reject** (MEDIUM)
   - GET requests should be idempotent (not modify state)
   - Accept/reject modify request state
   - Should be POST/PUT requests instead

---

## 🧪 Testing Endpoints

### Test 1: Get CSRF Token
```bash
curl -X POST http://localhost:4000/api/csrf-token \
  -H "Content-Type: application/json"
```

**Expected Response**:
```json
{
  "status": 1,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "CSRF token generated successfully"
}
```

---

### Test 2: Request Donors WITHOUT CSRF Token (Will Fail)
```bash
curl -X POST http://localhost:4000/api/requests/requestDonors \
  -H "Authorization: YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["507f1f77bcf86cd799439011"],
    "bloodGroup": "O+",
    "pincode": "533435",
    "address": "City Hospital"
  }'
```

**Expected Response**:
```json
{
  "status": 0,
  "message": "CSRF token invalid or expired"
}
```
**HTTP Status**: 403 Forbidden

---

### Test 3: Request Donors WITH CSRF Token (Will Succeed)
```bash
curl -X POST http://localhost:4000/api/requests/requestDonors \
  -H "Authorization: YOUR_JWT_TOKEN" \
  -H "x-csrf-token: CSRF_TOKEN_FROM_/api/csrf-token" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["507f1f77bcf86cd799439011"],
    "bloodGroup": "O+",
    "pincode": "533435",
    "address": "City Hospital"
  }'
```

**Expected Response**:
```json
{
  "status": 1,
  "message": "Request send successfully"
}
```
**HTTP Status**: 200 OK

---

## 📝 Summary Table

| Item | Details |
|------|---------|
| **Error** | 403 Forbidden |
| **Endpoint** | POST /api/requests/requestDonors |
| **Root Cause** | CSRF token missing from request |
| **Source File** | blood-bank-react/src/components/requestForm/requestForm.js:50 |
| **Middleware** | csrfProtection in express.js |
| **Error Location** | blood-bank-node/middleware/csrfProtection.js:38 |
| **Solution** | Add CSRF token retrieval and include in headers |
| **Severity** | HIGH - Core feature blocked |
| **Security Impact** | Low - CSRF protection working as designed |

---

## 🚀 Next Steps

1. **Immediate**: Implement Solution 3 (CSRFService) in frontend
2. **Short-term**: Add authentication to accept/reject endpoints
3. **Medium-term**: Change accept/reject to POST requests
4. **Long-term**: Create comprehensive API documentation with CSRF requirements

---

## 📚 Related Documentation

- [CSRF Protection Middleware](blood-bank-node/middleware/csrfProtection.js)
- [Express Configuration](blood-bank-node/configs/express.js)
- [Request Routes](blood-bank-node/app/modules/Request/Routes.js)
- [Request Controller](blood-bank-node/app/modules/Request/Controller.js)
- [Request Form Component](blood-bank-react/src/components/requestForm/requestForm.js)
- [Authentication Globals](blood-bank-node/configs/Globals.js)
