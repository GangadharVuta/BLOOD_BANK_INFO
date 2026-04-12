# 📋 Code Reference & File Paths Summary

## 🎯 Investigation Results for 403 Forbidden Error

### Error Details
- **HTTP Status**: 403 Forbidden
- **Endpoint**: POST /api/requests/requestDonors
- **Root Cause**: CSRF Token Missing
- **Error Message**: "CSRF token invalid or expired"

---

## 📂 All File Locations

### Frontend - React Application

| File | Lines | Purpose | Status |
|------|-------|---------|--------|
| `blood-bank-react/src/components/requestForm/requestForm.js` | 1-120 | Blood request form component | ❌ Missing CSRF token |
| `blood-bank-react/src/components/requestForm/requestForm.js` | 37-67 | handleSubmit - Request submission | ❌ Issue here |
| `blood-bank-react/src/services/apiService.js` | 1-150 | API service with error handling | ⚠️ Handles 403 but unclear why |

### Backend - Node.js Application

#### Configuration Files
| File | Lines | Purpose | Status |
|------|-------|---------|--------|
| `blood-bank-node/configs/express.js` | 1-150+ | Express setup & middleware | ✅ CSRF enabled |
| `blood-bank-node/configs/express.js` | 112-135 | CSRF exemption paths | ✅ Configured |
| `blood-bank-node/configs/Globals.js` | 1-140 | Authentication middleware | ✅ JWT validation |
| `blood-bank-node/configs/Globals.js` | 54-75 | isAuthorised function | ✅ Working |
| `blood-bank-node/.env.dev` | 32 | baseApiUrl setting | ✅ /api |

#### Middleware
| File | Lines | Purpose | Status |
|------|-------|---------|--------|
| `blood-bank-node/middleware/csrfProtection.js` | 1-100 | CSRF protection logic | ✅ Correctly returning 403 |
| `blood-bank-node/middleware/csrfProtection.js` | 31-42 | CSRF error handler | ✅ Returns 403 on validation fail |
| `blood-bank-node/middleware/adminAuth.js` | 1-100 | Admin authentication | ✅ Different middleware |

#### Routes & Controllers
| File | Lines | Purpose | Status |
|------|-------|---------|--------|
| `blood-bank-node/app/modules/Request/Routes.js` | 1-60 | Request routes definition | ✅ All routes listed |
| `blood-bank-node/app/modules/Request/Routes.js` | 15 | requestDonors route | ✅ Protected with Globals.isAuthorised |
| `blood-bank-node/app/modules/Request/Routes.js` | 18-21 | accept/reject routes | ⚠️ NO authentication |
| `blood-bank-node/app/modules/Request/Controller.js` | 85-160 | requestDonors implementation | ⚠️ Never reached (blocked by CSRF) |
| `blood-bank-node/app/modules/Request/Controller.js` | 172-210 | acceptRequest implementation | ⚠️ Public endpoint |

#### Main Server File
| File | Lines | Purpose | Status |
|------|-------|---------|--------|
| `blood-bank-node/server.js` | 1-150+ | Main server setup | ✅ CSRF endpoint available |
| `blood-bank-node/server.js` | 100-101 | CSRF token endpoint | ✅ GET /api/csrf-token |

---

## 🔄 Request Flow Diagram

### Current Flow (With Bug)
```
Frontend (requestForm.js:37)
    ↓
    [handleSubmit triggered]
    ↓
    [Get token from localStorage]
    ↓
    POST /api/requests/requestDonors {
        body: { userIds, bloodGroup, pincode, address },
        headers: {
            Authorization: token,           ✅ JWT token
            Content-Type: application/json
            // ❌ MISSING: x-csrf-token
        }
    }
    ↓
    Express Middleware Chain (express.js:112-135)
    ↓
    [Check if GET or OPTIONS] → NO
    ↓
    [Check if in exemption list] → NO
    ↓
    [Apply csrfProtection middleware]
    ↓
    csrf() validation (csrfProtection.js:16)
    ↓
    [Look for CSRF token in: header, body, or cookies] → NOT FOUND
    ↓
    [Throw EBADCSRFTOKEN error]
    ↓
    csrfErrorHandler (csrfProtection.js:31-42)
    ↓
    Return 403 Forbidden
    {
        status: 0,
        message: "CSRF token invalid or expired"
    }
    ↓
    Frontend catches 403
    ↓
    Error: "Failed to send request. Please try again."
```

