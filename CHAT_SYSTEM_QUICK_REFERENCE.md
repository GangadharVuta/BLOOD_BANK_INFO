# CHAT SYSTEM - QUICK REFERENCE CARD

## Installation & Setup

### Backend
```bash
cd blood-bank-node
npm install
npm start
# Port: 4000
```

### Frontend
```bash
cd blood-bank-react
npm install
npm start
# Port: 3000
```

### MongoDB (Local)
```bash
mongosh
# Indexes auto-created by Schema
```

---

## Core Files

| File | Lines | Purpose |
|------|-------|---------|
| `app/modules/Chat/Schema.js` | 124 | Message & Conversation models |
| `app/modules/Chat/Controller.js` | 523 | Chat business logic |
| `app/modules/Chat/Routes.js` | 173 | REST API endpoints |
| `configs/socket.js` | 304 | Socket.io real-time events |
| `src/components/chat/Chat.js` | 427 | React Chat UI component |
| `src/services/chatService.js` | 272 | REST API client |
| `src/services/socketClient.js` | ~200 | Socket.io client |
| `src/hooks/useChat.js` | 340 | Custom React hook |

---

## API Endpoints (REST)

```
GET  /api/chat/history/:requestId?page=1&limit=50
     Fetch messages with pagination

GET  /api/chat/conversations?page=1&limit=20
     Get user's active conversations

GET  /api/chat/unread
     Get total unread count

POST /api/chat/mark-conversation-read/:requestId
     Mark all messages as read

DELETE /api/chat/message/:messageId
     Soft delete a message
```

---

## Socket.io Events

### Client → Server
```javascript
socket.emit('join_chat', { requestId })
socket.emit('send_message', { receiverId, requestId, message })
socket.emit('message_read', { messageId, requestId })
socket.emit('typing', { requestId, isTyping: true/false })
socket.emit('leave_chat', { requestId })
socket.emit('check_online_status', { targetUserId }, callback)
```

### Server → Client
```javascript
socket.on('receive_message', (message) => {})
socket.on('message_read_receipt', ({ messageId, readBy }) => {})
socket.on('user_typing', ({ userId, userName, isTyping }) => {})
socket.on('user_online', ({ userId, isOnline }) => {})
socket.on('user_offline', ({ userId, isOnline }) => {})
socket.on('error', ({ message }) => {})
```

---

## React Component Usage

### Basic Chat Component
```jsx
import Chat from './components/chat/Chat';

<Chat
  requestId="request_123"
  otherUserId="user_456"
  otherUserName="John Doe"
  otherUserBloodGroup="O+"
/>
```

### Using useChat Hook
```jsx
import useChat from './hooks/useChat';

const ChatPage = ({ requestId, otherUserId }) => {
  const {
    messages,
    isLoading,
    isUserOnline,
    showTypingIndicator,
    messagesEndRef,
    sendMessage,
    deleteMessage,
    loadMoreMessages
  } = useChat(requestId, otherUserId);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {messages.map(msg => (
        <div key={msg._id}>
          <strong>{msg.senderName}</strong>: {msg.message}
          <small>{msg.timestamp.toLocaleTimeString()}</small>
        </div>
      ))}
      {showTypingIndicator && <div>User is typing...</div>}
      <button onClick={() => loadMoreMessages()}>Load More</button>
      <div ref={messagesEndRef} />
    </div>
  );
};
```

---

## Common Tasks

### Send a Message
```javascript
// Via Socket.io (real-time)
socketClient.sendMessage(receiverId, requestId, messageText);

// Via API
chatService chatService.saveMessage({...})
```

### Mark as Read
```javascript
// Single message
chatService.markMessageAsRead(messageId);

// All in conversation
chatService.markConversationAsRead(requestId);
```

### Get Chat History
```javascript
const history = await chatService.getChatHistory(requestId, page, limit);
// Returns: { messages: [...], pagination: {...} }
```

### Delete Message
```javascript
await chatService.deleteMessage(messageId);
// Message shows as "[Message deleted]"
```

### Check Online Status
```javascript
const status = await socketClient.checkUserOnlineStatus(userId);
// Returns: { userId, isOnline, timestamp }
```

### Show Typing Indicator
```javascript
socketClient.sendTypingStatus(requestId, true);
// Auto-stops after 2 seconds
```

---

## Data Models

### Message Object
```javascript
{
  _id: "mongo_id",
  senderId: { _id: "...", name: "John" },      // NOT email/phone
  receiverId: { _id: "...", name: "Jane" },    // NOT email/phone
  requestId: "blood_request_id",
  message: "Hello!",
  messageType: "text",
  isRead: true,
  readAt: Date,
  isDeleted: false,
  createdAt: Date,
  updatedAt: Date
}
```

