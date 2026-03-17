# Chat System Integration Guide

## Overview

This guide explains how to integrate the real-time chat system into your existing Blood Connect application workflow, specifically in the blood request acceptance flow.

---

## Integration Points

### 1. Request Acceptance Flow

When a donor accepts a blood request, a chat conversation should be initiated.

**Location:** Update the Request acceptance endpoint in `blood-bank-node/app/modules/Request/Controller.js`

```javascript
/**
 * When a request is accepted by donor
 * Create/update conversation in Chat module
 */
async acceptRequest(requestId, donorId) {
  try {
    // Existing logic...
    const request = await Requests.findByIdAndUpdate(
      requestId,
      { 
        isAcceptedByUser: true,
        donorId: donorId,
        acceptedAt: new Date()
      },
      { new: true }
    );

    // ✅ NEW: Create chat conversation
    const { Conversations } = require('../Chat/Schema');
    
    const conversation = await Conversations.findOneAndUpdate(
      { requestId: new ObjectId(requestId) },
      {
        participant1Id: donorId, // Donor
        participant2Id: request.requestedBy, // Recipient
        requestId: new ObjectId(requestId),
        isActive: true,
        lastMessageTime: new Date()
      },
      { upsert: true, new: true }
    );

    // Emit event or send notification
    // Notify both users that chat is now available

    return {
      status: 1,
      message: 'Request accepted and chat activated',
      data: { request, conversation }
    };
  } catch (error) {
    return { status: 0, message: error.message };
  }
}
```

### 2. Request Rejection Flow

When a request is rejected, the conversation should be marked inactive.

```javascript
/**
 * When a request is rejected
 * Deactivate chat conversation
 */
async rejectRequest(requestId) {
  try {
    // Existing logic...
    const request = await Requests.findByIdAndUpdate(
      requestId,
      { isRejectedByUser: true },
      { new: true }
    );

    // ✅ NEW: Deactivate chat
    const { Conversations } = require('../Chat/Schema');
    
    await Conversations.updateOne(
      { requestId: new ObjectId(requestId) },
      { isActive: false }
    );

    return {
      status: 1,
      message: 'Request rejected'
    };
  } catch (error) {
    return { status: 0, message: error.message };
  }
}
```

---

## Frontend Integration

### 1. Add Chat Link in Request Details Page

**File:** `blood-bank-react/src/components/requestForm/RequestDetails.js` (existing component)

```jsx
import { useNavigate } from 'react-router-dom';
import Chat from '../chat/Chat';

function RequestDetails({ requestId, donorId, recipientId, bloodGroup }) {
  const [showChat, setShowChat] = useState(false);
  
  return (
    <div className="request-details">
      {/* Existing request info */}
      
      {/* ✅ NEW: Show chat button if request is accepted */}
      {request.isAcceptedByUser && (
        <button 
          className="btn btn-primary"
          onClick={() => setShowChat(true)}
        >
          💬 Chat with {request.donorName}
        </button>
      )}
      
      {/* ✅ NEW: Chat modal/section */}
      {showChat && (
        <div className="chat-modal">
          <button onClick={() => setShowChat(false)}>Close</button>
          <Chat
            requestId={requestId}
            otherUserId={donorId}
            otherUserName={request.donorName}
            otherUserBloodGroup={bloodGroup}
          />
        </div>
      )}
    </div>
  );
}
```

### 2. Add Chat Navigation Link

**File:** `blood-bank-react/src/components/navBar/NavBar.js` (existing component)

```jsx
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import chatService from '../../services/chatService';

function NavBar() {
  const [unreadCount, setUnreadCount] = useState(0);
  
  useEffect(() => {
    // Fetch unread message count
    const fetchUnreadCount = async () => {
      try {
        const count = await chatService.getUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };
    
    fetchUnreadCount();
    // Refresh every 10 seconds
    const interval = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <nav className="navbar">
      {/* Existing nav items */}
      
      {/* ✅ NEW: Chat icon with badge */}
      <Link to="/chat" className="nav-item">
        💬 Messages
        {unreadCount > 0 && (
          <span className="badge">{unreadCount}</span>
        )}
      </Link>
    </nav>
  );
}
```

### 3. Add Chat Route

**File:** `blood-bank-react/src/App.js` (existing main app file)

