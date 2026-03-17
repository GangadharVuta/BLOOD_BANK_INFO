# Donor Card Quick Reference

## Key Changes Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Visible Info** | Name, Phone, Pincode | Blood Group, City, Village, Availability |
| **Action** | Call button | Chat button |
| **Contact Method** | Direct phone call | Real-time Socket.io chat |
| **Privacy** | Low | High |
| **Location Field** | Single: pincode | Three: city, village, pincode (optional) |

---

## Component Quick Lookup

### DonorCard.js
**Purpose:** Main donor display card  
**Location:** `blood-bank-react/src/components/requestBlood/DonorCard.js`  
**Size:** 338 lines  
**Key Props:** `donor`, `isSelected`, `onSelect`, `currentUserId`, `requestId`  
**Shows:** Blood group circle, location, availability, chat button, select button  
**Hides:** Name, phone number, full address  

### ChatModal.js
**Purpose:** Modal wrapper for chat  
**Location:** `blood-bank-react/src/components/requestBlood/ChatModal.js`  
**Size:** 49 lines  
**Embeds:** Chat component inside modal overlay  
**Features:** Header with blood group & location, close button, responsive  

### RequestBloodPage.js
**Purpose:** Main page controller  
**Location:** `blood-bank-react/src/components/requestBlood/RequestBloodPage.js`  
**Changes:** Uses DonorCard component, updated location filtering  
**Features:** Donor selection, filtering, bulk requests  

### Donor Schema
**Purpose:** MongoDB data model  
**Location:** `blood-bank-node/app/modules/Donor/Schema.js`  
**New Fields:** `city`, `village`, `availability`, `donorType`, `userId`  
**Indexes:** bloodGroup+city+village, addedBy  
**Backward Compatible:** Yes (pincode still supported)  

---

## API Endpoints

### Add Donor
```
POST /api/donors/add
{
  "name": "John",
  "bloodGroup": "O+",
  "phone": "9876543210",
  "city": "Hyderabad",        // NEW
  "village": "Kirlampudi",    // NEW
  "pincode": "533435",        // Optional
  "lastDonationDate": "2024-02-15",
  "availability": "Available" // NEW
}
```

### Get Donors
```
GET /api/donors/merged/all
Response: {
  status: 1,
  data: [
    { _id, name, bloodGroup, phone, city, village, pincode, availability, donorType }
  ]
}
```

### Chat Send
```
Socket: socket.emit('send_message', {
  senderId, receiverId, requestId, message
})
```

---

## Database Schema Quick View

#### Donor (Updated)
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  name: String,              // Hidden on card
  bloodGroup: String,        // Displayed
  phone: String,             // Hidden on card
  city: String,              // Displayed
  village: String,           // Displayed
  pincode: String,           // Optional
  availability: String,      // Displayed
  donorType: String,         // registered/manual
  lastDonationDate: Date,
  addedBy: ObjectId,
  isDeleted: Boolean
}
```

#### Message (Existing)
```javascript
{
  _id: ObjectId,
  senderId: ObjectId,
  receiverId: ObjectId,
  requestId: ObjectId,
  message: String,
  isRead: Boolean,
  createdAt: Timestamp
}
```

---

## File Tree

```
Backend:
✅ blood-bank-node/app/modules/
   ├── Donor/
   │  ├── Schema.js (UPDATED)
   │  └── Controller.js (UPDATED)
   └── Chat/ (EXISTING)

Frontend:
✅ blood-bank-react/src/components/
   ├── requestBlood/
   │  ├── RequestBloodPage.js (UPDATED)
   │  ├── DonorCard.js (NEW)
   │  ├── DonorCard.css (NEW)
   │  ├── ChatModal.js (NEW)
   │  └── ChatModal.css (NEW)
   └── chat/ (EXISTING)
```

---

## Startup Checklist

### Backend
- [ ] `npm install` in blood-bank-node
- [ ] Verify MongoDB connection
- [ ] `npm start` (should see Socket.io ready)
- [ ] Check port 5000

### Frontend
- [ ] `npm install` in blood-bank-react
- [ ] Verify socket.io-client installed
- [ ] `npm start` (should see React on 3000)
- [ ] Check API connection

### Database
- [ ] Donor collection has city/village in schema
- [ ] Existing donors backfilled with city/village
- [ ] Chat collection exists
- [ ] Indexes created

---

## Common Tasks

### Test Donor Card Display
```javascript
// In React console
import DonorCard from './components/requestBlood/DonorCard';

// Check if renders without errors
<DonorCard 
  donor={{ 
    _id: '1', 
    bloodGroup: 'O+', 
    city: 'Hyd', 
    village: 'Village',
    availability: 'Available',
    donorType: 'manual'
  }}
  isSelected={false}
  onSelect={() => {}}
