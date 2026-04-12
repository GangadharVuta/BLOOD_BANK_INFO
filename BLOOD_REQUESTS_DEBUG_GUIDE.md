# Blood Requests - Debugging Guide with Code Snippets

## Debug Checklist - Run These Tests

### TEST 1: Verify Request Is Saved to MongoDB

**Step 1**: Open a terminal in your project and connect to MongoDB
```bash
# Using MongoDB shell if installed locally
mongosh

# Or if using mongoose in your Node app, run this script:
node -e "
const mongoose = require('mongoose');
const Requests = require('./blood-bank-node/app/modules/Request/Schema').Requests;

mongoose.connect('mongodb://YOUR_DB_URL').then(() => {
  Requests.find({}).limit(5).then(docs => {
    console.log('Total requests:', docs.length);
    console.log(JSON.stringify(docs, null, 2));
    process.exit(0);
  });
});
"
```

**Expected Output**:
```javascript
[
  {
    _id: ObjectId("..."),
    requestedBy: ObjectId("your_user_id"),
    donorId: ObjectId("selected_donor_id"),
    bloodGroup: "O+",
    address: "Hospital Name",
    pincode: "533435",
    requestId: "BCREQ0",
    isAcceptedByUser: false,
    isRejectedByUser: false,
    isDeleted: false,
    createdAt: ISODate(...),
    updatedAt: ISODate(...)
  }
]
```

---

### TEST 2: Check API Responses in Browser

**Step 1**: Open Developer Tools (F12) → Network Tab

**Step 2**: Submit a blood request and watch network calls

**Look for**: `POST /api/requests/requestDonors`
```
STATUS: 200
RESPONSE BODY: {
  "status": 1,
  "message": "Request send successfully"
}
```

If you see `status: 0`:
```
{
  "status": 0,
  "message": "Please send proper data... [specific fields]"
}
```

**Action**: Check FormData in the Request tab - verify userIds, bloodGroup, address, pincode are sent.

---

### TEST 3: Check Dashboard API Response

**In Network Tab**: Look for `POST /api/requests/getDonorsListForRequests`

**Expected Response** (status 1):
```javascript
{
  "status": 1,
  "data": [
    {
      "requestId": "BCREQ0",
      "userId": "donor_object_id",
      "userName": "Donor Name",
      "phoneNumber": "9876543210",
      "pincode": "533435",
      "bloodGroup": "O+"
    }
  ]
}
```

**Error Response** (status 0):
```javascript
{
  "status": 0,
  "message": "Request details not found"  // or other error
}
```

**If status 0**:
- Requests not saved to DB
- OR currentUser not authenticated
- OR filter conditions failing

---

### TEST 4: Check "My Requests" API Response

**In Network Tab**: Look for `GET /api/requests/donor/received`

**Expected Response** (status 1):
```javascript
{
  "status": 1,
  "data": [
    {
      "_id": "request_object_id",
      "requestId": "BCREQ0",
      "bloodGroup": "O+",
      "address": "Hospital Name",
      "pincode": "533435",
      "isAcceptedByUser": false,
      "isRejectedByUser": false,
      "requesterName": "Patient Name",
      "requesterPhone": "9876543210"
    }
  ]
}
```

---

## Debug Code Sections

### Frontend: RequestForm - Add Console Logs

📍 **File**: [blood-bank-react/src/components/requestForm/requestForm.js](blood-bank-react/src/components/requestForm/requestForm.js)

**Replace handleSubmit (Line 36-82) with this debug version**:

```javascript
const handleSubmit = async (e) => {
    e.preventDefault();

    try {
        const token = localStorage.getItem("token");
        
        console.log('🔍 [DEBUG] Form submitted');
        console.log('🔍 [DEBUG] Token:', token ? 'EXISTS' : 'MISSING');
        console.log('🔍 [DEBUG] Form data:', formData);
        
        if (!token) {
            swal("Error", "Not authenticated. Please login first.", "error");
            return;
        }

        // Fetch CSRF token
        const csrfResponse = await axios.post(
            "http://localhost:4000/api/csrf-token",
            {},
            {
                headers: {
                    Authorization: token,
                    "Content-Type": "application/json"
                }
            }
        );

        const csrfToken = csrfResponse.data.csrfToken;
        console.log('🔍 [DEBUG] CSRF token obtained:', csrfToken ? 'YES' : 'NO');

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

        console.log('✅ [DEBUG] Response status:', response.data.status);
        console.log('📝 [DEBUG] Response message:', response.data.message);
        console.log('📊 [DEBUG] Full response:', response.data);

        if (response.data.status === 0) {
            swal("Error", response.data.message, "error");
        } else {
            swal("Success", "Blood request sent successfully", "success");
            navigate("/dashboard");
        }
    } catch (error) {
        console.error('❌ [ERROR] Request submission failed');
        console.error('❌ Status:', error.response?.status);
        console.error('❌ Message:', error.message);
        console.error('❌ Full error:', error);
        
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

**Then check Console tab and copy all logs starting with 🔍 [DEBUG]**

---

### Frontend: Dashboard - Add Console Logs

📍 **File**: [blood-bank-react/src/components/dashboard/dashboard.js](blood-bank-react/src/components/dashboard/dashboard.js)

**Replace fetchDonor function (Line 52-114) with debug version**:

```javascript
const fetchDonor = async (activeTab) => {
    try {
        const token = localStorage.getItem('token');
        
        console.log('🔍 [DASHBOARD] Fetching with tab:', activeTab);
        console.log('🔍 [DASHBOARD] Token exists:', token ? 'YES' : 'NO');
        
        if (!token) {
            swal({
                title: "Error",
                text: "Not authenticated. Please login first.",
                icon: "error",
                button: "Okay"
            });
            return;
        }

        let req = {
            status: activeTab
        };
        
        console.log('🔍 [DASHBOARD] Sending request body:', req);

        const response = await axios.post('http://localhost:4000/api/requests/getDonorsListForRequests', req, {
            headers: {
                Authorization: token,
                'Content-Type': 'application/json',
            },
        });

        console.log('✅ [DASHBOARD] Response received');
        console.log('📊 [DASHBOARD] Response status:', response.data.status);
        console.log('📝 [DASHBOARD] Response message:', response.data.message);
        console.log('📋 [DASHBOARD] Data count:', response.data.data ? response.data.data.length : 0);
        console.log('📋 [DASHBOARD] Full data:', response.data.data);

        if (response.data.status === 0) {
            setDonors([])
            swal({
                title: "Error",
                text: typeof response.data.message === 'string' ? response.data.message : JSON.stringify(response.data.message),
                icon: "error",
                button: "Okay"
            });
        } else {
            console.log('✅ [DASHBOARD] Setting donors with', response.data.data.length, 'items');
            setDonors(response.data.data);
        }
    } catch (err) {
        console.error('❌ [DASHBOARD] Error occurred');
        console.error('❌ Status code:', err.response?.status);
        console.error('❌ Error message:', err.message);
        console.error('❌ Response data:', err.response?.data);
        console.error('❌ Full error:', err);
        
        if (err.response?.status === 401) {
            swal({
                title: "Error",
                text: "Session expired. Please login again.",
                icon: "error",
                button: "Okay"
            });
            localStorage.removeItem('token');
            window.location.href = '/login';
        } else {
            swal({
                title: "Error",
                text: "Failed to fetch requests",
                icon: "error",
                button: "Okay"
            });
        }
        setDonors([]);
    }
};
```

---

### Frontend: DonorRequests - Add Console Logs

📍 **File**: [blood-bank-react/src/components/donorRequests/DonorRequests.js](blood-bank-react/src/components/donorRequests/DonorRequests.js)

**Replace fetchDonorRequests function (Line 21-66) with debug version**:

```javascript
const fetchDonorRequests = async () => {
  try {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');

    console.log('🔍 [MY-REQUESTS] Starting fetch');
    console.log('🔍 [MY-REQUESTS] Token exists:', token ? 'YES' : 'NO');

    if (!token) {
      swal({
        title: 'Error',
        text: 'Please login to view your requests',
        icon: 'error',
        button: 'Okay'
      });
      navigate('/login');
      return;
    }

    console.log('🔍 [MY-REQUESTS] API_BASE_URL:', API_BASE_URL);
    const url = `${API_BASE_URL}/api/requests/donor/received`;
    console.log('🔍 [MY-REQUESTS] Full URL:', url);

    const response = await axios.get(
      url,
      {
        headers: {
          Authorization: token,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ [MY-REQUESTS] Response received');
    console.log('📊 [MY-REQUESTS] Response status:', response.data.status);
    console.log('📋 [MY-REQUESTS] Data count:', response.data.data ? response.data.data.length : 0);
    console.log('📋 [MY-REQUESTS] Full data:', response.data.data);

    if (response.data.status === 1) {
      console.log('✅ [MY-REQUESTS] Setting requests with', response.data.data.length, 'items');
      setRequests(response.data.data);
    } else {
      console.error('❌ [MY-REQUESTS] API returned status 0');
      setError(response.data.message || 'Failed to fetch requests');
      setRequests([]);
    }
  } catch (err) {
    console.error('❌ [MY-REQUESTS] Error occurred');
    console.error('❌ Status code:', err.response?.status);
    console.error('❌ Error message:', err.message);
    console.error('❌ Response data:', err.response?.data);
    console.error('❌ Full error:', err);
    
    if (err.response?.status === 401) {
      swal({
        title: 'Error',
        text: 'Session expired. Please login again.',
        icon: 'error',
        button: 'Okay'
      });
      localStorage.removeItem('token');
      navigate('/login');
    } else {
      setError(err.response?.data?.message || 'Failed to fetch requests');
    }
    setRequests([]);
  } finally {
    setLoading(false);
  }
};
```

---

### Backend: Add Server Logs

📍 **File**: [blood-bank-node/app/modules/Request/Controller.js](blood-bank-node/app/modules/Request/Controller.js)

**In requestDonors() - Add after line 97**:

```javascript
console.log('🔍 [SERVER] requestDonors called');
console.log('🔍 [SERVER] currentUser:', currentUser);
console.log('🔍 [SERVER] request body:', data);
```

**In getDonorsListForRequests() - Add after line 257**:

```javascript
console.log('🔍 [SERVER] getDonorsListForRequests called');
console.log('🔍 [SERVER] currentUser:', currentUser);
console.log('🔍 [SERVER] status filter:', data.status);
```

**In getDonorReceivedRequests() - Add after line 441**:

```javascript
console.log('🔍 [SERVER] getDonorReceivedRequests called');
console.log('🔍 [SERVER] currentUser:', currentUser);
```

---

## Common Issues & Fixes

### Issue 1: "Request details not found" on Dashboard

**Possible Causes**:

1. **currentUser not populated**
   - Check backend logs: Is currentUser an ObjectId or empty string?
   - Fix: Verify authentication middleware sets `req.currentUser`

2. **Requests not saved**
   - Run MongoDB query: `db.requests.find({requestedBy: ObjectId("YOUR_USER_ID")})`
   - If empty: requestDonors() not saving to DB

3. **Wrong user ID format**
   - Backend expects ObjectId, might be receiving string
   - Check: `typeof currentUser === 'object'`

**Debug Code** - Add to Controller.js getDonorsListForRequests() at Line 260:

```javascript
logger.debug('Query parameters:', { currentUser, query });
const debugCount = await Requests.countDocuments({ requestedBy: new ObjectId(currentUser) });
logger.debug('Requests count for this user:', debugCount);
```

---

### Issue 2: "No requests found" on My Requests Page

**Possible Causes**:

1. **No records with your donorId**
   - MongoDB query: `db.requests.find({donorId: ObjectId("YOUR_USER_ID")})`
   - If empty: You weren't selected as a donor

2. **Soft deleted (isDeleted: true)**
   - Check: `db.requests.find({donorId: ObjectId("YOUR_USER_ID"), isDeleted: true})`

3. **API returning status 0**
   - Check backend logs for error message
   - Verify mongoDB connection

**Debug Code** - Add to Controller.js getDonorReceivedRequests() at Line 448:

```javascript
const debugAllRequests = await Requests.find({ donorId: new ObjectId(currentUser) });
logger.debug('All requests for donor (incl. deleted):', debugAllRequests.length);
logger.debug('Non-deleted requests:', debugAllRequests.filter(r => !r.isDeleted).length);
```

---

### Issue 3: Form Submit Returns status: 0

**Check Request Body**:

In console, before submit, log:
```javascript
console.log('Form data to be sent:', {
  userIds: formData.userIds,
  bloodGroup: formData.bloodGroup,
  address: formData.address,
  pincode: formData.pincode
});
```

**Verify**:
- [ ] userIds is an array, not empty
- [ ] bloodGroup is a string (not "any")
- [ ] address is not empty
- [ ] pincode is 6 digits

**If any missing**: Form validation failing in backend

---

### Issue 4: API Returns 401 Unauthorized

**Causes**:
1. Token missing or invalid
2. Token expired
3. Token not being sent in headers

**Check**:
```javascript
// In browser console
localStorage.getItem('token')  // Should show token, not null
```

**Fix**:
- Log out and log back in
- Check token validity: `echo $token` (or paste in jwt.io)

---

## Step-by-Step Debugging Procedure

### Step 1: Add Console Logs
1. Copy debug versions from above
2. Paste into frontend components
3. Paste into backend Controller
4. Restart both services

### Step 2: Clear Data & Start Fresh
```bash
# MongoDB - remove all requests
use blood_bank_db
db.requests.deleteMany({})

# OR - Keep them but check
db.requests.find({}).pretty()
```

### Step 3: Test User-to-User Request
1. User A selects User B as donor
2. User A submits form
3. Watch Console for 🔍 logs
4. Write down all log outputs

### Step 4: Check Each Response
1. ✅ Does "Request send successfully" appear?
2. ✅ Does MongoDB save?
3. ✅ Does Dashboard show requests?
4. ✅ Does User B see in "My Requests"?

### Step 5: Document Findings
- Screenshot all console logs
- Note all API response statuses
- Check MongoDB directly
- Share findings for further debugging

---

## Monitoring Script

**Run this in Node.js to monitor requests real-time**:

```javascript
const mongoose = require('mongoose');
const Requests = require('./blood-bank-node/app/modules/Request/Schema').Requests;

async function monitorRequests() {
  await mongoose.connect('mongodb://localhost:27017/blood_bank_db');
  
  console.log('=== REQUEST MONITORING STARTED ===\n');
  
  // Watch for new requests
  const changeStream = Requests.collection.watch([
    { $match: { operationType: { $in: ['insert', 'update'] } } }
  ]);
  
  changeStream.on('change', (change) => {
    console.log('📝 Change detected:', new Date().toLocaleTimeString());
    console.log(change.operationType, ':', change.fullDocument);
    console.log('---');
  });
  
  // Initial count
  const count = await Requests.countDocuments({});
  console.log('Current total requests:', count);
  
  console.log('\n(Press Ctrl+C to stop)\n');
}

monitorRequests().catch(console.error);
```

---

## Export Debugging Data

**Copy this from Console and paste to file**:

```javascript
// In browser console, run:
copy(JSON.stringify({
  token: localStorage.getItem('token'),
  userInfo: JSON.parse(localStorage.getItem('user') || '{}'),  // if you store user
  screen: window.location.pathname,
  timestamp: new Date().toISOString()
}, null, 2))

// Then paste in a text file
```

---

## Report Template

When debugging, collect and share:

```
## Debugging Report - Blood Requests Not Appearing

### System Info
- Frontend URL: ___
- Backend URL: ___
- Logged in as: ___
- User ID: ___

### Request Submission
- Form submitted: YES / NO
- Response status: ___
- Error message: ___

### MongoDB Check
- Requests in collection: ___ (count)
- My sent requests: ___ (count)
- My received requests: ___ (count)
- Request IDs: ___

### API Responses
- getDonorsListForRequests status: ___
- donor/received status: ___
- Error messages: ___

### Console Logs
[Paste all 🔍 logs here]

### Network Errors
[Any network tab errors?]
```

---

## Next Steps

1. ✅ Apply debug logging to frontend components
2. ✅ Apply debug logging to backend controller
3. ✅ Restart services
4. ✅ Perform a complete test (submit → dashboard → myreq)
5. ✅ Collect all console logs
6. ✅ Check MongoDB directly
7. ✅ Share findings
