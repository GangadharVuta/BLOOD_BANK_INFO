# Donor Card Integration Testing Checklist

## Pre-Test Setup

- [ ] Backend running on port 5000 (`npm start` in blood-bank-node)
- [ ] Frontend running on port 3000 (`npm start` in blood-bank-react)
- [ ] MongoDB connected and running
- [ ] User logged in to Blood Connect application
- [ ] Browser DevTools console open (to check for errors)
- [ ] Network tab open (to verify API calls)

---

## Phase 1: Component Rendering

### Test: DonorCard Component Displays
- [ ] Navigate to Request Blood page
- [ ] Verify donors list loads without errors
- [ ] Check that donor cards render with proper layout
- [ ] No TypeScript/JavaScript errors in console

### Test: Privacy - Personal Information Hidden
- [ ] **Donor name is NOT visible** on card (must be hidden)
- [ ] **Phone number is NOT visible** on card (must be hidden)
- [ ] **Email is NOT visible** on card (must be hidden)
- [ ] **Full address is NOT visible** on card (must be hidden)

### Test: Privacy - Required Information Visible
- [ ] Blood group is prominently displayed (in circle)
- [ ] Location (city and/or village) is visible
- [ ] Availability status is displayed (Available/Not Available/Pending)
- [ ] Donor type badge visible (Registered/Manual)

**Expected:** Only non-personal info visible; personal details completely hidden

---

## Phase 2: Button Functionality

### Test: Chat Button Exists
- [ ] Chat button (💬 Chat) is visible on each donor card
- [ ] Chat button is blue gradient color
- [ ] Chat button has hover effect (brightens on hover)
- [ ] Chat button is positioned correctly

### Test: Call Button Does NOT Exist
- [ ] **Old Call button (📞 Call) is NOT present** on card
- [ ] No remnants of call functionality in code/console

### Test: Chat Button Opens Modal
- [ ] Click on Chat button for a donor
- [ ] Modal opens smoothly (should slide up or fade in)
- [ ] Modal doesn't close immediately
- [ ] Modal overlay appears with semi-transparent background

**Expected:** Smooth modal opening with no errors

---

## Phase 3: ChatModal Component

### Test: Modal Header Display
- [ ] Modal shows blood group in header (e.g., "O+")
- [ ] Modal shows location in header (e.g., "Hyderabad")
- [ ] Modal displays title "💬 Blood Donor Chat"
- [ ] Header styling is consistent with design

### Test: Modal Close Button
- [ ] Close button (✕) visible in top-right corner
- [ ] Close button has hover effect
- [ ] Clicking close button closes modal smoothly
- [ ] Clicking outside modal (on backdrop) also closes it

### Test: Chat Component Embedded
- [ ] Chat interface visible inside modal
- [ ] Message input box present
- [ ] Send button present and functional
- [ ] Chat history visible (if any previous messages)

**Expected:** Modal displays correctly with embedded chat component

---

## Phase 4: Chat Functionality

### Test: Real-Time Message Sending
- [ ] Type message in chat input box
- [ ] Click Send button
- [ ] Message appears immediately (no delay)
- [ ] Message shows in chat history
- [ ] Message has timestamp

### Test: Message Receiving
- [ ] Open two browser windows (or two devices)
- [ ] Log in as different users
- [ ] Send message from User A
- [ ] Check that User B receives message in real-time
- [ ] Message received within 1-2 seconds (no delay)

### Test: Socket.io Connection
- [ ] In browser console, check: `socketClient.getConnectionStatus()`
- [ ] Should return: `{ isConnected: true, socketId: "..." }`
- [ ] Check Network tab → WebSocket → Should show socket.io connection
- [ ] Connection should be stable during chat

### Test: Online Status
- [ ] When User A opens chat, should show "🟢 Online" or similar
- [ ] When User B sends message, User A should see typing indicator
- [ ] When User B closes modal, online status should change to "🔴 Offline"

**Expected:** Real-time communication working without delays

---

## Phase 5: Donor Selection