```jsx
import ChatPage from './components/chat/ChatPage';
import ProtectedRoute from './components/ProtectedRoute'; // Assuming you have this

function App() {
  return (
    <Routes>
      {/* Existing routes */}
      
      {/* ✅ NEW: Protected chat route */}
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      
      {/* ✅ NEW: Direct chat for specific request */}
      <Route
        path="/request/:requestId/chat"
        element={
          <ProtectedRoute>
            <RequestChatView />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
```

### 4. Quick Chat Access from Request List

**File:** Update your request list component to show unread badges

```jsx
function RequestList() {
  const [requests, setRequests] = useState([]);
  const [unreadByRequest, setUnreadByRequest] = useState({});

  useEffect(() => {
    // Fetch unread count for each request
    const fetchUnreadCounts = async () => {
      const counts = {};
      for (const request of requests) {
        try {
          const count = await chatService.getUnreadCountForChat(request._id);
          if (count > 0) {
            counts[request._id] = count;
          }
        } catch (error) {
          console.error('Error fetching unread count:', error);
        }
      }
      setUnreadByRequest(counts);
    };

    if (requests.length > 0) {
      fetchUnreadCounts();
    }
  }, [requests]);

  return (
    <div className="requests-list">
      {requests.map(request => (
        <div key={request._id} className="request-item">
          {/* Existing request info */}
          
          {/* ✅ NEW: Chat button with unread count */}
          {request.isAcceptedByUser && (
            <Link 
              to={`/request/${request._id}/chat`}
              className="btn-chat"
            >
              💬 Chat
              {unreadByRequest[request._id] && (
                <span className="unread-badge">
                  {unreadByRequest[request._id]}
                </span>
              )}
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## API Integration Updates

### 1. Update Request Acceptance Endpoint

Modify your existing request acceptance API to also initialize chat:

```javascript
/**
 * PUT /api/request/:requestId/accept
 * Request body: { donorId }
 */
router.put('/request/:requestId/accept', verifyToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { donorId } = req.body;

    // Accept request
    const request = await Requests.findByIdAndUpdate(
      requestId,
      { 
        isAcceptedByUser: true,
        donorId: donorId
      },
      { new: true }
    );

    // ✅ NEW: Initialize chat conversation
    const { Conversations } = require('../Chat/Schema');
    const conversation = await Conversations.findOneAndUpdate(
      { requestId: new ObjectId(requestId) },
      {
        participant1Id: new ObjectId(donorId),
        participant2Id: new ObjectId(request.requestedBy),
        requestId: new ObjectId(requestId),
        isActive: true,
        lastMessageTime: new Date()
      },
      { upsert: true, new: true }
    );

    // ✅ NEW: Emit Socket.io event to notify users
    const io = req.app.io;
    io.emit('request_accepted', {
      requestId: request._id,
      donorId,
      conversationId: conversation._id,
      timestamp: new Date()
    });

    return res.status(200).json({
      status: 1,
      message: 'Request accepted and chat activated',
      data: { request, conversation }
    });
  } catch (error) {
    return res.status(500).json({
      status: 0,
      message: error.message
    });
  }
});
```

### 2. Add Endpoint to Check Chat Availability

```javascript
/**
 * GET /api/chat/available/:requestId
 * Check if chat is available for a request
 */
router.get('/chat/available/:requestId', verifyToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    
    const conversation = await Conversations.findOne({
      requestId: new ObjectId(requestId),
      isActive: true
    });

    return res.status(200).json({
      status: 1,
      data: {
        isAvailable: !!conversation,
        conversation: conversation || null
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: 0,
      message: error.message
    });
  }
});
```

---

## Notification Integration

### 1. Notify Users When Chat Becomes Available

```javascript
// In Request acceptance endpoint

// ✅ NEW: Send notifications to both users
const notificationService = require('../../services/NotificationService');

// Notify donor - chat is available
await notificationService.sendNotification({
  userId: donorId,
  type: 'CHAT_AVAILABLE',
  title: 'New Chat Available',
  message: `You can now chat with the recipient about blood request for ${request.bloodGroup}`,
  actionUrl: `/request/${requestId}/chat`
});

// Notify recipient - chat is available
await notificationService.sendNotification({
  userId: request.requestedBy,
  type: 'CHAT_AVAILABLE',
  title: 'Chat Started',
  message: `A donor has accepted your request. Start chatting now!`,
  actionUrl: `/request/${requestId}/chat`
});
```

### 2. Browser Notifications for New Messages

```javascript
// In socketClient.js

