# KisanDirect (Farmer Consumer App)

**KisanDirect** is a full-stack, mobile-first agricultural marketplace connecting farmers directly with individual consumers and residential apartment communities. It combines **individual doorstep orders**, **expanding hexagon-ring geo-dispatch**, **time-boxed apartment bulk buying with tiered discounts**, **Razorpay checkout**, **multi-language support (English, Telugu, Hindi)**, and a **Master Admin Command Center**, packaged as both a responsive web app and a native Android APK via Capacitor.

---

## Architecture Overview

```text
+-------------------------------------------------------------------+
|                   Frontend (React 18 + Vite + Tailwind)           |
|  - Consumer Portal  - Farmer Seller Portal  - Admin Command Center|
|  - Native Android APK (Capacitor 8: Camera, Geolocation, App)     |
+---------------------------------+---------------------------------+
                                  | HTTPS REST API (JWT Bearer Auth)
                                  v
+-------------------------------------------------------------------+
|                 Backend API (Flask 3 + SQLAlchemy)                |
|  Hosted on Render: https://farmer-consumer-app.onrender.com       |
|  - 15 Modular Blueprints (/api/auth, /products, /orders,          |
|    /payments, /communities, /campaigns, /admin, /reviews, ...)    |
|  - Automatic Startup Schema Sync (_ensure_schema)                 |
+-----------------+-------------------------------+-----------------+
                  |                               |
                  v                               v
+---------------------------------+   +-----------------------------+
|  Database (PostgreSQL / MySQL)  |   | External & Geo Services     |
|  - Supabase (Production)        |   | - Razorpay Orders & Verify  |
|  - MySQL kisandirect_db (Local) |   | - OpenStreetMap / Nominatim |
+---------------------------------+   +-----------------------------+
```

---

## Key Features

### 1. Consumer Portal (`/buyer`)
- **Marketplace & Expanding Hex-Ring Geo-Dispatch**: Consumers see active produce (`selling_mode != 'apartments_only'` and `available_quantity > 0`) prioritized from nearest farms outward.
- **Manual Quantity Input & Cart**: Type exact quantities (e.g., `100` kg) directly or use `-`/`+` steppers on product cards, product detail pages, and cart items.
- **Map Auto-Detected Delivery Addresses**: Add addresses using `RapidoMapPicker` (OpenStreetMap + GPS auto-detect for street, area, city, state, pincode) with only **Door / Flat No.** and **Landmark** required.
- **Checkout & Razorpay Integration**:
  - Full price & delivery breakdown: per-item quantity × unit price, farmer/farm name & location, Haversine distance (`km`), per-km delivery rate (`₹/km`), produce subtotal, delivery fee, and total payable.
  - Supports **Razorpay (UPI, Cards, Netbanking)** with live SDK + in-app Android WebView test checkout (Success & Failure simulation), **Direct UPI**, and **Cash on Delivery (COD)**.
- **Apartment Community Bulk Buying (`/buyer/community`)**:
  - Create or join nearby apartment communities (or join by 6-character code).
  - Receive instant **in-app notifications** (`MobileHeader` bell + unread badge) when a farmer launches a reserved bulk deal for your apartment.
  - Live **1–2 hour countdown timer** (`HHh : MMm : SSs`), 30% / 80% / 100% tiered discount progress bar, auto-disabled `+ Add` when timer ends, and automatic hiding of expired 0-pledge deals.
- **Collapsible Order Tracking (`/buyer/orders`)**: Compact cards showing product summary + amount; tap any order to expand the live status timeline, item breakdown, address, and rating/cancel actions.

### 2. Farmer Seller Portal (`/farmer`)
- **Product Management & Native Camera Capture**:
  - Add produce with **Take Photo (Camera)** (`@capacitor/camera`) or **Choose from Gallery**, stored per farmer in `backend/uploads/farmer_<farmer_id>/`.
  - Configure individual price, bulk price, minimum bulk target (kg), delivery rate (`₹/km`), max delivery distance (`1–19 km`), and **Selling Mode** (`both`, `apartments_only`, `individual_only`).
- **Automatic Stock & Min-Bulk Cutoffs (`sync_stock_flags`)**:
  - When `available_quantity < min_bulk_quantity`, `bulk_disabled` automatically blocks new apartment bulk campaigns while keeping individual orders active (if `selling_mode == 'both'`).
  - When `available_quantity <= 0`, the product is automatically marked unavailable (`is_available = False`) across both open marketplace and apartments.
- **Community Marketplace Hub (`/farmer/communities`)**:
  - Discover apartments on Map or List, select one apartment at a time, reserve stock, set a 60–120 minute timer, and unlock delivery contact sheets after locking the pool.

### 3. Master Admin Command Center (`/admin`)
- Accessible from the Login screen via **Admin Portal Login (`admin@gmail.com`)** or direct `/admin` route.
- **10 Management Tabs**: Overview KPIs, Users (Verify/Suspend/Edit/Delete), Produce (with selling-mode & bulk-stopped badges), Orders, Apartments & Campaigns, Payments (Razorpay/UPI/COD audit), Reviews moderation, Categories, Support Tickets, and System Controls (Broadcast Notifications & Demo Data Reset).
- **One-Click Full Database Excel Export**: `/api/campaigns/export-excel`.

### 4. Auth, Security & UX
- **Show/Hide Password Toggle**: Reusable `PasswordInput` component with eye toggle across Login, Buyer/Farmer Registration, Forgot Password, Consumer/Farmer Change Password, and Admin User modals.
- **Forgot Password Flow**: 2-step OTP reset (`POST /api/auth/forgot-password` & `POST /api/auth/reset-password`).
- **Logout Confirmation**: Confirmation dialog across Farmer, Consumer, and Admin portals before clearing session.
- **Multi-Language & Responsive Fit**: English (`en`), Telugu (`te`), and Hindi (`hi`) translations with safe-area and narrow-screen layout constraints.

