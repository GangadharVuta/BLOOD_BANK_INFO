# Blood Requests Investigation - Complete Documentation Index

**Investigation Date**: April 7, 2026  
**Issue**: Blood requests not appearing on dashboard and "My Requests" page after submission

---

## 📚 Documents Created

### 1. **BLOOD_REQUESTS_SUMMARY.md** ⭐ START HERE
- Executive summary of the entire system
- Three main data flows with diagrams
- Request record structure
- Key checkpoints for debugging
- Error message decoder
- **Read this first for quick understanding**

### 2. **BLOOD_REQUESTS_INVESTIGATION.md** 🔬 COMPLETE ANALYSIS
- Comprehensive architecture analysis
- Detailed component breakdowns (frontend & backend)
- Complete API endpoint documentation
- Data flow diagrams
- MongoDB schema structure
- Troubleshooting checklist
- Common issues & solutions

### 3. **BLOOD_REQUESTS_QUICK_REFERENCE.md** ⚡ QUICK LOOKUP
- File location lookup table
- API endpoints at a glance
- Request schema fields
- Frontend API calls reference
- Filtering logic table
- Debugging commands (cURL, MongoDB, browser)
- Status codes reference

### 4. **BLOOD_REQUESTS_DEBUG_GUIDE.md** 🐛 HANDS-ON DEBUGGING
- Step-by-step test procedures
- Debug code sections with console.logs
- Code snippets to add to components
- Issue-specific fixes
- Monitoring scripts
- Complete debugging procedure
- Report template for collecting findings

---

## 🎯 How to Use This Documentation

### Scenario 1: "I want to understand the system"
1. Read → **BLOOD_REQUESTS_SUMMARY.md**
2. Reference → **BLOOD_REQUESTS_QUICK_REFERENCE.md**
3. Deep dive → **BLOOD_REQUESTS_INVESTIGATION.md**

### Scenario 2: "I need to debug this NOW"
1. Start → **BLOOD_REQUESTS_SUMMARY.md** (3 checkpoints section)
2. Follow → **BLOOD_REQUESTS_DEBUG_GUIDE.md** (Step-by-step)
3. Reference → **BLOOD_REQUESTS_QUICK_REFERENCE.md** (for commands)

### Scenario 3: "I need to check a specific endpoint"
1. Go to → **BLOOD_REQUESTS_QUICK_REFERENCE.md**
2. Find endpoint in API section
3. Reference → **BLOOD_REQUESTS_INVESTIGATION.md** for detailed logic

### Scenario 4: "Something's not working"
1. Check → **BLOOD_REQUESTS_SUMMARY.md** (Error message decoder)
2. Find issue → **BLOOD_REQUESTS_INVESTIGATION.md** (Common issues table)
3. Fix it → **BLOOD_REQUESTS_DEBUG_GUIDE.md** (Solutions section)

---

## 🔑 Key Findings Summary

### Three Distinct Data Flows

#### Flow 1: Dashboard (Requests SENT by user)
- **Frontend**: [blood-bank-react/src/components/dashboard/dashboard.js](blood-bank-react/src/components/dashboard/dashboard.js)
- **API**: POST `/api/requests/getDonorsListForRequests`
- **Query**: `requestedBy == currentUser`
- **What it shows**: Donors you requested blood from

#### Flow 2: My Requests (Requests RECEIVED by user)
- **Frontend**: [blood-bank-react/src/components/donorRequests/DonorRequests.js](blood-bank-react/src/components/donorRequests/DonorRequests.js)
- **API**: GET `/api/requests/donor/received`
- **Query**: `donorId == currentUser`
- **What it shows**: Blood requests from other users to you

#### Flow 3: Request Submission
- **Frontend**: [blood-bank-react/src/components/requestForm/requestForm.js](blood-bank-react/src/components/requestForm/requestForm.js)
- **API**: POST `/api/requests/requestDonors`
- **What it does**: Creates N records (one per selected donor)

### Backend Implementation
- **Schema**: [blood-bank-node/app/modules/Request/Schema.js](blood-bank-node/app/modules/Request/Schema.js)
- **Routes**: [blood-bank-node/app/modules/Request/Routes.js](blood-bank-node/app/modules/Request/Routes.js)
- **Controller**: [blood-bank-node/app/modules/Request/Controller.js](blood-bank-node/app/modules/Request/Controller.js)

---

## 🚨 Critical Issues to Check

