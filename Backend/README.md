# IntelliMeet Backend – Week 1 Setup

## Project Overview

IntelliMeet is a real-time meeting and collaboration platform built using the MERN stack.

This backend includes:

* Express.js server
* MongoDB connection
* JWT authentication
* bcrypt password hashing
* Socket.io setup
* Meeting APIs
* Chat structure
* Middleware
* Professional backend architecture

---

# Technologies Used

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT
* bcryptjs
* Socket.io
* dotenv
* cors
* helmet
* express-rate-limit
* Redis (starter setup)
* Cloudinary (starter setup)

---

# Backend Folder Structure

```text
backend/
│
├── config/
│   └── db.js
│
├── controllers/
│   ├── authController.js
│   ├── chatController.js
│   └── meetingController.js
│
├── middleware/
│   ├── authMiddleware.js
│   └── rateLimiter.js
│
├── models/
│   ├── User.js
│   └── Meeting.js
│
├── routes/
│   ├── authRoutes.js
│   ├── chatRoutes.js
│   └── meetingRoutes.js
│
├── socket/
│   └── socketHandler.js
│
├── .env
├── package.json
├── package-lock.json
└── server.js
```

---

# Installation

## Clone Repository

```bash
git clone <repository-url>
```

---

## Move Into Backend Folder

```bash
cd backend
```

---

# Install Dependencies

```bash
npm install
```

Or manually install:

```bash
npm install express mongoose dotenv cors helmet bcryptjs jsonwebtoken socket.io express-rate-limit redis cloudinary multer
```

---

# Environment Variables

Create a `.env` file inside backend folder.

Example:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/intellmeet
JWT_SECRET=mysecretkey
```

---

# Run Backend Server

```bash
node server.js
```

Expected Output:

```text
MongoDB Connected
Server running on port 5000
```

---

# API Endpoints

## Authentication APIs

### Register User

```text
POST /api/auth/register
```

### Login User

```text
POST /api/auth/login
```

---

## Meeting APIs

### Create Meeting

```text
POST /api/meeting
```

### Get Meetings

```text
GET /api/meeting
```

---

# Authentication Features

* JWT authentication
* bcrypt password hashing
* Protected routes
* Rate limiting middleware

---

# Socket.io Features

* Real-time communication setup
* Join room event
* Send message event
* Receive message event
* Meeting room communication starter

---

# Current Features Completed

## Backend Foundation

* Express backend setup
* MongoDB connection structure
* Professional folder structure
* REST APIs
* Middleware setup
* Authentication structure
* Socket.io setup
* Meeting structure
* Chat structure

---

# Testing APIs

Use:

* Thunder Client
* Postman

---

# Example Register Request

```json
{
  "name": "Ajit",
  "email": "aji@gmail.com",
  "password": "123456"
}
```

---

# Example Login Request

```json
{
  "email": "aji@gmail.com",
  "password": "123456"
}
```

---

# Security Features

* Helmet security middleware
* CORS configuration
* JWT authentication
* Password hashing
* Rate limiting

---

# Pending Features

* Full WebRTC implementation
* Redis caching
* Cloudinary uploads
* Frontend integration
* Video/audio streaming
* Real-time notifications
* Production deployment

---

# Week 1 Progress

* Backend setup
* Authentication structure
* MongoDB structure
* Meeting APIs
* Socket.io starter setup
* Middleware setup
* Testing setup

---

# Team Responsibilities

| Member       | Responsibility                    |
| ------------ | --------------------------------- |
| Ajit         | Backend APIs + Socket.io + WebRTC |
| Team Members | MongoDB, Frontend, Deployment     |

---

# Project Status

```text
Week 1 Backend Foundation on running.
```

---

# Author

Ajit – Backend Developer
