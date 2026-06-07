# IntellMeet — Advanced Video Conferencing

A full-stack video conferencing application with AI-powered features, built with React + TypeScript frontend and Node.js/Express backend. Styled with a premium dark/light theme inspired by Zoom and Google Meet.

## ✨ Features

- **HD Video Conferencing** — WebRTC peer-to-peer video/audio
- **Screen Sharing** — Share your screen with all participants  
- **Live Chat** — Real-time messaging with typing indicators
- **AI Transcription** — Powered by OpenAI Whisper
- **AI Summaries** — GPT-4o-mini generates meeting summaries
- **Action Items** — Automatic extraction with owners and due dates
- **Dark / Light Mode** — Premium theme toggle
- **Lobby Pre-join** — Camera/mic check before entering
- **Participant Management** — See who's in the room
- **Meeting PIN/Spotlight** — Click to spotlight any participant

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Redis (optional — falls back to in-memory)

### 1. Backend Setup

```bash
cd Backend
cp .env.example .env
# Edit .env with your values
npm install
node server.js
```

### 2. Frontend Setup

```bash
cd Frontend
npm install
npm run dev
```

The app will be running at `http://localhost:5173`

---

## 🐳 Docker (recommended)

```bash
cp Backend/.env.example Backend/.env
# Edit Backend/.env

docker-compose up -d
```

Frontend: http://localhost:5173  
Backend: http://localhost:5000

---

## ⚙️ Environment Variables

### Backend `.env`
```
PORT=5000
MONGO_URL=mongodb://localhost:27017/intellimeet
JWT_SECRET=your_secret_here
REDIS_URL=mock               # or redis://localhost:6379
OPENAI_API_KEY=mock          # or your real key for AI features
```

> Set `REDIS_URL=mock` and `OPENAI_API_KEY=mock` to run without those services. AI features will return realistic mock data.

### Frontend `.env`
```
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

---

## 🏗️ Architecture

```
intellimeet/
├── Backend/
│   ├── config/           # DB, Redis, Cloudinary
│   ├── controllers/      # Auth, Meeting, AI, Task
│   ├── middleware/       # JWT auth, rate limiting
│   ├── models/           # Mongoose schemas
│   ├── routes/           # Express routers
│   ├── socket/           # Socket.io handler (WebRTC signaling)
│   └── server.js         # Entry point
│
└── Frontend/
    └── src/
        ├── api/          # Axios client + API wrappers
        ├── components/
        │   ├── ai/       # AI panel (transcription + summary)
        │   ├── chat/     # Chat panel
        │   └── meeting/  # VideoTile, ParticipantsPanel
        ├── hooks/        # useWebRTC, useSocket
        ├── pages/        # Login, Register, Dashboard, Lobby, Room
        ├── store/        # Zustand auth store
        └── App.tsx       # Routes
```

---

## 📡 API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/register | No | Create account |
| POST | /auth/login | No | Sign in |
| GET | /auth/profile | Yes | Get profile |
| POST | /meeting | Yes | Create meeting |
| GET | /meeting | Yes | List meetings |
| POST | /ai/transcribe | Yes | Transcribe audio (Whisper) |
| POST | /ai/summary | Yes | Generate summary (GPT-4o) |

---

## 🎨 Tech Stack

**Frontend:** React 18 + TypeScript, Vite, Tailwind CSS, Zustand, TanStack Query, Socket.io-client, WebRTC APIs

**Backend:** Node.js, Express 5, MongoDB + Mongoose, Socket.io, Redis, JWT, bcrypt, OpenAI SDK, Cloudinary
