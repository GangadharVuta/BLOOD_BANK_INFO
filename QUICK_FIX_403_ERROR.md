# 🔧 Quick Fix Guide: 403 Forbidden on /api/requests/requestDonors

## Problem
403 Forbidden error when submitting blood request form.

## Root Cause
Frontend is not sending CSRF token that backend requires.

---

## ⚡ Quick Fix (5 minutes)

### Step 1: Update requestForm.js

**File**: `blood-bank-react/src/components/requestForm/requestForm.js`

Replace the `handleSubmit` function (lines 37-71) with:

```javascript
const handleSubmit = async (e) => {
    e.preventDefault();

    try {
        const token = localStorage.getItem("token");
        
        if (!token) {
            swal("Error", "Not authenticated. Please login first.", "error");
            return;
        }

        // Get CSRF token from backend
        let csrfToken = null;
        try {
            const csrfResponse = await axios.post("http://localhost:4000/api/csrf-token");
            csrfToken = csrfResponse.data.token;
        } catch (csrfError) {
            console.error('CSRF token retrieval failed:', csrfError);
            swal("Error", "Security token retrieval failed. Please refresh and try again.", "error");
            return;
        }

        const response = await axios.post(
            "http://localhost:4000/api/requests/requestDonors",
            formData,
            {
                headers: {
                    Authorization: token,
                    "x-csrf-token": csrfToken,
                    "Content-Type": "application/json"
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
        console.error('Request form error:', error.response?.status, error.message);
        if (error.response?.status === 401) {
            swal("Error", "Session expired. Please login again.", "error");
            localStorage.removeItem("token");
            navigate("/login");
        } else if (error.response?.status === 403) {
            swal("Error", "Security verification failed. Please refresh the page and try again.", "error");
        } else {
            swal("Error", "Failed to send request. Please try again.", "error");
        }
    }
};
```

### Step 2: Test

1. Go to `/request-blood-form` in your React app
2. Fill out the form
3. Click "Send Blood Request"
4. Should now get 200 Success instead of 403 Forbidden

---

## 📊 What Changed

| Before | After |
|--------|-------|
| Only sends Authorization header | Sends Authorization + CSRF token |
| No CSRF token retrieval | Retrieves CSRF token from `/api/csrf-token` |
| 403 Forbidden error | 200 Success |

---

## 🔒 Response Headers Check

When you make the request, the backend sets CSRF cookie. Check your browser:

1. Open Browser DevTools → Network tab
2. Look at `/api/csrf-token` POST request
3. In Response headers, you should see:
   ```
   Set-Cookie: _csrf=...; HttpOnly; Secure; SameSite=Strict
   ```

---

## ✅ Verification

After fix, when you submit the form:

1. ✅ `/api/csrf-token` endpoint called
2. ✅ Returns CSRF token in response
3. ✅ `/api/requests/requestDonors` called with X-CSRF-Token header
4. ✅ Returns 200 Success with message "Request send successfully"

---

## 🆘 If Still Getting 403

### Check 1: Token is being sent
- Open DevTools → Network → click `/api/requests/requestDonors` POST request
- Check Request Headers → should have `x-csrf-token: ...`

### Check 2: Cookie is being sent
- Same request, check Cookies section
- Should show `_csrf=...` cookie

### Check 3: Console logs
- Check browser console for any errors during CSRF token retrieval
- If `/api/csrf-token` fails → that's the issue

### Check 4: Browser cookies enabled
- CSRF protection requires cookies
- Make sure cookies are enabled in browser
- Check if private/incognito mode is affecting cookies

---

## 🎯 Files Modified

- [blood-bank-react/src/components/requestForm/requestForm.js](blood-bank-react/src/components/requestForm/requestForm.js)

## 🔧 Backend No Changes Required

The backend CSRF protection is already set up correctly. No backend changes needed!

---

## 📚 How CSRF Protection Works

```
1. Frontend calls /api/csrf-token (POST)
   ↓
2. Backend returns CSRF token + sets cookie
   ↓
3. Frontend stores CSRF token from response
   ↓
4. Frontend sends request with:
   - x-csrf-token header (from step 2)
   - _csrf cookie (from step 2)
   ↓
5. Backend validates token matches cookie
   ↓
6. ✅ Request proceeds
```

If either token OR cookie is missing → 403 error

---

## 💡 Alternative: Long-term Solution

See the full investigation report: `403_FORBIDDEN_ERROR_INVESTIGATION.md` for creating a reusable CSRF service.

---

## ⏱️ Time Estimate
- Implementation: 3 minutes
- Testing: 2 minutes
- Total: 5 minutes
