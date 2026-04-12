# Blood Requests System - Visual Architecture

## System Overview Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    BLOOD REQUEST SYSTEM ARCHITECTURE                 │
└─────────────────────────────────────────────────────────────────────┘

                        ┌─────────────────────┐
                        │   React Frontend    │
                        │    (Port 3000)      │
                        └─────────────────────┘
                                 │
                ┌────────────────┼────────────────┐
                │                │                │
        ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
        │  Dashboard   │  │  DonorRequests   │  │ RequestForm  │
        │  (Sent Reqs) │  │ (Received Reqs)  │  │  (Submit)    │
        └──────┬───────┘  └────────┬────────┘  └──────┬───────┘
               │                   │                   │
        ┌──────▼──────────────────▼───────────────────▼────────┐
        │         API Calls (Axios)                            │
        │  POST /getDonorsListForRequests  (Dashboard)         │
        │  GET  /donor/received            (DonorRequests)     │
        │  POST /requestDonors             (RequestForm)       │
        └──────┬───────────────────────────────────────────────┘
               │
        ┌──────▼────────────────────────┐
        │   Node.js Backend             │
        │   (Port 4000)                 │
        │   Request Controller Methods: │
        │  · requestDonors()            │
        │  · getDonorsListForRequests() │
        │  · getDonorReceivedRequests() │
        └──────┬────────────────────────┘
               │
        ┌──────▼────────────────┐
        │   MongoDB Database    │
        │   requests collection │
        │   users collection    │
        │   donors collection   │
        └───────────────────────┘
```

---

## Request Submission Flow

```
┌──────────────────────┐
│  User A (Patient)    │
│  Needs Blood         │
└──────────┬───────────┘
           │
           │ (1) Visit RequestBloodPage
           │
           ▼
┌──────────────────────────────────────┐
│  RequestBloodPage                    │
│  - Display all donors                │
│  - Allow multi-select                │
│  - Filter by blood group, location   │
└──────────┬───────────────────────────┘
           │
           │ (2) User A selects: Bob, Charlie (2 donors)
           │
           ▼
┌──────────────────────────────────────┐
│  RequestForm                         │
│  - Show selected donors              │
│  - Ask for blood group               │
│  - Ask for address/pincode           │
└──────────┬───────────────────────────┘
           │
           │ (3) Fill form & Submit
           │     {userIds: [Bob, Charlie],
           │      bloodGroup: 'O+',
           │      address: 'City Hospital',
           │      pincode: '533435'}
           │
           ▼
┌──────────────────────────────────────────────────┐
│  POST /api/requests/requestDonors                │
│  Controller: requestDonors()                     │
│                                                  │
│  Validation:                                     │
│  ✓ Check all fields present                     │
│  ✓ Get currentUser from token                   │
│                                                  │
│  For each donor in userIds:                      │
│    Create Record 1: {                           │
│      requestedBy: User_A_ID,                    │
│      donorId: Bob_ID,                           │
│      bloodGroup: 'O+',                          │
│      address: 'City Hospital',                  │
│      pincode: '533435',                         │
│      requestId: 'BCREQ0',                       │
│      isAcceptedByUser: false,                   │
│      isRejectedByUser: false,                   │
│      isDeleted: false                           │
│    }                                             │
│                                                  │
│    Create Record 2: {                           │
│      requestedBy: User_A_ID,                    │
│      donorId: Charlie_ID,                       │
│      ... (same fields)...                       │
│      requestId: 'BCREQ0'                        │
│    }                                             │
│                                                  │
│  Save to MongoDB → 2 records created ✓         │
│  Send WhatsApp notifications to Bob & Charlie   │
│                                                  │
│  Response: { status: 1,                         │
│             message: "Request sent successfully" }
└──────────┬────────────────────────────────────────┘
           │
           │ (4) Redirect to Dashboard
           │
           ▼
        ✅ SUCCESS
```

---

## Dashboard View - User A's Perspective

```
┌────────────────────────────────────────┐
│  Dashboard → "My Requests"             │
│  (Requests I SENT to donors)           │
└────────────┬─────────────────────────┘
             │
             │ Component mounts
             │ Call: fetchDonor('pending')
             │
             ▼
┌────────────────────────────────────────┐
│ POST /api/requests/getDonorsListForRequests
│ Body: { status: 'pending' }            │
│ Headers: Authorization: User_A_TOKEN   │
└────────────┬─────────────────────────┘
             │
             │ Controller: getDonorsListForRequests()
             │ Query MongoDB:
             │  { requestedBy: User_A_ID,
             │    isAcceptedByUser: false,
             │    isRejectedByUser: false,
             │    isDeleted: false }
             │
             ▼
