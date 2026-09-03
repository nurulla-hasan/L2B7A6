# Academic Portal Backend Boilerplate

A production-ready Node.js & Express REST API boilerplate built with TypeScript, Prisma 7, PostgreSQL, Redis, and JWT authentication with Role-Based Access Control (RBAC).

---

## 🚀 Tech Stack

- **Runtime & Framework**: Node.js, Express 5.x, TypeScript
- **Database ORM**: Prisma 7 (with `@prisma/adapter-pg` & PostgreSQL)
- **Caching & Sessions**: Redis (with automatic in-memory fallback for local development)
- **Authentication**: JWT (Access Token + Refresh Token in HttpOnly cookies/bearer), Passport.js (Local Strategy + Google OAuth)
- **Validation**: Zod
- **Email Service**: Nodemailer + EJS templates (console fallback in development)
- **File Uploads**: Multer + Cloudinary
- **Code Quality**: Biome (Linter & Formatter)
- **Bundler**: TSUp

---

## 👥 Roles Supported

- `SUPER_ADMIN`: Full system control
- `ADMIN`: Administrator
- `TEACHER` / `FACULTY`: Faculty member
- `STUDENT`: Student

---

## 📁 Project Structure

```
├── prisma/
│   └── schema/
│       ├── enums.prisma      # Enums: Role, UserStatus, AuthProvider
│       ├── schema.prisma     # Client generator and datasource
│       └── user.prisma       # User, TeacherProfile, StudentProfile models
├── src/
│   ├── config/               # App and environment configurations
│   ├── lib/                  # Prisma, Redis, Email, Multer, Cloudinary, Seeder
│   ├── middlewares/          # Auth, RBAC, Validation, Error Handling
│   ├── modules/
│   │   ├── auth/             # Authentication & OTP verification
│   │   └── user/             # User management endpoints
│   ├── routes/               # API route definitions
│   ├── templates/            # EJS email templates
│   ├── types/                # Express & custom type definitions
│   ├── utils/                # Response helpers, Error classes, JWT utils
│   ├── app.ts                # Express app setup & middlewares
│   └── server.ts             # Server entry point
├── biome.json                # Biome configuration
├── prisma.config.ts          # Prisma 7 configuration
├── tsconfig.json             # TypeScript configuration
└── tsup.config.ts            # Production bundler config
```

---

## 🔑 Available API Endpoints

### Authentication (`/api/v1/auth`)
- `POST /api/v1/auth/register` - Register new user (Sends 6-digit OTP to email)
- `POST /api/v1/auth/verify-email` - Verify email OTP and activate account
- `POST /api/v1/auth/resend-otp` - Resend verification code
- `POST /api/v1/auth/login` - Login with email & password
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `POST /api/v1/auth/logout` - Logout and clear authentication cookies
- `GET /api/v1/auth/me` - Get current authenticated user profile
- `PATCH /api/v1/auth/me` - Update current user profile
- `POST /api/v1/auth/change-password` - Change password
- `POST /api/v1/auth/forgot-password` - Request password reset OTP
- `POST /api/v1/auth/resend-reset-otp` - Resend password reset OTP
- `POST /api/v1/auth/reset-password` - Reset password with OTP
- `GET /api/v1/auth/google` - Initiate Google OAuth sign-in
- `GET /api/v1/auth/google/callback` - Google OAuth callback

### User Management (`/api/v1/users`)
- `GET /api/v1/users` - List users with search, pagination, and role filters *(Admin only)*
- `GET /api/v1/users/:id` - Get user by ID *(Admin only)*
- `POST /api/v1/users/create-admin` - Create new admin account *(Super Admin only)*
- `PATCH /api/v1/users/:id/status` - Update user status (`ACTIVE`, `BLOCKED`) *(Admin only)*
- `PATCH /api/v1/users/:id/role` - Update user role *(Super Admin only)*
- `DELETE /api/v1/users/:id` - Delete user *(Super Admin only)*
- `PATCH /api/v1/users/profile-image` - Upload profile image *(Authenticated user)*

---

## 🛠️ Getting Started

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your details:
```bash
cp .env.example .env
```

### 3. Generate Prisma Client & Migrate
```bash
pnpm db:generate
pnpm db:migrate
```

### 4. Run in Development Mode
```bash
pnpm dev
```

### 5. Build for Production
```bash
pnpm build
pnpm start
```

