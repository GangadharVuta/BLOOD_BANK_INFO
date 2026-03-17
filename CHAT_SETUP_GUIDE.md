# Real-Time Chat System - Setup & Deployment Guide

## Overview

This guide provides complete setup and deployment instructions for the Blood Connect Real-Time Chat System.

**Technology Stack:**
- Frontend: React.js with Socket.io client
- Backend: Node.js/Express with Socket.io server
- Database: MongoDB
- Real-time Communication: Socket.io v4.7.2
- Authentication: JWT (JSON Web Tokens)

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Backend Setup](#backend-setup)
3. [Frontend Setup](#frontend-setup)
4. [Environment Configuration](#environment-configuration)
5. [Running the Application](#running-the-application)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Node.js** (v14.0.0 or higher)
- **npm** (v6.0.0 or higher) or **yarn**
- **MongoDB** (v4.0 or higher) - Local or Cloud (MongoDB Atlas)
- **Git**

### Required Knowledge
- Basic understanding of Node.js and Express
- React.js fundamentals
- Socket.io basics
- JWT authentication

---

## Backend Setup

### Step 1: Install Backend Dependencies

Navigate to the backend directory and install required packages:

```bash
cd blood-bank-node
npm install
```

The `socket.io` package should be installed along with other dependencies as per the updated `package.json`.

### Step 2: Verify Socket.io Installation

```bash
npm list socket.io
```

Expected output:
```
socket.io@4.7.2
```

### Step 3: Update Mongoose Connection

Ensure your MongoDB connection is properly configured in `configs/mongoose.js`. The chat system uses MongoDB to store messages.

### Step 4: Verify File Structure

After setup, your backend structure should look like:

```
blood-bank-node/
├── app/modules/Chat/
│   ├── Schema.js       (Message & Conversation models)
│   ├── Controller.js   (Chat business logic)
│   └── Routes.js       (REST API endpoints)
├── configs/
│   ├── socket.js       (Socket.io configuration) ✅ NEW
│   ├── express.js      (Express setup with Chat routes) ✅ UPDATED
│   ├── mongoose.js
│   └── configs.js
├── server.js           (✅ UPDATED with Socket.io)
└── package.json        (✅ UPDATED with socket.io dependency)
```

---

## Frontend Setup

### Step 1: Install Frontend Dependencies

Navigate to the frontend directory:

```bash
cd blood-bank-react
npm install
```

### Step 2: Add Socket.io Client

The socket.io-client should be installed automatically with npm dependencies. Verify:

```bash
npm list socket.io-client
```

Expected output:
```
socket.io-client@^4.x.x
```

If not installed, manually install:

```bash
npm install socket.io-client@4.7.2
```

### Step 3: Verify File Structure

After setup, your frontend structure should look like:

```
blood-bank-react/src/
├── components/chat/
│   ├── Chat.js         (Main chat interface) ✅ NEW
│   ├── Chat.css        (Chat styling) ✅ NEW
│   ├── ChatList.js     (Conversations list) ✅ NEW
│   ├── ChatList.css    (ChatList styling) ✅ NEW
│   ├── ChatPage.js     (Chat page wrapper) ✅ NEW
│   └── ChatPage.css    (ChatPage styling) ✅ NEW
├── services/
│   ├── socketClient.js (Socket.io client) ✅ NEW
│   ├── chatService.js  (Chat API service) ✅ NEW
│   └── authService.js  (Existing)
└── App.js
```

---

## Environment Configuration

### Backend Environment Variables

Create a `.env` file in `blood-bank-node/` root directory:

```env
# Server Configuration
NODE_ENV=development
SERVER_PORT=5000

# Database Configuration
DB_URL=mongodb://localhost:27017/blood-bank
# OR for MongoDB Atlas
DB_URL=mongodb+srv://username:password@cluster.mongodb.net/blood-bank

# JWT Configuration
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRY=7d

# CORS Configuration (for Socket.io)
CORS_ORIGIN=http://localhost:3000

# Firebase Configuration (existing)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_API_KEY=your-api-key

# Optional: Twilio Configuration
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
```

### Frontend Environment Variables

Create a `.env` file in `blood-bank-react/` root directory:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000

# Firebase Configuration (if applicable)
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
```

### Environment Variables for Production

**Backend `.env.production`:**

```env
NODE_ENV=production
SERVER_PORT=5000
DB_URL=mongodb+srv://prod-user:prod-password@prod-cluster.mongodb.net/blood-bank
JWT_SECRET=use-strong-random-key-in-production
JWT_EXPIRY=7d
CORS_ORIGIN=https://yourdomain.com
```

**Frontend `.env.production`:**

```env
REACT_APP_API_URL=https://api.yourdomain.com/api
REACT_APP_SOCKET_URL=https://api.yourdomain.com
```

---

## Running the Application

### Step 1: Start MongoDB

**Local MongoDB:**
```bash
mongod
```

**MongoDB Atlas (Cloud):**
No action needed - connection string in `.env` is sufficient.

### Step 2: Start Backend Server

```bash
cd blood-bank-node
npm start
```

Expected output:
```
✅ Connected to mongoose
Server running at http://localhost:5000
Socket.io server is ready for connections
```

### Step 3: Start Frontend Development Server

In a new terminal:

```bash
cd blood-bank-react
npm start
```

Expected output:
```
Compiled successfully!
You can now view blood-bank-react in the browser.
http://localhost:3000
```

### Step 4: Test the Chat System

1. Open two browser windows
2. Login with different user accounts (donor and recipient)
3. Create a blood request (as recipient)
4. Accept the request (as donor)
5. Navigate to the chat page
6. Send messages in real-time

---

## Using the Chat Component

### Integration in Your Application

To integrate the Chat component into your existing pages:

**Option 1: Use the full ChatPage component**

```jsx
import ChatPage from './components/chat/ChatPage';

function App() {
  return (
    <div>
      <ChatPage />
    </div>
  );
}
```

**Option 2: Use Chat component only for specific request**

```jsx
import Chat from './components/chat/Chat';

function RequestDetailPage({ requestId, otherUserId, otherUserName, bloodGroup }) {
  return (
    <Chat
      requestId={requestId}
      otherUserId={otherUserId}
      otherUserName={otherUserName}
      otherUserBloodGroup={bloodGroup}
    />
  );
}
```

### Socket.io Connection

The socket connection is automatically established when the Chat component mounts. Ensure JWT token is available in localStorage:

```javascript
// Token should be stored after login
localStorage.setItem('authToken', jwtToken);
localStorage.setItem('userId', userId);
```

---

## API Endpoints

### Chat REST Endpoints

All endpoints require JWT authentication in the `Authorization` header:

```
Authorization: Bearer <JWT_TOKEN>
```

#### 1. Get Chat History

```
GET /api/chat/history/:requestId?page=1&limit=50
```

**Response:**
```json
{
  "status": 1,
  "message": "Chat history fetched successfully",
  "data": {
    "messages": [
      {
        "_id": "msg123",
        "senderId": {
          "_id": "user1",
          "name": "John Doe",
          "bloodGroup": "O+"
        },
        "receiverId": {
          "_id": "user2",
          "name": "Jane Smith",
          "bloodGroup": "A+"
        },
        "message": "Are you available today?",
        "createdAt": "2024-03-11T10:30:00Z",
        "isRead": true
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalMessages": 250,
      "limit": 50
    }
  }
}
```

#### 2. Get Conversations List

```
GET /api/chat/conversations?page=1&limit=20
```

**Response:**
```json
{
  "status": 1,
  "message": "Conversations fetched successfully",
  "data": {
    "conversations": [
      {
        "_id": "conv123",
        "participant1Id": {...},
        "participant2Id": {...},
        "requestId": "req456",
        "lastMessage": "Thanks!",
        "lastMessageTime": "2024-03-11T10:30:00Z",
        "unreadCount1": 0,
        "unreadCount2": 2
      }
    ],
    "pagination": {...}
  }
}
```

#### 3. Get Unread Count

```
GET /api/chat/unread
```

#### 4. Get Unread Count for Specific Chat

```
GET /api/chat/unread/:requestId
```

#### 5. Mark Message as Read

```
POST /api/chat/mark-read
```

**Request Body:**
```json
{
  "messageId": "msg123"
}
```

#### 6. Mark Conversation as Read

```
POST /api/chat/mark-conversation-read/:requestId
```

#### 7. Delete Message

```
DELETE /api/chat/message/:messageId
```

---

## Socket.io Events

### Client-side Events

**Connect:**
```javascript
socketClient.connect(token, serverUrl);
```

**Join Chat:**
```javascript
socketClient.joinChat(requestId);
```

**Send Message:**
```javascript
socketClient.sendMessage(receiverId, requestId, message);
```

**Typing Indicator:**
```javascript
socketClient.sendTypingStatus(requestId, isTyping);
```

**Mark Message as Read:**
```javascript
socketClient.markMessageAsRead(messageId, requestId);
```

### Server-side Events Received

```javascript
// New message received
socketClient.on('messageReceived', (message) => {
  console.log('New message:', message);
});

// User online status
socketClient.on('userOnline', (data) => {
  console.log('User online:', data.userId);
});

// User offline status
socketClient.on('userOffline', (data) => {
  console.log('User offline:', data.userId);
});

// Typing indicator
socketClient.on('typingStatus', (data) => {
  console.log('User typing:', data.isTyping);
});

// Message delivery confirmation
socketClient.on('messageSent', (data) => {
  console.log('Message delivered:', data.messageId);
});

// Message read receipt
socketClient.on('messageRead', (data) => {
  console.log('Message read by:', data.readBy);
});
```

---

## Security Features

### 1. JWT Authentication
- All API endpoints require valid JWT token
- Socket.io connection authenticated via token in handshake
- Token expiration: 7 days (configurable)

### 2. Data Privacy
- Private user information (phone, email, full address) is not exposed to chat participants
- Only display: Donor ID, Blood Group, Location/Pincode

### 3. Message Security
- Messages stored with sender/receiver IDs
- Soft delete for user privacy
- Message deletion only allowed for sender

### 4. CORS Configuration
- Whitelist specific origins
- No wildcard (*) allowed in production
- Credentials required for cross-origin requests

### 5. Input Validation
- Message length limit: 5000 characters
- SQL injection prevention via Mongoose
- XSS protection via React's built-in escaping

---

## Testing

### Manual Testing

**Test 1: Real-time Messaging**
1. Login as User A and User B
2. Create a blood request (User B as recipient)
3. Accept request (User A as donor)
4. Send message from User A to User B
5. Verify message appears in real-time on User B's screen

**Test 2: Online Status**
1. Login User A → should see "🟢 Online"
2. Close User A's browser → wait 2 seconds
3. Verify User B sees "🔴 Offline"

**Test 3: Typing Indicators**
1. User A starts typing
2. Verify User B sees typing indicator with animation
3. User A finishes typing
4. Verify indicator disappears after 2 seconds

**Test 4: Message Read Receipts**
1. User A sends message
2. Message shows "✓" (single check)
3. User B opens chat
4. Message shows "👁️" (read receipt)

**Test 5: Chat History**
1. Send 100+ messages
2. Refresh page
3. Verify messages load with pagination
4. Click "Load Previous Messages"
5. Verify older messages load

### Automated Testing (Optional)

Create test files in `blood-bank-node/__tests__/chat.test.js`:

```javascript
const request = require('supertest');
const app = require('../server');
const { Messages } = require('../app/modules/Chat/Schema');

describe('Chat API', () => {
  it('should fetch chat history', async () => {
    const response = await request(app)
      .get('/api/chat/history/requestId123')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe(1);
    expect(Array.isArray(response.body.data.messages)).toBe(true);
  });
});
```

Run tests:
```bash
npm test
```

---

## Deployment

### Deploy to Heroku

#### Step 1: Install Heroku CLI

```bash
npm install -g heroku
heroku login
```

#### Step 2: Create Heroku App

```bash
cd blood-bank-node
heroku create blood-bank-chat-api
```

#### Step 3: Add Environment Variables

```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-production-secret-key
heroku config:set DB_URL=mongodb+srv://user:pass@cluster.mongodb.net/blood-bank
heroku config:set CORS_ORIGIN=https://yourdomain.com
```

#### Step 4: Deploy Backend

```bash
git push heroku main
```

#### Step 5: Check Logs

```bash
heroku logs --tail
```

### Deploy Frontend to Vercel

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Deploy

```bash
cd blood-bank-react
vercel
```

#### Step 3: Configure Environment Variables

In Vercel dashboard, add:
- `REACT_APP_API_URL=https://blood-bank-chat-api.herokuapp.com/api`
- `REACT_APP_SOCKET_URL=https://blood-bank-chat-api.herokuapp.com`

#### Step 4: Redeploy

```bash
vercel --prod
```

### Deploy to AWS EC2

#### Step 1: SSH into EC2 Instance

```bash
ssh -i your-key.pem ec2-user@your-instance-ip
```

#### Step 2: Install Dependencies

```bash
sudo yum update
sudo yum install nodejs npm
curl -fsSL https://www.mongodb.org/static/pgp/server-4.4.asc | sudo rpm --import -
```

#### Step 3: Clone Repository

```bash
git clone https://github.com/your-repo/blood-bank.git
cd blood-bank/blood-bank-node
npm install
```

#### Step 4: Setup Environment Variables

```bash
nano .env
# Add production environment variables
```

#### Step 5: Run with PM2 (Process Manager)

```bash
sudo npm install -g pm2
pm2 start server.js --name "blood-bank-api"
pm2 save
pm2 startup
```

#### Step 6: Setup Nginx Reverse Proxy

```bash
sudo yum install nginx
sudo systemctl start nginx
```

Edit `/etc/nginx/conf.d/blood-bank.conf`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Production Checklist

- [ ] MongoDB Atlas cluster set up
- [ ] Environment variables configured
- [ ] SSL certificate installed (HTTPS)
- [ ] CORS whitelist updated
- [ ] JWT_SECRET changed to strong value
- [ ] Error logging configured
- [ ] Database backups scheduled
- [ ] Load testing completed
- [ ] Security audit completed
- [ ] Monitor uptime with monitoring service

---

## Troubleshooting

### Issue 1: Socket.io Connection Refused

**Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:5000
```

**Solution:**
1. Check if backend server is running: `npm start`
2. Verify server port: 5000
3. Check CORS configuration in `configs/socket.js`
4. Ensure token is valid: `localStorage.getItem('authToken')`

### Issue 2: Messages Not Appearing in Real-time

**Error:**
Messages only appear after refresh

**Solution:**
1. Verify Socket.io connection: Open browser console, check for errors
2. Check if JWT token is expired: Refresh login
3. Verify message is being saved to MongoDB
4. Check MongoDB connection: `mongo --eval "db.adminCommand('ping')"`

### Issue 3: High Database Consumption

**Error:**
Database growing too large

**Solution:**
1. Implement message archival: Move old messages to separate collection
2. Add TTL index to delete messages after 90 days:

```javascript
messageSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 7776000 } // 90 days
);
```

### Issue 4: CORS Errors

**Error:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution:**
1. Update CORS whitelist in `configs/express.js`
2. Verify origin matches exactly (protocol, domain, port)
3. For development: use `CORS_ORIGIN=*` (not for production)

### Issue 5: Connection Timeout

**Error:**
```
Socket timeout: no activity received for 60s
```

**Solution:**
1. Increase ping interval: Edit `configs/socket.js`
2. Check network stability
3. Verify server has sufficient resources

---

## Performance Optimization

### 1. Message Pagination

```javascript
// Load 50 messages initially
const getChatHistory = (requestId, page = 1, limit = 50);
```

### 2. Lazy Loading

Implement virtual scrolling for conversations list:

```javascript
import { FixedSizeList as List } from 'react-window';

<List
  height={600}
  itemCount={conversations.length}
  itemSize={80}
  width="100%"
>
  {({ index, style }) => (
    <ConversationItem style={style} conversation={conversations[index]} />
  )}
</List>
```

### 3. Database Indexing

Ensure indexes exist:

```javascript
messageSchema.index({ senderId: 1, receiverId: 1, requestId: 1 });
messageSchema.index({ requestId: 1, createdAt: -1 });
conversationSchema.index({ requestId: 1 }, { unique: true });
```

### 4. Caching

Implement Redis for active conversations:

```bash
npm install redis
```

---

## Support & Documentation

### Additional Resources
- Socket.io Documentation: https://socket.io/docs/
- Express.js Guide: https://expressjs.com/
- MongoDB Documentation: https://docs.mongodb.com/
- React Documentation: https://react.dev/

### Getting Help
1. Check error logs: `pm2 logs blood-bank-api`
2. Review Socket.io network tab in browser DevTools
3. Check MongoDB connection with mongo shell
4. Enable debug logging: `DEBUG=* npm start`

---

## Version History

- **v1.0.0** (2024-03-11): Initial release
  - Real-time messaging with Socket.io
  - REST API endpoints
  - React UI components
  - JWT authentication
  - Message persistence with MongoDB

---

## License

This project is part of Blood Bank Info Application.

---

**Last Updated:** March 11, 2024  
**Next Review:** June 11, 2024
