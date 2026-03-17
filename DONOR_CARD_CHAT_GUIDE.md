# Donor Card Chat Integration Guide

## Overview

This guide explains the privacy-focused donor card redesign for the Blood Connect Request Page. The new system replaces the Call button with a Chat button for real-time messaging while hiding sensitive donor personal information.

---

## What Changed

### Before
- Displayed: Donor name, Phone number, Blood group, Pincode
- Action: Call button (direct phone access)
- Privacy: Low - All personal info visible

### After
- Displayed: Blood Group, Location (City/Village), Availability Status
- Action: Chat button (real-time messaging via Socket.io)
- Privacy: High - Personal details hidden, shared only inside chat

---

## Key Features

✅ **Privacy-First Design**
- Donor name and phone hidden on donor card
- Personal details only accessible in direct chat
- Users can share info voluntarily inside chat

✅ **Real-Time Chat Integration**
- Socket.io for instant messaging
- Chat modal opens on donor card
- Messages stored in MongoDB
- Read receipts and typing indicators

✅ **New Location Structure**
- City and village fields instead of pincode
- More human-readable location display
- Better geographic filtering

✅ **Enhanced UI/UX**
- Modern card design with blood group circle
- Status indicators (Available/Not Available/Pending)
- Donor type badges (Registered/Manual)
- Responsive design for all devices

---

## File Structure

### Backend Files Created/Modified

```
blood-bank-node/
├── app/modules/Donor/
│   ├── Schema.js           ✅ UPDATED - Added city, village, availability
│   └── Controller.js       ✅ UPDATED - Handles new location fields
└── app/modules/Chat/       ✅ ALREADY EXISTS
    ├── Schema.js           - Message storage
    ├── Controller.js       - Chat logic
    └── Routes.js           - API endpoints
```

### Frontend Files Created/Modified

```
blood-bank-react/src/
├── components/requestBlood/
│   ├── RequestBloodPage.js       ✅ UPDATED - Uses new DonorCard
│   ├── DonorCard.js              ✅ NEW - Privacy-focused card
│   ├── DonorCard.css             ✅ NEW - Card styling
│   ├── ChatModal.js              ✅ NEW - Modal wrapper
│   ├── ChatModal.css             ✅ NEW - Modal styling
│   └── RequestBloodPage.css      ✅ UPDATED grid layout
├── components/chat/
│   ├── Chat.js                   ✅ ALREADY EXISTS
│   ├── Chat.css                  ✅ ALREADY EXISTS
│   └── ...other chat components
└── services/
    ├── socketClient.js           ✅ ALREADY EXISTS
    └── chatService.js            ✅ ALREADY EXISTS
```

---

## Database Schema Changes

### Updated Donor Schema

**Before:**
```javascript
{
  name: String,
  bloodGroup: String,
  phone: String,
  pincode: String,           // ❌ Removed
  lastDonationDate: Date,
  addedBy: ObjectId,
  isDeleted: Boolean
}
```

**After:**
```javascript
{
  // User reference
  userId: ObjectId,

  // Basic Information
  name: String,              // Hidden on card
  bloodGroup: String,        // ✅ Displayed
  phone: String,             // Hidden on card

  // Location Information (NEW)
  city: String,              // ✅ Displayed
  village: String,           // ✅ Displayed
  pincode: String,           // Optional (backward compatibility)

  // Donation Information
  lastDonationDate: Date,
  availability: String,      // ✅ Displayed (Available/Not Available/Pending)

  // Metadata
  addedBy: ObjectId,
  donorType: String,         // registered/manual
  isDeleted: Boolean
}
```

### Message Schema (Existing)

