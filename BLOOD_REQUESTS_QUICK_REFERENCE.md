# Blood Requests System - Quick Reference Card

## File Locations

### Frontend Components
| Component | File Path | Purpose |
|-----------|-----------|---------|
| Dashboard (Sent Requests) | [blood-bank-react/src/components/dashboard/dashboard.js](blood-bank-react/src/components/dashboard/dashboard.js) | Shows requests user SENT to donors |
| My Requests (Received) | [blood-bank-react/src/components/donorRequests/DonorRequests.js](blood-bank-react/src/components/donorRequests/DonorRequests.js) | Shows requests user RECEIVED as donor |
| Request Form | [blood-bank-react/src/components/requestForm/requestForm.js](blood-bank-react/src/components/requestForm/requestForm.js) | Form to submit blood requests |
| Request Blood Page | [blood-bank-react/src/components/requestBlood/RequestBloodPage.js](blood-bank-react/src/components/requestBlood/RequestBloodPage.js) | Choose donors before forming request |

### Backend Files
| Component | File Path | Purpose |
|-----------|-----------|---------|
| Request Schema | [blood-bank-node/app/modules/Request/Schema.js](blood-bank-node/app/modules/Request/Schema.js) | MongoDB schema definition |
| Request Routes | [blood-bank-node/app/modules/Request/Routes.js](blood-bank-node/app/modules/Request/Routes.js) | API route definitions |
| Request Controller | [blood-bank-node/app/modules/Request/Controller.js](blood-bank-node/app/modules/Request/Controller.js) | Business logic |

---

## API Endpoints Summary

### 1. Submit Request (POST)
```
Endpoint: POST /api/requests/requestDonors
Auth: Required (token in Authorization header)
Body: {
  "userIds": ["id1", "id2"],
  "bloodGroup": "O+",
  "address": "Hospital name",
  "pincode": "533435"
}
Response: { status: 1, message: "Request send successfully" }
Controller: requestDonors() - Line 78
```

### 2. Get Sent Requests (POST)
```
Endpoint: POST /api/requests/getDonorsListForRequests
Auth: Required
Body: { "status": "pending" | "accepted" | "rejected" }
Response: { status: 1, data: [{requestId, userId, userName, phoneNumber, pincode, bloodGroup}] }
Controller: getDonorsListForRequests() - Line 253
Query: requestedBy == currentUser
```

### 3. Get Received Requests (GET)
```
Endpoint: GET /api/requests/donor/received
Auth: Required
Body: (none)
Response: { status: 1, data: [{_id, requestId, bloodGroup, address, pincode, isAcceptedByUser, isRejectedByUser, requesterName, requesterPhone}] }
Controller: getDonorReceivedRequests() - Line 439
Query: donorId == currentUser
```

### 4. Get Donors for Request (GET)
```
Endpoint: GET /api/requests/:id/donors
Auth: Required
Params: id = requestId
Response: { status: 1, data: [{userId, userName, phoneNumber, bloodGroup, status}] }
Controller: getDonorsForRequest() - Line 368
```

### 5. Accept Request (GET)
```
Endpoint: GET /api/requests/accept/:requestId/donor/:donorId
Auth: Not required
Params: requestId, donorId
Response: { status: 1, message: "Donor accepted" }
Controller: acceptRequest() - Line 201
Update: isAcceptedByUser = true
```

### 6. Reject Request (GET)
```
Endpoint: GET /api/requests/reject/:requestId/donor/:donorId
Auth: Not required
Params: requestId, donorId
Response: { status: 1, message: "Donor rejected" }
Controller: rejectRequest() - Line 224
Update: isRejectedByUser = true
```

---

## Request Schema Fields

```javascript
{
  requestedBy: ObjectId,      // User sending request
  donorId: ObjectId,          // Donor receiving request
  pincode: String,            // Location pincode
  bloodGroup: String,         // Blood group needed (e.g., "O+")
  address: String,            // Hospital/location address
  requestId: String,          // Generated ID like "BCREQ0"
  isAcceptedByUser: Boolean,  // Donor accepted (default: false)
  isRejectedByUser: Boolean,  // Donor rejected (default: false)
  isDeleted: Boolean,         // Request cancelled (default: false)
  createdAt: Date,            // Auto-generated
  updatedAt: Date             // Auto-generated
}
```

---

## Frontend API Calls (Chrome Network Tab)

### Request Submission
```
Method: POST
URL: http://localhost:4000/api/requests/requestDonors
Headers:
  - Authorization: Bearer/Token VALUE
  - Content-Type: application/json
  - x-csrf-token: CSRF_TOKEN
Payload: {userIds: [], bloodGroup, address, pincode}
```

### Dashboard Fetch (on page load)
```
Method: POST
URL: http://localhost:4000/api/requests/getDonorsListForRequests
Headers:
  - Authorization: Bearer/Token VALUE
  - Content-Type: application/json
Payload: {status: "pending"}  // or "accepted", "rejected"
```

### My Requests Fetch (on page load)
```
Method: GET
URL: http://localhost:4000/api/requests/donor/received
Headers:
  - Authorization: Bearer/Token VALUE
  - Content-Type: application/json
```

