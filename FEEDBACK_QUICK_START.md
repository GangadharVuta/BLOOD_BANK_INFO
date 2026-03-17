# Feedback System Quick Reference

## 🚀 Quick Start

### Backend Setup
```bash
# Files already created in:
# - blood-bank-node/app/modules/Feedback/Schema.js
# - blood-bank-node/app/modules/Feedback/Controller.js
# - blood-bank-node/app/modules/Feedback/Routes.js

# Register in express.js config:
const feedbackRoutes = require('../app/modules/Feedback/Routes');
app.use('/api/feedback', feedbackRoutes);

# Restart server
npm start
```

### Frontend Setup
```bash
# Files already created in:
# - blood-bank-react/src/components/home/FeedbackCarousel.js
# - blood-bank-react/src/components/home/FeedbackCarousel.css
# - blood-bank-react/src/components/home/FeedbackForm.js
# - blood-bank-react/src/components/home/FeedbackForm.css

# Import in Home.js:
import FeedbackCarousel from './components/home/FeedbackCarousel';

# Add to render:
<FeedbackCarousel />

# Restart frontend
npm start
```

---

## 📋 API Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/feedback/public` | GET | ❌ | Get approved feedback for homepage |
| `/api/feedback/stats/platform` | GET | ❌ | Get platform statistics |
| `/api/feedback` | POST | ✅ | Submit new feedback |
| `/api/feedback/my-feedback` | GET | ✅ | Get user's feedback |
| `/api/feedback/admin/all` | GET | ✅ Admin | Get all feedback (admin view) |
| `/api/feedback/:id/approve` | PATCH | ✅ Admin | Approve/reject feedback |
| `/api/feedback/:id` | DELETE | ✅ Admin | Delete feedback (soft) |

---

## 🎯 Component Usage

### FeedbackCarousel (Homepage)
```jsx
import FeedbackCarousel from './components/home/FeedbackCarousel';

function HomePage() {
  return (
    <div>
      <h1>Welcome to Blood Connect</h1>
      <FeedbackCarousel />
    </div>
  );
}
```

### FeedbackForm (Feedback Page)
```jsx
import FeedbackForm from './components/home/FeedbackForm';

function FeedbackPage() {
  return (
    <div>
      <FeedbackForm onSubmitSuccess={() => alert('Thank you!')} />
    </div>
  );
}
```

---

## 📊 Data Models

### Feedback Object (Public)
```json
{
  "role": "Donor",
  "bloodGroup": "O+",
  "rating": 5,
  "message": "Great platform!",
  "createdAt": "2024-03-11T10:30:00Z"
}
```

### Platform Stats
```json
{
  "totalSuccessfulDonations": 120,
  "totalRegisteredDonors": 350,
  "averagePlatformRating": "4.7",
  "totalFeedbacks": 65,
  "donorFeedbacks": 35,
  "recipientFeedbacks": 30
}
```

---

## 🔐 Privacy Protection

| Data | Stored? | Public? | Admin? |
|------|---------|--------|--------|
| Name | ✅ | ❌ | ✅ |
| Phone | ✅ | ❌ | ✅ |
| Email | ❌ | ❌ | N/A |
| User ID | ✅ | ❌ | ✅ |
| Blood Group | ✅ | ✅ | ✅ |
| Rating | ✅ | ✅ | ✅ |
| Message | ✅ | ✅ | ✅ |
| Role | ✅ | ✅ | ✅ |

---

## 🎨 Styling

### Colors Used
- Primary Gradient: `#667eea → #764ba2`
- Star Color: `#ffc107` (gold)
- Success Green: `#4caf50`
- Error Red: `#f44336`
- Background: `#ffffff` (light)

### Responsive Breakpoints
- Mobile: `max-width: 480px`
- Tablet: `480px - 768px`
- Desktop: `769px+`

### Dark Mode
Automatic with `@media (prefers-color-scheme: dark)`

---

## 🧪 Testing Examples

