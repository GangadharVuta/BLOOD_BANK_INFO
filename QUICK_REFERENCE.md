# Firebase Phone Auth Implementation - Quick Reference

## 🎯 What Was Done

### Twilio → Firebase Migration
- ✅ Removed all Twilio SMS dependencies
- ✅ Implemented Firebase Phone Authentication
- ✅ Removed Aadhaar/PAN identity verification
- ✅ Created two-step registration flow
- ✅ Added server-side Firebase token verification

---

## 📱 Frontend Registration Flow

### Step 1: Phone Verification
```
User enters 10-digit phone number (e.g., 9876543210)
     ↓
Clicks "Send OTP"
     ↓
Firebase generates OTP and sends via SMS
     ↓
User receives SMS with 6-digit code
     ↓
User enters OTP in input field
     ↓
Clicks "Verify OTP"
     ↓
Firebase confirms OTP, returns auth credential + ID token
     ↓
Phone verified badge shown ✓
```

### Step 2: Profile Completion
```
Form fields appear:
- Full Name
- Email Address
- Blood Group (dropdown)
- Pincode (6 digits)
- Password
- Confirm Password
     ↓
Click "Complete Registration"
     ↓
Sends to backend with Firebase ID token
     ↓
Success → Redirect to login
```

---

## 🔧 Backend Registration Endpoint

### Endpoint
```
POST http://localhost:4000/api/users/register
```

### Request Body
```json
{
  "userName": "John Doe",
  "emailId": "john@example.com",
  "phoneNumber": "9876543210",
  "bloodGroup": "O+",
  "pincode": "123456",
  "password": "password123",
  "idToken": "<firebase-id-token>",
  "firebaseUid": "<firebase-uid>"
}
```

### Backend Processing
```
Receive request with Firebase ID token
     ↓
Verify token with Firebase Admin SDK
     ↓
Validate phone number matches token
     ↓
Validate Firebase UID matches token
     ↓
Check email uniqueness
     ↓
Check firebaseUid uniqueness
     ↓
Hash password with bcrypt
     ↓
Create user in MongoDB with:
- userName, emailId, phoneNumber, bloodGroup, pincode
- password (hashed), firebaseUid, isPhoneVerified=true
     ↓
Return success with userId
```

---

## 📁 Key Files

### Backend
| File | Changes |
|------|---------|
| `configs/firebase.js` | NEW - Firebase Admin initialization |
| `app/modules/User/Schema.js` | Removed identity fields, added firebaseUid |
| `app/modules/User/Controller.js` | Updated register() for Firebase verification |
| `.env.dev` | Added Firebase env var placeholders |
| `package.json` | Removed twilio, added firebase-admin |

### Frontend
| File | Changes |
|------|---------|
| `src/firebase.js` | UPDATED - Environment variable config |
| `src/components/register/RegisterPage.js` | REWRITTEN - Two-step Firebase flow |
| `src/services/otpService.js` | Added Firebase OTP methods |
| `.env.local` | NEW - Firebase client config |
| `package.json` | Removed twilio, added firebase |

---

## ⚙️ Environment Variables

### Backend (.env.dev)
```
NODE_ENV=Development
FIREBASE_PROJECT_ID=blood-bank-app-97b45

# Choose ONE:
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
# OR
FIREBASE_SERVICE_ACCOUNT_PATH=./secrets/firebase-service-account.json
```

### Frontend (.env.local)
```
REACT_APP_FIREBASE_API_KEY=AIzaSyDV9Abn5xLhzoweoxhXp6HQmm1LCIpFYRI
REACT_APP_FIREBASE_AUTH_DOMAIN=blood-bank-app-97b45.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=blood-bank-app-97b45
REACT_APP_FIREBASE_STORAGE_BUCKET=blood-bank-app-97b45.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=1081108873916
REACT_APP_FIREBASE_APP_ID=1:1081108873916:web:8c71bc0436714b96b706b9
```