---

## Filtering Logic

### Dashboard Shows (Requests SENT by user)
- **Status**: `requestedBy == loggedInUser._id`
- **Pending**: `isAcceptedByUser: false, isRejectedByUser: false, isDeleted: false`
- **Accepted**: `isAcceptedByUser: true, isRejectedByUser: false, isDeleted: false`
- **Rejected**: `isAcceptedByUser: false, isRejectedByUser: true, isDeleted: false`

### My Requests Shows (Requests RECEIVED by user)
- **Status**: `donorId == loggedInUser._id , isDeleted: false`
- **Frontend filters**:
  - **Pending**: `!isAcceptedByUser && !isRejectedByUser`
  - **Accepted**: `isAcceptedByUser: true`
  - **Rejected**: `isRejectedByUser: true`

---

## Data Flow Chains

### Complete Request Lifecycle
```
1. User selects donors on RequestBloodPage
2. Navigate to RequestForm with selectedDonors
3. User fills form → Submit button
4. POST /api/requests/requestDonors
   └─ Creates N records (one per donor)
   └─ Fields: requestedBy, donorId, bloodGroup, address, pincode, requestId
   └─ Defaults: isAcceptedByUser=false, isRejectedByUser=false, isDeleted=false
5. Save to MongoDB requests collection
6. Send WhatsApp notifications to donors
7. Success → Redirect to Dashboard

Dashboard Load:
1. Component mounts → fetchDonor('pending')
2. POST /api/requests/getDonorsListForRequests {status: 'pending'}
3. Backend queries: requestedBy==currentUser + filters
4. Join with users/donors for details
5. Return donor list
6. Display in table

Donor View:
1. Donor accesses "My Requests" page (DonorRequests)
2. Fetch GET /api/requests/donor/received
3. Backend queries: donorId==currentUser + isDeleted==false
4. Join with users to get requester details
5. Return request list
6. Display in cards with Accept/Reject buttons
```

---

## Critical Checkpoints

| Checkpoint | Check | Expected Result |
|-----------|-------|-----------------|
| Form Submit | POST to requestDonors returns status:1 | Response should be success |
| MongoDB Save | db.requests.find({requestedBy: userId}) | Documents appear in collection |
| Dashboard API | POST getDonorsListForRequests returns status:1 | Array of donors in response.data |
| Dashboard Display | Table renders | Rows visible for each request |
| MyRequests API | GET donor/received returns status:1 | Array of requests in response.data |
| MyRequests Display | Cards render with Accept/Reject | Buttons clickable |
| Accept Action | GET requests/accept/:requestId/:donorId | isAcceptedByUser updates to true |
| Reject Action | GET requests/reject/:requestId/:donorId | isRejectedByUser updates to true |

---

## Debugging Commands

### Browser Console (DevTools)
```javascript
// Check token
localStorage.getItem('token')

// Check API response
fetch('http://localhost:4000/api/requests/getDonorsListForRequests', {
  method: 'POST',
  headers: {
    'Authorization': localStorage.getItem('token'),
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({status: 'pending'})
}).then(r => r.json()).then(console.log)
```

### MongoDB (in shell)
```javascript
// Count all requests
db.requests.countDocuments({})

// Find my sent requests
db.requests.find({requestedBy: ObjectId("YOUR_USER_ID")})

// Find requests received
db.requests.find({donorId: ObjectId("YOUR_USER_ID")})

// Check status fields
db.requests.findOne({}, {isAcceptedByUser: 1, isRejectedByUser: 1, isDeleted: 1})
```

### cURL (Terminal)
```bash
# Test API endpoint
curl -X POST http://localhost:4000/api/requests/getDonorsListForRequests \
  -H "Authorization: YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"status":"pending"}'

# Get received requests
curl -X GET http://localhost:4000/api/requests/donor/received \
  -H "Authorization: YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

---

## Status Codes Reference

- **status: 1** → Success (request processed, data returned)
- **status: 0** → Error (check `message` field for details)

### Common Error Messages
- "Please send proper data... fields required" → Missing required fields
- "Donor details not found" → No donors match query
- "Request details not found" → No requests for user
- "User not authenticated" → currentUser not populated
- "User not found" → Requester or donor ID invalid

---

## Important Notes

1. **RequestedBy vs DonorId**:
   - `requestedBy` = User sending the blood request
   - `donorId` = User being asked to donate

2. **Dashboard** = Shows my sent requests (I'm the requester)

3. **My Requests** = Shows requests sent to me (I'm the donor)

4. **RequestId** = Generated as "BCREQ" + count (e.g., "BCREQ0", "BCREQ1")

5. **Timestamps** = Automatically created (createdAt, updatedAt)

6. **Multiple Records Per Request** = If user selects 5 donors, 5 request records are created (same requestId but different donorIds)

---

## Next Steps for Resolution

1. ✅ Check if requests are saved (MongoDB query)
2. ✅ Verify API response status codes (Network tab)
3. ✅ Check authentication (token in headers)
4. ✅ Review filter logic (pending/accepted/rejected)
5. ✅ Check console errors (both browser and server)
6. ✅ Verify currentUser is populated (backend logs)
