# 🏟️ Sportz United Backend

A modular Node.js + Express backend for the **Sportz United** sports arena booking platform. Built with Sequelize ORM on MSSQL, featuring role-based access control, JWT authentication, and Swagger documentation.

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env   # Then edit .env with your DB credentials

# Start development server (auto-reload)
npm run dev

# Start production server
npm start
```

The server runs on **port 3000** by default.

---

## 📁 Project Structure

```
SportzUnitedBackend/
├── server.js                    # Entry point
├── src/
│   ├── app.js                   # Express app & route registration
│   ├── config/
│   │   ├── database.js          # Sequelize + MSSQL config
│   │   └── swagger.js           # Swagger/OpenAPI config
│   ├── models/                  # Sequelize models (14 tables)
│   │   ├── index.js             # Model loader & associations
│   │   ├── Arena.js
│   │   ├── Court.js
│   │   ├── CourtSlot.js
│   │   ├── Booking.js
│   │   ├── BookingDetail.js
│   │   ├── BookingPlayer.js
│   │   ├── Player.js
│   │   ├── User.js
│   │   ├── Sport.js
│   │   ├── PlayerWallet.js
│   │   ├── Transaction.js
│   │   ├── Amenity.js
│   │   ├── ArenaAmenity.js
│   │   └── RefreshToken.js
│   ├── middlewares/
│   │   ├── auth.middleware.js    # JWT verification
│   │   ├── role.middleware.js    # Role-based access control
│   │   ├── arena.middleware.js   # Arena ownership check
│   │   ├── validate.middleware.js# Joi request validation
│   │   └── error.middleware.js   # Centralized error handler
│   ├── repositories/            # Data access layer
│   │   ├── super-admin/         # Super Admin repositories
│   │   ├── admin/               # Arena Admin repositories
│   │   └── user/                # Player/User repositories
│   ├── services/                # Business logic layer
│   │   ├── super-admin/         # Super Admin services
│   │   ├── admin/               # Arena Admin services
│   │   └── user/                # Player/User services
│   ├── controllers/             # Request handlers
│   │   ├── super-admin/         # Super Admin controllers
│   │   ├── admin/               # Arena Admin controllers
│   │   └── user/                # Player/User controllers
│   └── routes/                  # API route definitions
│       ├── super-admin/         # Super Admin routes
│       ├── admin/               # Arena Admin routes
│       └── user/                # Player/User routes
└── uploads/                     # Avatar & file uploads
```

---

## 🔐 Authentication & Roles

| Role | Description |
|------|-------------|
| `super_admin` | Platform-wide management (arenas, sports, users) |
| `arena_owner` | Manages their own arenas, courts, slots, staff |
| `receptionist` / `cashier` / `coach` | Arena staff roles |
| `Player` | Public users who book courts and play |

**Auth Methods:**
- Email + Password login
- OTP-based mobile login
- JWT Bearer token (1-day expiry)
- Refresh token support

---

## 📡 API Endpoints

### 🔵 Player / User (`/api`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new player |
| `POST` | `/api/auth/login` | Email login |
| `POST` | `/api/auth/send-otp` | Send OTP to phone |
| `POST` | `/api/auth/login-otp` | OTP login |
| `GET` | `/api/auth/me` | Get current user |
| `GET` | `/api/arenas` | List all arenas |
| `GET` | `/api/arenas/search` | Search with filters |
| `GET` | `/api/arenas/:id` | Arena details |
| `GET` | `/api/arenas/:id/courts` | Arena courts |
| `GET` | `/api/courts/slots/query` | Slots by court & date |
| `POST` | `/api/bookings` | Create booking |
| `GET` | `/api/bookings/history` | Booking history |
| `PATCH` | `/api/bookings/:id/cancel` | Cancel booking |
| `PATCH` | `/api/bookings/:id/modify` | Modify booking |
| `GET` | `/api/payments/wallet/balance` | Wallet balance |
| `POST` | `/api/payments` | Record payment |
| `GET` | `/api/users/profile` | Player profile |
| `PUT` | `/api/users/profile` | Update profile |
| `POST` | `/api/users/upload-avatar` | Upload avatar |
| `GET` | `/api/sports` | List active sports |

### 🟠 Arena Admin (`/api/admin`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/admin/auth/login` | Admin login |
| `GET` | `/api/admin/bookings` | Arena bookings |
| `GET` | `/api/admin/courts` | Manage courts |
| `POST` | `/api/admin/courts` | Create court |
| `POST` | `/api/admin/slots/generate` | Generate slots |
| `POST` | `/api/admin/slots/block` | Block slot |
| `GET` | `/api/admin/pricing` | Pricing rules |
| `POST` | `/api/admin/promos` | Create promo |
| `GET` | `/api/admin/memberships` | Memberships |
| `GET` | `/api/admin/reports/revenue` | Revenue report |
| `GET` | `/api/admin/staff` | List staff |
| `POST` | `/api/admin/staff` | Create staff |
| `GET` | `/api/admin/notifications` | Notifications |
| `GET` | `/api/admin/wallet/:playerId` | Player wallet |
| `POST` | `/api/admin/wallet/topup` | Top-up wallet |

### 🔴 Super Admin (`/api/super-admin`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/super-admin/arenas` | All arenas |
| `POST` | `/api/super-admin/arenas` | Create arena |
| `PUT` | `/api/super-admin/arenas/:id` | Update arena |
| `DELETE` | `/api/super-admin/arenas/:id` | Delete arena |
| `GET` | `/api/super-admin/sports` | All sports |
| `POST` | `/api/super-admin/sports` | Create sport |
| `PUT` | `/api/super-admin/sports/:id` | Update sport |
| `DELETE` | `/api/super-admin/sports/:id` | Delete sport |
| `GET` | `/api/super-admin/users` | All users |
| `GET` | `/api/super-admin/users/:id` | User by ID |
| `PUT` | `/api/super-admin/users/:id` | Update user |
| `DELETE` | `/api/super-admin/users/:id` | Delete user |

---

## 📖 Swagger Documentation

Once the server is running, visit:

```
http://localhost:3000/api-docs
```

Interactive API documentation with **Try it out** support.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime |
| **Express 5** | Web framework |
| **Sequelize** | ORM |
| **MSSQL (Tedious)** | Database |
| **JWT** | Authentication |
| **Joi** | Request validation |
| **Multer** | File uploads |
| **Swagger (OpenAPI 3.0)** | API docs |
| **dotenv** | Environment config |

---

## ⚙️ Environment Variables

Create a `.env` file in the project root:

```env
PORT=3000
JWT_SECRET=your_jwt_secret_key
DB_HOST=localhost
DB_NAME=SportzUnited
DB_USER=sa
DB_PASSWORD=your_password
DB_PORT=1433
DB_DIALECT=mssql
```

---

## 🏗️ Architecture

The codebase follows a **modular layered architecture**:

```
Routes → Controllers → Services → Repositories → Models (Sequelize)
```

Each layer is organized into three role-based modules:

- **`super-admin/`** — Platform-wide operations (arenas, sports, users)
- **`admin/`** — Arena-scoped operations (courts, slots, bookings, staff)
- **`user/`** — Player-facing operations (auth, bookings, payments)

This separation ensures:
- ✅ Clear ownership boundaries
- ✅ Independent scalability per module
- ✅ Simplified onboarding for new developers
- ✅ Easy role-based access enforcement

---

## 📋 Scripts

```bash
npm start       # Production start
npm run dev     # Development with auto-reload
npm run migrate # Sync database schema
```

---

## 📄 License

ISC