---

## 🚀 Quick Start

### Backend
```bash
cd blood-bank-node
npm install
# Configure .env.dev with Firebase credentials
npm start
# Server runs on http://localhost:4000
```

### Frontend
```bash
cd blood-bank-react
npm install
# .env.local already configured
npm start
# App runs on http://localhost:3000
```

---

## ✅ Testing Checklist

- [ ] Frontend loads without Firebase errors
- [ ] Phone input accepts 10 digits only
- [ ] "Send OTP" shows loading state
- [ ] SMS received with OTP
- [ ] OTP verification succeeds
- [ ] Phone verified badge appears
- [ ] Step 2 form appears after verification
- [ ] Email validation works
- [ ] Password validation works
- [ ] Registration submits to backend
- [ ] Backend verifies Firebase token
- [ ] User created in MongoDB
- [ ] Login works with registered email/password

---

## 🔐 Security Features

✅ **Phone Verification:** Firebase-managed SMS OTP
✅ **reCAPTCHA:** Invisible bot protection
✅ **ID Token:** Server-side Firebase verification
✅ **Password:** Hashed with bcryptjs
✅ **Email:** Uniqueness validation
✅ **Phone:** No raw storage (Firebase managed)

---

## ❌ What Was Removed

- Twilio SDK
- Aadhaar number field
- PAN number field
- Identity verification fields
- 3-step progress indicator
- Server-side OTP sending

---

## 📊 Database Schema Changes

### Removed Fields
```javascript
identityType: String
identityHash: String
identityLastFourDigits: String
isIdentityVerified: Boolean
```

### Added Fields
```javascript
firebaseUid: String (unique, sparse)
isPhoneVerified: Boolean (true after Firebase OTP)
```

---

## 🐛 Common Issues

### Issue: "reCAPTCHA not initialized"
**Solution:** Refresh page, check Firebase credentials in console

### Issue: "Failed to send OTP"
**Solution:** Verify phone number format (10 digits), check Firebase reCAPTCHA config

### Issue: "Firebase token verification failed"
**Solution:** Check FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH is set

### Issue: "Phone number mismatch"
**Solution:** Ensure phone number sent to backend matches Firebase token

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| FIREBASE_SETUP_GUIDE.md | Complete setup instructions |
| FIREBASE_MIGRATION_SUMMARY.md | Detailed migration changes |
| REGISTRATION_WITH_OTP.md | Registration flow documentation |
| CHANGES.md | Full changelog |

---

## 🔗 Useful Links

- Firebase Console: https://console.firebase.google.com/project/blood-bank-app-97b45
- Firebase Auth Docs: https://firebase.google.com/docs/auth/web/phone-auth
- Admin SDK: https://firebase.google.com/docs/admin/setup
- MongoDB: mongodb+srv://... (check .env.dev)

---

## 📝 API Response Formats

### Success
```json
{
  "status": 1,
  "message": "User successfully registered with phone verification",
  "userId": "mongo-object-id"
}
```

### Error
```json
{
  "status": 0,
  "message": "Error description"
}
```

---

## 👤 User Model

```javascript
{
  _id: ObjectId,
  userName: String,
  emailId: String (unique),
  phoneNumber: String,
  bloodGroup: String,
  pincode: String,
  password: String (hashed),
  firebaseUid: String (unique),
  isPhoneVerified: Boolean,
  role: String (default: "Donor"),
  isActive: Boolean (default: true),
  isDeleted: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🎯 Next Steps

1. Deploy Firebase service account to backend
2. Install dependencies: `npm install` (both frontend and backend)
3. Start backend and frontend servers
4. Test registration flow end-to-end
5. Test login with new registered user
6. Deploy to production

---

**Status:** ✅ Complete - Ready for testing and deployment
**Last Updated:** 2024
**Version:** 1.0 - Firebase Phone Auth
