# Quick Start Guide: Secure Registration with OTP

## 🚀 5-Minute Setup

### Step 1: Install Dependencies (2 minutes)

**Backend**:
```bash
cd blood-bank-node
npm install firebase-admin bcryptjs express-rate-limit
```

**Frontend**: Already has axios installed ✓

### Step 2: Setup Firebase Auth for Phone Verification (5 minutes)

1. Go to https://console.firebase.google.com/ and create/select a project
2. Enable Authentication → Sign-in method → Phone
3. Create a service account and download the service account JSON (for server-side verification)
4. Add `FIREBASE_SERVICE_ACCOUNT_JSON` or `FIREBASE_SERVICE_ACCOUNT_PATH` to `blood-bank-node/.env.dev`

### Step 3: Configure .env.dev (1 minute)

Open `blood-bank-node/.env.dev` and add your Firebase service account JSON or path (see file for examples).

### Step 4: Start Services

**Terminal 1 - Backend**:
```bash
cd blood-bank-node
npm start
```

**Terminal 2 - Frontend**:
```bash
cd blood-bank-react
npm start
```

✅ **Done!** Go to http://localhost:3000 and click Register

---

## 🧪 Test Registration (First Time)

### Test User Data

**Aadhaar Test**:
- ID Type: Aadhaar
- ID Number: `123456789012` (12 digits)
- Phone: `9876543210` (10 digits)
- Name: John Doe
- Email: john@test.com
- Password: Test123456
- Blood Group: O+
- Pincode: 123456

**PAN Test**:
- ID Type: PAN
- ID Number: `ABCDE1234F` (5 letters + 4 digits + 1 letter)
- Phone: `9876543210`
- Name: Jane Smith
- Email: jane@test.com
- Password: Test123456
- Blood Group: A+
- Pincode: 654321

### Test Steps

1. **Fill Identity Form**
   - Select ID type
   - Enter ID number (see masked display)
   - Enter phone number
   - Click "Send OTP"

2. **Check Phone for OTP**
   - SMS arrives to phone number
   - Should look like: "Your Blood Bank verification OTP is: 123456"

3. **Enter OTP**
   - Copy 6-digit code from SMS
   - Paste in OTP field
   - Click "Verify OTP"

4. **Complete Registration**
   - Fill name, email, etc.
   - Click "Register"
   - See success message

5. **Login**
   - Go to Login page
   - Use registered email + password

---

## 🔧 Verify Everything Works

### Check Backend Logs
Should see:
```
Server running at http://localhost:4000
MongoDB connected
```

### Check Frontend Console
Should see:
```
RegisterPage loaded
OTP Service initialized
Auth Service initialized
```

### Check Firebase Console
- Open Authentication → Users to see phone-verified users

### Check MongoDB
```javascript
// OTP Collection should have expired records cleaned up
db.otps.find().sort({createdAt: -1}).limit(5)

// User Collection should have new user
db.users.find({identityType: "Aadhaar"}).limit(1)
```

---

## 📋 Troubleshooting (Quick Fixes)

### "OTP not received"
```
1. Ensure Firebase phone auth is enabled in the Firebase Console
2. Verify phone number format (use E.164 or let Firebase handle formatting)
3. Check `.env.dev` has Firebase service account config if using server-side verification
4. Check browser console for client SDK errors and backend logs for token verification
```

### "Phone not verified" error
```
1. OTP expires after 10 minutes
2. Send new OTP if needed
3. Verify same phone used in both steps
```

### "Rate limit exceeded"
```
1. Wait 5 minutes before resending OTP
2. Wait 1 minute before re-verifying
```

### Port already in use
```bash
# Kill process on port 4000 (backend)
netstat -ano | findstr :4000
taskkill /PID [PID] /F

# Kill process on port 3000 (frontend)
netstat -ano | findstr :3000
taskkill /PID [PID] /F
```

### Module not found errors
```bash
# Reinstall all dependencies
cd blood-bank-node
rm -rf node_modules package-lock.json
npm install

cd ../blood-bank-react
npm install
```

---

## 🎯 Key Features to Test

| Feature | Test | Expected |
|---------|------|----------|
| Aadhaar Mask | Enter `123456789012` | Displays `XXXX-XXXX-9012` |
| PAN Mask | Enter `ABCDE1234F` | Displays `ABCDE****F` |
| OTP Send | Click Send OTP | SMS arrives in 2 seconds |
| OTP Verify | Enter correct code | "OTP Verified" message |
| Wrong OTP | Enter wrong code | "Invalid OTP, 4 attempts remaining" |
| Registration | Fill form + submit | Redirected to login |
| Duplicate Email | Register twice | "Email already registered" |
| Data Security | Check DB | No raw Aadhaar/PAN stored |

---

## 📱 Mobile Testing

```
Device: iPhone 12
Browser: Safari
URL: http://[your-computer-ip]:3000

Device: Android 11
Browser: Chrome
URL: http://[your-computer-ip]:3000
```

---

## 🔒 Security Checklist

- [ ] No raw Aadhaar/PAN in database
- [ ] Only hash + last 4 digits stored
- [ ] OTP has 10-minute expiry
- [ ] Rate limiting works (5 attempts)
- [ ] Firebase service account config in .env only
- [ ] HTTPS ready (set in production)

---

## 📊 What's Stored in Database

**OTP Table**:
```javascript
{
  phoneNumber: "9876543210",
  otp: "123456",        // Auto-deleted after 10 min
  verified: true,       // After successful verification
  attempts: 0,
}
```

**User Table**:
```javascript
{
  userName: "John Doe",
  emailId: "john@test.com",
  phoneNumber: "9876543210",
  identityType: "Aadhaar",
  identityHash: "3f5c3f1b2a...",  // SHA256 hash
  identityLastFourDigits: "9012",   // Only last 4 digits
  isIdentityVerified: true,
  // ...other fields
}
```

---

## 🆘 Getting Help

### Check These Files
1. `REGISTRATION_WITH_OTP.md` - Full documentation
2. `IMPLEMENTATION_SUMMARY.md` - What was changed
3. `TESTING_CHECKLIST.md` - Complete test cases
4. Backend logs: `npm start` output
5. Frontend console: Press F12 → Console tab

### Common Errors

**Firebase client errors**
```bash
# If you see client SDK errors, ensure the Firebase JS SDK is initialized on the frontend
```

**Server: Firebase Admin not initialized**
```
- Check .env.dev has FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH
- Restart backend with: npm start
```

**"Rate limit exceeded"**
```
- Wait the specified time
- Check /api/otp/send and /api/otp/verify limits
```

---

## ✨ Next Steps After Testing

1. ✅ Verify all features work
2. ✅ Test error scenarios
3. ✅ Check database records
4. 📝 Update team documentation
5. 🚀 Deploy to staging
6. 🔍 Final security review
7. 📊 Load testing
8. 🌐 Production deployment

---

## 📞 Support Resources

- Firebase Auth Docs: https://firebase.google.com/docs/auth
- Express Rate Limit: https://github.com/nfriedly/express-rate-limit
- React Hooks: https://react.dev/reference/react
- MongoDB: https://docs.mongodb.com

---

**Last Updated**: February 8, 2026  
**Status**: Ready to Use  
**Estimated Setup Time**: 5-10 minutes  
**Estimated First Test**: 15-20 minutes
