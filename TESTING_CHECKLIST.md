# Integration Checklist: Secure Registration with Aadhaar/PAN & OTP

## Pre-Deployment Checklist

### Backend Setup
- [ ] All dependencies installed: `npm install firebase-admin bcryptjs express-rate-limit`
- [ ] OTP module created in `app/modules/OTP/`
- [ ] User schema updated with identity fields
- [ ] User controller updated for OTP validation
- [ ] OTP routes added to `configs/express.js`
- [ ] No syntax errors in backend files
- [ ] MongoDB connection verified

### Frontend Setup
- [ ] AuthService created: `src/services/authService.js`
- [ ] OTPService created: `src/services/otpService.js`
- [ ] RegisterPage completely rewritten
- [ ] RegisterPage CSS updated with new styles
- [ ] No syntax errors in frontend files
- [ ] All imports correct and dependencies available

### Configuration
- [ ] Firebase project created and phone auth enabled
- [ ] Service account JSON downloaded
- [ ] `.env.dev` updated with `FIREBASE_SERVICE_ACCOUNT_JSON` or `FIREBASE_SERVICE_ACCOUNT_PATH`
- [ ] Backend restarted to load new config

### Database
- [ ] MongoDB indexes created (optional but recommended)
- [ ] Existing users unaffected (new fields are optional)
- [ ] Backup taken before deployment

---

## Functional Testing Checklist

### Registration Flow - Step 1 (Identity Verification)

**UI Elements**:
- [ ] Progress bar shows 3 steps (Identity, OTP, Register)
- [ ] Privacy disclaimer is visible and clear
- [ ] ID type dropdown shows "Aadhaar" and "PAN"
- [ ] ID Number input field accepts digits only
- [ ] Masked display shows correct format (XXXX-XXXX-1234 for Aadhaar)
- [ ] Phone number field accepts 10 digits only
- [ ] "Send OTP" button is enabled/disabled correctly

**Aadhaar Validation**:
- [ ] Accepts exactly 12 digits
- [ ] Rejects 11 or 13 digits with error message
- [ ] Displays masked format: XXXX-XXXX-1234
- [ ] Shows last 4 digits correctly

**PAN Validation**:
- [ ] Accepts ABCDE1234F format
- [ ] Rejects lowercase letters
- [ ] Displays masked format: ABCDE****F
- [ ] Shows last 1 character correctly

**Phone Number Validation**:
- [ ] Accepts 10 digits only
- [ ] Rejects letters and special characters
- [ ] Shows error for invalid format
- [ ] Matches format expected by Firebase phone auth (E.164 or client-side handling)

**Send OTP**:
- [ ] Button changes to "OTP Sent" after successful send
- [ ] Success message displays with 10-minute validity
- [ ] Error message shows for invalid inputs
- [ ] Loading state shown during API call
- [ ] Use Firebase Console (Authentication → Users) to verify phone-verified users during testing

---

### Registration Flow - Step 2 (OTP Verification)

**UI Elements**:
- [ ] Progress bar advances to step 2
- [ ] Phone number displayed (e.g., "6-digit OTP to 9876543210")
- [ ] OTP input field accepts 6 digits only
- [ ] "Verify OTP" button is functional
- [ ] "Resend OTP" button is visible

**OTP Verification**:
- [ ] Entering correct OTP shows success message
- [ ] Entering incorrect OTP shows "Invalid OTP" with remaining attempts
- [ ] 5 failed attempts trigger error message with prompt to resend
- [ ] Resend OTP sends new code via Firebase Auth (client)
- [ ] OTP expires after 10 minutes with appropriate error
- [ ] Progress advances to step 3 after verification

**Error Handling**:
- [ ] 6-digit validation enforced
- [ ] Attempt counter decrements on each failure
- [ ] Rate limiting triggers after 5 attempts/minute
- [ ] Clear error messages for all failure scenarios

---

### Registration Flow - Step 3 (Complete Registration)

**UI Elements**:
- [ ] Progress bar shows step 3 active
- [ ] "✓ Phone verified with [Aadhaar/PAN]" badge visible
- [ ] All form fields appear (Name, Email, etc.)
- [ ] Blood group dropdown populated with 8 options
- [ ] Form pre-populated with verified phone number

**Input Validation**:
- [ ] Name field not empty
- [ ] Valid email format enforced
- [ ] Password minimum 6 characters
- [ ] Password confirmation matches
- [ ] Pincode exactly 6 digits
- [ ] Blood group selection required
- [ ] All fields show clear error messages on validation failure

**Registration Submission**:
- [ ] Identity number hashed before submission
- [ ] Raw identity number not sent to server
- [ ] API call includes all required fields
- [ ] Success message shows and redirects to login
- [ ] Failed submission shows error message
- [ ] Duplicate email prevented with error message
- [ ] Duplicate identity prevented with error message

**Data Cleanup**:
- [ ] Raw identity number cleared from React state
- [ ] Masked identity cleared from display
- [ ] OTP cleared from memory
- [ ] Sensitive data not logged to console

---

### Database Verification

**OTP Collection**:
- [ ] OTP record created when send is called
- [ ] OTP marked as verified after successful verification
- [ ] OTP deleted after registration completes
- [ ] OTP auto-deleted after 10 minutes (TTL)
- [ ] Failed attempts recorded in `attempts` field