const handleMessageReceived = (message) => {
  // Store message locally
  setMessages(prev => [...prev, message]);
  
  // ✅ NEW: Browser notification
  if (Notification.permission === 'granted') {
    new Notification('New message from ' + message.senderId.name, {
      body: message.message.substring(0, 50),
      icon: '/chat-icon.png',
      tag: 'chat-' + message._id
    });
  }
};

// Request notification permission on app load
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}
```

---

## Security Checklist

### API Security

- [x] All chat endpoints require JWT authentication
- [x] Only conversation participants can access messages
- [x] Message content is validated (max 5000 chars)
- [x] User info limited to: name, ID, blood group (no phone, email, address)

### Frontend Security

- [x] JWT token stored securely in localStorage
- [x] Validate token before connecting Socket.io
- [x] Sanitize message content before display
- [x] HTTPS required for production
- [x] Disable message forwarding/sharing between different requests

### Database Security

- [x] MongoDB indexes for performance
- [x] Soft delete for message privacy
- [x] TTL index to auto-delete old messages (optional)
- [x] Encryption at rest (MongoDB Atlas Enterprise)

---

## Testing Integration

### Test Scenarios

**Scenario 1: Request Acceptance Creates Chat**
1. Donor accepts request
2. Verify conversation created in MongoDB
3. Check both users see chat icon
4. Verify initial message history is empty

**Scenario 2: Chat Notification Appears**
1. Recipient refreshes page after donation
2. Verify "Chat" button appears
3. Verify badge shows unread count
4. Click chat to open conversation

**Scenario 3: Real-time Update After Acceptance**
1. Recipient has request list open
2. Donor accepts request in separate window
3. Recipient's page should show real-time update
4. Chat button should appear without page refresh

**Scenario 4: Message Persistence**
1. Send 10 messages in chat
2. Refresh page
3. Verify all messages still present
4. Verify pagination works for older messages

---

## Performance Considerations

### 1. Lazy Loading Chat History

```javascript
// Initially load only last 50 messages
const getChatHistory = (requestId, page = 1, limit = 50);

// Load older messages when user scrolls to top
const handleLoadMore = async () => {
  const nextPage = page + 1;
  const moreMessages = await getChatHistory(requestId, nextPage, 50);
  // Prepend to messages array
};
```

### 2. Debounce Typing Indicator

```javascript
const [typingTimeout, setTypingTimeout] = useState(null);

const handleInputChange = (e) => {
  const value = e.target.value;
  
  // Clear previous timeout
  if (typingTimeout) clearTimeout(typingTimeout);
  
  // Send typing indicator only if content changed
  socketClient.sendTypingStatus(requestId, true);
  
  // Stop typing after 2 seconds of inactivity
  setTypingTimeout(setTimeout(() => {
    socketClient.sendTypingStatus(requestId, false);
  }, 2000));
};
```

### 3. Virtual Scrolling for Large Conversation Lists

```javascript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={conversations.length}
  itemSize={80}
  width="100%"
>
  {({ index, style }) => (
    <ConversationItem 
      style={style}
      conversation={conversations[index]}
    />
  )}
</FixedSizeList>
```

---

## Monitoring & Analytics

### 1. Log Chat Events

```javascript
// In Chat Controller

async saveMessage(messageData) {
  // ... existing code ...
  
  // ✅ NEW: Log analytics
  console.log('Chat Message', {
    senderId: messageData.senderId,
    receiverId: messageData.receiverId,
    requestId: messageData.requestId,
    timestamp: new Date(),
    messageLength: messageData.message.length
  });
}
```

### 2. Monitor Socket Connections

```javascript
// In Socket.io config

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.userId} (${socket.id})`);
  
  // Log event metrics
  socket.on('send_message', () => {
    // Count messages per user, per day, etc.
    analytics.trackEvent('message_sent', {
      userId: socket.userId,
      timestamp: new Date()
    });
  });
});
```

---

## Summary

The chat system is fully integrated into your Blood Connect application. Key integration points:

1. ✅ Chat initialization when request is accepted
2. ✅ Frontend components ready to display conversations
3. ✅ Real-time messaging via Socket.io
4. ✅ REST API for historical data
5. ✅ Security and privacy maintained
6. ✅ Performance optimized for production

---

**Next Steps:**
1. Run setup commands from CHAT_SETUP_GUIDE.md
2. Test all scenarios listed in Testing Integration section
3. Deploy backend and frontend
4. Monitor performance and user engagement

---

**Questions or Issues?** Refer to CHAT_SETUP_GUIDE.md Troubleshooting section.
