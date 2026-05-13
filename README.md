# 🚀 CollabSpace

**CollabSpace** is a premium, real-time collaborative document editor built with the MERN stack. It offers a seamless, high-performance experience for teams to create, discuss, and build together in a secure, distraction-free environment.

![CollabSpace Interface](https://img.shields.io/badge/Status-Production--Ready-brightgreen)
![MERN Stack](https://img.shields.io/badge/Stack-MERN-blue)
![Realtime](https://img.shields.io/badge/Sync-Socket.io-orange)
![PWA](https://img.shields.io/badge/PWA-Ready-purple)

## ✨ Key Features

- **Real-time Collaboration**: Multiple users can edit the same document simultaneously with zero lag.
- **Instant Team Chat**: Embedded chat window for seamless team communication without leaving the workspace.
- **Push Notifications (PWA)**: Cross-platform Web Push notifications keep you updated on document shares and mentions, even when offline.
- **Smart Security**: Role-based access control (Owner, Editor, Viewer) to keep your documents safe.
- **Modern UI/UX**: Premium glassmorphic design with a dedicated Dark Mode and smooth animations.
- **Cloud Sync**: All changes are automatically saved to a MongoDB cluster.
- **Export Options**: Download your work as high-quality DOCX files.
- **User Dashboard**: Manage all your private and shared documents in one clean interface.

## 🛠️ Tech Stack

- **Frontend**: React (Vite), TypeScript, Tailwind CSS, Framer Motion (motion/react), Lucide Icons, PWA Service Workers.
- **Backend**: Node.js, Express.js, Google Gemini API.
- **Database**: MongoDB (Mongoose).
- **Real-time**: Socket.io.
- **Authentication**: JWT (JSON Web Tokens) with Bcrypt password hashing.

## 🚀 Getting Started

### Prerequisites
- Node.js installed
- MongoDB URI (Local or Atlas)

### Local Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/KavyaPatel2210/Collab-Space.git
   cd Collab-Space
   ```

2. **Backend Setup**:
   ```bash
   cd backend
   npm install
   # Create a .env file with:
   # PORT=5000
   # MONGO_URI=your_mongodb_uri
   # JWT_SECRET=your_secret
   npm run dev
   ```

3. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 🌐 Deployment

- **Backend**: Optimized for deployment on **Render**.
- **Frontend**: Optimized for deployment on **Vercel** (includes `vercel.json` for routing).

---
Built with ❤️ by [Kavya Patel](https://github.com/KavyaPatel2210)
