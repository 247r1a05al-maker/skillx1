# Skill Exchange Platform

A modern full-stack web application for exchanging and learning skills with a community. Built with React, Node.js, MongoDB, and Socket.io for real-time features.

## 🎯 Features

### Global Features
- **Real-time Search**: Instantly search users, skills, groups, and posts with debounce (300ms)
- **Notifications**: Real-time notifications for messages, requests, coins, and group updates
- **Online Status**: Real-time presence tracking with green dot indicators
- **JWT Authentication**: Secure authentication with token-based access
- **Responsive Design**: Works seamlessly on mobile and desktop

### Pages

#### Dashboard
- Welcome header with coins display
- Stats cards (coins, sessions, skills)
- Today's schedule
- Recent activity feed
- Quick action buttons

#### Explore/Search
- Search users with filters
- Filter by skill, level, availability, online status
- User cards with profiles and skills
- Send exchange requests or messages
- Infinite scroll

#### Skill Exchange (Core Feature)
- Manage skills you teach and want to learn
- Exchange request management
- Automatic matching suggestions
- Session scheduling with date/time picker
- Session history and coin rewards
- Request status tracking

#### Inbox (Real-time Messaging)
- 2-column professional layout
- Real-time chat with Socket.io
- Message editing and deletion
- Typing indicators
- Seen status
- File/image uploads
- Emoji picker
- Message grouping like WhatsApp

#### Groups
- Create and join groups
- Group collaboration features
- Group chat
- Shared files
- Announcements
- Real-time updates

#### Community
- Post creation (text + images)
- Like and comment system
- Post search
- Trending topics
- Infinite scroll
- Tag system

#### Coins
- Current balance display
- Transaction history
- Filter by date
- Earned through:
  - Completing sessions (100+ coins)
  - Post engagement
  - Certificates
  - Group activities

#### Certificates
- Achievements showcase
- Download PDF
- Share certificates
- Grid layout

#### Profile (Public View)
- User info and bio
- Teaching/learning skills
- Certificates
- Groups joined
- Followers/following
- Follow button
- Message button

#### Settings
- Change password
- Email settings
- Notification preferences
- Privacy options
- Dark/light mode
- Delete account

## 🛠️ Tech Stack

### Frontend
- **React 18**: UI library
- **React Router**: Navigation
- **Tailwind CSS**: Styling
- **Framer Motion**: Animations
- **Socket.io Client**: Real-time features
- **Zustand**: State management
- **Axios**: HTTP client
- **date-fns**: Date formatting

### Backend
- **Node.js**: Runtime
- **Express**: Web framework
- **MongoDB**: Database
- **Socket.io**: Real-time WebSocket
- **JWT**: Authentication
- **Bcrypt**: Password hashing
- **Mongoose**: MongoDB ODM

## 📁 Project Structure

