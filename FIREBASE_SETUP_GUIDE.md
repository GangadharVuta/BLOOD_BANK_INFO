# Firebase Phone Auth Migration - Setup Guide

## Overview
This Blood Bank application has been successfully migrated from Twilio SMS OTP to Firebase Phone Authentication. All Aadhaar and PAN identity verification has been completely removed.

## Architecture

### Frontend (React)
- Uses Firebase SDK v9+ (modular)
- Phone authentication via `signInWithPhoneNumber()`
- Invisible reCAPTCHA for bot protection
- Two-step registration:
  1. Phone verification (OTP from Firebase)
  2. User profile completion (name, email, blood group, pincode, password)

### Backend (Node.js/Express)
- Firebase Admin SDK for token verification
- Verifies Firebase ID tokens from client before registration
- Stores Firebase UID and phone number (no identity docs)
- MongoDB for user data

## Setup Instructions

### Frontend Setup

1. **Install Dependencies**
   ```bash
   cd blood-bank-react
   npm install
   ```

2. **Environment Variables** (`.env.local`)
   The file is already created with:
   ```
   REACT_APP_FIREBASE_API_KEY=AIzaSyDV9Abn5xLhzoweoxhXp6HQmm1LCIpFYRI
   REACT_APP_FIREBASE_AUTH_DOMAIN=blood-bank-app-97b45.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=blood-bank-app-97b45
   REACT_APP_FIREBASE_STORAGE_BUCKET=blood-bank-app-97b45.firebasestorage.app
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=1081108873916
   REACT_APP_FIREBASE_APP_ID=1:1081108873916:web:8c71bc0436714b96b706b9
   ```

3. **Run Development Server**
   ```bash
   npm start
   ```
   The app will run on http://localhost:3000

### Backend Setup

1. **Install Dependencies**
   ```bash
   cd blood-bank-node
   npm install
   ```

2. **Firebase Service Account Configuration**

   **Option A: Inline JSON (Quick Setup)**
   - Edit `.env.dev` and set:
     ```
     FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"blood-bank-app-97b45",...}
     ```
   - Get the JSON from Firebase Console → Project Settings → Service Accounts → Generate new private key

   **Option B: File Path (Recommended)**
   - Download service account JSON from Firebase Console
   - Place it at: `blood-bank-node/secrets/firebase-service-account.json`
   - Edit `.env.dev` and set:
     ```
     FIREBASE_SERVICE_ACCOUNT_PATH=./secrets/firebase-service-account.json
     ```

3. **Verify Environment Variables**
   ```
   FIREBASE_PROJECT_ID=blood-bank-app-97b45
   FIREBASE_SERVICE_ACCOUNT_JSON= (or FIREBASE_SERVICE_ACCOUNT_PATH=)
   ```

4. **Run Development Server**
   ```bash
   npm start
   ```
   The server will run on http://localhost:4000

## Registration Flow

### Frontend Registration
1. User enters 10-digit phone number (India +91)
2. Clicks "Send OTP" → Firebase sends SMS
3. User enters 6-digit OTP from SMS
4. Clicks "Verify OTP" → Client confirms with Firebase, gets ID token
5. Phone verified badge shown
6. User enters: Name, Email, Blood Group, Pincode, Password
7. Clicks "Complete Registration"
8. Client submits to backend with:
   - `idToken`: Firebase ID token
   - `firebaseUid`: Firebase UID
   - `phoneNumber`: Verified phone number
   - `userName`, `emailId`, `bloodGroup`, `pincode`, `password`

### Backend Registration
1. Receives registration request with Firebase ID token
2. Verifies ID token using Firebase Admin SDK
3. Checks token's phone number matches submitted phone number
4. Checks token's UID matches submitted firebaseUid
5. Validates email uniqueness
6. Validates firebaseUid uniqueness
7. Hashes password, creates user record
8. Returns success with userId

## Database Schema Changes

### User Collection (MongoDB)
**Removed Fields:**
- `identityType`
- `identityHash`
- `identityLastFourDigits`
- `isIdentityVerified`

**New Fields:**
- `firebaseUid`: String (unique, sparse) - Firebase UID from phone auth
- `isPhoneVerified`: Boolean - Phone verification status

**Existing Fields (unchanged):**
- `userName`
- `emailId`
- `phoneNumber`
- `bloodGroup`
- `pincode`
- `password` (hashed)
- `role` (default: 'Donor')
- `createdAt`, `updatedAt`

