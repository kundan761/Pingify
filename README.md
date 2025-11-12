# Pingify - Real-time Chat Application

A complete MERN stack real-time chat application with modern architecture, glassmorphic UI, and advanced features.

## 🚀 Features

- **Real-time Messaging**: Socket.io powered instant messaging
- **Private & Group Chats**: 1:1 and group conversations
- **File Sharing**: Upload and share images, videos, and files
- **User Management**: Profile, settings, and privacy controls
- **Notifications**: Real-time notifications with Redis
- **Authentication**: JWT with refresh tokens, email verification
- **Modern UI**: Glassmorphic design with TailwindCSS and Framer Motion

## 📁 Project Structure

```
chat-app/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── chats/
│   │   │   ├── messages/
│   │   │   ├── groups/
│   │   │   ├── notifications/
│   │   │   └── files/
│   │   ├── config/
│   │   ├── middlewares/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── store/
│   │   ├── services/
│   │   ├── utils/
│   │   └── styles/
│   └── package.json
└── README.md
```

## 🛠️ Tech Stack

### Backend
- Node.js, Express.js
- MongoDB (Mongoose)
- Socket.io
- Redis
- JWT, Argon2
- Multer, Cloudinary
- Winston (Logging)
- Zod (Validation)

### Frontend
- React (Vite)
- Redux Toolkit
- React Router
- Socket.io-client
- TailwindCSS
- Framer Motion
- Axios

## 📦 Installation

### Prerequisites
- Node.js (v18+)
- MongoDB
- Redis

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## ⚙️ Environment Variables

### Backend (.env)

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/pingify
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=http://localhost:5173
```

## 🎨 Features Overview

### Authentication
- JWT with refresh tokens
- Email verification
- Password reset
- Role-based access (user/admin)

### Chat Features
- Real-time messaging
- Typing indicators
- Message read receipts
- Edit/delete messages
- Message reactions
- Reply to messages

### Group Features
- Create/join groups
- Admin and moderator roles
- Member management
- Group settings

### Media & Files
- Image/video/file uploads
- Cloudinary integration
- File preview

### Notifications
- Real-time notifications
- Unread message counts
- Email fallback

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh-token` - Refresh token
- `GET /api/auth/verify-email` - Verify email
- `POST /api/auth/forgot-password` - Forgot password
- `POST /api/auth/reset-password` - Reset password

### Users
- `GET /api/users/profile` - Get profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/search` - Search users
- `POST /api/users/block/:userId` - Block user
- `POST /api/users/unblock/:userId` - Unblock user

### Chats
- `GET /api/chats` - Get all chats
- `GET /api/chats/:chatId` - Get chat
- `POST /api/chats` - Create chat
- `DELETE /api/chats/:chatId` - Delete chat

### Messages
- `GET /api/messages/chat/:chatId` - Get messages
- `POST /api/messages` - Send message
- `PUT /api/messages/:messageId` - Edit message
- `DELETE /api/messages/:messageId` - Delete message
- `POST /api/messages/:messageId/react` - React to message
- `POST /api/messages/chat/:chatId/read` - Mark as read

### Groups
- `GET /api/groups/my-groups` - Get my groups
- `GET /api/groups/:groupId` - Get group
- `POST /api/groups` - Create group
- `PUT /api/groups/:groupId` - Update group
- `POST /api/groups/:groupId/members` - Add members
- `DELETE /api/groups/:groupId/members/:userId` - Remove member
- `POST /api/groups/:groupId/moderators/:userId` - Promote to moderator
- `POST /api/groups/:groupId/leave` - Leave group

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:notificationId/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:notificationId` - Delete notification

## 🔒 Security

- Helmet for security headers
- CORS configuration
- Rate limiting
- Input validation (Zod)
- Password hashing (Argon2)
- JWT authentication
- Socket.io authentication middleware

## 📊 Logging

- Winston logger with daily rotation
- Logs stored in `/logs` directory
- No console.logs in production code

## 🚀 Deployment

### Backend
1. Set environment variables
2. Build: `npm start`
3. Deploy to your server

### Frontend
1. Update API URLs in environment
2. Build: `npm run build`
3. Deploy `dist` folder

## 📄 License

MIT

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