| Issue | Check | Solution |
|-------|-------|----------|
| No requests on Dashboard | MongoDB has records? | Check `requestedBy` field matches currentUser |
| No requests on My Requests | MongoDB has records with your donorId? | Verify you were selected as donor |
| API returns status: 0 | Check error message | See error decoder in SUMMARY.md |
| Form won't submit | All fields filled? | Check DevTools → Network for errors |
| 401 Unauthorized | Token in localStorage? | Log out and log back in |

---

## ✅ Three-Point Debugging Checklist

```
CHECKPOINT 1: Is it saved?
├─ MongoDB query: db.requests.find({requestedBy: ObjectId("your_id")})
├─ ✅ Records found → Proceed to Checkpoint 2
└─ ❌ No records → Issue in requestDonors() or currentUser

CHECKPOINT 2: Do APIs work?
├─ Check Network tab responses
├─ ✅ status: 1 → Proceed to Checkpoint 3
└─ ❌ status: 0 → Check error message & backend

CHECKPOINT 3: Is UI showing?
├─ Check if table/cards display data
├─ ✅ Data visible → FIXED! ✨
└─ ❌ No display → Frontend render/filter issue
```

---

## 📋 File Cross-Reference

When you need information about a specific file:

### Frontend Components
| File | In Document | Key Lines |
|------|------------|-----------|
| dashboard.js | INVESTIGATION.md | Lines 58-75, 94-114, 129, 255, 280 |
| DonorRequests.js | INVESTIGATION.md | Lines 21-66, 48-53, 179-230 |
| requestForm.js | INVESTIGATION.md | Lines 15-21, 36-72 |

### Backend Files
| File | In Document | Key Methods |
|------|------------|------------|
| Schema.js | INVESTIGATION.md | Field definitions |
| Routes.js | INVESTIGATION.md | Endpoint routing |
| Controller.js | INVESTIGATION.md | Lines 78-158, 253-330, 439-489 |

---

## 🔍 Investigation Results

### ✅ What We Found

1. **Request Storage**
   - Requests are stored in MongoDB `requests` collection
   - Each selected donor creates 1 record
   - Fields: requestedBy, donorId, bloodGroup, address, pincode, requestId

2. **Request Retrieval**
   - Dashboard query: `requestedBy == currentUser`
   - MyRequests query: `donorId == currentUser`
   - Status filters applied correctly

3. **Data Model**
   - Schema properly defined with timestamps
   - Default values for flags: false (not accepted/rejected)
   - Soft delete via `isDeleted` flag

### ❓ To Be Verified

1. **Is currentUser properly populated?**
   - Check backend logs in requestDonors()
   - Verify authentication middleware

2. **Are requests actually being saved?**
   - Run: `db.requests.countDocuments({})`
   - Should be > 0 after submission

3. **Are MongoDB joins working?**
   - Check aggregation pipeline in getDonorsListForRequests()
   - Verify $lookup on users/donors collections

---

## 🛠️ Debugging Tools & Commands

### Browser Console
```javascript
// Check token
localStorage.getItem('token')

// Test API directly
fetch('http://localhost:4000/api/requests/getDonorsListForRequests', {
  method: 'POST',
  headers: {
    'Authorization': localStorage.getItem('token'),
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({status: 'pending'})
}).then(r => r.json()).then(console.log)
```

### MongoDB Shell
```javascript
// Count all requests
db.requests.countDocuments({})

// Find sent requests
db.requests.find({requestedBy: ObjectId("USER_ID")}).pretty()

// Find received requests
db.requests.find({donorId: ObjectId("USER_ID")}).pretty()
```

### cURL (Terminal)
```bash
# Test POST endpoint
curl -X POST http://localhost:4000/api/requests/getDonorsListForRequests \
  -H "Authorization: TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"pending"}'

# Test GET endpoint
curl -X GET http://localhost:4000/api/requests/donor/received \
  -H "Authorization: TOKEN"
```

---

## 📞 Support Flow

### If you get stuck:

1. **Check the error** → BLOOD_REQUESTS_SUMMARY.md error decoder
2. **Find similar issue** → BLOOD_REQUESTS_INVESTIGATION.md common issues
3. **Debug it** → BLOOD_REQUESTS_DEBUG_GUIDE.md procedures
4. **Quick lookup** → BLOOD_REQUESTS_QUICK_REFERENCE.md for commands

---