┌────────────────────────────────────────┐
│  MongoDB Query Results                 │
│                                        │
│  Find 2 request records:               │
│  1. {requestedBy: A, donorId: B, ...}  │
│  2. {requestedBy: A, donorId: C, ...}  │
│                                        │
│  Join with Users collection:           │
│  Get Bob's details, Charlie's details  │
└────────────┬─────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│ API Response:                          │
│ {                                      │
│   status: 1,                           │
│   data: [                              │
│     {                                  │
│       requestId: "BCREQ0",             │
│       userId: Bob_ID,                  │
│       userName: "Bob",                 │
│       phoneNumber: "9876543210",       │
│       pincode: "533435",               │
│       bloodGroup: "O+"                 │
│     },                                 │
│     {                                  │
│       requestId: "BCREQ0",             │
│       userId: Charlie_ID,              │
│       userName: "Charlie",             │
│       phoneNumber: "9876543211",       │
│       pincode: "533435",               │
│       bloodGroup: "O+"                 │
│     }                                  │
│   ]                                    │
│ }                                      │
└────────────┬─────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│  Frontend renders Table:               │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ #  │ Name    │ Blood │ Pincode  │  │
│  ├────┼─────────┼───────┼──────────┤  │
│  │ 1  │ Bob     │ O+    │ 533435   │  │
│  │ 2  │ Charlie │ O+    │ 533435   │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ✅ User A sees their sent requests    │
└────────────────────────────────────────┘
```

---

## "My Requests" View - Donor's Perspective (Bob)

```
┌────────────────────────────────────────┐
│  My Requests / DonorRequests           │
│  (Requests SENT TO ME)                 │
└────────────┬─────────────────────────┘
             │
             │ Component mounts
             │ Call: fetchDonorRequests()
             │
             ▼
┌────────────────────────────────────────┐
│ GET /api/requests/donor/received       │
│ Headers: Authorization: Bob_TOKEN      │
└────────────┬─────────────────────────┘
             │
             │ Controller: getDonorReceivedRequests()
             │ Query MongoDB:
             │  { donorId: Bob_ID,
             │    isDeleted: false }
             │
             ▼
┌────────────────────────────────────────────┐
│  MongoDB Query Results                     │
│                                            │
│  Find 1 request record:                    │
│  {requestedBy: A, donorId: Bob_ID, ...}    │
│                                            │
│  Join with Users collection:               │
│  Get User A's details (requester info)     │
└────────────┬──────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│ API Response:                              │
│ {                                          │
│   status: 1,                               │
│   data: [                                  │
│     {                                      │
│       _id: "record_id",                    │
│       requestId: "BCREQ0",                 │
│       bloodGroup: "O+",                    │
│       address: "City Hospital",            │
│       pincode: "533435",                   │
│       isAcceptedByUser: false,             │
│       isRejectedByUser: false,             │
│       requesterName: "User A",             │
│       requesterPhone: "9876543200"         │
│     }                                      │
│   ]                                        │
│ }                                          │
└────────────┬──────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│  Frontend renders Cards:               │
│                                        │
│  ┌─────────────────────────────────┐   │
│  │ 🩸 Blood Request                │   │
│  ├─────────────────────────────────┤   │
│  │ From: User A                    │   │
│  │ Blood Group: O+                 │   │
│  │ Location: City Hospital         │   │
│  │ Pincode: 533435                 │   │
│  │ Contact: 9876543200             │   │
│  │ Status: ⏳ Pending              │   │
│  │                                 │   │
│  │ [✓ Accept]  [✗ Reject]         │   │
│  └─────────────────────────────────┘   │
│                                        │
│  ✅ Bob sees blood requests to him    │
└────────────────────────────────────────┘
```

---

## Data State Transitions

```
REQUEST LIFECYCLE
═════════════════════════════════════════════════════════════════

Created
├─ isAcceptedByUser: ❌ false
├─ isRejectedByUser: ❌ false
├─ isDeleted: ❌ false
│
├─────────────────────────────────────────────────────────────┐
│                                                             │
▼                        ▼                        ▼          ▼
PENDING              ACCEPTED             REJECTED       CANCELLED
(Awaiting)           (Donor Said Yes)     (Donor Said No) (Requester Cancel)
├─ Accepted: ❌     ├─ Accepted: ✅      ├─ Accepted: ❌  ├─ Deleted: ✅
├─ Rejected: ❌      ├─ Rejected: ❌      ├─ Rejected: ✅  ├─ Accepted: ❌
├─ Deleted: ❌      ├─ Deleted: ❌      ├─ Deleted: ❌    ├─ Rejected: ❌
│                    │                   │                 │
▼                    ▼                   ▼                 ▼
NOT showing          Showing in        Showing in     Not showing
anywhere            "Accepted" tab    "Rejected" tab  (soft deleted)