```
skill-exchange-platform/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Layout.jsx
│   │   │   └── UI.jsx (Reusable components)
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Explore.jsx
│   │   │   ├── SkillExchange.jsx
│   │   │   ├── Inbox.jsx
│   │   │   ├── Groups.jsx
│   │   │   ├── Community.jsx
│   │   │   ├── Coins.jsx
│   │   │   ├── Certificates.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Settings.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── services/
│   │   │   ├── api.js (API client)
│   │   │   ├── index.js (API calls)
│   │   │   └── socket.js (Socket.io setup)
│   │   ├── store/
│   │   │   └── index.js (Zustand stores)
│   │   ├── hooks/
│   │   │   └── index.js (Custom hooks)
│   │   ├── utils/
│   │   │   └── helpers.js (Utilities)
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── index.html
│
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Skill.js
│   │   ├── Message.js
│   │   ├── Conversation.js
│   │   ├── ExchangeRequest.js
│   │   ├── Session.js
│   │   ├── Group.js
│   │   ├── Post.js
│   │   ├── Coin.js
│   │   ├── Certificate.js
│   │   └── Notification.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── skills.js
│   │   ├── messages.js
│   │   ├── exchanges.js
│   │   ├── groups.js
│   │   ├── posts.js
│   │   ├── coins.js
│   │   ├── certificates.js
│   │   └── notifications.js
│   ├── controllers/
│   │   └── (Controllers for business logic)
│   ├── middleware/
│   │   └── auth.js
│   ├── utils/
│   │   ├── helpers.js
│   │   └── demoRoutes.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

#### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run dev
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

**Backend (.env)**
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/skill-exchange
JWT_SECRET=your-super-secret-key-change-in-production
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

## 📱 UI Design

### Color Scheme
- **Primary**: Indigo (#4F46E5)
- **Secondary**: Purple (#6366F1)
- **Accent**: Pink (#EC4899)
- **Backgrounds**: White, Light Gray (#F9FAFB)
- **Text**: Dark Gray (#1F2937)

### Components
- Soft shadows (2px to 20px)
- Rounded corners (8px to 12px)
- Glassmorphism effects
- Smooth animations with Framer Motion
- Loading skeletons
- Empty states
- Error handling

## 🔐 Authentication

- **JWT Token**: 7-day expiration
- **Password Hashing**: Bcrypt with salt rounds
- **Protected Routes**: Client-side route protection
- **API Interceptors**: Auto token injection and 401 handling

## 🔄 Real-time Features

### Socket.io Events
- `user:online` - User comes online
- `user:offline` - User goes offline
- `message:new` - New message
- `message:updated` - Message edited
- `message:deleted` - Message deleted
- `message:seen` - Message seen status
- `message:typing` - Typing indicator
- `notification:new` - New notification
- `exchange:request` - Exchange request
- `coins:earned` - Coins earned
- `group:message` - Group message
- `group:member-joined` - Member joined group

## 📊 Database Schema

### User
- name, email, password
- avatar, bio, coins
- skillsTeaching[], skillsLearning[]
- followers[], following[]
- groups[], isOnline, lastSeen

### Skill
- userId, name, level, description
- category, yearsOfExperience
- isTeaching, isLearning

### ExchangeRequest
- fromUserId, toUserId
- skillOffered, skillRequested
- status (pending/accepted/rejected/completed)

### Message
- conversationId, senderId
- text, image, file
- isEdited, seenBy[]

### Session
- userId1, userId2
- skill1, skill2
- scheduledDate, scheduledTime
- status, coinsRewarded

### Group
- name, description, creator
- members[], tags, isPublic

### Post
- author, content, image
- tags[], likes[], comments
- shares

### Coin
- userId, balance
- totalEarned, totalSpent

### Certificate
- userId, title, skill
- issueDate, completedWith
- certificateUrl

## 🎮 Usage

### Logging In
1. Click "Sign In"
2. Enter email and password (demo: any credentials work)
3. Redirected to Dashboard

### Skill Exchange
1. Go to "Skill Exchange"
2. Add skills you teach
3. Add skills you want to learn
4. View matched users
5. Send exchange request
6. Schedule session
7. Complete and earn coins

### Messaging
1. Go to "Inbox"
2. Select or start conversation
3. Type and send messages
4. Features: edit, delete, emoji, files

### Community
1. Go to "Community"
2. Create post
3. Add tags and images
4. Like, comment, share posts
5. Infinite scroll feed

## 🔧 API Endpoints

All endpoints require JWT authentication header:
```
Authorization: Bearer <token>
```

### Auth
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Current user

### Users
- `GET /api/users/:userId` - Get profile
- `PUT /api/users/:userId` - Update profile
- `GET /api/users/search?q=query` - Search
- `GET /api/users/online` - Online users

### Skills
- `GET /api/skills/my-skills` - My skills
- `POST /api/skills` - Add skill
- `PUT /api/skills/:skillId` - Update
- `DELETE /api/skills/:skillId` - Delete

### Messages
- `GET /api/messages/conversations` - Conversations
- `GET /api/messages/conversations/:id` - Messages
- `POST /api/messages/conversations/:id` - Send
- `PUT /api/messages/:id` - Edit
- `DELETE /api/messages/:id` - Delete

### Exchanges
- `POST /api/exchanges/request` - Send request
- `GET /api/exchanges/requests` - Get requests
- `PUT /api/exchanges/requests/:id/accept` - Accept
- `GET /api/exchanges/matches` - Matches
- `POST /api/exchanges/schedule` - Schedule

### Groups
- `GET /api/groups` - All groups
- `POST /api/groups` - Create
- `POST /api/groups/:id/join` - Join
- `POST /api/groups/:id/leave` - Leave

### Posts
- `GET /api/posts` - All posts
- `POST /api/posts` - Create
- `POST /api/posts/:id/like` - Like
- `POST /api/posts/:id/comments` - Comment

### Coins
- `GET /api/coins/balance` - Balance
- `GET /api/coins/history` - History

### Certificates
- `GET /api/certificates` - All
- `POST /api/certificates` - Generate
- `GET /api/certificates/:id/download` - Download

## 🎨 Styling Highlights

- **Sidebar**: Fixed left navigation with Discord-like design
- **Cards**: Soft shadows, rounded corners, hover effects
- **Animations**: Page transitions, button hovers, loading states
- **Responsive**: Mobile-first design with Tailwind breakpoints
- **Accessibility**: Proper contrast, focus states, semantic HTML

## 📝 Notes

- Mock data is used for demonstration
- Backend API routes are set up but need full implementation
- Socket.io connection established with mock events
- All UI is production-ready and responsive
- No rating system - coins only
- Professional startup-level design

## 🚀 Next Steps

1. **Implement API Controllers**: Add business logic to backend routes
2. **Connect Real Database**: Replace mock data with MongoDB queries
3. **Deploy**: Use Vercel (frontend) and Heroku/Railway (backend)
4. **Testing**: Add unit and integration tests
5. **Monitoring**: Set up error tracking and analytics
6. **Optimization**: Image optimization, code splitting, caching

## 📄 License

MIT

## 👥 Contributors

Built with ❤️ for the learning community.
