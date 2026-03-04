# Secure Registration with Aadhaar/PAN & OTP Verification

## Overview

This implementation adds secure, multi-step user registration with Aadhaar/PAN-based identity verification and OTP (One-Time Password) authentication to the Blood Bank application.

### Key Features

✅ **Identity Verification**: Aadhaar (12 digits) or PAN (10 characters) validation  
✅ **OTP via SMS**: Firebase Auth (phone) integration for sending OTP to user's phone  
✅ **Data Security**: Raw identity numbers are never stored - only secure hash + last 4 digits  
✅ **Input Masking**: Automatic masking of sensitive data (Aadhaar: XXXX-XXXX-1234, PAN: ABCDE****F)  
✅ **Rate Limiting**: DDoS protection on OTP endpoints  
✅ **Multi-Step Flow**: Progressive registration with visual progress indicator  
✅ **Privacy Compliant**: Clear disclaimer about data usage  

---

## Technical Architecture

### Backend (Node.js/Express)

#### New Modules Created

**1. OTP Module** (`app/modules/OTP/`)
- **Schema.js**: MongoDB schema for OTP storage with auto-expiry
-- **Controller.js**: Business logic for sending, verifying OTP via Firebase (server verifies Firebase ID tokens; client triggers SMS)
- **Routes.js**: API endpoints with rate limiting

**2. User Module Updates**
- Enhanced `Schema.js`: Added identity verification fields
- Enhanced `Controller.js`: Updated registration to validate OTP and store hashed identity

#### New API Endpoints

```
POST /api/otp/send
- Request: { phoneNumber: "9876543210" }
- Response: { status: 1, message: "OTP sent", messageId: "..." }

POST /api/otp/verify
- Request: { phoneNumber: "9876543210", otp: "123456" }
- Response: { status: 1, verified: true }

POST /api/otp/check
- Request: { phoneNumber: "9876543210" }
- Response: { status: 1, verified: true/false }

POST /api/users/register (Enhanced)
- Request: { 
    userName, emailId, password, phoneNumber, bloodGroup, pincode,
    identityType, identityNumber, identityHash
  }
- Response: { status: 1, message: "User successfully registered", userId }
```

#### Security Features

1. **Rate Limiting**:
   - OTP Send: 5 requests per 5 minutes
   - OTP Verify: 5 requests per 1 minute

2. **Identity Hash Storage**:
   ```javascript
   // Only store hash + last 4 digits
   identityHash: SHA256(identityNumber)
   identityLastFourDigits: "1234"
   // Never store raw identityNumber in database
   ```

3. **OTP Expiry**:
   - Auto-deletes after 10 minutes
   - Max 5 verification attempts

4. **Duplicate Prevention**:
   - Identity hash checked for uniqueness
   - Email checked for uniqueness

---

### Frontend (React)

#### New Services Created

**1. authService.js**
- `validateAadhaar()`: Validates 12-digit Aadhaar
- `validatePAN()`: Validates PAN format (ABCDE1234F)
- `maskAadhaar()`: Masks Aadhaar as XXXX-XXXX-1234
- `maskPAN()`: Masks PAN as ABCDE****F
- `hashIdentity()`: SHA256 hashing
- `registerUser()`: Submits registration with validation

**2. otpService.js**
- `sendOTP(phoneNumber)`: Calls OTP send endpoint
- `verifyOTP(phoneNumber, otp)`: Verifies OTP code
- `checkVerificationStatus()`: Checks if phone is verified

#### Enhanced RegisterPage Component

**Three-Step Registration Flow**:

1. **Step 1: Identity Verification**
   - Select ID type (Aadhaar/PAN)
   - Enter ID number (auto-masked)
   - Enter phone number
   - Click "Send OTP"

2. **Step 2: OTP Verification**
   - Enter 6-digit OTP
   - Click "Verify OTP"
   - Option to "Resend OTP"

3. **Step 3: Complete Registration**
   - Fill remaining details (name, email, etc.)
   - Submit registration

#### Input Validation

- **Aadhaar**: Must be exactly 12 digits
- **PAN**: Must be 5 uppercase + 4 digits + 1 uppercase (ABCDE1234F)
- **Phone**: Must be 10 digits
- **Email**: Valid email format
- **Password**: Minimum 6 characters
- **Pincode**: 6 digits

---

## Installation & Setup

### 1. Install Dependencies

**Backend**:
```bash
cd blood-bank-node
npm install firebase-admin bcryptjs crypto express-rate-limit dotenv
```

**Frontend**:
```bash
cd blood-bank-react
npm install axios
```

### 2. Configure Firebase Auth for Phone Verification

1. Create or open a Firebase project: https://console.firebase.google.com/
2. Enable Authentication → Sign-in method → Phone
3. Create a service account (Project Settings → Service Accounts) and download the JSON
4. Update `blood-bank-node/.env.dev` with either `FIREBASE_SERVICE_ACCOUNT_JSON` (paste JSON) or `FIREBASE_SERVICE_ACCOUNT_PATH` (path to JSON file)

Example `.env.dev` entries:
```dotenv
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_PATH=./secrets/firebase-service-account.json
```

### 3. Verify MongoDB Schema

The User schema now includes:
```javascript
{
  // ... existing fields ...
  identityType: "Aadhaar" | "PAN",
  identityHash: "sha256_hash",
  identityLastFourDigits: "1234",
  isIdentityVerified: true
}
```

### 4. Start Services

**Backend**:
```bash
cd blood-bank-node
npm start
```

**Frontend**:
```bash
cd blood-bank-react
npm start
```

---

## Security Considerations