### Test: Checkbox Selection
- [ ] Each donor card has checkbox (top-left corner)
- [ ] Click checkbox to select donor
- [ ] Checkbox becomes checked (visual feedback)
- [ ] Selected donor row highlights or changes appearance
- [ ] Click again to deselect donor

### Test: Selection State Management
- [ ] Select multiple donors
- [ ] Count of selected donors displays somewhere (check UI)
- [ ] Selected state persists when scrolling
- [ ] Selected state remains after opening/closing chat modal

### Test: Select Button Function
- [ ] Each card has "Select" or "Request" button
- [ ] Clicking adds donor to selection
- [ ] Alternative: Verify checkbox and button do same action consistently

**Expected:** Proper selection tracking across multiple donors

---

## Phase 6: Location Filtering

### Test: Filter by Location (City)
- [ ] Use location filter dropdown
- [ ] Select a specific city (e.g., "Hyderabad")
- [ ] Donor list shows only donors from that city
- [ ] Filter works correctly

### Test: Filter by Location (Village)
- [ ] Use location filter dropdown
- [ ] Select a specific village (e.g., "Kirlampudi")
- [ ] Donor list shows only donors from that village
- [ ] Filter works correctly

### Test: Backward Compatibility (Pincode Filter)
- [ ] If any donors only have pincode (no city/village)
- [ ] These donors should still appear/filter correctly
- [ ] Fallback logic working: tries city → village → pincode

### Test: Clear Filters
- [ ] Apply multiple filters
- [ ] Click "Clear Filters" or "Reset"
- [ ] All donors reappear in list
- [ ] No donors unexpectedly hidden

**Expected:** Filters work with new city/village structure and old pincode data

---

## Phase 7: Responsive Design

### Test: Desktop (1920px width)
- [ ] Open application on desktop browser
- [ ] Donor cards display in 3-column grid
- [ ] All text clear and readable
- [ ] Spacing and padding appropriate
- [ ] Chat modal fits on screen

### Test: Tablet (768px width)
- [ ] Resize browser to tablet size
- [ ] Donor cards display in 2-column grid
- [ ] Layout adjusts properly
- [ ] No text overflow
- [ ] Chat modal fits screen

### Test: Mobile (480px width)
- [ ] Resize browser to mobile size (or use mobile device)
- [ ] Donor cards stack in 1-column layout
- [ ] Card content doesn't overflow
- [ ] Buttons are still clickable
- [ ] Chat modal is readable and usable
- [ ] Modal doesn't extend beyond screen

### Test: Orientation Change
- [ ] On mobile, rotate screen landscape → portrait
- [ ] Layout adjusts correctly
- [ ] Chat modal adapts to orientation

**Expected:** Responsive design works on all screen sizes

---

## Phase 8: Dark Mode

### Test: Dark Mode Toggle
- [ ] Check browser settings for dark mode preference
- [ ] OR use DevTools to force dark mode: `(prefers-color-scheme: dark)`
- [ ] Donor cards switch to dark colors automatically
- [ ] Background becomes dark
- [ ] Text becomes light colored

### Test: Dark Mode Contrast
- [ ] Text is readable on dark background
- [ ] No unreadable color combinations
- [ ] Chat modal is visible in dark mode
- [ ] Buttons are clearly visible

### Test: Light Mode
- [ ] Switch back to light mode
- [ ] Colors return to original light theme
- [ ] No contrast issues

**Expected:** Dark mode CSS media query working correctly

---

## Phase 9: Database & API

### Test: Donor Data in Database
- [ ] Check MongoDB donors collection
- [ ] Verify donors have `city` field (not NULL)
- [ ] Verify donors have `village` field (not NULL)
- [ ] Check `availability` field populated correctly
- [ ] Check `donorType` field present

### Test: API Response Format
- [ ] Open Network tab
- [ ] Click on GET /api/donors/merged/all
- [ ] Check Response payload
- [ ] Verify includes: _id, bloodGroup, city, village, availability, donorType
- [ ] Response should NOT include: name, phone in plain text (stored but not exposed)

