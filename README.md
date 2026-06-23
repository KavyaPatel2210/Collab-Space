# 🚀 CollabSpace

**CollabSpace** is a premium, real-time collaborative workspace built with the MERN stack. It goes beyond a simple document editor — offering live voice huddles, AI-powered writing assistance, team workspaces, live cursor presence, and cross-platform push notifications, all wrapped in a stunning glassmorphic dark UI.

![Status](https://img.shields.io/badge/Status-Production--Ready-brightgreen)
![Stack](https://img.shields.io/badge/Stack-MERN-blue)
![Realtime](https://img.shields.io/badge/Sync-Socket.io-orange)
![WebRTC](https://img.shields.io/badge/Voice-WebRTC-red)
![AI](https://img.shields.io/badge/AI-Gemini%202.5-purple)
![PWA](https://img.shields.io/badge/PWA-Ready-teal)

---

## ✨ Features

### 📝 Real-time Document Collaboration
- Multiple users can edit the same document **simultaneously** with zero lag via Socket.io.
- Document changes are **auto-saved** to MongoDB in real time.
- Full **role-based access control**: Owner, Editor, and Viewer roles per document.
- Invite collaborators by email with instant in-app and push notifications.
- **Version History**: Every save state is tracked, allowing users to restore previous document versions.

### 🎙️ Voice Huddles (WebRTC)
- Start or join a **live voice huddle** directly inside any document — no third-party apps needed.
- Built on **WebRTC peer-to-peer** audio with Socket.io used for signalling (offers, answers, ICE candidates).
- Real-time **active speaker detection** with visual indicators on participant avatars.
- Mute/unmute toggle with immediate feedback. Huddle state auto-cleans when all participants leave or disconnect.

### 🤖 AI Writing Assistant (Gemini)
- Context-aware AI assistant powered by **Google Gemini 2.5 Flash / Pro** with automatic model fallback.
- Supports **multi-turn chat history** within a session.
- The AI is automatically provided with the **current document content** as context for relevant suggestions.
- Gracefully handles rate limits (429) and high-demand errors (503) by cycling through fallback models.

### 👥 Team Workspaces
- Create and manage **teams** with a name and description.
- Invite members by email; members receive a real-time notification upon invitation.
- Team **admin/member role system**: only admins and owners can invite or update team settings.
- View all **team documents** in a dedicated workspace page.
- Deleting a team cascades and removes all associated team documents.

### 🖱️ Live Cursor Presence
- See **other users' cursors** move in real time across the shared document canvas.
- Each collaborator is assigned a unique color for easy identification.
- Cursors are cleanly removed when a user leaves the document.

### 🔦 Spotlight Mode
- Collaborators can activate a **spotlight pointer** to draw everyone's attention to a specific part of the document.
- Spotlight position is broadcast in real time to all users in the document room.

### 💬 In-Document Team Chat
- Embedded **chat panel** inside the editor for seamless team communication.
- Messages are persisted in MongoDB and broadcast in real time to all users in the document room.
- Sends **notifications** to offline collaborators via Web Push when a new message is received.
- Typing indicators keep collaborators aware of active communication.

### 🔔 Smart Notifications (In-App + Push)
- Real-time **in-app notifications** delivered via Socket.io to a user's private room (`user_<id>`).
- **Web Push Notifications** (via VAPID / `web-push`) for offline devices — works when the app is closed.
- Push is only enabled when the app is **installed as a PWA** (standalone mode), respecting user intent.
- Notifications for: document shares, team invitations, and new chat messages.
- Mark individual or all notifications as read.

### 📤 Export Options
- Download documents as **DOCX** files (via the `docx` library).
- Export as **PDF** (via `jspdf` + `html2pdf.js`).

### 🎨 Premium UI/UX
- **Glassmorphic dark mode** design with smooth Framer Motion animations.
- Fully responsive layout built with **Tailwind CSS v4** and **Radix UI** primitives.
- Rich component library including modals, dropdowns, avatars, toasts (Sonner), and more.
- **PWA-ready** with a service worker and installable manifest.

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + Vite + TypeScript | Core UI framework & build tool |
| Tailwind CSS v4 | Utility-first styling |
| Framer Motion (`motion/react`) | Animations & transitions |
| Radix UI | Accessible headless UI primitives |
| MUI (Material UI) | Supplementary UI components |
| Socket.io-client | Real-time communication |
| WebRTC (Browser API) | Peer-to-peer voice in huddles |
| Lucide React | Icon library |
| Axios | HTTP client |
| `docx` + `jspdf` + `html2pdf.js` | Document export |
| Sonner | Toast notifications |
| React Router v7 | Client-side routing |
| `next-themes` | Dark/light mode theming |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express.js v5 | REST API server |
| MongoDB + Mongoose | Database & ODM |
| Socket.io | Real-time events (collaboration, chat, huddle signalling, notifications) |
| JWT + Bcrypt | Authentication & password hashing |
| `@google/generative-ai` | Gemini AI integration |
| `web-push` | Web Push notifications (VAPID) |
| `cookie-parser` | Cookie middleware |
| `dotenv` | Environment variable management |
| `nodemon` | Development auto-reload |

---

## 📁 Project Structure

```
CollabSpace/
├── frontend/
│   ├── src/app/
│   │   ├── pages/              # Route-level page components
│   │   │   ├── landing-page.tsx
│   │   │   ├── login-page.tsx
│   │   │   ├── dashboard-page.tsx
│   │   │   ├── editor-page.tsx
│   │   │   ├── teams-page.tsx
│   │   │   └── team-workspace-page.tsx
│   │   ├── components/
│   │   │   ├── editor/         # Editor-specific components
│   │   │   │   ├── AIAssistantPanel.tsx
│   │   │   │   ├── HuddlePanel.tsx
│   │   │   │   ├── CursorOverlay.tsx
│   │   │   │   └── SpotlightOverlay.tsx
│   │   │   ├── ui/             # Shared UI primitives
│   │   │   ├── layout/         # Layout components
│   │   │   ├── Navbar.tsx
│   │   │   ├── Logo.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── hooks/              # Custom React hooks
│   │   │   ├── useAIAssistant.ts
│   │   │   ├── useCursorPresence.ts
│   │   │   ├── useDocuments.ts
│   │   │   ├── useHuddle.ts    # WebRTC voice huddle logic
│   │   │   ├── useNotifications.ts
│   │   │   ├── usePWA.ts
│   │   │   ├── useSpotlight.ts
│   │   │   └── useTeams.ts
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx
│   │   └── lib/
│   │       ├── api.ts          # Axios instance
│   │       └── socket.ts       # Socket.io client singleton
│   └── public/                 # PWA assets (icons, manifest, service worker)
│
└── backend/
    ├── controllers/
    │   ├── aiController.js         # Gemini AI with model fallback
    │   ├── authController.js       # JWT auth (register/login)
    │   ├── chatController.js       # Chat message history
    │   ├── documentController.js   # CRUD, collaborator management, notifications
    │   ├── notificationController.js
    │   └── teamController.js       # Teams CRUD, member management
    ├── models/
    │   ├── User.js
    │   ├── Document.js
    │   ├── Team.js
    │   ├── Message.js
    │   ├── Notification.js
    │   └── VersionHistory.js
    ├── routes/                 # Express route definitions
    ├── sockets/
    │   └── socketManager.js    # All socket event handlers (collab, chat, huddle, WebRTC, presence)
    ├── utils/
    │   └── webpush.js          # VAPID push notification utility
    └── server.js               # App entry point
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+ recommended)
- **MongoDB** URI (Local or Atlas)
- **Google Gemini API Key** (for AI assistant)
- **VAPID Keys** for Web Push (generate with `npx web-push generate-vapid-keys`)

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
   ```
   Create a `.env` file in the `backend/` directory:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   CLIENT_URL=http://localhost:5173
   GEMINI_API_KEY=your_gemini_api_key
   VAPID_PUBLIC_KEY=your_vapid_public_key
   VAPID_PRIVATE_KEY=your_vapid_private_key
   VAPID_EMAIL=mailto:your@email.com
   ```
   ```bash
   npm run dev
   ```

3. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

The frontend will be available at `http://localhost:5173` and the backend at `http://localhost:5000`.

---

## 🌐 Deployment

- **Backend**: Optimized for deployment on **Render** (set all `.env` variables in the Render dashboard).
- **Frontend**: Optimized for **Vercel** — includes a `vercel.json` for SPA routing. Set `VITE_API_URL` to your deployed backend URL.

---

## 🔌 API Overview

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login and receive a JWT |
| `GET` | `/api/documents` | Get all accessible documents |
| `POST` | `/api/documents` | Create a new document |
| `GET` | `/api/documents/:id` | Get a specific document |
| `PUT` | `/api/documents/:id` | Update document content/title |
| `DELETE` | `/api/documents/:id` | Delete a document (owner only) |
| `POST` | `/api/documents/:id/collaborators` | Invite a collaborator by email |
| `DELETE` | `/api/documents/:id/leave` | Leave a shared document |
| `GET` | `/api/teams` | Get all teams for current user |
| `POST` | `/api/teams` | Create a new team |
| `PUT` | `/api/teams/:id` | Update team details |
| `DELETE` | `/api/teams/:id` | Delete a team (owner only) |
| `POST` | `/api/teams/:id/members` | Invite a member to a team |
| `DELETE` | `/api/teams/:id/members/me` | Leave a team |
| `GET` | `/api/teams/:id/documents` | Get all documents in a team |
| `POST` | `/api/teams/:id/documents` | Create a document in a team |
| `POST` | `/api/ai/generate` | Generate AI content via Gemini |
| `GET` | `/api/notifications` | Get all notifications |
| `PUT` | `/api/notifications/:id/read` | Mark a notification as read |
| `PUT` | `/api/notifications/read-all` | Mark all notifications as read |
| `GET` | `/api/notifications/vapid-key` | Get public VAPID key for push |
| `POST` | `/api/notifications/subscribe` | Register a push subscription |

---

Built with ❤️ by [Kavya Patel](https://github.com/KavyaPatel2210)