---

## Repository Structure

```text
Farmer Consumer App/
├── apk/                                 # Versioned Android APKs (KisanDirect-v1.8.0-debug.apk)
├── backend/
│   ├── app.py                           # Flask app factory, CORS, uploads route & _ensure_schema()
│   ├── config.py                        # DB URI (PostgreSQL/MySQL), JWT, Upload & Razorpay config
│   ├── extensions.py                    # SQLAlchemy & JWTManager instances
│   ├── models.py                        # 16 SQLAlchemy models + stock/tier helpers
│   ├── utils_geo.py                     # Haversine distance & expanding hex-ring dispatch
│   ├── export_db_excel.py               # Multi-sheet .xlsx database exporter
│   ├── seed.py                          # Base seed (admin@gmail.com, categories, sample data)
│   ├── requirements.txt                 # Python dependencies (Flask, SQLAlchemy, Razorpay, Gunicorn)
│   └── routes/                          # 15 API Blueprints:
│       ├── auth.py, buyer.py, farmer.py, products.py, categories.py,
│       ├── cart.py, orders.py, payments.py, addresses.py, notifications.py,
│       ├── reviews.py, support.py, communities.py, campaigns.py, admin.py
├── frontend/
│   ├── android/                         # Capacitor Android project (minSdk/targetSdk, Camera & GPS permissions)
│   ├── capacitor.config.json            # App ID: com.kisandirect.fc, androidScheme: http
│   ├── index.html                       # Loads Razorpay Checkout JS + Plus Jakarta Sans
│   ├── package.json                     # React 18, Vite 6, Tailwind, Capacitor 8 (@capacitor/camera, geolocation, app)
│   └── src/
│       ├── admin/                       # AdminDashboard.jsx
│       ├── auth/                        # LanguageSelectPage, RoleSelectPage, LoginPage, BuyerRegisterPage, FarmerRegisterPage, VerifyEmailPage
│       ├── consumer/                    # MarketplaceHome, CategoriesPage, ProductDetailPage, CartPage, CheckoutPage, OrderSuccessPage, MyOrdersPage, BuyerProfilePage, CommunityPage
│       ├── farmer/                      # FarmerDashboard, FarmerProducts, AddProductPage, FarmerOrders, FarmerEarnings, FarmerProfile, FarmerReviews, FarmerCommunities
│       ├── contexts/                    # AuthContext, CartContext, LanguageContext, BackgroundContext, NavigationContext
│       ├── services/api.js              # Axios client (defaults native APK to https://farmer-consumer-app.onrender.com)
│       ├── shared/                      # MobileHeader, MobileBottomNav, MobilePhoneFrame, RapidoMapPicker, PasswordInput, OrderTimeline, BackButton, PageBackground, ProtectedRoute
│       ├── translations/                # en.json, hi.json, te.json
│       └── utils/                       # geo.js, geolocation.js, productLocalization.js
├── app.py / wsgi.py / gunicorn.conf.py / Procfile / requirements.txt
└── README.md
```

---

## Backend API Endpoints

| Prefix | Blueprint | Purpose |
|---|---|---|
| `/api/auth` | `auth_bp` | Register, Login, Email OTP verify, Forgot/Reset Password, Change Password, Profile & Language |
| `/api/products` | `products_bp` | Marketplace list (hex-ring + selling-mode filtered), detail, farmer CRUD, image upload |
| `/api/categories` | `categories_bp` | Active product categories |
| `/api/cart` | `cart_bp` | Add, update quantity, remove, clear cart (`apartments_only` blocked) |
| `/api/orders` | `orders_bp` | Place order, deduct stock + `sync_stock_flags()`, cancel, buyer order history |
| `/api/payments` | `payments_bp` | Razorpay `/create`, `/verify` (HMAC signature check), `/fail` |
| `/api/addresses` | `addresses_bp` | Saved delivery addresses & default selection |
| `/api/communities` | `communities_bp` | Nearby apartments, create/join by code, `/my`, push cart, contribute with timer check |
| `/api/campaigns` | `campaigns_bp` | Farmer apartment discovery, demand requests, launch 1–2 hr bulk campaign, lock/deliver, Excel export |
| `/api/farmer` | `farmer_bp` | Farmer dashboard stats, products, incoming orders, earnings |
| `/api/buyer` | `buyer_bp` | Buyer profile & stats |
| `/api/reviews` | `reviews_bp` | Product reviews & delivery feedback |
| `/api/notifications` | `notifications_bp` | User alerts & read-status endpoints |
| `/api/support` | `support_bp` | Support ticket submission |
| `/api/admin` | `admin_bp` | Master Admin stats, user verification/CRUD, products, orders, communities, campaigns, payments, reviews, broadcast, reset |

---

## Setup & Deployment

### 1. Environment Variables
Configure these in your `.env` (local) or Render Environment Settings (production):
- `DATABASE_URL` — PostgreSQL connection string (Supabase) or local MySQL (`MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DB`)
- `SECRET_KEY` & `JWT_SECRET_KEY`
- `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`

### 2. Run Backend Locally
```powershell
pip install -r requirements.txt
python backend/app.py
```

### 3. Run Frontend & Build Android APK
```powershell
cd frontend
npm install
npm run build
npx cap sync android
cd android
.\gradlew.bat assembleDebug
```
Copy the built APK to `apk/KisanDirect-v<major>.<minor>.0-debug.apk` (current latest: `apk/KisanDirect-v1.8.0-debug.apk`).