### Test: API Call Timing
- [ ] Page load → API call should complete in < 2 seconds
- [ ] Check Network tab for duration
- [ ] Status should be 200 (success)
- [ ] Response payload size reasonable (~50KB for 100 donors)

**Expected:** API returns correct data structure with new fields

---

## Phase 10: Error Handling

### Test: No Donors Available
- [ ] Filter to a city with no donors
- [ ] Should display "No donors found" message
- [ ] No errors in console
- [ ] UI gracefully handles empty state

### Test: Network Error
- [ ] Simulate offline mode (DevTools → Network tab → Offline)
- [ ] Try clicking Chat button
- [ ] Should show error message (not crash)
- [ ] Resume connection, should recover

### Test: Socket Connection Error
- [ ] Stop backend server while chat is open
- [ ] Try sending message
- [ ] Should show connection error
- [ ] Restart backend, connection resumes
- [ ] Try sending message again (should work)

### Test: Invalid Data
- [ ] Try to send empty message
- [ ] Should prevent sending or show validation error
- [ ] Try to select no donors and request
- [ ] Should show warning (if applicable)

**Expected:** Application handles errors gracefully

---

## Phase 11: Performance

### Test: Page Load Time
- [ ] Open Request Blood page (empty cache)
- [ ] Measure time until fully loaded (DOMContentLoaded event)
- [ ] Should be < 3 seconds on decent connection
- [ ] Check Performance tab in DevTools

### Test: Render Performance
- [ ] Scroll through 100 donors smoothly
- [ ] Should not lag or stutter
- [ ] FPS should stay > 30 (check Performance tab)
- [ ] No jank when opening/closing chat modal

### Test: Memory Usage
- [ ] Open DevTools → Memory tab
- [ ] Check memory usage at start
- [ ] Open 10 chat modals (one at a time)
- [ ] Memory should not spike excessively
- [ ] Memory should not leak (stays stable)

### Test: Bundle Size
- [ ] Check Network tab for JS bundle sizes
- [ ] Main bundle < 500KB (gzipped)
- [ ] Chat component lazy loaded (not in main bundle initially)

**Expected:** No performance degradation from new components

---

## Phase 12: Security

### Test: Authentication Required
- [ ] Log out from application
- [ ] Try accessing /request-blood page directly (URL)
- [ ] Should redirect to login page
- [ ] Cannot access without authentication

### Test: Socket.io Authentication
- [ ] Check if Socket connection requires JWT token
- [ ] Open DevTools → Network → WebSocket
- [ ] Initial socket connection should include auth headers
- [ ] Invalid token should be rejected

### Test: Message Access Control
- [ ] User A sends message to User B
- [ ] User C (different user) tries to view this conversation
- [ ] User C should NOT be able to see the messages
- [ ] Only User A and User B can see the conversation

### Test: No Sensitive Data in Transit
- [ ] Monitor Network tab while sending message
- [ ] Check WebSocket frames
- [ ] Message should not contain unencrypted personal data
- [ ] JWT tokens should be in Authorization header

**Expected:** Proper authentication and authorization

---

## Phase 13: Integration Points

### Test: Donor to Chat Flow
- [ ] Donor card visible on Request Blood page ✓
- [ ] Click Chat button on DonorCard ✓
- [ ] ChatModal opens ✓
- [ ] Chat component initializes ✓
- [ ] Can send message ✓
- [ ] Message sends to correct donor ✓

### Test: Selection to Bulk Request
- [ ] Select multiple donors on Request Blood page
- [ ] Click "Send Bulk Request" button (if applicable)
- [ ] Should include selected donor IDs in request
- [ ] Backend should receive all selected donors

### Test: Return to Page After Chat
- [ ] Open chat modal
- [ ] Send a message
- [ ] Close chat modal (click X or backdrop)
- [ ] Should return to Request Blood page
- [ ] Page state preserved (selected donors still selected)
- [ ] Can open another donor's chat

**Expected:** Seamless integration between components

---

## Phase 14: Accessibility