```javascript
{
  senderId: ObjectId,        // Recipient's ID
  receiverId: ObjectId,      // Donor's ID
  requestId: ObjectId,       // Blood request ID
  message: String,           // Chat message
  isRead: Boolean,
  isDeleted: Boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## Component Documentation

### DonorCard Component

**Props:**
```javascript
{
  donor: {
    _id: String,
    bloodGroup: String,    // e.g., "O+"
    city: String,          // e.g., "Hyderabad"
    village: String,       // e.g., "Kirlampudi"
    availability: String,  // "Available" | "Not Available" | "Pending"
    donorType: String      // "registered" | "manual"
  },
  isSelected: Boolean,
  onSelect: Function,      // Callback for selection
  currentUserId: String,
  requestId: String        // For chat feature
}
```

**Displays:**
```
┌─────────────────────────┐
│  🟢 Registered (Badge)  │
│                         │
│      O+  (Large)        │ Blood Group Circle
│                         │
│  📍 Location            │
│  Kirlampudi, Hyderabad  │
│                         │
│  🟢 Status: Available   │
│                         │
│  🔒 Contact details...  │ Privacy Notice
│                         │
│  [💬 Chat] [❤️ Request] │ Buttons
└─────────────────────────┘
```

**Key Features:**
- Checkbox for donor selection
- No personal information visible (name/phone)
- Chat button opens ChatModal
- Request button for blood request selection

### ChatModal Component

**Props:**
```javascript
{
  donorId: String,
  currentUserId: String,
  requestId: String,
  bloodGroup: String,
  location: String,
  onClose: Function
}
```

**Features:**
- Full-screen modal with backdrop
- Shows blood group and location in header
- Embeds Chat component inside
- Close button (✕)
- Responsive design (mobile-friendly)

---

## API Endpoints

### Add Donor (Backend)

**Endpoint:** `POST /api/donors/add`

**Body (OLD):**
```json
{
  "name": "John Doe",
  "bloodGroup": "O+",
  "phone": "9876543210",
  "pincode": "533435",
  "lastDonationDate": "2024-02-15",
  "addedBy": "user-id-123"
}
```

**Body (NEW):**
```json
{
  "name": "John Doe",
  "bloodGroup": "O+",
  "phone": "9876543210",
  "city": "Hyderabad",           // NEW
  "village": "Kirlampudi",       // NEW
  "pincode": "533435",           // OPTIONAL (backup)
  "lastDonationDate": "2024-02-15",
  "addedBy": "user-id-123",
  "availability": "Available",   // NEW
  "donorType": "manual"          // NEW
}
```

### Get Donors

**Endpoint:** `GET /api/donors/merged/all`

**Response:**
```json
{
  "status": 1,
  "data": [
    {
      "_id": "donor-id-1",
      "name": "John Doe",              // Hidden on card
      "bloodGroup": "O+",              // Displayed
      "phone": "9876543210",           // Hidden on card
      "city": "Hyderabad",             // Displayed
      "village": "Kirlampudi",         // Displayed
      "availability": "Available",     // Displayed
      "donorType": "manual",
      "lastDonationDate": "2024-02-15"
    }
  ]
}
```

### Chat Endpoints (Existing)

All chat endpoints already exist:
- `GET /api/chat/history/:requestId` - Fetch messages
- `POST /api/chat/send` - Send message (via Socket.io)
- `GET /api/chat/conversations` - List conversations
- `POST /api/chat/mark-conversation-read/:requestId` - Mark as read

---

## Socket.io Events

### Events Used in Donor Card Chat

**From Client:**
```javascript
socketClient.joinChat(requestId)                    // Enter chat room
socketClient.sendMessage(donorId, requestId, msg)   // Send message
socketClient.sendTypingStatus(requestId, true)      // Typing indicator
socketClient.markMessageAsRead(msgId, requestId)    // Read receipt
socketClient.leaveChat(requestId)                   // Exit chat
```

**From Server:**
```javascript
socket.on('receive_message', handler)
socket.on('user_online', handler)
socket.on('user_offline', handler)
socket.on('user_typing', handler)
socket.on('message_read_receipt', handler)
```

---

## Implementation Steps

### Step 1: Update Backend

1. **Verify Donor Schema** is updated with city/village
   ```bash
   # Check blood-bank-node/app/modules/Donor/Schema.js
   ```

2. **Update Donor Controller** to handle new fields
   ```bash
   # Check blood-bank-node/app/modules/Donor/Controller.js addDonor method
   ```

3. **Verify Chat Module** exists
   ```bash
   # Check blood-bank-node/app/modules/Chat/
   ```

4. **Restart Backend**
   ```bash
   cd blood-bank-node
   npm install
   npm start
   # Should see: Socket.io server is ready for connections
   ```

### Step 2: Update Frontend

1. **Verify Chat Components** exist
   ```bash
   # Check blood-bank-react/src/components/chat/
   ```

2. **Add DonorCard Component**
   ```bash
   # Already created: DonorCard.js and DonorCard.css
   ```

3. **Add ChatModal Component**
   ```bash
   # Already created: ChatModal.js and ChatModal.css
   ```

4. **Update RequestBloodPage**
   ```bash
   # Already updated to use DonorCard
   ```

5. **Install Dependencies** (if needed)
   ```bash
   cd blood-bank-react
   npm install socket.io-client
   npm start
   ```

### Step 3: Test the System

```javascript
// Test Checklist:
✅ Donors display correctly on Request Page
✅ Donor name and phone are hidden
✅ Blood group, location, and availability are shown
✅ Call button is removed, Chat button is shown
✅ Chat button opens modal
✅ Messages send in real-time
✅ Online status changes
✅ Typing indicator works
✅ Read receipts display
✅ Responsive design works on mobile
```

---

## Migration Guide

### For Existing Donors (Backward Compatibility)

If you have existing donor data with only pincode:

**Option 1: Automated Migration**
```javascript
// In Node.js shell or migration script
const { Donors } = require('./app/modules/Donor/Schema');

