# 🚀 Firebase Quick Start

## What We've Done ✅

1. ✅ Installed Firebase SDK
2. ✅ Created Firebase configuration
3. ✅ Built real-time services layer
4. ✅ Created React hooks for Firebase
5. ✅ Updated socket.js to use Firebase
6. ✅ Integrated Firebase into App.jsx

---

## 📝 Your Next Steps

### 1️⃣ Create Firebase Project (5 minutes)

```bash
# Go to Firebase Console
https://console.firebase.google.com/

# Click "Add Project" → Enter name → Create
```

### 2️⃣ Get Your Firebase Config (2 minutes)

```bash
# In Firebase Console:
# 1. Click web icon (</>)
# 2. Register app
# 3. Copy config object
```

### 3️⃣ Enable Realtime Database (2 minutes)

```bash
# In Firebase Console:
# Build → Realtime Database → Create Database
# Start in TEST MODE for development
# Copy the database URL
```

### 4️⃣ Update .env File (1 minute)

```bash
# Edit: frontend/.env
cd frontend
cp .env.example .env
# Then paste your Firebase config
```

**Example:**
```env
VITE_FIREBASE_API_KEY=AIzaSyC3xHZYZ...
VITE_FIREBASE_AUTH_DOMAIN=my-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=my-project-123
VITE_FIREBASE_DATABASE_URL=https://my-project-default-rtdb.firebaseio.com
```

### 5️⃣ Run Your App (1 minute)

```bash
cd frontend
npm run dev
```

---

## 🎯 Test Real-time Features

### Test 1: User Online Status
1. Open your app in 2 browser windows
2. Login as different users
3. You should see online indicators

### Test 2: Real-time Messages
1. Open chat in both windows
2. Send message from window 1
3. Message appears instantly in window 2

### Test 3: Notifications
1. Create an action (send request, etc.)
2. Notification appears in real-time
3. Bell icon shows unread count

---

## 📚 Using Firebase in Your Components

### Quick Example 1: Show Online Status

```jsx
import { useUserPresence } from './hooks/useFirebase'

function UserCard({ userId, name }) {
  const { isOnline } = useUserPresence(userId)
  
  return (
    <div>
      {name} {isOnline ? '🟢' : '⚫'}
    </div>
  )
}
```

### Quick Example 2: Real-time Messages

```jsx
import { useRealtimeMessages } from './hooks/useFirebase'

function Chat({ conversationId }) {
  const { messages, sendMessage } = useRealtimeMessages(conversationId)
  
  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>{msg.text}</div>
      ))}
      <button onClick={() => sendMessage({ text: 'Hi!' })}>
        Send
      </button>
    </div>
  )
}
```

### Quick Example 3: Notifications

```jsx
import { useNotifications } from './hooks/useFirebase'

function NotificationBell() {
  const { unreadCount } = useNotifications(currentUserId)
  
  return (
    <div>
      🔔 {unreadCount > 0 && <span>{unreadCount}</span>}
    </div>
  )
}
```

---

## 🔧 Helpful Commands

```bash
# Run setup checker
node setup-firebase.js

# Start dev server
cd frontend && npm run dev

# Check Firebase package
npm list firebase

# Install Firebase CLI (optional)
npm install -g firebase-tools
firebase login
firebase init
```

---

## 📖 Available Hooks

| Hook | Purpose | Usage |
|------|---------|-------|
| `useUserPresence(userId)` | Track user online status | `const { isOnline } = useUserPresence(userId)` |
| `useRealtimeMessages(convId)` | Real-time chat messages | `const { messages, sendMessage } = useRealtimeMessages(id)` |
| `useTypingIndicator(convId, userId)` | Show typing indicators | `const { typingUsers, setTyping } = useTypingIndicator(id, userId)` |
| `useNotifications(userId)` | Real-time notifications | `const { notifications, unreadCount } = useNotifications(userId)` |
| `useOnlineUsers()` | Track all online users | `const { onlineUsers, onlineCount } = useOnlineUsers()` |
| `useGroupMessages(groupId)` | Group chat messages | `const { messages, sendMessage } = useGroupMessages(id)` |

---

## 🛠️ Troubleshooting

### Problem: "Firebase not initialized"
**Solution:** Check if `.env` file exists with correct values

### Problem: "Permission denied"
**Solution:** In Firebase Console → Database → Rules → Set to test mode

### Problem: "Can't see real-time updates"
**Solution:** 
1. Check browser console for errors
2. Verify Firebase Database URL in `.env`
3. Make sure user is authenticated

### Problem: "Module not found: firebase"
**Solution:** Run `npm install firebase` in frontend folder

---

## 📞 Need Help?

1. Check [FIREBASE_SETUP_GUIDE.md](./FIREBASE_SETUP_GUIDE.md) for detailed guide
2. Run `node setup-firebase.js` to check your setup
3. Check browser console for Firebase errors
4. Verify Firebase Console shows your app connected

---

## 🎉 You're All Set!

Once you complete steps 1-5 above, your app will have:
- ✅ Real-time messaging
- ✅ Live notifications
- ✅ User presence tracking
- ✅ Typing indicators
- ✅ Online users count

**Start your dev server and test it out! 🚀**
