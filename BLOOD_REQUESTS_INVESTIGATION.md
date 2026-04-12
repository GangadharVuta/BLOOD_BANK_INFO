# Blood Requests Not Appearing - Comprehensive Investigation

**Date**: April 7, 2026  
**Issue**: Blood requests are not appearing on the dashboard and "My Requests" page after submission

---

## Executive Summary

The blood request system has **three distinct data flows**:
1. **Sending requests** (requestedBy current user) → visible on Dashboard
2. **Receiving requests** (donorId is current user) → visible on "My Requests/Donor Requests"
3. **Backend storage** → Request schema with multiple fields

The issue likely stems from **one of these areas**:
- Requests not being saved to MongoDB
- Incorrect filters hiding requests
- User authentication issues (currentUser not set)
- Console errors during network requests

---

## 1. Frontend Components - Complete Analysis

### 1.1 Dashboard Component 
**Shows requests SENT by the current user**

📍 **Location**: [blood-bank-react/src/components/dashboard/dashboard.js](blood-bank-react/src/components/dashboard/dashboard.js)

**What it displays**: 
- Table of donors who received requests from THIS user
- Can filter by status: Pending, Accepted, Rejected

**API Call**:
```javascript
// Line 58-75: fetchDonor(activeTab) method
POST http://localhost:4000/api/requests/getDonorsListForRequests
Body: { status: 'pending' | 'accepted' | 'rejected' }
Headers: Authorization: token

Response expected:
{
  status: 1,
  data: [
    {
      requestId: 'BCREQ0',
      userId: '_id',
      userName: 'donor name',
      phoneNumber: '9876543210',
      pincode: '533435',
      bloodGroup: 'A+'
    }
  ]
}
```

**Console logs to check** (Line 87):
- Look for console errors in `catch` block
- Check if response status is 0 (error conditions)

---

### 1.2 "My Requests" / "Donor Requests" Component
**Shows requests RECEIVED by the current user (as a donor)**

📍 **Location**: [blood-bank-react/src/components/donorRequests/DonorRequests.js](blood-bank-react/src/components/donorRequests/DonorRequests.js)

**What it displays**:
- Blood requests received FROM other users
- Filter by status: Pending, Accepted, Rejected
- Accept/Reject buttons

**API Call**:
```javascript
// Line 24-46: fetchDonorRequests() method
GET http://localhost:4000/api/requests/donor/received
Headers: 
  Authorization: token
  Content-Type: application/json

Response expected:
{
  status: 1,
  data: [
    {
      _id: 'request_id',
      requestId: 'BCREQ0',
      bloodGroup: 'O+',
      address: 'Hospital name',
      pincode: '533435',
      isAcceptedByUser: false,
      isRejectedByUser: false,
      requesterName: 'Patient name',
      requesterPhone: '9876543210'
    }
  ]
}
```

**Critical section** (Line 48-53):
- If `response.data.status === 1`: requests are displayed
- If `response.data.status === 0`: error message shown, requests set to `[]`

---

### 1.3 Request Form Component
**Where users submit blood requests**

📍 **Location**: [blood-bank-react/src/components/requestForm/requestForm.js](blood-bank-react/src/components/requestForm/requestForm.js)

**Form data structure**:
```javascript
// Line 15-21
{
  userIds: selectedDonors,      // Array of donor IDs
  bloodGroup: selectedBloodGroup, // Blood group selected
  address: "",                   // Hospital/address
  pincode: ""                    // 6-digit pincode
}
```

**Submission** (Line 36-72):
```javascript
POST http://localhost:4000/api/requests/requestDonors
Headers:
  Authorization: token
  x-csrf-token: csrfToken
  Content-Type: application/json
```

**Success check** (Line 67):
- If `response.data.status === 0`: Error alert shown
- If `response.data.status === 1`: Success message, redirects to `/dashboard`

⚠️ **Console errors to monitor**:
- Line 63: Network errors
- Line 75: Authentication errors (401)

---

## 2. Backend API Endpoints - Complete Analysis

### 2.1 Route Definition

📍 **Location**: [blood-bank-node/app/modules/Request/Routes.js](blood-bank-node/app/modules/Request/Routes.js)

```javascript
// Line 8-14: POST /requests/requestDonors
router.post('/requests/requestDonors', Globals.isAuthorised, (req, res, next) => {
    const requestObj = (new RequestsController()).boot(req, res);
    return requestObj.requestDonors();
});

// Line 30-33: POST /requests/getDonorsListForRequests
router.post('/requests/getDonorsListForRequests', Globals.isAuthorised, (req, res, next) => {
    const requestObj = (new RequestsController()).boot(req, res);
    return requestObj.getDonorsListForRequests();
});

// Line 43-46: GET /requests/donor/received
router.get('/requests/donor/received', Globals.isAuthorised, (req, res, next) => {
    const requestObj = (new RequestsController()).boot(req, res);
    return requestObj.getDonorReceivedRequests();
});
```