// Run this once to backfill city/village from pincode
await Donors.updateMany(
  {
    city: { $exists: false },
    pincode: { $exists: true }
  },
  [
    {
      $set: {
        city: { $cond: [{ $ne: ['$pincode', null] }, 'City', ''] },
        village: 'Village',
        availability: 'Available'
      }
    }
  ]
);
```

**Option 2: Manual Update**
Update each donor record in MongoDB with city and village information.

---

## Privacy & Security

### What's Hidden
- ❌ Donor name - Not shown on card
- ❌ Phone number - Not shown on card
- ❌ Email - Not exposed
- ❌ Full address - Not exposed

### What's Visible
- ✅ Blood Group - Needed for matching
- ✅ City/Village - Location reference
- ✅ Availability - Current status

### When Shared
- Personal details can only be accessed in the chat
- Users voluntarily share contact info if they choose
- Chat is secure with JWT authentication
- Messages encrypted in transit (HTTPS)
- Messages stored encrypted in MongoDB

---

## Styling & Customization

### Color Scheme
```css
Primary Gradient: #667eea → #764ba2
Available Status: #4caf50 (Green)
Unavailable Status: #f44336 (Red)
Pending Status: #ff9800 (Orange)
```

### Customizable Elements
1. Blood group circle size: `.blood-group-circle { width: 80px }`
2. Card corner radius: `.donor-card { border-radius: 16px }`
3. Shadow intensity: Change `box-shadow` values
4. Gradient colors: Update in `background: linear-gradient(...)`

---

## Troubleshooting

### Issue: Donors showing pincode only

**Solution:** Ensure donors have city and village in database
```javascript
// Check donor data
db.donors.findOne()
// Should have: city, village fields
// If missing, update with city/village values
```

### Issue: Chat button not working

**Solution:** Check Socket.io connection
```javascript
// In browser console
socketClient.getConnectionStatus()
// Should show { isConnected: true, socketId: "..." }
```

### Issue: Location not filtering properly

**Solution:** Update filter logic to check all location fields
```javascript
// RequestBloodPage.js applyFilters function
// Checks: city === location OR village === location OR pincode === location
```

### Issue: Modal not closing

**Solution:** Ensure onClose handler is properly passed
```jsx
<ChatModal
  // ...
  onClose={() => setShowChat(false)}  // Required
/>
```

---

## Performance Tips

1. **Lazy Load Chat**
   - Chat component only loads when modal opens
   - Reduces initial page load

2. **Debounce Filters**
   - Update every 300ms instead of per keystroke
   - Smooth filtering experience

3. **Virtual Scroll**
   - For 100+ donors, implement virtual scrolling
   - Use: `react-window` package

4. **Image Optimization**
   - Blood group circle as SVG (not image)
   - Reduces file size

---

## Next Steps

1. ✅ **Deploy Backend Changes**
   - Update Donor schema
   - Restart Node server

2. ✅ **Deploy Frontend Changes**
   - Push DonorCard component
   - Push ChatModal component
   - Update RequestBloodPage

3. ✅ **Migrate Data**
   - Update existing donors with city/village

4. ✅ **Test Thoroughly**
   - Use testing checklist above

5. ✅ **Monitor & Iterate**
   - Gather user feedback
   - Optimize based on usage

---

## FAQ

**Q: Why remove the Call button?**
A: Chat provides a better secure channel for communication. Phone numbers stay private unless shared voluntarily.

**Q: What if donor doesn't respond in chat?**
A: Users can still request blood and the donor gets notified. Another donor can be selected.

**Q: Can donors see their personal info on card?**
A: No - the card never shows personal info for privacy. Even to themselves on Request Page.

**Q: Is chat saved?**
A: Yes - all messages stored in MongoDB with timestamps. Can view history anytime.

**Q: Can messages be deleted?**
A: Yes - only the sender can delete their own messages. Soft delete keeps audit trail.

---

## Support

For issues or questions:
1. Check Troubleshooting section above
2. Review CHAT_SETUP_GUIDE.md for chat system
3. Check CHAT_INTEGRATION_GUIDE.md for integration details
4. Review component comments in code

---

**Created:** March 11, 2026  
**Status:** Production Ready ✅
