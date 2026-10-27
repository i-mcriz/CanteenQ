# 🍽️ CanteenQ — Smart Campus Canteen Queue & Food Ordering System

> A modern, real-time campus canteen ordering and queue management system designed to eliminate physical queues, estimate wait times, track order velocity, and deliver AI-driven crowd and peak-hour predictions.

---

## 📑 Table of Contents
- [1. System Architecture](#1-system-architecture)
- [2. Tech Stack Overview](#2-tech-stack-overview)
- [3. Key Features by Role](#3-key-features-by-role)
- [4. Cloud Database (Supabase PostgreSQL)](#4-cloud-database-supabase-postgresql)
- [5. Backend Architecture (NestJS & GraphQL)](#5-backend-architecture-nestjs--graphql)
- [6. Frontend Architecture (Next.js 14 App Router)](#6-frontend-architecture-nextjs-14-app-router)
- [7. Vercel Deployment Guide](#7-vercel-deployment-guide)
- [8. CI/CD Pipeline (GitHub Actions)](#8-cicd-pipeline-github-actions)
- [9. Local Development Setup](#9-local-development-setup)
- [10. Running with Docker Compose](#10-running-with-docker-compose)
- [11. Demo Accounts & Credentials](#11-demo-accounts--credentials)

---

## 1. System Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│               Frontend: Next.js 14 App Router (Vercel)                 │
│   - TypeScript, Tailwind CSS, Dark Mode Glassmorphism UI               │
│   - Unified GraphQL Client (lib/graphql.ts)                            │
│   - Real-time WebSocket Client (Socket.io) for Live Queue Updates      │
│   - Portals: Student Ordering, Kitchen Kanban, Executive Admin         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ GraphQL Queries / Mutations / WebSockets
┌───────────────────────────────────▼────────────────────────────────────┐
│                    Backend: NestJS 10 (Port 4000)                      │
│   - Code-First GraphQL Schema (@nestjs/graphql, Apollo Server)         │
│   - WebSocket Gateway (@nestjs/websockets, Socket.io)                  │
│   - 19 Modular Domain Services (Auth, Menu, Orders, Queue, Analytics)  │
│   - Dynamic Queue Engine: wait time calculation, order queue position  │
│   - Prediction Engine: peak hours, crowd density, demand forecasting   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Prisma Client (Pooled: 6543 / Direct: 5432)
┌───────────────────────────────────▼────────────────────────────────────┐
│               Cloud Database: Supabase (PostgreSQL 16)                 │
│   - Hosted Cloud PostgreSQL with PgBouncer / Supavisor connection pool │
│   - 14 Relational Models (User, Order, QueueToken, FoodItem, etc.)     │
│   - Automated Schema Push & Migration via Prisma ORM                   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Tech Stack Overview

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | **Next.js 14** (App Router) | Server/client component rendering, routing, modern responsive UI |
| **Frontend Host**| **Vercel** | Edge network deployment, zero-config Next.js hosting, auto-SSL |
| **Backend** | **NestJS 10** | Modular Node.js framework, dependency injection, business logic |
| **API Layer** | **GraphQL (Apollo Server)** | Strongly-typed Code-First API for all queries and mutations |
| **Real-time** | **Socket.io** | Bidirectional real-time queue position and status events |
| **Database** | **Supabase (PostgreSQL)** | Managed cloud relational database with pooled and direct access |
| **ORM** | **Prisma 5** | Type-safe database queries, schema modeling, automated migrations |
| **CI/CD** | **GitHub Actions** | Automated lint, build, test, Supabase migration, and Vercel deploy |
| **Containers**| **Docker & Docker Compose** | Reproducible multi-stage containerization |

---

## 3. Key Features by Role

### 🎓 1. Student Portal (`/`, `/menu`, `/cart`, `/checkout`, `/order/[id]`, `/orders`)
* **Live Campus Crowd Meter**: Real-time crowd percentage (0–40% LOW, 41–70% MODERATE, 71–100% HIGH), queue length, and estimated waiting time before ordering.
* **Interactive Menu**: Category filters (Breakfast, Meals, Snacks, Beverages, Fast Food, Desserts), search, veg/non-veg toggle, stock indicators (Available, Low Stock, Sold Out).
* **Cart & Seamless Checkout**: Add to cart, modify quantities, tax calculation, payment selection (UPI, Card, Net Banking, or Instant Test Gateway).
* **Live Order & Queue Tracking**:
  * Real-time status stepper: `PLACED` ➔ `PAID` ➔ `ACCEPTED` ➔ `PREPARING` ➔ `READY` ➔ `COMPLETED`.
  * Dynamic queue position counter showing real-time orders ahead.
  * Auto-generated cryptographic **QR Code** upon reaching `READY` status for secure counter pickup.
* **Order History**: Review previous orders, download tokens, and 1-click reorder.

### 👨‍🍳 2. Kitchen Staff / Chef Portal (`/staff`)
* **Real-time Kanban Board**: Orders automatically drop into columns: **New Orders** ➔ **In Preparation** ➔ **Ready for Pickup** ➔ **Completed Today**.
* **One-Click State Transitions**: Actions to `Accept`, `Start Preparing`, `Mark Ready`, `Complete`, or `Reject/Cancel`.
* **Live Menu Availability Manager**: Toggle items between available and sold out; adjust current stock numbers and prep times on the fly.
* **Audio/Visual Notifications**: Instant UI updates via WebSockets when a student places a new order.

### 🛡️ 3. Campus Admin & Analytics Portal (`/admin`)
* **Executive Metrics**: Today's revenue, order volume, average queue wait time, kitchen turnaround velocity, and cancellation rates.
* **Visual Recharts Graphs**: Hourly order volume breakdown, revenue distribution, and top popular dishes.
* **AI-Driven Prediction Engine**:
  * Predicts upcoming peak rush periods (e.g., 8:30 AM – 9:30 AM, 12:30 PM – 2:00 PM).
  * Forecasts expected orders and wait minutes for the next 4 hours.
  * Identifies high-demand food items to guide kitchen ingredient prep.

---

## 4. Cloud Database (Supabase PostgreSQL)

CanteenQ connects to **Supabase**, a cloud-hosted PostgreSQL database. Prisma uses dual connection strings to support connection pooling and migrations seamlessly:

### ⚙️ Supabase Connection Strings
1. In your **Supabase Dashboard**, navigate to **Project Settings** ➔ **Database** ➔ **Connection String**.
2. **Transaction Pooler URL (`DATABASE_URL`)**:
   Connects to port `6543` with `pgbouncer=true`. Used by the NestJS runtime for application queries:
   ```env
   DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
   ```
3. **Direct Database URL (`DIRECT_URL`)**:
   Connects to port `5432` directly. Used by Prisma CLI for migrations and schema pushes:
   ```env
   DIRECT_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
   ```

### 🚀 Prisma Commands for Supabase
```bash
cd backend

# Generate the Prisma Client
npm run prisma:generate

# Push schema directly to Supabase
npm run prisma:push

# Deploy production migrations
npm run prisma:deploy

# Seed sample data (users, 30 menu items, categories, demo orders)
npm run prisma:seed

# Open Prisma Studio GUI
npm run prisma:studio
```

---

## 5. Backend Architecture (NestJS & GraphQL)

CanteenQ uses a **Code-First GraphQL architecture** built with `@nestjs/graphql` and Apollo Server on `http://localhost:4000/graphql`.

### 🧩 Schema & Resolvers
* `@ObjectType()`: Defines GraphQL output types (`UserType`, `OrderType`, `FoodItemType`, `CrowdDensityType`).
* `@InputType()`: Defines input arguments for mutations (`RegisterInput`, `CreateOrderInput`, `FoodItemInput`).
* **Authentication**: GraphQL requests are verified by `GqlAuthGuard` using JWT tokens passed in the `Authorization: Bearer <token>` header.
* **Role Guards**: `@Roles(Role.STAFF, Role.ADMIN)` restricts administrative and kitchen operations.

### 📡 Core GraphQL Operations

| Domain | Operation | Type | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `login(email, password)` | Mutation | Authenticates user; returns JWT token and role |
| **Auth** | `register(input)` | Mutation | Registers a new student account |
| **Menu** | `getMenu(...)` | Query | Returns dishes with category, veg, search, and stock filters |
| **Menu** | `getCategories` | Query | Returns all food categories |
| **Menu** | `updateFoodAvailability(id, isAvailable, stock)` | Mutation | Kitchen staff updates item stock/availability |
| **Queue** | `getCrowdDensity` | Query | Calculates crowd load %, waiting time, and active orders |
| **Orders** | `createOrder(paymentMethod)` | Mutation | Converts cart into an order, reserves stock, generates `SQ-xxx` token |
| **Orders** | `acceptOrder`, `startPreparing`, `markReady`, `completeOrder` | Mutation | Staff Kanban workflow transitions |
| **Payment** | `createPayment`, `verifyPayment` | Mutation | Processes payment (Test Mode or Razorpay) |
| **Analytics**| `getAnalytics` | Query | Aggregates daily orders, revenue, and top dishes |
| **Predictions**| `getPredictions` | Query | Statistical peak period and demand prediction model |

---

## 6. Frontend Architecture (Next.js 14 App Router)

The frontend is built with **Next.js 14** using the **App Router** (`app/`), **TypeScript**, and **Tailwind CSS**.

### 📁 Directory Layout
```text
frontend/
├── app/
│   ├── layout.tsx              # Root layout with AuthProvider & CartProvider
│   ├── page.tsx                # Hero landing page with crowd meter & featured food
│   ├── login/page.tsx          # 1-click role switcher & manual login
│   ├── register/page.tsx       # Student registration
│   ├── dashboard/page.tsx      # Student home: active order banner & recommendations
│   ├── menu/page.tsx           # Full searchable, filterable food catalog
│   ├── cart/page.tsx           # Cart breakdown, quantity controls & bill summary
│   ├── checkout/page.tsx       # Payment method selection & order submission
│   ├── order/[orderId]/page.tsx# Real-time order progress stepper & pickup QR code
│   ├── orders/page.tsx         # Past order history & 1-click reorder
│   ├── queue/page.tsx          # Public canteen digital queue display
│   ├── staff/page.tsx          # Kitchen staff Kanban board & stock management
│   └── admin/page.tsx          # Campus admin charts & AI peak predictions
├── components/
│   ├── Navbar.tsx              # Navigation bar with live order badge & crowd meter
│   ├── MobileNav.tsx           # Bottom bar optimized for mobile devices
│   └── CrowdMeter.tsx          # Real-time visual crowd density indicator
├── context/
│   ├── AuthContext.tsx         # User session, JWT tokens, demo login helpers
│   └── CartContext.tsx         # Cart items, persistent storage, subtotal/tax calculations
└── lib/
    ├── graphql.ts              # Unified fetch-based GraphQL client
    └── socket.ts               # Socket.io real-time connection manager
```

---

## 7. Vercel Deployment Guide

Deploying the Next.js frontend to **Vercel** takes just a few steps:

### Method 1: Deploying via Vercel Dashboard (Recommended)
1. Push your repository to **GitHub**.
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Select your repository.
4. In the **Project Configuration** screen:
   * **Framework Preset**: `Next.js`
   * **Root Directory**: Click "Edit" and choose `frontend`
5. Under **Environment Variables**, add:
   * `NEXT_PUBLIC_API_URL` = `https://your-backend-domain.com` (or Railway/Render URL)
   * `NEXT_PUBLIC_GRAPHQL_URL` = `https://your-backend-domain.com/graphql`
   * `NEXT_PUBLIC_WS_URL` = `https://your-backend-domain.com`
6. Click **Deploy**. Vercel will build and launch your frontend with automatic SSL and global CDN distribution.

### Method 2: Deploying via Vercel CLI
```bash
# Install Vercel CLI globally
npm install -g vercel

# Navigate to the frontend directory
cd frontend

# Deploy preview build
vercel

# Deploy to production
vercel --prod
```

---

## 8. CI/CD Pipeline (GitHub Actions)

A comprehensive GitHub Actions workflow is preconfigured in [`.github/workflows/ci-cd.yml`](.github/workflows/ci-cd.yml).

### Pipeline Stages:
1. **Backend Check**: Installs dependencies with `npm ci`, generates Prisma client, runs `npm run build`, and executes Jest unit tests.
2. **Frontend Check**: Installs dependencies with `npm ci`, runs `npm run build`, and verifies all 14 routes compile without type errors.
3. **Docker Validation**: Builds and validates Docker containers for both backend and frontend on pushes to `main`.
4. **Supabase Schema Push**: Automatically pushes schema changes to your Supabase PostgreSQL database on production pushes.
5. **Vercel Deployment**: Automatically deploys the frontend to Vercel production using the prebuilt bundle.

### Required GitHub Secrets & Variables
To enable automated database migrations and Vercel deployments, configure these in **GitHub Settings ➔ Secrets and variables ➔ Actions**:

| Name | Type | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | Secret | Supabase Transaction Pooler URL (port 6543) |
| `DIRECT_URL` | Secret | Supabase Direct Connection URL (port 5432) |
| `VERCEL_TOKEN` | Secret | Personal Vercel Access Token (from Vercel Account Settings ➔ Tokens) |
| `VERCEL_ORG_ID` | Secret | Vercel Organization ID (from `.vercel/project.json` or team settings) |
| `VERCEL_PROJECT_ID` | Secret | Vercel Project ID (from project settings) |
| `NEXT_PUBLIC_GRAPHQL_URL` | Variable/Secret | Production backend GraphQL URL (e.g. `https://api.canteenq.com/graphql`) |
| `NEXT_PUBLIC_WS_URL` | Variable/Secret | Production backend WebSocket URL |

---

## 9. Local Development Setup

### Prerequisites
* **Node.js**: v18.x or v20.x
* **npm**: v9.x or later
* **Supabase account** (free tier at [supabase.com](https://supabase.com))

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd CanteenQ
```

### Step 2: Configure Environment Variables
1. **Backend**:
   ```bash
   cp backend/.env.example backend/.env
   ```
   Edit `backend/.env` and paste your Supabase connection strings:
   ```env
   DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
   JWT_SECRET="canteenq-super-secret-jwt-key-32chars"
   PORT=4000
   ```

2. **Frontend**:
   ```bash
   cp frontend/.env.example frontend/.env.local
   ```

### Step 3: Setup Database & Seed
```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
```

### Step 4: Run Applications
```bash
# Terminal 1 — Backend
cd backend
npm run start:dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

* **Frontend**: [http://localhost:3000](http://localhost:3000)
* **GraphQL Playground**: [http://localhost:4000/graphql](http://localhost:4000/graphql)

---

## 10. Running with Docker Compose

To run both services in isolated Docker containers:

```bash
# Build and run containers in background
docker compose up --build -d

# View live application logs
docker compose logs -f

# Stop containers
docker compose down
```

---

## 11. Demo Accounts & Credentials

The seed script creates pre-populated accounts for immediate testing:

| Role | Email | Password | Recommended Route | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Student** | `student@canteenq.local` | `Password@123` | `/dashboard`, `/menu` | Order food, track queue position, scan QR code |
| **Kitchen Chef** | `chef@canteenq.local` | `Password@123` | `/staff` | Manage order Kanban board, update food inventory |
| **Campus Admin** | `admin@canteenq.local` | `Password@123` | `/admin` | Real-time sales analytics, queue bottlenecks, AI peak forecasting |

*(Note: On the `/login` page, you can also use 1-click login buttons for instant access to any role).*

---

### 📄 License
This project is licensed for campus canteen queue and food management. All rights reserved.