**User Collection**:
- [ ] New user record created with all fields
- [ ] `identityHash` contains SHA256 hash (not raw identity)
- [ ] `identityLastFourDigits` contains last 4 digits
- [ ] `identityType` shows "Aadhaar" or "PAN"
- [ ] `isIdentityVerified` set to true
- [ ] `phoneNumber` stored correctly
- [ ] `password` encrypted with bcrypt
- [ ] No raw identity number stored anywhere

---

### Security Testing

**Rate Limiting**:
- [ ] Calling OTP send > 5 times in 5 minutes triggers rate limit
- [ ] Calling OTP verify > 5 times in 1 minute triggers rate limit
- [ ] Rate limit error message is clear
- [ ] Rate limit status code is 429

**Input Security**:
- [ ] SQL injection attempts rejected
- [ ] Special characters handled safely
- [ ] XSS attempts prevented
- [ ] Phone number format strictly validated
- [ ] Identity number format strictly validated

**Authentication**:
- [ ] OTP verification required before registration
- [ ] Cannot bypass OTP step
- [ ] Cannot register without verified phone
- [ ] Duplicate prevention works correctly

**Data Privacy**:
- [ ] Privacy disclaimer visible and accurate
- [ ] Raw identity never logged
- [ ] Raw identity not in API request body (only hash)
- [ ] Error messages don't expose sensitive data
- [ ] HTTPS recommended in documentation

---

### API Testing (Backend)

**POST /api/otp/send**
- [ ] Valid phone: Returns 200 with status 1
- [ ] Invalid phone format: Returns error message
- [ ] Duplicate OTP: Old OTP deleted, new one created
- [ ] Firebase token/verification errors handled gracefully on `/api/otp/verify`
- [ ] Rate limit exceeded: 429 error

**POST /api/otp/verify**
- [ ] Valid OTP: Returns status 1, verified: true
- [ ] Invalid OTP: Increments attempts counter
- [ ] OTP expired: Error message
- [ ] Max attempts exceeded: Error message
- [ ] Rate limit exceeded: 429 error

**POST /api/users/register**
- [ ] Valid registration: Creates user, returns userId
- [ ] Missing OTP verification: Rejected with error
- [ ] Duplicate email: Rejected with error
- [ ] Duplicate identity: Rejected with error
- [ ] Invalid identity hash: Rejected
- [ ] Password encryption: Bcrypt hash stored

---

### Cross-Browser Testing

- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile browsers (iOS Safari, Chrome Android)

**Desktop (1920x1080)**:
- [ ] Layout responsive
- [ ] All buttons clickable
- [ ] Form fields aligned properly

**Tablet (768x1024)**:
- [ ] Progress bar wraps correctly
- [ ] Form still usable
- [ ] Buttons not overlapping

**Mobile (375x667)**:
- [ ] Single column layout
- [ ] Touch-friendly button sizes
- [ ] No horizontal scrolling
- [ ] Readable text

---

### Performance Testing

- [ ] Registration form loads in < 2 seconds
- [ ] OTP send API responds in < 5 seconds
- [ ] OTP verify API responds in < 2 seconds
- [ ] Form submission responds in < 3 seconds
- [ ] No memory leaks after multiple registrations
- [ ] Database indexes improve query speed

---

### Documentation Verification

- [ ] REGISTRATION_WITH_OTP.md complete and accurate
- [ ] IMPLEMENTATION_SUMMARY.md covers all changes
- [ ] Code comments explain key logic
- [ ] README updated with new features
- [ ] Firebase setup instructions clear
- [ ] Troubleshooting section helpful
- [ ] Examples include sample requests/responses

---

## Staging Environment Testing

- [ ] Deploy to staging server
- [ ] Run complete registration flow on staging
- [ ] Test with Firebase phone auth in staging (use test phone numbers or verifier tools)
- [ ] Load test (multiple concurrent registrations)
- [ ] Verify SSL/HTTPS works
- [ ] Check server logs for errors
- [ ] Monitor database for unexpected records
- [ ] Test backup and recovery

---

## Production Deployment

- [ ] All staging tests passed
- [ ] Database backup completed
- [ ] Rollback procedure documented
- [ ] Production credentials configured
- [ ] HTTPS enforced
- [ ] Rate limiting adjusted for production load
- [ ] Logging enabled for audit trail
- [ ] Monitoring/alerting configured
- [ ] Team trained on new registration flow
- [ ] Documentation updated

---

## Post-Deployment Checklist

- [ ] Monitor OTP delivery rates
- [ ] Monitor registration error rates
- [ ] Monitor database growth
- [ ] Verify no error logs
- [ ] Check user feedback
- [ ] Monitor performance metrics
- [ ] Weekly security audit
- [ ] Monthly compliance review

---

## Rollback Procedure (if needed)

1. Revert User Controller to previous version
2. Revert User Schema (remove identity fields)
3. Remove OTP routes from Express config
4. Delete OTP module
5. Restore RegisterPage to original
6. Restart backend service
7. Verify database consistency
8. Test registration with old flow

---

## Sign-Off

- [ ] Development Complete: _________________ Date: _______
- [ ] Testing Complete: _________________ Date: _______
- [ ] Security Review Complete: _________________ Date: _______
- [ ] Staging Approved: _________________ Date: _______
- [ ] Production Approved: _________________ Date: _______

---

**Document Created**: February 8, 2026  
**Last Updated**: February 8, 2026  
**Status**: Ready for Testing