### Submit Feedback (cURL)
```bash
curl -X POST http://localhost:4000/api/feedback \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role":"Donor","bloodGroup":"O+","rating":5,"message":"Excellent service!"}'
```

### Get Public Feedback
```bash
curl http://localhost:4000/api/feedback/public?limit=10
```

### Approve Feedback (Admin)
```bash
curl -X PATCH http://localhost:4000/api/feedback/FEEDBACK_ID/approve \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isApproved":true}'
```

---

## ⚠️ Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Feedback not showing | Not approved | Admin to approve in database |
| API 404 | Routes not registered | Add to express.js config |
| CORS Error | Frontend/Backend mismatch | Check localhost:4000/3000 |
| Auth error | No token in request | Login first, then submit |
| Stats wrong | DB not populated | Add sample feedback |

---

## 📁 File Locations

### Backend
```
blood-bank-node/
└── app/modules/Feedback/
    ├── Schema.js (Mongoose model)
    ├── Controller.js (Business logic)
    └── Routes.js (API endpoints)
```

### Frontend
```
blood-bank-react/src/components/
└── home/
    ├── FeedbackCarousel.js (Carousel component)
    ├── FeedbackCarousel.css (Carousel styles)
    ├── FeedbackForm.js (Form component)
    └── FeedbackForm.css (Form styles)
```

---

## 🔄 Workflow

### User Submits Feedback
1. User fills FeedbackForm with rating + message
2. Form validates (10-500 chars)
3. POST to `/api/feedback` with token
4. Backend saves to MongoDB (isApproved: false)
5. Success message shown to user

### Admin Approves
1. Admin logs in with admin role
2. Views pending feedback via `/api/feedback/admin/all?isApproved=false`
3. Reviews & approves via PATCH endpoint
4. Sets isApproved: true & approvedBy: adminId

### Public Display
1. FeedbackCarousel calls `/api/feedback/public`
2. Backend returns only approved feedback (no personal info)
3. Carousel displays with auto-scroll
4. Users can see testimonials before/after login

---

## 🚨 Validation Rules

### Feedback Message
- **Minimum:** 10 characters
- **Maximum:** 500 characters
- **Type:** String, trimmed

### Rating
- **Range:** 1-5
- **Type:** Integer
- **Required:** Yes

### Blood Group
- **Format:** `^(O|A|B|AB)[+-]$`
- **Examples:** O+, A-, B+, AB-

### Role
- **Options:** "Donor" or "Recipient"
- **Required:** Yes

---

## 🔧 Admin Commands

### View Pending Feedback
```javascript
db.feedbacks.find({ isApproved: false, isDeleted: false })
```

### Approve All Feedback
```javascript
db.feedbacks.updateMany(
  { isApproved: false },
  { $set: { isApproved: true, approvedAt: new Date() } }
)
```

### Get Statistics
```javascript
db.feedbacks.aggregate([
  { $match: { isApproved: true, isDeleted: false } },
  { $group: { _id: null, avg: { $avg: "$rating" }, total: { $sum: 1 } } }
])
```

---

## 📈 Performance

- **Database Indexes:** 4 optimized indexes
- **Pagination:** Default 10 items per page
- **Response Size:** ~5KB per feedback item
- **Cache:** Recommended 5-minute TTL
- **Lazy Load:** Components load on demand

---

## 🎯 Features Matrix

| Feature | Status | Backend | Frontend |
|---------|--------|---------|----------|
| Submit Feedback | ✅ | Controller | FeedbackForm |
| Public Display | ✅ | Controller | FeedbackCarousel |
| Admin Approval | ✅ | Controller | (create admin panel) |
| Statistics | ✅ | Controller | FeedbackCarousel |
| Privacy Protection | ✅ | Schema | toPublic() method |
| Soft Delete | ✅ | Controller | — |
| Character Limit | ✅ | Controller | HTML5 maxLength |
| Star Rating | ✅ | — | Interactive UI |
| Dark Mode | ✅ | — | CSS @media |
| Responsive | ✅ | — | CSS breakpoints |

---

**Last Updated:** March 11, 2026  
**Status:** 🟢 Production Ready