## 🎓 What The System Does

### Complete User Journey

```
Alice (Patient) wants blood
  │
  ├─ Selects Bob & Charlie (donors) on RequestBloodPage
  ├─ Fills: "O+", "City Hospital", "533435"
  ├─ Submits RequestForm
  │   └─ POST /api/requests/requestDonors
  │       └─ Creates 2 records in MongoDB:
  │           ├─ {requestedBy: Alice, donorId: Bob, ...}
  │           └─ {requestedBy: Alice, donorId: Charlie, ...}
  │
  ├─ Redirected to Dashboard
  │   └─ Calls getDonorsListForRequests
  │       └─ Shows: Bob, Charlie in "Pending" tab
  │
  └─ Both Bob & Charlie receive WhatsApp:
      "Blood donation needed. Accept or Reject?"
      
Bob (Donor) sees request
  │
  ├─ Logs in
  ├─ Navigates to "My Requests"
  │   └─ Calls GET /api/requests/donor/received
  │       └─ Shows: Alice's request for O+
  │
  └─ Clicks "Accept"
      └─ Updates record: isAcceptedByUser: true
      
Alice checks Dashboard later
  │
  └─ Refreshes Dashboard
      └─ Bob appears in "Accepted" tab ✓
```

---

## 📊 Request Status Lifecycle

```
CREATED (Pending)
  isAcceptedByUser: false
  isRejectedByUser: false
  isDeleted: false
      ↓
      ├─ Donor accepts → ACCEPTED
      │  isAcceptedByUser: true
      │
      ├─ Donor rejects → REJECTED
      │  isRejectedByUser: true
      │
      └─ Requester cancels → CANCELLED
         isDeleted: true
```

---

## 🎯 Resolution Steps

### For Users
1. Verify you're logged in (check token in DevTools)
2. Try submitting a request again
3. Check Dashboard immediately after
4. Ask a colleague to check their "My Requests"
5. Look for browser console errors (F12)

### For Developers
1. Add debug logs from DEBUG_GUIDE.md
2. Restart backend service
3. Perform full test cycle
4. Collect all console & server logs
5. Check MongoDB directly
6. Verify authentication middleware

### For DevOps
1. Verify MongoDB is running and connected
2. Check Node.js backend is running on correct port
3. Verify React build is serving from correct URL
4. Check firewall/network for API accessibility
5. Review server logs for exceptions

---

## 📈 Next Steps

### Immediate (5 min)
- [ ] Read BLOOD_REQUESTS_SUMMARY.md
- [ ] Identify which checkpoint fails

### Short-term (30 min)
- [ ] Apply debug logs from DEBUG_GUIDE.md
- [ ] Run test submission
- [ ] Collect all logs

### Medium-term (1-2 hours)
- [ ] Verify MongoDB data
- [ ] Check API responses
- [ ] Fix identified issue
- [ ] Verify fix works

### Long-term (ongoing)
- [ ] Add unit tests for endpoints
- [ ] Add integration tests for flows
- [ ] Improve error messages
- [ ] Add observability/monitoring

---

## 📞 Key Contacts in Code

**Questions about request storage?**
→ See [blood-bank-node/app/modules/Request/Controller.js](blood-bank-node/app/modules/Request/Controller.js) requestDonors() method

**Questions about displaying sent requests?**
→ See [blood-bank-react/src/components/dashboard/dashboard.js](blood-bank-react/src/components/dashboard/dashboard.js) fetchDonor() method

**Questions about displaying received requests?**
→ See [blood-bank-react/src/components/donorRequests/DonorRequests.js](blood-bank-react/src/components/donorRequests/DonorRequests.js) fetchDonorRequests() method

**Questions about schema?**
→ See [blood-bank-node/app/modules/Request/Schema.js](blood-bank-node/app/modules/Request/Schema.js)

**Questions about API routes?**
→ See [blood-bank-node/app/modules/Request/Routes.js](blood-bank-node/app/modules/Request/Routes.js)

---

## ✨ Summary

The blood request system consists of:

- **2 User Perspectives**: Dashboard (sent) & My Requests (received)
- **3 Main API Endpoints**: Submit, Fetch sent, Fetch received
- **1 Data Model**: Request schema with requestedBy & donorId
- **Multiple Documents**: For full understanding, debugging, and quick reference

**Start with BLOOD_REQUESTS_SUMMARY.md, then choose your next document based on your need!** 🚀