---

### 2.2 POST /api/requests/requestDonors - Store Requests

📍 **Location**: [blood-bank-node/app/modules/Request/Controller.js](blood-bank-node/app/modules/Request/Controller.js#L78)

**Method**: `async requestDonors()`

**What it does** (Line 78-158):

```javascript
async requestDonors() {
  // Step 1: Validate required fields (Line 91-95)
  let fieldsArray = ["userIds", "bloodGroup", "pincode", "address"];
  let emptyFields = await (new RequestBody()).checkEmptyWithFields(this.req.body, fieldsArray);
  // Returns error if any field is missing

  // Step 2: Get current user (Line 97)
  const currentUser = this.req.currentUser && this.req.currentUser._id ? this.req.currentUser._id : "";

  // Step 3: Get all existing requests count to generate requestId (Line 99-108)
  const requestsCount = await Requests.aggregate([...])
  // This creates requestId like "BCREQ0", "BCREQ1", etc.

  // Step 4: For each selected donor, create a request record (Line 110-158)
  for (let i = 0; i < data.userIds.length; i++) {
    const donarObj = {
      requestedBy: currentUser,      // User sending request
      donorId: data.userIds[i],      // Donor receiving request
      pincode: data.pincode,
      address: data.address,
      bloodGroup: data.bloodGroup,
      requestId: "BCREQ" + requestsCount.length  // "BCREQ0", "BCREQ1"
    }
    
    // Save to MongoDB (Line 130)
    const request = await new Model(Requests).store(donarObj);
    
    // Send WhatsApp notification to donor
  }

  // Return success (Line 156)
  return this.res.send({ status: 1, message: "Request send successfully" });
}
```

**Critical fields saved**:
- `requestedBy`: ObjectId of user sending request
- `donorId`: ObjectId of user receiving request
- `bloodGroup`: Blood group needed
- `address`: Location/hospital
- `pincode`: Location pincode
- `requestId`: String like "BCREQ0"
- `isAcceptedByUser`: Boolean, defaults to false
- `isRejectedByUser`: Boolean, defaults to false

**⚠️ Potential Issues**:
1. **Is `currentUser` populated?**: Check if `this.req.currentUser._id` is available
2. **Is data being saved?**: Check if `new Model(Requests).store(donarObj)` actually saves
3. **Wrong requestId?**: The requestId generation might be creating duplicates

---

### 2.3 POST /api/requests/getDonorsListForRequests - Fetch Sent Requests

📍 **Location**: [blood-bank-node/app/modules/Request/Controller.js](blood-bank-node/app/modules/Request/Controller.js#L253)

**Method**: `async getDonorsListForRequests()`

**What it does** (Line 253-330):

```javascript
async getDonorsListForRequests() {
  // Get current user
  const currentUser = this.req.currentUser && this.req.currentUser._id ? this.req.currentUser._id : "";

  // Build query: requests WHERE requestedBy == currentUser
  let query = [{ requestedBy: currentUser }];

  // Apply status filter (Line 270-278)
  if (data.status == "accepted") {
    query.push({ isAcceptedByUser: true, isRejectedByUser: false, isDeleted: false })
  } else if (data.status == "rejected") {
    query.push({ isAcceptedByUser: false, isRejectedByUser: true, isDeleted: false })
  } else if (data.status == "cancelled") {
    query.push({ isDeleted: true })
  } else {
    // Default: "pending"
    query.push({ isAcceptedByUser: false, isRejectedByUser: false, isDeleted: false })
  }

  // Aggregate query: Join with users and donors collections (Line 281-313)
  let requests = await Requests.aggregate([
    { $match: { $and: query } },
    {
      $lookup: {
        from: "users",
        localField: "donorId",
        foreignField: "_id",
        as: "userDetails"
      }
    },
    {
      $lookup: {
        from: "donors",
        localField: "donorId",
        foreignField: "_id",
        as: "donorDetails"
      }
    },
    {
      $addFields: {
        merged: {
          $cond: [
            { $gt: [{ $size: "$userDetails" }, 0] },
            { $arrayElemAt: ["$userDetails", 0] },
            { $arrayElemAt: ["$donorDetails", 0] }
          ]
        }
      }
    },
    { "$unwind": "$merged" },
    {
      $project: {
        requestId: "$requestId",
        userId: "$merged._id",
        userName: { $ifNull: ["$merged.userName", "$merged.name"] },
        phoneNumber: { $ifNull: ["$merged.phoneNumber", "$merged.phone"] },
        pincode: "$merged.pincode",
        bloodGroup: { $ifNull: ["$merged.bloodGroup", "$merged.bloodGroup"] }
      }
    }
  ])

  return this.res.send({ status: 1, data: requests });
}
```

**Filter Logic** (Lines 270-278):

| Status | Query |
|--------|-------|
| `pending` (default) | `isAcceptedByUser: false, isRejectedByUser: false, isDeleted: false` |
| `accepted` | `isAcceptedByUser: true, isRejectedByUser: false, isDeleted: false` |
| `rejected` | `isAcceptedByUser: false, isRejectedByUser: true, isDeleted: false` |
| `cancelled` | `isDeleted: true` |

---

### 2.4 GET /api/requests/donor/received - Fetch Received Requests

📍 **Location**: [blood-bank-node/app/modules/Request/Controller.js](blood-bank-node/app/modules/Request/Controller.js#L439)

**Method**: `async getDonorReceivedRequests()`

**What it does** (Line 439-489):

```javascript
async getDonorReceivedRequests() {
  const currentUser = this.req.currentUser && this.req.currentUser._id ? this.req.currentUser._id : "";

  if (!currentUser) {
    return this.res.send({ status: 0, message: "User not authenticated" });
  }

  // Find all requests WHERE donorId == currentUser (Line 448)
  let requests = await Requests.aggregate([
    { $match: { donorId: new ObjectId(currentUser), isDeleted: false } },
    
    // Join with users collection (who made the request)
    {
      $lookup: {
        from: "users",
        localField: "requestedBy",
        foreignField: "_id",
        as: "requesterDetails"
      }
    },
    
    { $unwind: "$requesterDetails" },
    
    {
      $project: {
        _id: 1,
        requestId: 1,
        bloodGroup: "$bloodGroup",
        address: "$address",
        pincode: "$pincode",
        isAcceptedByUser: 1,
        isRejectedByUser: 1,
        createdAt: 1,
        requesterName: { $ifNull: ["$requesterDetails.userName", "$requesterDetails.name"] },
        requesterPhone: { $ifNull: ["$requesterDetails.phoneNumber", "$requesterDetails.phone"] }
      }
    },
    
    { $sort: { createdAt: -1 } }
  ]);

  return this.res.send({ status: 1, data: requests });
}
```

**⚠️ Critical Issues**:
1. Line 448: `donorId: new ObjectId(currentUser)` - CurrentUser MUST be an ObjectId
2. Line 451: Join with `requestedBy` field (not `donorId`)
3. No filter for accepted/rejected - returns ALL requests

---

## 3. Data Model (MongoDB Schema)

📍 **Location**: [blood-bank-node/app/modules/Request/Schema.js](blood-bank-node/app/modules/Request/Schema.js)

```javascript
const request = new schema({
    requestedBy: { type: schema.Types.ObjectId, ref: 'Users' },  // User sending request
    donorId: { type: schema.Types.ObjectId, ref: 'Users' },      // User receiving request
    pincode: { type: String },
    bloodGroup: { type: String },
    address: { type: String },
    requestId: { type: String },                                  // e.g., "BCREQ0"
    isAcceptedByUser: { type: Boolean, default: false },
    isRejectedByUser: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
}, {
    timestamps: true  // Creates createdAt, updatedAt
});
```

---

## 4. Complete Data Flow Diagram

### Send Request Flow
```
RequestBloodPage
  ↓ (select donors)
RequestForm
  ↓ (submit with userIds[], bloodGroup, address, pincode)
POST /api/requests/requestDonors
  ↓ (validate, loop through userIds)
For each userIds[i]:
  ├─ Create Requests record:
  │  ├─ requestedBy: currentUser
  │  ├─ donorId: userIds[i]
  │  ├─ bloodGroup, address, pincode
  │  ├─ requestId: "BCREQ0", "BCREQ1"...
  │  └─ isAcceptedByUser: false, isRejectedByUser: false
  │
  ├─ Save to MongoDB → requests collection
  │
  └─ Send WhatsApp notification to donor
  
✓ Success response → Redirect to Dashboard
```

### Display Sent Requests (Dashboard)
```
Dashboard loads
  ↓
fetchDonor('pending') → POST /api/requests/getDonorsListForRequests
  ↓
Query: Find requests WHERE
  - requestedBy == currentUser
  - isAcceptedByUser: false
  - isRejectedByUser: false
  - isDeleted: false
  ↓
Join with users/donors collections to get donor details
  ↓
Display in table: [requestId, donorName, bloodGroup, pincode, phone]
```

### Display Received Requests (My Requests)
```
DonorRequests page loads
  ↓
fetchDonorRequests() → GET /api/requests/donor/received
  ↓
Query: Find requests WHERE
  - donorId == currentUser
  - isDeleted: false
  ↓
Join with users collection to get requester details
  ↓
Display in cards: [requestId, bloodGroup, address, requesterName, status]
  ↓
Allow Accept/Reject buttons
```

---

## 5. Troubleshooting Checklist

### Step 1: Verify Request Is Being Saved
- [ ] Open browser DevTools → Network tab
- [ ] Submit a blood request
- [ ] Check POST `/api/requests/requestDonors` response
  - Is `status: 1` returned?
  - Any error in `message` field?

### Step 2: Verify Request In MongoDB
```javascript
// Connect to MongoDB and run:
db.requests.find({ requestedBy: ObjectId("user_id_here") }).pretty()
```
- Should see records with your userIds as donorId
- Check if `isAcceptedByUser`, `isRejectedByUser` are false

### Step 3: Check User Authentication
- [ ] Verify token is being sent in headers
- [ ] Check if `currentUser` is populated in backend
- [ ] Look for 401 responses (unauthorized)

### Step 4: Check Dashboard API Response
- [ ] Network tab → POST `/api/requests/getDonorsListForRequests`
- [ ] Is response `status: 1` or `status: 0`?
- [ ] Look at `data` array - should have your donors

### Step 5: Check "My Requests" API Response
- [ ] Network tab → GET `/api/requests/donor/received`
- [ ] Is response `status: 1` or `status: 0`?
- [ ] Look at `data` array - should have requests sent to you

### Step 6: Browser Console Errors
- [ ] Open Developer Tools → Console tab
- [ ] Submit request and check for errors
- [ ] Check for network errors

### Step 7: Server Logs
- [ ] Check Node.js server console for errors
- [ ] Look for Logger.error or Logger.debug messages
- [ ] Check MongoDB connection status

---

## 6. Key Filters & Conditions

### Request Visibility Conditions

**For Dashboard (showing sent requests)**:
- `requestedBy == loggedInUser._id` AND
- Status filter applied:
  - Pending: `isAcceptedByUser: false, isRejectedByUser: false, isDeleted: false`
  - Accepted: `isAcceptedByUser: true, isRejectedByUser: false, isDeleted: false`
  - Rejected: `isAcceptedByUser: false, isRejectedByUser: true, isDeleted: false`

**For My Requests (showing received requests)**:
- `donorId == loggedInUser._id` AND
- `isDeleted: false`
- Frontend filters by `isAcceptedByUser` and `isRejectedByUser`

---

## 7. Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| No requests show on Dashboard after submit | `currentUser` not set, wrong requestedBy | Check authentication, log currentUser |
| Requests show in DB but not in UI | API returns `status: 0` | Check error message from API |
| Received requests not appearing | Backend not joining correctly OR `donorId` wrong | Verify donorId matches currentUser |
| Wrong donors showing | requestId collision or query filter wrong | Check query logic in controller |
| Data looks right but filters don't work | Frontend filter logic wrong | Check DonorRequests.js getFilteredRequests() |
| Network errors (500, 401) | Token not sent, user not authenticated | Check headers, verify token in localStorage |

---

## 8. Files To Check For Debugging

### Frontend
1. [blood-bank-react/src/components/dashboard/dashboard.js](blood-bank-react/src/components/dashboard/dashboard.js) - Check console.error() outputs
2. [blood-bank-react/src/components/donorRequests/DonorRequests.js](blood-bank-react/src/components/donorRequests/DonorRequests.js) - Check API response status
3. Browser DevTools → Network tab for request/response
4. Browser DevTools → Console for JavaScript errors

### Backend
1. [blood-bank-node/app/modules/Request/Controller.js](blood-bank-node/app/modules/Request/Controller.js) - Check logger outputs
2. MongoDB logs for save/query errors
3. Node.js server console for uncaught errors

### Tests to Run
```bash
# Test Dashboard fetch
curl -X POST http://localhost:4000/api/requests/getDonorsListForRequests \
  -H "Authorization: TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"status":"pending"}'

# Test Received Requests fetch
curl -X GET http://localhost:4000/api/requests/donor/received \
  -H "Authorization: TOKEN_HERE" \
  -H "Content-Type: application/json"

# Check MongoDB
db.requests.countDocuments({})
db.requests.find().limit(5).pretty()
```

---

## Summary

The blood request system works through:
1. **Submission** → RequestForm POST `/api/requests/requestDonors`
2. **Storage** → Creates N request records in MongoDB (one per donor)
3. **Retrieval** → Dashboard/MyRequests query with different `requestedBy`/`donorId` filters

**To find the issue**:
- ✅ Check if requests are saved to MongoDB
- ✅ Check if API responses have `status: 1`
- ✅ Check if `currentUser` is properly authenticated
- ✅ Check browser console and server logs for errors

Next steps should be running the curl commands above and checking real-time logs when submitting a request.