### Expected Flow (After Fix)
```
Frontend (requestForm.js)
    ↓
    [handleSubmit triggered]
    ↓
    [Get JWT token from localStorage]
    ↓
    POST /api/csrf-token
    ↓
    Backend: getCsrfToken() (csrfProtection.js)
    ↓
    Return {
        status: 1,
        token: "eyJ...",              ← CSRF Token
        message: "..."
    }
    ↓
    Set cookie: _csrf=... (HttpOnly, Secure)
    ↓
    Frontend receives CSRF token
    ↓
    POST /api/requests/requestDonors {
        body: { userIds, bloodGroup, pincode, address },
        headers: {
            Authorization: token,           ✅ JWT
            x-csrf-token: csrfToken,        ✅ CSRF Token
            Content-Type: application/json
        },
        cookies: {
            _csrf: ...                       ✅ CSRF Cookie
        }
    }
    ↓
    Express Middleware
    ↓
    [csrfProtection validates]
    ↓
    [Token in header matches cookie]
    ↓
    next() → passes to next middleware
    ↓
    Globals.isAuthorised (Globals.js:54)
    ↓
    [Validates JWT token]
    ↓
    [User found and valid]
    ↓
    next() → passes to controller
    ↓
    requestDonors() (Controller.js:85)
    ↓
    [Process request]
    ↓
    [Create request records]
    ↓
    [Send WhatsApp notifications]
    ↓
    Return 200 Success
    {
        status: 1,
        message: "Request send successfully"
    }
```

---

## 🔑 Key Code Snippets