### ✅ What We Do

1. **Never Store Raw Identity**
   - Raw Aadhaar/PAN only exists in request body
   - Cleared from memory after hashing
   - Database stores only: Hash + Last 4 digits

2. **Secure OTP Handling**
   - OTP sent to user's entered phone (not linked to identity)
   - OTP stored securely in MongoDB
   - Auto-expires after 10 minutes
   - Max 5 verification attempts

3. **Rate Limiting**
   - Prevents OTP brute force attacks
   - Limits to 5 attempts per minute for verification

4. **HTTPS Recommendation**
   - Enable SSL/TLS in production
   - Set secure cookies
   - Use environment variables for secrets

### ⚠️ Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS/SSL
- [ ] Use strong `sessionSecret` and `securityToken`
- [ ] Configure CORS properly
- [ ] Use database encryption
- [ ] Monitor for suspicious registration patterns
- [ ] Log security events (failed OTP, rate limiting)
- [ ] Implement CAPTCHA for registration form

---

## API Examples

### Example 1: Send OTP

**Request**:
```bash
POST http://localhost:4000/api/otp/send
Content-Type: application/json

{
  "phoneNumber": "9876543210"
}
```

**Response** (Success):
```json
{
   "status": 1,
   "message": "In production use Firebase Auth on the client to send OTP. After client verification, send the Firebase ID token to `/api/otp/verify`.",
   "expiresIn": 600
}
```

**Response** (Error):
```json
{
  "status": 0,
  "message": "Invalid phone number. Must be 10 digits."
}
```

### Example 2: Verify OTP

**Request**:
```bash
POST http://localhost:4000/api/otp/verify
Content-Type: application/json

{
  "phoneNumber": "9876543210",
  "otp": "123456"
}
```

**Response** (Success):
```json
{
  "status": 1,
  "message": "OTP verified successfully",
  "verified": true,
  "phoneNumber": "9876543210"
}
```

### Example 3: Register User

**Request**:
```bash
POST http://localhost:4000/api/users/register
Content-Type: application/json

{
  "userName": "John Doe",
  "emailId": "john@example.com",
  "password": "SecurePass123",
  "phoneNumber": "9876543210",
  "bloodGroup": "O+",
  "pincode": "123456",
  "identityType": "Aadhaar",
  "identityNumber": "123456789012",
  "identityHash": "sha256_hash_value"
}
```

**Response** (Success):
```json
{
  "status": 1,
  "message": "User successfully registered with identity verification",
  "userId": "507f1f77bcf86cd799439011"
}
```

---

## File Structure

```
blood-bank-node/
├── app/
│   └── modules/
│       ├── OTP/
│       │   ├── Schema.js          [NEW]
│       │   ├── Controller.js       [NEW]
│       │   └── Routes.js           [NEW]
│       └── User/
│           ├── Schema.js           [MODIFIED]
│           ├── Controller.js       [MODIFIED]
│           └── Routes.js           [EXISTING]
├── configs/
│   ├── express.js                  [MODIFIED - Added OTP routes]
│   └── configs.js                  [EXISTING]
├── .env.dev                         [MODIFIED - Added Firebase service account config]
└── server.js                        [EXISTING]

blood-bank-react/
├── src/
│   ├── services/
│   │   ├── authService.js          [NEW]
│   │   └── otpService.js           [NEW]
│   └── components/
│       └── register/
│           ├── RegisterPage.js     [MODIFIED]
│           └── RegisterPage.css    [MODIFIED]
```

---

## Troubleshooting

### Issue: OTP not received
**Solutions**:
1. Ensure Firebase phone auth is enabled in the Firebase Console
2. Check phone number format (use E.164 on client or let Firebase handle formatting)
3. If using test/sandbox numbers, ensure they are configured in Firebase
4. Check browser console for client SDK errors and backend logs for token verification

### Issue: "Phone not verified" error during registration
**Solutions**:
1. Ensure OTP was verified before registration
2. Check if OTP expired (> 10 minutes)
3. Verify phone number matches between OTP and registration

### Issue: Rate limiting errors
**Solutions**:
1. Wait 5 minutes before resending OTP
2. Wait 1 minute before re-attempting verification
3. Implement exponential backoff in frontend

### Issue: Hash mismatch
**Solutions**:
1. Ensure hashing algorithm matches (SHA256)
2. Verify identityNumber is exactly the same when hashing
3. Check for whitespace in identityNumber

---

## Database Indexes

For optimal performance, create these indexes:

```javascript
// OTP Collection
db.otps.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 600 })
db.otps.createIndex({ "phoneNumber": 1, "verified": 1 })

// User Collection
db.users.createIndex({ "emailId": 1 }, { unique: true })
db.users.createIndex({ "identityHash": 1 }, { sparse: true })
```

---

## Privacy & Compliance

✅ **GDPR Compliant**: No raw identity data stored  
✅ **Data Minimization**: Only necessary information collected  
✅ **User Consent**: Privacy notice displayed during registration  
✅ **Data Retention**: OTP auto-deleted after 10 minutes  
✅ **Right to be Forgotten**: Users can request data deletion  

---

## Future Enhancements

- [ ] Multi-language support
- [ ] Email verification in addition to SMS
- [ ] Biometric verification
- [ ] Document upload for identity proof
- [ ] Admin dashboard for registration analytics
- [ ] Audit logging for compliance

---

## Support & Contact

For issues or questions:
1. Check the troubleshooting section
2. Review API logs: `console.log()` output
3. Verify environment configuration
4. Contact: [Your Support Email]

---

## License

This code is part of the Blood Bank application. See LICENSE file for details.