### Test: Keyboard Navigation
- [ ] Tab through donor cards
- [ ] Space/Enter to select donor with keyboard
- [ ] Tab to Chat button, press Enter to open
- [ ] Shift+Tab to go backwards
- [ ] All interactive elements reachable via keyboard

### Test: Screen Reader
- [ ] Enable screen reader (NVDA/JAWS)
- [ ] Blood group should be announced: "O positive"
- [ ] Location should be announced: "Hyderabad"
- [ ] Buttons should be announced: "Chat button"
- [ ] Status should be announced: "Available"

### Test: Color Contrast
- [ ] Use WebAIM or similar tool
- [ ] Check contrast of text on card background
- [ ] Should meet WCAG AA standards (4.5:1 for small text)
- [ ] Check modal colors as well

### Test: Focus Indicators
- [ ] Tab through elements
- [ ] Focused elements should have visible outline
- [ ] Outline should be clearly visible
- [ ] No focus traps (can tab out of modal)

**Expected:** Application meets accessibility standards

---

## Phase 15: Cross-Browser Testing

### Test: Chrome/Edge
- [ ] Open application in Chrome
- [ ] Run through critical tests (Chat, Selection, Filtering)
- [ ] All should work
- [ ] No browser-specific errors

### Test: Firefox
- [ ] Open application in Firefox
- [ ] Run through critical tests
- [ ] Socket.io should work
- [ ] CSS should render correctly

### Test: Safari
- [ ] Open on Safari (macOS or iOS)
- [ ] Check for compatibility issues
- [ ] Socket.io connection should establish
- [ ] Gradients and CSS should display correctly

**Expected:** Application works across modern browsers

---

## Phase 16: User Workflow

### Test: Complete Blood Request Flow
1. [ ] User logs in to Blood Connect
2. [ ] Navigates to "Request Blood" page
3. [ ] Filters donors by blood group and location
4. [ ] Views donor cards (only blood group, location, availability visible)
5. [ ] Clicks Chat on a donor card
6. [ ] ChatModal opens with donor's blood group and location in header
7. [ ] Chats with donor in real-time via Socket.io
8. [ ] Closes chat modal
9. [ ] Selects multiple donors using checkboxes
10. [ ] Clicks "Submit Request" or similar
11. [ ] Request is sent to selected donors
12. [ ] Donors receive notifications

**Expected:** Complete workflow functions without issues

---

## Post-Test Cleanup

- [ ] Check console for any uncaught errors
- [ ] Monitor Network tab for failed requests
- [ ] Check for memory leaks (DevTools → Memory)
- [ ] Verify no browser warnings in console
- [ ] Document any issues found

---

## Test Results Summary

| Test Category | Status | Notes |
|---|---|---|
| Component Rendering | ⚪ | |
| Privacy & Info Hidden | ⚪ | |
| Button Functionality | ⚪ | |
| ChatModal Display | ⚪ | |
| Chat Messaging | ⚪ | |
| Donor Selection | ⚪ | |
| Location Filtering | ⚪ | |
| Responsive Design | ⚪ | |
| Dark Mode | ⚪ | |
| Database & API | ⚪ | |
| Error Handling | ⚪ | |
| Performance | ⚪ | |
| Security | ⚪ | |
| Integration Points | ⚪ | |
| Accessibility | ⚪ | |
| Cross-Browser | ⚪ | |
| User Workflow | ⚪ | |

**Legend:**  
🟢 = Pass (Working correctly)  
🟡 = Partial (Working with issues)  
🔴 = Fail (Not working)  
⚪ = Not tested

---

## Issues Found

### Issue #1
- **Category:** 
- **Severity:** (Critical/High/Medium/Low)
- **Description:** 
- **Steps to Reproduce:** 
- **Expected Behavior:** 
- **Actual Behavior:** 
- **Solution:** 

---

## Sign-Off

- **Tested By:** 
- **Date:** 
- **Environment:** 
- **Browser & OS:** 
- **Overall Status:** ⚪ Ready for Production

---

**Testing Document Version:** 1.0  
**Created:** March 11, 2026  
**Last Updated:** 