## API Endpoints

### User Registration
- **Endpoint:** `POST /api/users/register`
- **Request Body:**
  ```json
  {
    "userName": "John Doe",
    "emailId": "john@example.com",
    "phoneNumber": "9876543210",
    "bloodGroup": "O+",
    "pincode": "123456",
    "password": "password123",
    "idToken": "firebase-id-token-from-client",
    "firebaseUid": "firebase-uid"
  }
  ```
- **Success Response:**
  ```json
  {
    "status": 1,
    "message": "User successfully registered with phone verification",
    "userId": "mongodb-user-id"
  }
  ```

### User Login
- **Endpoint:** `POST /api/users/login`
- **Request Body:**
  ```json
  {
    "emailId": "john@example.com",
    "password": "password123"
  }
  ```
- **Success Response:**
  ```json
  {
    "status": 1,
    "message": "User logged in successfully",
    "access_token": "jwt-token",
    "data": { ...user details... }
  }
  ```

## Testing Checklist

- [ ] Frontend loads without Firebase errors
- [ ] RecaptchaVerifier initializes (check console)
- [ ] Phone number input accepts only 10 digits
- [ ] "Send OTP" button sends SMS via Firebase
- [ ] OTP entry accepts only 6 digits
- [ ] "Verify OTP" confirms with Firebase
- [ ] After verification, step 2 form appears
- [ ] All profile fields are required
- [ ] Email validation works
- [ ] Password confirmation validates
- [ ] Registration submits to backend with idToken
- [ ] Backend verifies Firebase token successfully
- [ ] User created in MongoDB with firebaseUid
- [ ] Login works with registered email/password
- [ ] Duplicate email prevented
- [ ] Duplicate phone number prevented

## Troubleshooting

### Frontend Issues

**"reCAPTCHA not initialized"**
- Ensure Firebase SDK is loaded
- Check browser console for errors
- Refresh page

**"Failed to send OTP"**
- Verify phone number is valid (10 digits)
- Check Firebase Console → Authentication → Settings
- Ensure reCAPTCHA site key is configured in Firebase
- Phone number format should be +91XXXXXXXXXX

**"Invalid OTP"**
- Check OTP hasn't expired (Firebase timeout ~3 minutes)
- Verify 6-digit format
- Try "Send OTP" again

### Backend Issues

**"Firebase authentication service unavailable"**
- Check FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH is set
- Verify service account JSON is valid
- Check Firebase project ID matches

**"Firebase token verification failed"**
- Token may have expired (get new one from client)
- Verify Firebase Admin SDK initialization succeeded
- Check server logs for error details

**"Phone number mismatch"**
- Client must send phone number in standard format
- Backend strips country code for comparison
- Verify both client and server use same phone format

## Migration Notes

### What Changed
✅ Removed: Twilio SDK and credentials
✅ Removed: Aadhaar/PAN identity fields
✅ Removed: 3-step progress indicator
✅ Added: Firebase Phone Auth
✅ Added: Two-step registration flow
✅ Added: Firebase ID token verification

### What Stayed the Same
- Email/Password login
- MongoDB user storage
- JWT token generation
- Password hashing (CommonService)
- Blood group selection
- Pincode validation

### Backward Compatibility
- Existing users can still login with email/password
- New registrations require phone verification only
- No identity documents needed

## Production Deployment

### Environment Setup
1. Set `NODE_ENV=Production` in `.env.prod`
2. Configure Firebase service account for production
3. Update `frontUrl` to production domain
4. Enable HTTPS on backend
5. Configure CORS if needed

### Security Considerations
1. Never commit Firebase service account JSON to Git
2. Use environment variables for all secrets
3. Rate-limit registration endpoints
4. Monitor Firebase usage/costs
5. Review Firebase security rules (if using Firestore)
6. Enable Firebase Authentication phone sign-in security options

## Support & References

- Firebase Phone Auth Docs: https://firebase.google.com/docs/auth/web/phone-auth
- Firebase Admin SDK: https://firebase.google.com/docs/admin/setup
- RecaptchaVerifier: https://firebase.google.com/docs/auth/web/recaptcha
- Project Documentation: See CHANGES.md, IMPLEMENTATION_SUMMARY.md

---

**Last Updated:** 2024
**Status:** Firebase Phone Auth Active
**Identity Verification:** Removed (Phone OTP Only)
