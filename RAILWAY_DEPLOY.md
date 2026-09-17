# 🚀 Railway Deployment Guide: Frontend, Backend & Database

This guide explains how to host the complete **POS Order & Inventory System** (React Frontend, Node.js Backend, and MongoDB Database) on **[Railway](https://railway.app)**.

---

## 🏗️ Architecture Options

### Option 1: Unified Fullstack + Railway MongoDB (Recommended ⭐)
- **1 Web Service**: Builds React with Vite, serves both the compiled frontend and Express API on a single port.
- **1 Database Service**: Managed Railway MongoDB container with persistent storage.
- **Benefits**:
  - Zero CORS configuration.
  - Single public domain (`https://pos-production.up.railway.app`).
  - Minimum resource usage and lowest cost on Railway.

```
┌─────────────────────────────────────────────────────────────┐
│                       Railway Project                       │
│                                                             │
│  ┌─────────────────────────┐     Internal / MONGO_URL       │
│  │   Fullstack Service     │ ────────────────────────────── │
│  │  - React Frontend (Vite)│                                │
│  │  - Express.js API       │         ┌───────────────────┐  │
│  │  - Expiry Worker        │         │  Railway MongoDB  │  │
│  │  - Port 0.0.0.0:$PORT   │         │ (Persistent Vol)  │  │
│  └─────────────────────────┘         └───────────────────┘  │
│               │                                             │
│               ▼                                             │
│     Public Railway Domain                                   │
│  (https://*.up.railway.app)                                 │
└─────────────────────────────────────────────────────────────┘
```

---

### Option 2: Microservices (3 Separate Services)
- **Frontend Service**: React SPA built with Vite.
- **Backend Service**: Express API connecting to MongoDB.
- **Database Service**: Railway MongoDB.
- Set `VITE_API_URL=https://your-backend.up.railway.app` in the frontend service environment variables.

---

## 📋 Step-by-Step Deployment (Option 1: Recommended)

### Step 1: Push Your Code to GitHub
Ensure all latest files (including `railway.json`, `Dockerfile`, `.dockerignore`) are pushed to your GitHub repository:
```bash
git add .
git commit -m "feat: add Railway deployment support"
git push origin main
```

---

### Step 2: Create a Project on Railway
1. Go to [Railway Dashboard](https://railway.app/dashboard).
2. Click **"+ New Project"**.
3. Select **"Deploy from GitHub repo"** and choose your repository (`pos-order-inventory-system`).

---

### Step 3: Add MongoDB Database on Railway
1. Inside your new Railway project canvas, click **"+ New"** in the top right.
2. Select **"Database"** ➔ **"Add MongoDB"**.
3. Railway will provision a MongoDB container with a persistent volume.
4. Railway automatically defines connection variables:
   - `MONGO_URL`
   - `MONGO_PRIVATE_URL`
   - `MONGODB_URL`

---

### Step 4: Link MongoDB to Your Web Service
1. Click on your **Web Service** card (your GitHub repo) in the Railway canvas.
2. Open the **"Variables"** tab.
3. Click **"+ New Variable"** ➔ **"Add Reference"**.
4. Select `MONGO_URL` from your MongoDB database service.
   *(Alternatively, type `MONGO_URL` and enter `${{MongoDB.MONGO_URL}}`)*.
5. Add additional optional variables:
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: `your-random-super-secret-jwt-key`
   - `RESERVATION_DURATION_SEC`: `300`
   - `EXPIRY_WORKER_INTERVAL_MS`: `5000`

> [!NOTE]
> Our database connector in `server/src/config/db.js` automatically recognizes `MONGO_URL`, `MONGO_PRIVATE_URL`, `MONGODB_URI`, and `MONGODB_URL` without any manual renaming required!

---

### Step 5: Generate a Public Domain
1. In your Web Service settings, go to the **"Settings"** tab.
2. Scroll down to the **"Networking"** section.
3. Under **"Public Networking"**, click **"Generate Domain"**.
4. Railway will create a secure HTTPS domain (e.g., `https://pos-production.up.railway.app`).

---

### Step 6: Verify Deployment

1. **Check Health Endpoint**:
   Visit:
   ```
   https://<your-railway-domain>/api/health
   ```
   Expected response:
   ```json
   {
     "status": "ok",
     "service": "POS Order & Inventory System",
     "timestamp": "2026-09-17T05:45:00.000Z"
   }
   ```

2. **Open the Web Application**:
   Navigate to `https://<your-railway-domain>`.
   - The storefront will load with **pre-seeded demo products** automatically populated.
   - Click **"Sign In"** in the header.
   - Default Administrator Credentials:
     - **Username**: `admin`
     - **Password**: `admin123`

3. **Test Concurrency & Reservation**:
   - Open the **"⚡ Concurrency Simulator"** tab in the UI.
   - Run 20 simultaneous concurrent orders on a product with 5 stock.
   - Confirm exactly 5 succeed and 15 safely receive out-of-stock without negative inventory!

---

## 🐳 Alternative: Local / VPS Docker Compose

You can also run the full stack (Frontend, Backend & MongoDB) locally or on a VPS using Docker Compose:

```bash
# Build and run the entire stack in the background
docker compose up --build -d

# Check running containers
docker compose ps

# View server and database logs
docker compose logs -f

# Access the application
# Frontend + Backend: http://localhost:5000
# Health check:       http://localhost:5000/api/health
# MongoDB:            localhost:27017
```

To stop:
```bash
docker compose down
```

---

## 🔧 Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **Database Connection Refused** | MongoDB service still starting or not linked | Check Railway canvas to ensure the MongoDB service is green and `MONGO_URL` reference is added to the web service variables. |
| **502 Bad Gateway** | Server failed health check or port mismatch | Railway dynamically assigns `PORT`. Our server binds to `0.0.0.0:$PORT` automatically. Check Railway deploy logs. |
| **Catalog Empty** | Database connected but fresh | The server auto-seeds on startup. You can also click the **"Seed Catalog"** button in the Admin Inventory page or POST to `/api/products/seed`. |
| **Admin Login Fails** | Database has existing modified users | Use default credentials `admin` / `admin123` or register a new user in UserManager. |