Dashboard shows:     ✓                 [Cancel Button] ✓
My Requests shows:   ✓                 ✓               [Restore?]
```

---

## Database Schema Visualization

```
┌─────────────────────────────────────────────────────────────────┐
│                    REQUESTS COLLECTION                          │
└─────────────────────────────────────────────────────────────────┘

Document Example:
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  
  ┌─ WHO ─────────────────────────────────────────────────────┐
  │ requestedBy: ObjectId("66f7a..."),  [User A - Patient]    │
  │ donorId: ObjectId("66f7b..."),      [User B - Donor]      │
  └────────────────────────────────────────────────────────────┘
  
  ┌─ WHAT ────────────────────────────────────────────────────┐
  │ bloodGroup: "O+",                                          │
  │ address: "City Hospital, Main Street",                     │
  │ pincode: "533435",                                         │
  └────────────────────────────────────────────────────────────┘
  
  ┌─ TRACKING ────────────────────────────────────────────────┐
  │ requestId: "BCREQ0",           [Group identifier]         │
  │ isAcceptedByUser: false,       [Donor response]           │
  │ isRejectedByUser: false,       [Donor response]           │
  │ isDeleted: false,              [Soft delete flag]         │
  └────────────────────────────────────────────────────────────┘
  
  ┌─ TIMESTAMPS (Auto) ────────────────────────────────────────┐
  │ createdAt: ISODate("2026-04-07T10:30:00Z"),                │
  │ updatedAt: ISODate("2026-04-07T10:30:00Z")                 │
  └────────────────────────────────────────────────────────────┘
}

Multiple documents per submission:
  If A selects 5 donors → 5 request records created
  All have same requestId ("BCREQ0")
  Each has different donorId
```

---

## Filter Logic Flowchart

```
┌─────────────────────┐
│  Frontend Component │
└──────────┬──────────┘
           │

┌──────────▼─────────────────┐
│  Which View?               │
└──────────┬──────────────────┘
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼

DASHBOARD        MY REQUESTS
    │                │
    │ Query:         │ Query:
    │                │
    ▼                ▼

requestedBy      donorId
== currentUser   == currentUser
    │                │
    ▼                ▼

Apply Filter:    Only use:
┌─────┬─────┬──────┐    isAcceptedByUser
│Pend │Acce │ Rej │    isRejectedByUser
├─────┼─────┼──────┤    (isDeleted: false)
│P: ❌│A: ✅│R: ✅│
│acc  │acc  │rej  │
├─────┼─────┼──────┤
│P: ❌│A: ❌│R: ❌│
│rej  │rej  │del  │
└─────┴─────┴──────┘
    │
    ▼

Display Results

DASHBOARD          MY REQUESTS
Shows:             Shows:
- Bob (Pending)    - Request from Alice
- Charlie (Pend.)  - Status: Pending
                   - [Accept] [Reject]
```

---

## Error Paths

```
┌──────────────────────────┐
│ Form Submission          │
└──────────┬───────────────┘
           │
    ┌──────▼──────┐
    │ Validation? │
    └──────┬──────┘
           │
    ┌──────▼──────────────────────────┐
    │ Missing fields?                 │
    │ (userIds, bloodGroup, etc)      │
    └──────┬──────────────┬────────────┘
           │ YES          │ NO
           ▼              ▼
        ❌ FAIL    ┌──────────────────┐
         Error:    │ Authentication?  │
         "Please   └──────┬───────────┘
         send      │
         proper    ├──NO──▼
         data"     │   ❌ FAIL
                   │   Error: "User not
                   │   authenticated"
                   │
                   ├──YES─▼
                   │    ┌─────────────────┐
                   │    │ Save to MongoDB │
                   │    └─────┬───────────┘
                              │
                         ┌────▼─────┐
                         │ Success? │
                         └────┬─────┘
                              │
                    ┌─────────┴──────────┐
                    │ YES               │ NO
                    ▼                   ▼
                   ✅ SUCCESS           ❌ FAIL
                   Return:             Database
                   status: 1           Error
