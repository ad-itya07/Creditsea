# CreditSea Loan Management System

A full-stack Loan Management System built for the CreditSea assignment. The application models the complete operational lifecycle of a loan: borrower onboarding, business-rule eligibility, document upload, loan application, sanction approval, disbursement, collection, and closure.

The project is split into a **Next.js client** and an **Express + TypeScript server**, with MongoDB for persistence and Cloudinary for salary-slip storage.

---

## Table of Contents

- [Project Highlights](#project-highlights)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Loan Lifecycle](#loan-lifecycle)
- [Roles and Dashboards](#roles-and-dashboards)
- [Backend Architecture](#backend-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [Seeded Demo Accounts](#seeded-demo-accounts)
- [API Reference](#api-reference)
- [Business Rules](#business-rules)
- [Data Models](#data-models)
- [Validation and Security](#validation-and-security)
- [Scripts](#scripts)
- [Suggested Demo Flow](#suggested-demo-flow)

---

## Project Highlights

- **End-to-end loan workflow** from borrower registration to final repayment closure.
- **Role-based access control** for Borrower, Sales, Sanction, Disbursement, Collection, and Admin users.
- **Server-side Business Rule Engine (BRE)** that validates eligibility before allowing an applicant to continue.
- **Multi-step borrower wizard** with client-side validation, salary-slip preview, loan sliders, and repayment preview.
- **Operational dashboards** for each internal team with filtering, search, pagination, and contextual actions.
- **Cloudinary document upload** using Multer memory storage and stream upload.
- **JWT authentication** with password hashing via bcrypt.
- **Type-safe codebase** across both client and server using TypeScript.
- **Centralized error handling** with custom error classes for consistent API responses.
- **MongoDB/Mongoose persistence** with normalized user, loan, and payment collections.

---

## Tech Stack

### Client

- **Next.js 15** with App Router
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **React Hook Form**
- **Zod**
- **Framer Motion**
- **Lucide React icons**

### Server

- **Node.js**
- **Express.js**
- **TypeScript**
- **MongoDB + Mongoose**
- **JWT**
- **bcryptjs**
- **Zod**
- **Multer**
- **Cloudinary**

---

## Repository Structure

```text
Creditsea/
├── client/                         # Next.js frontend
│   ├── src/
│   │   ├── app/                    # App Router pages and layouts
│   │   │   ├── borrower/           # Borrower home, apply, status
│   │   │   ├── dashboard/          # Sales, sanction, disbursement, collection dashboards
│   │   │   ├── login/              # Login page
│   │   │   └── register/           # Borrower registration page
│   │   ├── components/             # Shared UI components
│   │   ├── context/                # AuthContext
│   │   ├── lib/                    # API client and formatting helpers
│   │   └── types.ts                # Shared frontend types
│   ├── package.json
│   └── next.config.ts
│
├── server/                         # Express backend
│   ├── src/
│   │   ├── config/                 # MongoDB and Cloudinary config
│   │   ├── constants/              # Roles and loan statuses
│   │   ├── controllers/            # Route controllers
│   │   ├── errors/                 # Custom API error classes
│   │   ├── middleware/             # Auth, role guard, upload, error handler
│   │   ├── models/                 # Mongoose models
│   │   ├── routes/                 # Express route definitions
│   │   ├── seed/                   # Demo user seeding
│   │   ├── services/               # Business logic services
│   │   ├── utils/                  # Async handler and Cloudinary upload helper
│   │   ├── app.ts                  # Express app setup
│   │   └── server.ts               # Server bootstrap
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                           # Additional client/server documentation
├── LMS_Assignment (1).pdf          # Assignment reference
└── README.md
```

---

## Loan Lifecycle

The system follows this lifecycle:

```text
NOT_APPLIED
   ↓ borrower submits details
LEAD or BRE_REJECTED
   ↓ salary slip upload + loan configuration
APPLIED
   ↓ sanction team approval/rejection
SANCTIONED or REJECTED
   ↓ disbursement team action
DISBURSED
   ↓ collection team records repayments
CLOSED
```

### Status Meaning

| Status | Meaning |
| --- | --- |
| `NOT_APPLIED` | Borrower has registered but has no loan record yet. |
| `LEAD` | Borrower passed BRE and can upload documents/apply. |
| `BRE_REJECTED` | Borrower failed eligibility rules. |
| `APPLIED` | Borrower submitted amount and tenure for review. |
| `SANCTIONED` | Sanction team approved the application. |
| `REJECTED` | Sanction team rejected the application. |
| `DISBURSED` | Loan amount has been marked as disbursed. |
| `CLOSED` | Loan has been fully repaid. |

---

## Roles and Dashboards

| Role | Access | Main Capabilities |
| --- | --- | --- |
| `BORROWER` | Borrower portal | Register/login, submit details, upload salary slip, apply for loan, track status. |
| `SALES` | Sales dashboard | View borrower leads and application status. |
| `SANCTION` | Sanction dashboard | Review applied loans, inspect borrower details/documents, approve or reject. |
| `DISBURSEMENT` | Disbursement dashboard | View sanctioned loans and mark them as disbursed. |
| `COLLECTION` | Collection dashboard | View disbursed loans, record payments, inspect transaction history. |
| `ADMIN` | All dashboards | Switch between Sales, Sanction, Disbursement, and Collection views. |

---

## Backend Architecture

The backend uses a clean MVC-inspired structure:

- **Routes** define the public API surface.
- **Controllers** handle request/response logic.
- **Services** contain reusable business logic such as BRE checks and loan calculations.
- **Models** define MongoDB collections using Mongoose.
- **Middleware** handles authentication, authorization, file uploads, and error formatting.
- **Custom errors** keep validation, auth, not-found, conflict, and BRE failures consistent.

### Key Backend Files

| File | Purpose |
| --- | --- |
| `server/src/app.ts` | Configures Express middleware, health route, routers, 404 handler, and global error handler. |
| `server/src/server.ts` | Connects to MongoDB and starts the API server. |
| `server/src/controllers/auth.controller.ts` | Register, login, and current-user profile APIs. |
| `server/src/controllers/borrower.controller.ts` | Borrower details, salary-slip upload, loan application, and loan status. |
| `server/src/controllers/dashboard.controller.ts` | Sales, sanction, disbursement, and collection operations. |
| `server/src/services/bre.service.ts` | Business Rule Engine eligibility checks. |
| `server/src/services/loan.service.ts` | Simple-interest loan calculation. |
| `server/src/models/User.ts` | User account and borrower profile schema. |
| `server/src/models/Loan.ts` | Loan lifecycle, financial fields, and status tracking. |
| `server/src/models/Payment.ts` | Collection payment records with unique UTR numbers. |

---

## Frontend Architecture

The frontend uses Next.js App Router and separates page routes, shared UI, authentication state, and API utilities.

### Main Screens

- `/` redirects into the appropriate experience.
- `/login` authenticates existing users.
- `/register` creates borrower accounts.
- `/borrower` borrower landing/status area.
- `/borrower/apply` loan application wizard.
- `/borrower/status` current borrower loan status.
- `/dashboard/sales` borrower lead table.
- `/dashboard/sanction` sanction queue and review screen.
- `/dashboard/disbursement` disbursement queue.
- `/dashboard/collection` repayment collection screen.

### Frontend Features

- **AuthContext** stores the authenticated user and JWT token.
- **Protected routes** redirect users away from unauthorized areas.
- **Central API client** automatically attaches the `Authorization: Bearer <token>` header.
- **Loan wizard** validates applicant data, previews salary slips, computes repayment preview, and submits the final application.
- **Dashboards** include table filtering, search, pagination, status badges, and action buttons.
- **Admin navigation** allows an admin to switch across operational dashboards without logging in as each team.

---

## Setup Instructions

### Prerequisites

- Node.js 18+
- npm
- MongoDB database URI
- Cloudinary account credentials

### 1. Clone and Install

```bash
git clone <repo-url>
cd Creditsea

cd server
npm install

cd ../client
npm install
```

### 2. Configure Environment Files

Create `server/.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URL=mongodb+srv://<username>:<password>@<cluster>/<database>
JWT_SECRET=replace_with_a_strong_secret
JWT_EXPIRES_IN=24h
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Create `client/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

### 3. Seed Demo Users

From the `server` directory:

```bash
npm run seed
```

### 4. Start the Backend

From the `server` directory:

```bash
npm run dev
```

The backend will run on:

```text
http://localhost:5000
```

Health check:

```text
GET http://localhost:5000/api/health
```

### 5. Start the Frontend

From the `client` directory:

```bash
npm run dev
```

The frontend will run on:

```text
http://localhost:3000
```

---

## Environment Variables

### Server

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | No | API port. Defaults to `5000`. |
| `NODE_ENV` | No | Runtime environment label. |
| `MONGODB_URL` | Yes | MongoDB connection string. |
| `JWT_SECRET` | Yes | Secret used to sign and verify JWTs. |
| `JWT_EXPIRES_IN` | No | Token expiry. Defaults to `24h`. |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary cloud name. |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret. |

### Client

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | No | Backend API base URL. Defaults to `http://localhost:5000/api`. |

---

## Seeded Demo Accounts

After running `npm run seed` in the server folder, these accounts are available:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@lms.com` | `Admin@123` |
| Sales | `sales@lms.com` | `Sales@123` |
| Sanction | `sanction@lms.com` | `Sanction@123` |
| Disbursement | `disbursement@lms.com` | `Disburse@123` |
| Collection | `collection@lms.com` | `Collect@123` |
| Borrower | `borrower@lms.com` | `Borrow@123` |

New public registrations always create a `BORROWER` account.

---

## API Reference

Base URL:

```text
http://localhost:5000/api
```

### Health

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/health` | No | Confirms that the API is running. |

### Authentication

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | No | Creates a borrower account and returns a JWT. |
| `POST` | `/auth/login` | No | Logs in a user and returns a JWT. |
| `GET` | `/auth/me` | Yes | Returns the current authenticated user. |

### Borrower

All borrower routes require `BORROWER` role.

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/borrower/details` | Saves applicant details and runs BRE. |
| `POST` | `/borrower/upload-salary-slip` | Uploads a PDF/JPG/PNG salary slip to Cloudinary. |
| `POST` | `/borrower/apply` | Submits principal and tenure, calculates repayment, and marks loan as `APPLIED`. |
| `GET` | `/borrower/my-loan` | Returns the borrower loan record. |

### Dashboard

All dashboard routes require authentication and the matching role, or `ADMIN`.

| Method | Endpoint | Roles | Description |
| --- | --- | --- | --- |
| `GET` | `/dashboard/sales` | `SALES`, `ADMIN` | Lists borrower leads and current loan status. |
| `GET` | `/dashboard/sanction` | `SANCTION`, `ADMIN` | Lists loans in the sanction pipeline. |
| `PATCH` | `/dashboard/sanction/:loanId/approve` | `SANCTION`, `ADMIN` | Moves an `APPLIED` loan to `SANCTIONED`. |
| `PATCH` | `/dashboard/sanction/:loanId/reject` | `SANCTION`, `ADMIN` | Rejects an `APPLIED` loan with a reason. |
| `GET` | `/dashboard/disbursement` | `DISBURSEMENT`, `ADMIN` | Lists sanctioned/disbursed/closed loans. |
| `PATCH` | `/dashboard/disbursement/:loanId/disburse` | `DISBURSEMENT`, `ADMIN` | Marks a sanctioned loan as `DISBURSED`. |
| `GET` | `/dashboard/collection` | `COLLECTION`, `ADMIN` | Lists disbursed and closed loans. |
| `POST` | `/dashboard/collection/:loanId/payment` | `COLLECTION`, `ADMIN` | Records a repayment and updates outstanding amount. |
| `GET` | `/dashboard/collection/:loanId/payments` | `COLLECTION`, `ADMIN` | Lists payment history for a loan. |

---

## Business Rules

The BRE runs on the server and validates:

| Rule | Requirement |
| --- | --- |
| Age | Applicant must be between 23 and 50 years old. |
| Salary | Monthly salary must be at least `₹25,000`. |
| PAN | PAN must match Indian PAN format, for example `ABCDE1234F`. |
| Employment | Applicant cannot be `Unemployed`. |

The client repeats the same checks to give immediate feedback, but the backend remains the source of truth.

### Loan Calculation

The application uses fixed simple interest at **12% per annum**:

```text
SI = (P × R × T) / (365 × 100)
Total Repayment = Principal + SI
```

Allowed borrower-selected ranges:

| Field | Range |
| --- | --- |
| Principal | `₹50,000` to `₹5,00,000` |
| Tenure | `30` to `365` days |

---

## Data Models

### User

Stores identity, authentication, role, and borrower profile data.

Important fields:

- `name`
- `email`
- `password`
- `role`
- `profile.fullName`
- `profile.pan`
- `profile.dateOfBirth`
- `profile.monthlySalary`
- `profile.employmentMode`
- `profile.salarySlipUrl`

### Loan

Tracks the full loan lifecycle and financial state.

Important fields:

- `borrower`
- `principal`
- `tenureDays`
- `interestRate`
- `interestAmount`
- `totalRepayment`
- `status`
- `rejectionReason`
- `sanctionedBy`
- `sanctionedAt`
- `disbursedBy`
- `disbursedAt`
- `totalPaid`
- `outstandingAmount`

### Payment

Stores collection payments.

Important fields:

- `loan`
- `borrower`
- `utrNumber`
- `amount`
- `paymentDate`
- `recordedBy`

The `utrNumber` is unique to prevent duplicate transaction entries.

---

## Validation and Security

- Passwords are hashed using `bcryptjs`.
- JWTs are required for protected routes.
- Role middleware blocks unauthorized dashboard and borrower operations.
- Zod validates request bodies on the server.
- Multer restricts salary-slip uploads to PDF, JPG, and PNG.
- Upload size is limited to 5 MB.
- Cloudinary stores uploaded salary slips securely and returns the hosted URL.
- Collection payments reject overpayment attempts.
- Fully repaid loans are automatically marked as `CLOSED`.
- Centralized error middleware returns consistent JSON responses.

---

## Scripts

### Server

Run inside `server/`:

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the Express server with `ts-node-dev`. |
| `npm run build` | Compiles TypeScript into `dist/`. |
| `npm start` | Runs the compiled server. |
| `npm run seed` | Creates demo users. |
| `npm run lint` | Runs TypeScript checking with `tsc --noEmit`. |

### Client

Run inside `client/`:

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the Next.js development server. |
| `npm run build` | Builds the production frontend. |
| `npm start` | Starts the production Next.js server. |
| `npm run lint` | Runs Next lint command. |
| `npm run typecheck` | Runs TypeScript checking with `tsc --noEmit`. |

---

## Suggested Demo Flow

1. Start MongoDB, backend, and frontend.
2. Seed the demo accounts.
3. Log in as `borrower@lms.com`.
4. Complete borrower details using eligible values:
   - PAN: `ABCDE1234F`
   - Salary: `30000` or above
   - Employment: `Salaried`
   - Age: between 23 and 50
5. Upload a PDF/JPG/PNG salary slip.
6. Select loan amount and tenure, then submit the application.
7. Log in as `sanction@lms.com` or `admin@lms.com`.
8. Open the sanction dashboard, inspect the application, and approve it.
9. Log in as `disbursement@lms.com` or continue as admin.
10. Mark the sanctioned loan as disbursed.
11. Log in as `collection@lms.com` or continue as admin.
12. Record one or more payments.
13. When the outstanding amount reaches zero, verify that the loan moves to `CLOSED`.

---

## Why This Project Is Assignment-Ready

This repository demonstrates more than isolated CRUD operations. It implements a realistic loan pipeline with separate responsibilities for each role, strong validation boundaries, document handling, financial calculation, controlled status transitions, and repayment tracking.

The codebase is structured so each layer has a clear responsibility, making it straightforward to review, extend, and test. The UI also reflects real operational workflows: borrowers get a guided application flow, while internal teams get focused dashboards for their stage of the loan lifecycle.
