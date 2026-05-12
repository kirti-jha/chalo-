# 🛵 Chalo - Premium Bike Taxi Platform

**Chalo** is a high-fidelity, production-grade ride-sharing application specifically optimized for bike-taxi operations. It combines real-time GPS tracking, advanced OSRM routing, and a multi-role ecosystem (Rider, Captain, Admin) into a seamless, premium experience.

---

## 📑 Table of Contents
1. [💎 Key Features](#-key-features)
2. [🏗️ System Architecture](#-system-architecture)
3. [🚀 Tech Stack](#-tech-stack)
4. [🛠️ Installation & Setup](#-installation--setup)
5. [🔌 API Endpoints](#-api-endpoints)
6. [📡 Socket.io Events](#-socketio-events)
7. [🗄️ Database Schema](#-database-schema)
8. [🛡️ Admin Console](#-admin-console)
9. [📱 Responsiveness](#-responsiveness)
10. [🔮 Future Roadmap](#-future-roadmap)

---

## 💎 Key Features

### 📍 For Riders
- **OSRM Real-Road Routing**: Uses the Open Source Routing Machine to calculate the shortest path via actual roads, ensuring accurate distance and fare calculations.
- **Interactive Map Selection**: Riders can click anywhere on the map to set their pickup or destination. The app uses reverse-geocoding (Nominatim) to identify addresses instantly.
- **Smooth Real-Time Tracking**: Features CSS-gliding markers that slide fluidly every 2 seconds, providing a "live" feel similar to Uber/Ola.
- **OTP Verification**: A secure 4-digit OTP is generated for every ride. The ride only transitions to "Ongoing" once the Captain verifies this code.
- **Emergency SOS**: Immediate one-tap emergency reporting directly from the active ride screen.

### 🛵 For Captains (Drivers)
- **Smart Queue Management**: Instant alerts for new ride requests with details on pickup/drop locations and estimated earnings.
- **Auto-Fit Map Intelligence**: The map automatically adjusts its zoom level and center point to keep both the Captain and the target location (Rider or Destination) in view at all times.
- **Earnings Tracking**: A dedicated wallet system showing balance and a detailed history of all completed trips.
- **Verification Flow**: Secure onboarding process where admins must manually verify driver credentials before they can receive requests.

### 🛡️ For Administrators
- **Real-Time Analytics**: Dashboard showing Total Revenue, Platform Commission, Active Rides, and Safety Alerts.
- **Driver Management**: Complete control over driver status, with the ability to approve or revoke access instantly.
- **System Monitoring**: Live health checks including backend connectivity, database status, and app version tracking.

---

## 🏗️ System Architecture

Chalo follows a modern **Monolithic API** with **Real-Time Overlay**:
1.  **Frontend (React)**: Handles UI/UX, Map rendering, and Client-side Socket listeners.
2.  **Backend (Node.js/TS)**: Manages Business logic, Auth, and Database interactions via Prisma.
3.  **Real-Time Layer (Socket.io)**: A dedicated service that handles high-frequency location updates and event broadcasting.
4.  **Routing Engine (OSRM)**: External API called for road-path geometry and navigation data.

---

## 🚀 Tech Stack

- **Core**: React 18, Vite, Node.js, TypeScript.
- **Database**: PostgreSQL (Neon.tech Serverless).
- **ORM**: Prisma (Type-safe database client).
- **Real-Time**: Socket.io (WebSockets).
- **Maps**: Leaflet.js, React-Leaflet.
- **Routing**: OSRM API (Open Source Routing Machine).
- **Authentication**: JWT (JSON Web Tokens) with Role-Based Access Control (RBAC).

---

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/chalo-bike-taxi.git
cd chalo-bike-taxi
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Configure `.env`:
```env
PORT=5001
DATABASE_URL="your-postgresql-url"
JWT_SECRET="your-secret-key"
```
Initialize Database:
```bash
npx prisma db push
npx prisma generate
```

### 3. Frontend Setup
```bash
cd test-webapp
npm install
```
Configure `.env`:
```env
VITE_API_URL=http://localhost:5001/api
VITE_SOCKET_URL=http://localhost:5001
```

### 4. Running Locally
Run both simultaneously in separate terminals:
-   **Backend**: `npm run dev` (Runs on http://localhost:5001)
-   **Frontend**: `npm run dev` (Runs on http://localhost:5173)

---

## 🔌 API Endpoints

### **Auth**
- `POST /api/auth/rider/register` - Create rider account
- `POST /api/auth/rider/login` - Rider login
- `POST /api/auth/driver/register` - Captain registration
- `POST /api/auth/driver/login` - Captain login

### **Rides**
- `POST /api/rides/request` - Request a new ride
- `POST /api/rides/accept` - Driver accepts a request
- `PATCH /api/rides/status` - Update ride status (ACCEPTED -> ONGOING -> COMPLETED)
- `POST /api/rides/cancel` - Cancel an active ride
- `GET /api/rides/history` - Fetch user/driver trip history

### **Admin**
- `GET /api/admin/stats` - Fetch platform-wide analytics
- `GET /api/admin/drivers` - List all drivers
- `PATCH /api/admin/verify-driver` - Verify/Unverify a captain

---

## 📡 Socket.io Events

| Event Name | Sender | Receiver | Description |
| :--- | :--- | :--- | :--- |
| `join` | Client | Server | Associates socket ID with User ID and Role |
| `updateLocation` | Driver | Server | Sends current GPS coordinates to server |
| `driverLocationUpdate`| Server | Rider | Broadcasts live captain position to the assigned rider |
| `newRideRequest` | Server | Driver | Notifies nearby drivers of a new request |
| `rideAccepted` | Server | Rider | Notifies rider that a captain is on the way |
| `rideStatusUpdate` | Server | All | Syncs status changes (Start/End) across clients |

---

## 🗄️ Database Schema

The schema is built on **Prisma** with the following core models:
- **User (Rider)**: Basic profile and history.
- **Driver (Captain)**: Vehicle details, verification status, rating, and wallet balance.
- **Ride**: Tracking coordinates, fare, OTP, status, and cancellation reasons.
- **Admin**: Credentials for system management.
- **SupportTicket**: Managing SOS and help requests.

---

## 🛡️ Admin Console

The Admin Console is accessible at `/auth/admin`. 
**Default Credentials:**
- **User**: `admin@chalo.com`
- **Pass**: `admin123`

Features include a **System Info** module that tracks the build version (v2.0.0), database connectivity, and real-time socket health.

---

## 📱 Responsiveness

Chalo is built with a **Mobile-First** approach:
- **Mobile (< 600px)**: Sidebar converts to a horizontal scrollable menu; map expands to full width.
- **Tablet (< 900px)**: Stacked layout for easy interaction on touch devices.
- **Desktop**: Grid-based dual-pane layout for optimized multitasking.

---

## 🔮 Future Roadmap

- [ ] **Multi-Vehicle Support**: Options for Bike, Auto, and Mini-Cars.
- [ ] **Wallet Recharge**: Integrated payment gateways (Razorpay/Stripe).
- [ ] **Chat System**: In-app messaging between Rider and Captain.
- [ ] **Heatmaps**: Admin view for high-demand areas.
- [ ] **Referral Program**: Growth hacking tools for user acquisition.

---

© 2024 Chalo Bike-Taxi. Engineered for speed, safety, and scale.