```

---

## Multi-User Interaction Diagram

```
Alice (Requester)              Bob (Donor)              Charlie (Donor)
       │                            │                          │
       │ 1. Submit request          │                          │
       │    (selects Bob & Charlie) │                          │
       │                            │                          │
       ▼                            │                          │
    Form Submit ─────────────────────┼─────────────────────────┼──►
       │                            │                          │
       │                ┌───────────┴──────┬──────────────────┐
       │                │                  │                  │
       │        Create 2 Records:          │                  │
       │        Record1: A→B               │                  │
       │        Record2: A→C               │                  │
       │                │                  │                  │
       ▼                ▼                  ▼                  ▼
   Dashboard      My Requests         My Requests        (Should see
   Shows:         Shows:              Shows:             request in
   - Bob          Request from A      Request from A     own view)
   - Charlie        Status: Pending      Status: Pending  (won't, since
                    [Accept]             [Accept]        they're not
                    [Reject]             [Reject]        donors to them)
       │                │                  │
       │ 2. Bob accepts │                  │
       │◄───────────────┤                  │
       │                │                  │
       └────────┬────────┘                  │
           Dashboard                       │
           Updates: Bob                    │
           Status → Accepted               │
                ▼                          ▼
           My Requests          My Requests
           Record1:             Record2:
           Accepted ✓           Pending (unchanged)


Result: Alice sees 1 Accepted, 1 Pending
        Bob: Request now marked as Accepted
        Charlie: Request still Pending
```

---

## Status Code Reference

```
┌─────────────────────────────────────────────────────────┐
│           API RESPONSE STATUS CODES                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ✅ status: 1 = SUCCESS                               │
│     Data returned successfully                        │
│     data: [array of records]                          │
│                                                         │
│  ❌ status: 0 = ERROR                                 │
│     Something went wrong                              │
│     message: "Description of error"                   │
│                                                         │
│  🚫 HTTP 401 = UNAUTHORIZED                           │
│     Token missing or invalid                          │
│     Token expired - need to login again               │
│                                                         │
│  🚫 HTTP 500 = SERVER ERROR                           │
│     Backend exception or crash                        │
│     Check server logs for details                     │
│                                                         │
│  🚫 HTTP 400 = BAD REQUEST                            │
│     Invalid parameters                                │
│     Check request format/fields                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## MongoDB Query Cheatsheet

```
┌────────────────────────────────────────────────────────────┐
│  HELPFUL MONGODB QUERIES FOR DEBUGGING                    │
└────────────────────────────────────────────────────────────┘

Use database:
  use blood_bank_db

Count all requests:
  db.requests.countDocuments({})

Find all requests:
  db.requests.find({}).pretty()

Find requests I SENT:
  db.requests.find({requestedBy: ObjectId("YOUR_USER_ID")})

Find requests sent TO ME:
  db.requests.find({donorId: ObjectId("YOUR_USER_ID")})

Find pending requests I sent:
  db.requests.find({
    requestedBy: ObjectId("YOUR_ID"),
    isAcceptedByUser: false,
    isRejectedByUser: false,
    isDeleted: false
  })

Find accepted requests I sent:
  db.requests.find({
    requestedBy: ObjectId("YOUR_ID"),
    isAcceptedByUser: true
  })

Find latest requests:
  db.requests.find({}).sort({_id: -1}).limit(5)

Delete all requests (⚠️ DANGEROUS):
  db.requests.deleteMany({})

Count by status:
  db.requests.countDocuments({isAcceptedByUser: true})
  db.requests.countDocuments({isRejectedByUser: true})
  db.requests.countDocuments({isDeleted: true})
```

---

## Component Dependency Map

```
App.js
├─ MainLayout.js (Navbar & Sidebar)
│  └─ Navigation Links
│     ├─ Dashboard
│     ├─ My Requests
│     ├─ Request Blood
│     └─ Give Feedback
│
├─ Routes:
│  ├─ /dashboard
│  │  └─ Dashboard.js
│  │     ├─ fetchDonor()
│  │     ├─ POST /api/requests/getDonorsListForRequests
│  │     └─ Display table of sent requests
│  │
│  ├─ /my-requests
│  │  └─ DonorRequests.js
│  │     ├─ fetchDonorRequests()
│  │     ├─ GET /api/requests/donor/received
│  │     └─ Display cards of received requests
│  │
│  ├─ /request-blood
│  │  └─ RequestBloodPage.js
│  │     ├─ fetchMergedDonors()
│  │     └─ Navigate to RequestForm with selected donors
│  │
│  └─ /blood-request
│     └─ RequestForm.js
│        ├─ handleSubmit()
│        ├─ POST /api/requests/requestDonors
│        └─ Redirect to /dashboard on success
```

---

Use these diagrams alongside the detailed documentation for better understanding! 🎯