### Conversation Object
```javascript
{
  _id: "mongo_id",
  participant1Id: "user_id",
  participant2Id: "user_id",
  requestId: "blood_request_id",
  lastMessage: "Last message text",
  lastMessageTime: Date,
  unreadCount1: 2,
  unreadCount2: 0,
  isActive: true,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Key Features Checklist

✅ Real-time messaging with Socket.io  
✅ Message persistent storage in MongoDB  
✅ Request-aware (chat only when request active)  
✅ Personal data protection (no email/phone in chat)  
✅ Read receipts with timestamps  
✅ Typing indicators  
✅ Online/offline status  
✅ Message search & pagination  
✅ Auto-scroll to latest message  
✅ Message deletion (soft-delete)  
✅ Unread message count  
✅ JWT authentication  
✅ Socket.io with fallback transport  
✅ Error handling & logging  

---

## Debugging

### Frontend Console
```javascript
// Check socket connection
console.log('Connected:', socketClient.isConnected);

// Listen to all events
socketClient.on('*', (event) => {
  console.log('Event:', event);
});

// Send test message
socketClient.sendMessage('user_id', 'request_id', 'test');
```

### Backend Logs
```javascript
Logger.info('Message sent', { from, to, requestId });
Logger.warn('High rate', { userId, count });
Logger.error('Socket error', error);

// Check MongoDB
db.messages.findById('msg_id')
db.conversations.findById('conv_id')
```

### Network Debugging
1. Open DevTools > Network Tab
2. Send message: Look for `/api/chat/*` request
3. Check WebSocket: Should see `wss://` connection
4. Verify `Authorization: Bearer <token>` header

---

## Common Issues

| Issue | Solution |
|-------|----------|
| Messages not real-time | Check Socket.io connection, verify JWT token |
| Duplicate messages | Ensure event listener cleanup in useEffect return |
| Can't send message | Verify request is ACTIVE/PENDING status |
| Email visible in chat | Check Schema populate select fields |
| High memory usage | Use pagination, implement react-window virtualization |
| Disconnects frequently | Increase pingInterval/pingTimeout, check network |
| Read receipt not working | Verify message_read event is emitted |

---

## Testing

### Quick Test
```bash
# Terminal 1: Backend
cd blood-bank-node && npm start

# Terminal 2: Frontend
cd blood-bank-react && npm start

# Browser 1: localhost:3000 - User A (donor)
# Browser 2: localhost:3000 - User B (requester)

# Test:
1. Navigate to request chat page
2. Type message and send
3. Verify appears on both clients in <1 second
4. Verify read receipt shows ✓✓
5. Verify typing indicator appears
6. Right-click message to delete
```

---

## Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure SSL/TLS certificates
- [ ] Set `SOCKET_IO_CORS_ORIGIN` to production URL
- [ ] Create MongoDB indexes
- [ ] Configure JWT_SECRET (min 32 chars)
- [ ] Set Firebase credentials
- [ ] Enable HTTPS (port 443)
- [ ] Set `transports: ['websocket']` (remove polling)
- [ ] Configure logging rotation
- [ ] Set up monitoring & alerts
- [ ] Test Socket.io with WSS (secure WebSocket)

---

## Performance Tips

1. **Pagination:** Load 50 messages initially, lazy-load more on scroll
2. **Typing Debounce:** 300ms delay before sending typing indicator
3. **Auto-scroll:** Only scroll when at bottom, not while user scrolling up
4. **Message Cleanup:** Remove messages from state after 1000+
5. **Database Indexes:** Compound index on (senderId, receiverId, requestId)
6. **Socket Rooms:** Use `chat_${requestId}` to target specific conversations

---

## Version Info

- **Backend:** Node.js + Express + Socket.io
- **Frontend:** React + Socket.io Client
- **Database:** MongoDB
- **Auth:** JWT
- **Status:** ✅ Production Ready

---

## Quick Links

- Full Guide: `CHAT_SYSTEM_IMPLEMENTATION_GUIDE.md`
- Schema: `blood-bank-node/app/modules/Chat/Schema.js`
- Controller: `blood-bank-node/app/modules/Chat/Controller.js`
- Component: `blood-bank-react/src/components/chat/Chat.js`
- Hook: `blood-bank-react/src/hooks/useChat.js`

---

**Last Updated:** 2024-01-23  
**Maintainer:** Blood Bank Team
