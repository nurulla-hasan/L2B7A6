# 🎓 University Management System RESTful API

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Express.js](https://img.shields.io/badge/Express.js-5.x-lightgrey.svg)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7.x-indigo.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.x-blue.svg)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-Cache%20%26%20Tokens-red.svg)](https://redis.io/)
[![bKash](https://img.shields.io/badge/bKash-Payment%20Gateway-e2136e.svg)](https://developer.bKash.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A robust, enterprise-grade, and scalable **University Management System RESTful API** built for **Programming Hero Level 2 Batch 7 Assignment 6 (B7A6)**.

This system powers academic workflows including **Role-Based Access Control (RBAC)** across Students, Teachers, and Admins, **Semester & Course Management**, **Section & Course Offerings**, **Capacity-Protected Student Course Enrollments**, **bKash Tokenized Sandbox Payment Gateway**, **Teacher Grade Submissions & Grading Scales**, and an **Admin Analytics Dashboard** with **Immutable Audit Logs**.

---

## 🌐 Live & Project Links

- **Live Deployment API**: `https://l2-b7-a6-university-management.vercel.app` *(or your production URL)*
- **API Health Endpoint**: `https://l2-b7-a6-university-management.vercel.app/`
- **GitHub Repository**: [https://github.com/nurulla-hasan/L2B7A6](https://github.com/nurulla-hasan/L2B7A6)
- **Postman Collection**: [Download / View in Repo](docs/postman.json)
- **Video Walkthrough (5-10 Mins)**: *(Provide Loom / YouTube Unlisted link here)*

---

## 🚀 Key Features

1. **Enterprise Layered Architecture**:
   - Strictly decoupled modular design: `Routes -> Middlewares -> Controllers -> Services -> Prisma ORM`.
   - Thin controllers handling HTTP context, pure business logic encapsulated inside Services.
2. **Role-Based Access Control (RBAC)**:
   - Dedicated access policies for `ADMIN`, `TEACHER`, and `STUDENT` (with `SUPER_ADMIN` support).
   - Strict 403 Forbidden enforcement on unauthorized route access.
3. **Authentication & Security**:
   - Secure Password Hashing with `bcryptjs` (salt rounds: 12).
   - Dual-token JWT architecture (Short-lived Access Token + Secure Refresh Token).
   - Email Verification & Password Reset via 6-digit OTPs.
   - Google Social Login (OAuth 2.0 with GCP).
   - Rate limiting, HTTP security headers (`Helmet`), CORS protection, and input sanitization.
4. **Relational Database & Integrity (Prisma 7 + PostgreSQL)**:
   - Atomic database transactions (`prisma.$transaction`) for race-condition prevention during enrollment and capacity decrements.
   - Soft delete pattern (`deletedAt`) protecting historical student and academic records.
   - Optimized indexing on relational foreign keys and search query fields.
5. **Real-Time bKash Tokenized Checkout (Sandbox)**:
   - Integrated with official bKash Tokenized Payment API.
   - Dynamic Grant Token generation, Payment Creation with auto-generated Invoice/Callbacks.
   - Automatic execution, status transition (`status: PAID`), and instant course enrollment activation (`status: ENROLLED`).
   - Resilient date parsing handling non-standard bKash timezone strings.
6. **Academic Lifecycle Management**:
   - **Semesters**: Active status toggles, date ranges, and code validation.
   - **Courses & Offerings**: Credits, prerequisite course bindings, room numbers, section quotas, and schedule conflict guards.
   - **Enrollments**: Capacity quotas, duplicate enrollment prevention, section-time clash validation, and drop workflows.
   - **Grading & Results**: Grade calculation algorithm (`A+`, `A`, `A-`, `B`, etc. with 4.0 GPA scale), student draft-result shielding, and bulk publication.
7. **Analytics & Audit Trails**:
   - Comprehensive **Admin Dashboard Analytics** (`/api/v1/users/admin/dashboard-stats`) tracking total users, revenue BDT, enrollment rates, and grade distribution.
   - **Immutable Audit Logging** tracking critical operations (`LOGIN`, `USER_BLOCKED`, `ENROLL_COURSE`, `PAYMENT_SUCCESS`, `SUBMIT_RESULT`, `PUBLISH_RESULT`).
8. **Consistent Response & Error Contract**:
   - Standard Success: `{ "success": true, "statusCode": 200, "message": "...", "data": {} }`
   - Standard Error: `{ "success": false, "statusCode": 400, "message": "...", "errors": [], "error": {} }`

---

## 🛠️ Tech Stack

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Runtime & Framework** | Node.js (v20+), Express.js 5, TypeScript | Scalable, high-performance RESTful API with strict compile-time typing |
| **Database & ORM** | PostgreSQL, Prisma ORM 7 | Relational models, foreign key cascades, migrations, and ACID transactions |
| **Caching & In-Memory** | Redis (with local in-memory fallback) | Refresh token tracking, OTP caching, and API rate limiting |
| **Authentication** | JWT, Passport.js, Google OAuth (GCP) | Dual-token authentication, Google social login, and RBAC guards |
| **Payment Gateway** | bKash Tokenized Checkout Sandbox | Real-time payment processing, invoice generation, and status callbacks |
| **Validation** | Zod 4 | Strict request body, query parameter, and UUID validation |
| **File Storage** | Multer, Cloudinary | Secure profile picture and document uploads with CDN hosting |
| **Email Service** | Nodemailer, EJS Templates | Transactional emails (OTP verification, welcome messages) |
| **Code Quality & Build** | Biome, TSUp | Ultra-fast linting, formatting, and production bundling |

---

## 👤 Pre-Seeded Demo User Credentials

The database comes pre-seeded with ready-to-test accounts for all three primary roles:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `11111111` | Full administrative control, user block/unblock, courses, offerings, bulk result publishing, analytics |
| **Teacher** | `teacher@example.com` | `11111111` | View assigned courses & students, submit marks & grades, update drafts |
| **Student** | `student@example.com` | `11111111` | Browse offerings, enroll in courses, execute bKash payment, view published grades |

---

## 💳 bKash Sandbox Testing Guide

To test the end-to-end payment workflow:

1. **Enroll in a Course Offering** as a Student (`POST /api/v1/enrollments`). This creates a record with `status: PENDING_PAYMENT`.
2. **Initiate Payment** (`POST /api/v1/payments/create-bkash-payment`) with the returned `enrollmentId`.
3. Open the returned `bkashURL` in your browser.
4. Use the following sandbox test credentials:
   - **Wallet Mobile Number**: `01929918378` (or `01877722345`, `01619777283`)
   - **Verification Code (OTP)**: `123456`
   - **bKash PIN**: `12121`
5. Upon confirmation, bKash redirects to the API callback (`/api/v1/payments/bkash/callback`), which executes the payment, stores transaction details (e.g. `trxID`), transitions Payment to `PAID`, and automatically upgrades the Student's Enrollment to `ENROLLED`.

---

## 📚 Complete API Reference (54 Endpoints)

### 1. Authentication (`/api/v1/auth`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Register new student or teacher account with OTP | Public |
| `POST` | `/api/v1/auth/verify-email` | Verify email OTP code and activate account | Public |
| `POST` | `/api/v1/auth/resend-otp` | Resend verification OTP code | Public |
| `POST` | `/api/v1/auth/login` | Login with email & password (returns JWT & cookie) | Public |
| `POST` | `/api/v1/auth/refresh-token` | Obtain new access token via refresh token cookie | Public |
| `POST` | `/api/v1/auth/logout` | Invalidate refresh token and clear cookies | Authenticated |
| `GET` | `/api/v1/auth/me` | Fetch currently logged-in user profile | Authenticated |
| `PATCH` | `/api/v1/auth/me` | Update logged-in user profile details | Authenticated |
| `POST` | `/api/v1/auth/change-password` | Change user password | Authenticated |
| `POST` | `/api/v1/auth/forgot-password` | Request password reset OTP | Public |
| `POST` | `/api/v1/auth/resend-reset-otp` | Resend password reset OTP | Public |
| `POST` | `/api/v1/auth/reset-password` | Reset password using OTP code | Public |
| `GET` | `/api/v1/auth/google` | Trigger Google OAuth 2.0 redirection | Public |
| `GET` | `/api/v1/auth/google/callback` | Google OAuth callback handler | Public |

### 2. User Management & Admin Dashboard (`/api/v1/users`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/users` | List users with pagination, role & status filters | `ADMIN` |
| `GET` | `/api/v1/users/admin/dashboard-stats` | Aggregated system analytics (revenue, users, enrollment) | `ADMIN` |
| `GET` | `/api/v1/users/:id` | Get user details by ID | `ADMIN` |
| `POST` | `/api/v1/users/create-admin` | Create new administrator account | `SUPER_ADMIN` |
| `PATCH` | `/api/v1/users/:id/status` | Block or Unblock user account (`ACTIVE`, `BLOCKED`) | `ADMIN` |
| `PATCH` | `/api/v1/users/:id/role` | Change user role (`STUDENT`, `TEACHER`, `ADMIN`) | `SUPER_ADMIN` |
| `DELETE`| `/api/v1/users/:id` | Delete user account | `SUPER_ADMIN` |
| `PATCH` | `/api/v1/users/profile-image` | Upload profile image via Multer & Cloudinary | Authenticated |

### 3. Semester Management (`/api/v1/semesters`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/semesters` | Create academic semester (e.g., Fall 2026) | `ADMIN` |
| `GET` | `/api/v1/semesters` | List all semesters with pagination & search | Authenticated |
| `GET` | `/api/v1/semesters/:id` | Get semester details by ID | Authenticated |
| `PATCH` | `/api/v1/semesters/:id` | Update semester details & date ranges | `ADMIN` |
| `DELETE`| `/api/v1/semesters/:id` | Soft delete semester | `ADMIN` |

### 4. Course Management (`/api/v1/courses`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/courses` | Create new course with credits & prerequisites | `ADMIN` |
| `GET` | `/api/v1/courses` | List courses with code/title search & filters | Authenticated |
| `GET` | `/api/v1/courses/:id` | Get course details & prerequisite tree | Authenticated |
| `PATCH` | `/api/v1/courses/:id` | Update course title, credits, or images | `ADMIN` |
| `DELETE`| `/api/v1/courses/:id` | Soft delete course | `ADMIN` |

### 5. Course Offerings (`/api/v1/course-offerings`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/course-offerings` | Create offering (section, capacity, teacher assignment) | `ADMIN` |
| `GET` | `/api/v1/course-offerings` | List offerings filtered by semester, course, or teacher | Authenticated |
| `GET` | `/api/v1/course-offerings/:id`| Get offering details with enrolled student count | Authenticated |
| `PATCH` | `/api/v1/course-offerings/:id`| Update capacity, room, or faculty assignment | `ADMIN` |
| `DELETE`| `/api/v1/course-offerings/:id`| Soft delete course offering | `ADMIN` |

### 6. Enrollments (`/api/v1/enrollments`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/enrollments` | Enroll in course offering (capacity & conflict guarded) | `STUDENT` |
| `GET` | `/api/v1/enrollments` | List enrollments with filters | `ADMIN`, `TEACHER` |
| `GET` | `/api/v1/enrollments/my-enrollments`| List current student's enrolled courses | `STUDENT` |
| `GET` | `/api/v1/enrollments/:id` | Get specific enrollment details | `ADMIN`, `TEACHER`, `STUDENT` |
| `PATCH` | `/api/v1/enrollments/:id/drop`| Drop course enrollment (frees section capacity) | `STUDENT`, `ADMIN` |
| `PATCH` | `/api/v1/enrollments/:id/status`| Manually update enrollment status | `ADMIN` |

### 7. Payments & bKash Gateway (`/api/v1/payments`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/payments/create-bkash-payment`| Initiate bKash Tokenized Checkout for enrollment | `STUDENT` |
| `GET` | `/api/v1/payments/bkash/callback`| bKash webhook/callback executing payment session | Public |
| `GET` | `/api/v1/payments` | List payment ledger with transaction details | `ADMIN` |
| `GET` | `/api/v1/payments/:id` | Get payment receipt by ID | `ADMIN`, `STUDENT` |

### 8. Grade Submissions & Results (`/api/v1/results`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/results/submit` | Submit marks (0-100) and auto-calculate letter grade & GPA | `TEACHER`, `ADMIN` |
| `GET` | `/api/v1/results` | List published results (or drafts for teacher/admin) | `ADMIN`, `TEACHER`, `STUDENT` |
| `GET` | `/api/v1/results/:id` | Get specific student result | `ADMIN`, `TEACHER`, `STUDENT` |
| `PATCH` | `/api/v1/results/:id` | Update marks and remarks | `TEACHER`, `ADMIN` |
| `PATCH` | `/api/v1/results/bulk-publish` | Bulk publish all drafted results for a course offering | `ADMIN` |

### 9. Audit Logging (`/api/v1/audit-logs`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/audit-logs` | Query immutable audit trails with action & user filters | `ADMIN` |
| `GET` | `/api/v1/audit-logs/:id`| Get audit log entry with IP, User-Agent, and metadata | `ADMIN` |

---

## 🛠️ Local Setup & Installation

### Prerequisites
- **Node.js**: v20.x or higher
- **pnpm**: v9.x or higher
- **PostgreSQL Database**: Local or Cloud (e.g. Supabase, Neon, Railway)
- **Redis Server** *(Optional — system automatically falls back to in-memory store)*

### 1. Clone the Repository
```bash
git clone https://github.com/nurulla-hasan/L2B7A6.git
cd L2B7A6
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory:
```env
NODE_ENV=development
PORT=5000
API_PREFIX=/api/v1
FRONTEND_URL=http://localhost:3000

# Database (PostgreSQL)
DATABASE_URL="postgresql://username:password@localhost:5432/university_db?schema=public"

# Redis Cache (Optional, fallback provided)
REDIS_URL="redis://localhost:6379"

# JWT Authentication
JWT_ACCESS_SECRET=your_super_secret_access_key
JWT_REFRESH_SECRET=your_super_secret_refresh_key
JWT_ACCESS_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# bKash Sandbox API
BKASH_BASE_URL=https://tokenized.sandbox.bka.sh/v2.0
BKASH_APP_KEY=your_sandbox_app_key
BKASH_APP_SECRET=your_sandbox_app_secret
BKASH_USERNAME=your_sandbox_username
BKASH_PASSWORD=your_sandbox_password

# Default Admin Credentials for Seeder
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=11111111
ADMIN_NAME="System Admin"
```

### 4. Run Migrations & Seed Database
```bash
# Push schema migrations
pnpm db:migrate

# Seed demo users (Admin, Teacher, Student) and initial academic data
pnpm db:seed
```

### 5. Start the Server
```bash
# Development mode with live reload
pnpm dev

# Production build
pnpm build
pnpm start
```

The API will be live at `http://localhost:5000/api/v1`.

---

## 🧪 Postman API Testing Collection

A complete, battle-tested Postman collection is included in [`docs/postman.json`](docs/postman.json).

### Features of the Collection:
- Organized cleanly into **9 functional folders**.
- **Automated Tests & Environment Chaining**:
  - Running `1. Authentication > Login (Admin/Teacher/Student)` automatically saves `accessToken` and user IDs to collection variables.
  - Creating a course offering, enrollment, payment, or result automatically populates `courseOfferingId`, `enrollmentId`, `paymentId`, and `resultId` across subsequent requests.
  - Zero manual copying and pasting required!

---

## 📹 Video Walkthrough Outline (For Submission)

When recording your 5-10 minute presentation:
1. **Introduction & Tech Stack Overview (1 min)**:
   - Introduce yourself, student ID, and the project scope (University Management System).
   - Highlight the architecture: TypeScript + Express 5 + Prisma 7 + PostgreSQL + bKash Tokenized Checkout.
2. **Three Roles & RBAC Demonstration (2 mins)**:
   - Show login with Admin (`admin@example.com`), Teacher (`teacher@example.com`), and Student (`student@example.com`).
   - Demonstrate `403 Forbidden` when a Student attempts to publish results or create courses.
3. **Course Enrollment & bKash Payment (2.5 mins)**:
   - Student enrolls in an offering with capacity checking (`status: PENDING_PAYMENT`).
   - Generate bKash Sandbox checkout link and execute payment using test credentials.
   - Show automatic status transition to `status: ENROLLED` and payment ledger entry (`status: PAID`).
4. **Marks Submission & Grading (1.5 mins)**:
   - Teacher submits marks (e.g. 85), system computes Grade `A+` (GPA 4.0).
   - Demonstrate draft hiding from student until Admin triggers Bulk Publish.
5. **Admin Dashboard Analytics & Audit Trail (1 min)**:
   - Show `GET /api/v1/users/admin/dashboard-stats` displaying live revenue BDT and enrollment counts.
   - View immutable audit log records.

---

## 📄 License

This project is licensed under the MIT License.