### Frontend - What's Being Sent Currently (WRONG)
**File**: [blood-bank-react/src/components/requestForm/requestForm.js](blood-bank-react/src/components/requestForm/requestForm.js#L50-L56)

```javascript
const response = await axios.post(
    "http://localhost:4000/api/requests/requestDonors",
    formData,
    {
        headers: {
            Authorization: token,
            "Content-Type": "application/json"
            // ❌ CSRF token missing!
        }
    }
);
```

### Backend - CSRF Protection Rejecting (CORRECT BEHAVIOR)
**File**: [blood-bank-node/middleware/csrfProtection.js](blood-bank-node/middleware/csrfProtection.js#L31-L42)

```javascript
const csrfErrorHandler = (err, req, res, next) => {
  if (err.code !== 'EBADCSRFTOKEN') {
    return next(err);
  }

  logger.warn('CSRF token validation failed:', {
    ip: req.ip,
    path: req.path,
    method: req.method
  });

  // ← THIS returns 403 Forbidden
  res.status(403).json({
    status: 0,
    message: 'CSRF token invalid or expired'
  });
};
```

### Backend - CSRF Exemptions (Why GET works)
**File**: [blood-bank-node/configs/express.js](blood-bank-node/configs/express.js#L112-135)

```javascript
const csrfExcludePaths = [
  '/api/users/login',
  '/api/users/register',
  '/api/users/forgot-password-send-otp',
  '/api/users/reset-password',
  '/api/admin/login',
  '/api/csrf-token'
  // ← `/api/requests/requestDonors` NOT in list!
];

app.use((req, res, next) => {
  // Skip CSRF protection for exempted paths
  if (csrfExcludePaths.includes(req.path) || req.method === 'OPTIONS' || req.method === 'GET') {
    return next();
  }
  // Apply CSRF protection to other routes
  csrfProtection(req, res, next);
});
```

---

## 🔐 Middleware Execution Order

When request hits `/api/requests/requestDonors` (POST):

```
1. helmet()                          - Security headers
2. compression()                     - Compression
3. bodyParser.urlencoded()          - Parse form data
4. bodyParser.json()                - Parse JSON body
5. cookieParser()                   - Parse cookies
6. session()                        - Session management
7. performanceMiddleware()          - Performance tracking
8. CORS middleware                  - Cross-origin handling
9. ⚠️ CSRF Protection (FAILS HERE)  ← 403 Error occurs
   - csrfProtection (line 135 in express.js)
   - csrfErrorHandler (line 137)
10. route handlers (never reached)
   - Globals.isAuthorised
   - requestDonors() controller
```

---

## 🎯 Endpoints Comparison

### Request Endpoints Breakdown

```
GET /requests/accept/:requestId/donor/:donorId
  - Middleware: NONE
  - CSRF: NO (GET method exempt)
  - Auth: ❌ Recommended to add
  - Status: 200 OK                     ✅ Works (PUBLIC)

GET /requests/reject/:requestId/donor/:donorId
  - Middleware: NONE
  - CSRF: NO (GET method exempt)
  - Auth: ❌ Recommended to add
  - Status: 200 OK                     ✅ Works (PUBLIC)

POST /requests/requestDonors
  - Middleware: Globals.isAuthorised
  - CSRF: YES (POST, not exempted)
  - Auth: ✅ JWT validated
  - Status: 403 Forbidden              ❌ CSRF token missing

GET /requests/cancel/:requestId
  - Middleware: Globals.isAuthorised
  - CSRF: NO (GET method exempt)
  - Auth: ✅ JWT validated
  - Status: 200 OK                     ✅ Works

POST /requests/getDonorsList
  - Middleware: Globals.isAuthorised
  - CSRF: YES (POST, not exempted)
  - Auth: ✅ JWT validated
  - Status: ? (likely same issue)      ⚠️ Check frontend

POST /requests/getDonorsListForRequests
  - Middleware: Globals.isAuthorised
  - CSRF: YES (POST, not exempted)
  - Auth: ✅ JWT validated
  - Status: ? (likely same issue)      ⚠️ Check frontend
```

---

## 📊 Comparison: Why Accept Works But RequestDonors Doesn't

| Aspect | Accept Endpoint | RequestDonors Endpoint |
|--------|---|---|
| **URL** | `/requests/accept/:requestId/donor/:donorId` | `/requests/requestDonors` |
| **HTTP Method** | GET ✅ | POST ✅ |
| **Authentication Required** | ❌ NO | ✅ YES (Globals.isAuthorised) |
| **CSRF Protected** | ❌ NO (GET exempt) | ✅ YES (POST not exempted) |
| **Auth Status** | Passes (no auth needed) | Fails at CSRF before reaching auth ⚠️ |
| **Final Status** | 200 Success ✅ | 403 Forbidden ❌ |
| **Response** | Works immediately | Blocked by middleware |
| **Why Difference** | GET requests are exempt from CSRF | POST requests require CSRF token |

---

## 🧪 How to Test

### Backend Endpoint: Get CSRF Token
**Endpoint**: `POST /api/csrf-token`

```bash
curl -X POST http://localhost:4000/api/csrf-token \
  -H "Content-Type: application/json"
```

**Response**:
```json
{
  "status": 1,
  "token": "AQJMfqRLxEbr9Hp5...",
  "message": "CSRF token generated successfully"
}
```

**Also Sets Cookie**:
```
Set-Cookie: _csrf=AQJMfqRLxEbr9Hp5...; HttpOnly; Secure; SameSite=strict; Path=/; Max-Age=3600
```

---

### Request Blood Endpoint: Currently Shows 403

**Endpoint**: `POST /api/requests/requestDonors`

```bash
curl -X POST http://localhost:4000/api/requests/requestDonors \
  -H "Authorization: YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["607f1f77bcf86cd799439011"],
    "bloodGroup": "O+",
    "pincode": "533435",
    "address": "City Hospital"
  }'
```

**Current Response (WITHOUT CSRF Token)**:
```json
{
  "status": 0,
  "message": "CSRF token invalid or expired"
}
```

**Status**: 403 Forbidden

---

### Request Blood Endpoint: Will Work With CSRF Token

**Updated Endpoint**: `POST /api/requests/requestDonors`

```bash
# First get CSRF token
CSRF_TOKEN=$(curl -X POST http://localhost:4000/api/csrf-token | jq -r '.token')

# Then use it in request
curl -X POST http://localhost:4000/api/requests/requestDonors \
  -H "Authorization: YOUR_JWT_TOKEN" \
  -H "x-csrf-token: $CSRF_TOKEN" \
  -H "Content-Type: application/json" \
  -b "_csrf=$CSRF_TOKEN" \
  -d '{
    "userIds": ["607f1f77bcf86cd799439011"],
    "bloodGroup": "O+",
    "pincode": "533435",
    "address": "City Hospital"
  }'
```

**Expected Response (WITH CSRF Token)**:
```json
{
  "status": 1,
  "message": "Request send successfully"
}
```

**Status**: 200 OK

---

## 🔍 Debugging Steps

### Step 1: Verify CSRF Protection is Active
**Check**: Does `/api/csrf-token` endpoint work?

```bash
curl -X POST http://localhost:4000/api/csrf-token -v
```

Should return token and set CSRF cookie.

### Step 2: Check JWT Token is Valid
**Check**: Is JWT token working?

```bash
curl -X GET http://localhost:4000/api/requests/cancel/123 \
  -H "Authorization: YOUR_JWT_TOKEN" \
  -v
```

Should return 200 if token valid, 401 if not.

### Step 3: Debug Frontend Request
**Check**: Is frontend sending CSRF token?

1. Open DevTools → Network tab
2. Submit the form
3. Right-click `/api/requests/requestDonors` → Copy as cURL
4. Check if it has `x-csrf-token` header
5. Check if it has `_csrf` cookie

### Step 4: Check Middleware Order
**Check**: Is CSRF middleware actually being used?

In `blood-bank-node/configs/express.js` around line 135:
- Should see `app.use(csrfProtection)` after session setup
- Should see `app.use(csrfErrorHandler)` after that

### Step 5: Verify Exemption List
**Check**: Is endpoint accidentally exempted?

In `blood-bank-node/configs/express.js` lines 112-120:
- `/api/requests/requestDonors` should NOT be in exemption list
- Only auth endpoints should be exempted

---

## 📚 Related Files & Documentation

| Document | Purpose |
|----------|---------|
| `403_FORBIDDEN_ERROR_INVESTIGATION.md` | Full investigation details |
| `QUICK_FIX_403_ERROR.md` | Quick implementation guide |
| This file | Code reference & summaries |

---

## ✅ Next Actions

1. **Implement Fix** - See `QUICK_FIX_403_ERROR.md`
2. **Test** - Run curl commands above to verify
3. **Verify** - Check browser network tab
4. **Deploy** - Push changes to production
5. **Monitor** - Check logs for any related errors

---

## 🎯 Key Takeaways

- ✅ CSRF protection is working correctly
- ✅ JWT authentication is working correctly
- ❌ Frontend is not sending CSRF token
- ✅ Backend endpoint `/api/csrf-token` is available
- ✅ Solution is simple: retrieve CSRF token and include in request headers

**Time to Fix**: ~5 minutes  
**Risk Level**: Low  
**Security Impact**: None - actually improves security by using CSRF tokens
