# 🎬 Kundapura Edits Studio — Full-Stack Platform

> **Nimma video, namma editing magic ✨**
> A production-ready video editing service platform built for Kundapura, Karnataka.

---

## 📁 Project Structure

```
kundapura-edits/
│
├── backend/                    # Node.js + Express API
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── middleware/
│   │   └── authMiddleware.js   # JWT authentication
│   ├── models/
│   │   ├── Video.js            # Video schema
│   │   ├── Review.js           # Review schema
│   │   └── Booking.js          # Booking schema
│   ├── routes/
│   │   ├── authRoutes.js       # POST /api/admin/login
│   │   ├── videoRoutes.js      # CRUD /api/videos
│   │   ├── reviewRoutes.js     # CRUD /api/reviews
│   │   └── bookingRoutes.js    # CRUD /api/bookings
│   ├── uploads/                # Uploaded video files (local storage)
│   └── server.js               # Express app entry point
│
├── frontend/                   # Static HTML/CSS/JS
│   ├── js/
│   │   ├── toast.js            # Toast notification system
│   │   ├── script.js           # Main frontend logic
│   │   └── admin.js            # Admin panel logic
│   ├── index.html              # Public website
│   ├── admin.html              # Admin panel
│   ├── styles.css              # Main styles (dark cinematic theme)
│   └── admin.css               # Admin panel styles
│
├── .env.example                # Environment variable template
├── .gitignore
├── package.json
└── README.md
```

---

## ⚙️ Prerequisites

Make sure you have these installed:

| Tool    | Version  | Download |
|---------|----------|----------|
| Node.js | ≥ 18.0.0 | [nodejs.org](https://nodejs.org) |
| npm     | ≥ 8.0.0  | (comes with Node) |
| MongoDB | ≥ 6.0    | [mongodb.com](https://www.mongodb.com/try/download/community) |

---

## 🚀 Setup & Installation

### Step 1 — Clone / Download the project

```bash
# If using Git
git clone <your-repo-url>
cd kundapura-edits

# Or just navigate to the downloaded folder
cd kundapura-edits
```

### Step 2 — Install dependencies

```bash
npm install
```

### Step 3 — Configure environment

```bash
# Copy the example env file
cp .env.example .env

# Open .env and edit the values:
nano .env   # or use VS Code: code .env
```

**Edit these values in `.env`:**

```env
PORT=5000
NODE_ENV=development

# MongoDB — local
MONGO_URI=mongodb://localhost:27017/kundapura_edits

# OR MongoDB Atlas (cloud — recommended for production)
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/kundapura_edits

# JWT Secret — change this to something long and random!
JWT_SECRET=change_this_to_a_long_random_string_minimum_32_chars

# Admin login credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_strong_password_here

# Max video file size in MB
MAX_FILE_SIZE_MB=200
```

### Step 4 — Start MongoDB (if using local)

```bash
# macOS / Linux
mongod

# Windows
"C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe"

# Or if using MongoDB as a service
sudo systemctl start mongod  # Linux
brew services start mongodb-community  # macOS with Homebrew
```

### Step 5 — Start the server

```bash
# Development mode (auto-restart on file changes)
npm run dev

# Production mode
npm start
```

### Step 6 — Open in browser

```
🌐 Website:    http://localhost:5000
🔑 Admin:      http://localhost:5000/admin
📡 API Health: http://localhost:5000/api/health
```

---

## 🔐 Admin Login

Default credentials (set in `.env`):

| Field    | Default         |
|----------|-----------------|
| Username | `admin`         |
| Password | `admin@ke2025`  |

> ⚠️ **Change these before deploying to production!**

---

## 📡 REST API Reference

### Authentication
| Method | Endpoint              | Description       | Auth |
|--------|-----------------------|-------------------|------|
| POST   | `/api/admin/login`    | Login as admin    | ❌   |
| GET    | `/api/admin/verify`   | Verify JWT token  | ✅   |

### Videos
| Method | Endpoint              | Description            | Auth |
|--------|-----------------------|------------------------|------|
| GET    | `/api/videos`         | Get all videos         | ❌   |
| GET    | `/api/videos/:id`     | Get single video       | ❌   |
| POST   | `/api/videos`         | Upload new video       | ✅   |
| PUT    | `/api/videos/:id`     | Edit video             | ✅   |
| DELETE | `/api/videos/:id`     | Delete video           | ✅   |

**Query params for GET /api/videos:**
- `?category=wedding` — filter by category
- `?page=1&limit=10` — pagination

### Reviews
| Method | Endpoint                      | Description          | Auth |
|--------|-------------------------------|----------------------|------|
| GET    | `/api/reviews/:videoId`       | Get reviews for video| ❌   |
| GET    | `/api/reviews`                | Get ALL reviews      | ✅   |
| POST   | `/api/reviews`                | Submit a review      | ❌   |
| PATCH  | `/api/reviews/:id/approve`    | Toggle approval      | ✅   |
| DELETE | `/api/reviews/:id`            | Delete review        | ✅   |

### Bookings
| Method | Endpoint                      | Description           | Auth |
|--------|-------------------------------|-----------------------|------|
| POST   | `/api/bookings/session`       | Book expressing session| ❌  |
| POST   | `/api/bookings/counsellor`    | Apply as counsellor   | ❌   |
| GET    | `/api/bookings`               | Get all bookings      | ✅   |
| PATCH  | `/api/bookings/:id/status`    | Update booking status | ✅   |
| DELETE | `/api/bookings/:id`           | Delete booking        | ✅   |

**Query params for GET /api/bookings:**
- `?type=session` or `?type=counsellor`
- `?status=new`

---

## 📤 Uploading Videos (Admin)

1. Go to `http://localhost:5000/admin`
2. Login with your admin credentials
3. Click **"Upload Video"** tab
4. Either:
   - **Upload a file** (MP4, WebM, MOV, AVI — max 200MB)
   - **OR paste a URL** (YouTube embed URL, Cloudinary URL, direct link)
5. Fill in title and category
6. Click **Upload Video**

The video will appear in the Portfolio section on the main website immediately.

---

## 🗄️ Database Schemas

### Video
```json
{
  "title": "Rohan & Priya Wedding Highlight",
  "category": "wedding | reels | youtube | ads",
  "videoUrl": "/uploads/filename.mp4",
  "description": "Optional description",
  "isActive": true,
  "views": 0,
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

### Review
```json
{
  "videoId": "<Video ObjectId>",
  "name": "Ravi Shetty",
  "rating": 5,
  "comment": "Bahala channagide!",
  "isApproved": true,
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

### Booking
```json
{
  "type": "session | counsellor",
  "name": "Ramesh Shetty",
  "email": "ramesh@example.com",
  "phone": "9380916728",
  "projectType": "wedding",
  "message": "I need editing for my wedding video",
  "skills": "(counsellor only)",
  "experience": "(counsellor only)",
  "portfolioLink": "(counsellor only)",
  "status": "new | reviewed | contacted | closed",
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

---

## 🌐 Deployment Guide

### Option A — Deploy on Render (Free)

1. Create account at [render.com](https://render.com)
2. Connect your GitHub repo
3. Create a **Web Service**:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Add all environment variables from `.env`
5. Use **MongoDB Atlas** for your database (free tier available)

### Option B — Deploy on Railway

1. Create account at [railway.app](https://railway.app)
2. Create new project → Deploy from GitHub
3. Add MongoDB plugin (or use Atlas)
4. Set environment variables in the dashboard

### Option C — VPS (DigitalOcean / AWS EC2)

```bash
# On your server
git clone <repo>
cd kundapura-edits
npm install
cp .env.example .env
nano .env  # Set production values

# Use PM2 for process management
npm install -g pm2
pm2 start backend/server.js --name "ke-studio"
pm2 startup
pm2 save

# Use Nginx as reverse proxy
# Point your domain to the server IP
# Configure SSL with Let's Encrypt (certbot)
```

---

## 💳 Razorpay Integration (Future)

When you're ready to enable payments, follow these steps:

1. Create account at [razorpay.com](https://razorpay.com)
2. Get your API Key ID and Secret
3. Add to `.env`:
   ```env
   RAZORPAY_KEY_ID=rzp_test_xxxxx
   RAZORPAY_KEY_SECRET=your_secret
   ```
4. Install: `npm install razorpay`
5. Update `backend/server.js` — replace the placeholder `/api/payment/create-order` route with:
   ```js
   const Razorpay = require('razorpay');
   const rzp = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
   // Create order, verify payment signature, etc.
   ```

---

## 🔧 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| `MongoDB connection refused` | Make sure `mongod` is running |
| `Port 5000 already in use` | Change `PORT` in `.env` or kill process: `lsof -ti:5000 \| xargs kill` |
| `File too large error` | Increase `MAX_FILE_SIZE_MB` in `.env` |
| `JWT invalid` | Check `JWT_SECRET` is set in `.env` |
| `CORS error` | Add your frontend URL to `FRONTEND_URL` in `.env` |
| Videos not showing | Check browser console; ensure backend is running |

---

## 📞 Contact

**Kundapura Edits Studio**
- 📧 devadigasampath238@gmail.com
- 📞 +91 93809 16728
- 📸 [@shank_frames](https://www.instagram.com/shank_frames?igsh=MWc5aDQwdHNwZ3Juaw==)
- 📍 Kundapura, Udupi District, Karnataka — 576201

---

*Yentilla, start maadona? 🎬*