/>
```

### Check Socket.io Connection
```javascript
// In browser console
socketClient.getConnectionStatus()
// Output: { isConnected: true, socketId: "..." }
```

### Update Single Donor
```javascript
// MongoDB shell
db.donors.updateOne(
  { _id: ObjectId("...") },
  { $set: { city: "Hyderabad", village: "Kirlampudi" } }
)
```

### Enable Dark Mode
```css
/* Default with prefers-color-scheme */
@media (prefers-color-scheme: dark) {
  .donor-card { background: #2d2d2d; }
  /* More dark styles... */
}
```

---

## Styling Classes

### DonorCard
```css
.donor-card               /* Main container */
.donor-selection-overlay  /* Checkbox overlay */
.blood-group-circle       /* Large blood group display */
.location-badge           /* City/village location */
.availability-status      /* Status with color */
.privacy-notice           /* Privacy text */
.donor-type-badge         /* Registered/Manual badge */
.card-actions             /* Buttons row */
```

### ChatModal
```css
.chat-modal-overlay       /* Full screen backdrop */
.chat-modal-content       /* Modal dialog box */
.modal-header            /* Header with blood group/location */
.modal-close-btn         /* Close button */
.modal-body              /* Chat component container */
```

---

## Privacy Checklist

- ✅ Name not rendered in DonorCard
- ✅ Phone not rendered in DonorCard
- ✅ Email not exposed in card
- ✅ Full address not shown in card
- ✅ Personal details only in chat
- ✅ Chat requires authentication
- ✅ Messages encrypted in transit
- ✅ Read receipts only between participants

---

## Responsive Breakpoints

```javascript
/* Mobile: 480px and below */
@media (max-width: 480px) {
  .donor-card { 
    flex: 100%;
    border-radius: 12px;
  }
}

/* Tablet: 481px - 768px */
@media (max-width: 768px) {
  .donor-card { 
    flex: calc(50% - 8px);
    border-radius: 14px;
  }
}

/* Desktop: 769px and above */
.donor-card { 
  flex: calc(33.333% - 10px);
  border-radius: 16px;
}
```

---

## Performance Tips

| Tip | Impact |
|-----|--------|
| Lazy load Chat component | Reduces initial load by ~50KB |
| Debounce filters 300ms | Smoother UX with less re-renders |
| Use virtual scroll for 100+ donors | Better performance on mobile |
| Optimize blood group SVG | Smaller file size |
| Memoize DonorCard component | Prevents unnecessary re-renders |

---

## Error Messages & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| Socket connection failed | Server not running | `npm start` in blood-bank-node |
| Undefined city/village | Schema not updated | Update Donor Schema in MongoDB |
| Chat modal blank | Chat component missing | Verify Chat.js exists |
| Cannot read isSelected | Props not passed | Check RequestBloodPage props |
| Empty donor list | No donors in DB | Add donors via API |

---

## Environment Variables

### Backend (.env)
```
MONGODB_URI=mongodb://localhost:27017/bloodbank
JWT_SECRET=your-secret-key
NODE_ENV=development
PORT=5000
```

### Frontend (.env.local)
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_ENV=development
```

---

## Code Examples

### Using DonorCard in Component
```jsx
import DonorCard from './DonorCard';

function MyComponent() {
  const [selectedDonors, setSelectedDonors] = useState([]);
  
  const handleSelect = (donorId) => {
    if (selectedDonors.includes(donorId)) {
      setSelectedDonors(prev => prev.filter(id => id !== donorId));
    } else {
      setSelectedDonors(prev => [...prev, donorId]);
    }
  };

  return (
    <DonorCard
      donor={donorData}
      isSelected={selectedDonors.includes(donorData._id)}
      onSelect={handleSelect}
      currentUserId={userId}
      requestId={requestId}
    />
  );
}
```

### Update Donor Location
```javascript
// Call this API when donor edits location
async function updateDonorLocation(donorId, city, village) {
  const response = await fetch(`/api/donors/${donorId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ city, village })
  });
  return response.json();
}
```

---

## Related Documentation

- **[DONOR_CARD_CHAT_GUIDE.md](DONOR_CARD_CHAT_GUIDE.md)** - Full detailed guide
- **[CHAT_SETUP_GUIDE.md](CHAT_SETUP_GUIDE.md)** - Chat system setup
- **[CHAT_INTEGRATION_GUIDE.md](CHAT_INTEGRATION_GUIDE.md)** - Chat integration
- **[ARCHITECTURE_fixed.md](ARCHITECTURE_fixed.md)** - System architecture
- **[BACKEND_STARTUP_GUIDE.md](BACKEND_STARTUP_GUIDE.md)** - Backend setup

---

## Support Contacts

- Backend Issues: Check blood-bank-node logs
- Frontend Issues: Check browser console
- Database Issues: Check MongoDB logs
- Real-Time Issues: Check Socket.io events in browser DevTools

---

**Last Updated:** March 11, 2026  
**Version:** 1.0 Production Ready
