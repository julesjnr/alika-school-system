# Alika Medical Training College & Medical Center — Portal System

A full-stack, multi-role institutional management platform for **Alika Medical Training College & Medical Center** located in Wangige, Kiambu County, Kenya. It brings medical training academics, community outpatient services, finance, and library services together with tailored portals for each user role.

## Institutional Overview

- **Institution:** Alika Medical Training College & Medical Center
- **Category:** Technical and Vocational College (TVC) & Licensed Outpatient Clinic
- **Physical Address:** ACK St. Peters Church Ndunyu Compound, Wangige Town, Kabete Ward, Kabete Sub-County, Kiambu County, Kenya
- **Telephone:** +254 721 578 290 / +254 723 940 093
- **Email:** info@alikamedical.co.ke
- **Website:** http://www.alikamedical.co.ke/
- **Operating Hours:** Monday – Saturday: 9:00 AM – 5:00 PM | Sunday: Closed

## Two Connected Functions

1. **Medical Training College** — Vocational and technical certificate programs in:
   - Certificate in Caregiver (4 Months, 10 Core Modules)
   - Certificate in Nurse Assistant (4 Months)
   - Certificate in Homecare Assistant (4 Months)
2. **Outpatient Medical Center** — Licensed healthcare facility providing:
   - General Outpatient Consultation
   - Family Planning & Reproductive Health
   - Infection Prevention & Control
   - Chronic Disease Management Support
   - Triage & Vital Signs Monitoring
   - Supervised Clinical Practical Training

## System Capabilities

- **Academics & Clinical Training** — Program catalog, student enrollment, clinical attachment tracking, attendance, grading, CAT/Exam marks, and transcript generation.
- **Finance & Ledgers** — Student fee statements, debit/credit ledger entries, voucher tracking, and double-entry accounting.
- **Medical Library** — Book catalog, physical turnstile gate logs, digital reading lists, reviews, and reservations.
- **Role-Based Portals** — Dedicated access gateways for Students, Lecturers, Accountants, Librarians, and Administrators.
- **Authentication & Security** — JWT session management, refresh token rotation, active session invalidation, RBAC authorization, and secure password recovery.

## User Roles

| Role | Access & Functionality |
|---|---|
| **Student** | Academic progress, module grades, fee ledgers, unit registration, timetable, and library |
| **Lecturer** | Assessment grading, attendance telemetry, class lists, and curriculum reading lists |
| **Accountant** | Invoices, payment reconciliation, vouchers, departmental budgets, and payroll |
| **Librarian** | Catalog management, book loans, reservations, gate logs, and digital assets |
| **Admin** | Master control, system diagnostics, user management, audit trails, and access recovery |

## Tech Stack

**Frontend**
- React 19 + TypeScript
- Vite
- Tailwind CSS
- Recharts & Lucide Icons

**Backend**
- Node.js + Express
- Drizzle ORM
- PostgreSQL (Supabase / Cloud SQL / Self-hosted)
- JWT + Refresh Token Authentication & RBAC

---

## Production Deployment & Packaging

### 1. Environment Configuration

Copy the production environment template and supply real production credentials:

```bash
cp .env.example .env
```

Ensure the following critical variables are configured in `.env`:
- `NODE_ENV=production`
- `PORT=3000`
- `DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<dbname>?sslmode=require`
- `JWT_SECRET=<strong-random-64-character-secret>`
- `APP_URL=https://portal.alikamedical.co.ke`
- `CORS_ORIGINS=https://portal.alikamedical.co.ke`
- `RESEND_API_KEY=<your-resend-api-key>` (if email notifications/resets are enabled)

---

### 2. Standard Production Build & Run (Node.js / VPS / Process Manager)

#### Step A: Install dependencies
```bash
npm ci
```

#### Step B: Run database migrations
```bash
npm run db:migrate
```

#### Step C: Build for production
```bash
npm run build
```
This compiles the frontend single-page application into `frontend/dist` and bundles the backend server into `backend/dist/server.cjs`.

#### Step D: Start production server
```bash
npm start
```
The server will start and serve both the API endpoints (`/api/*`) and the compiled frontend application on the designated `PORT` (default `3000`).

---

### 3. Docker Deployment

#### Build & Run with Docker Compose
```bash
# Start application and PostgreSQL services in detached mode
docker compose up --build -d

# Check service logs
docker compose logs -f app
```

#### Run Database Migrations in Docker
```bash
docker compose exec app npm run db:migrate
```

#### Standalone Docker Image Build
```bash
# Build production image
docker build -t alika-school-portal:latest .

# Run container with persistent uploads volume
docker run -d \
  --name alika_portal \
  -p 3000:3000 \
  --env-file .env \
  -v alika_uploads:/app/uploads \
  alika-school-portal:latest
```

---

### 4. Health Check

The backend includes an unauthenticated health check endpoint:
```bash
curl -i http://localhost:3000/api/health
```
Expected response: `HTTP 200 OK` with JSON `{ "status": "ok", "timestamp": "..." }`.

---

## Development Workflow

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run in Development Mode**
   ```bash
   npm run dev
   ```
   - Frontend runs on `http://localhost:5173` (or configured dev port)
   - Backend API runs on `http://localhost:3000`

## Useful Commands Reference

| Command | Description |
|---|---|
| `npm run build` | Build frontend and backend distribution bundles for production |
| `npm start` | Start the production server |
| `npm run db:migrate` | Apply database migrations via Drizzle ORM |
| `npm run db:push` | Push schema changes to database (development only) |
| `npm run dev` | Start development servers concurrently |
| `npm run lint` | TypeScript type-checking across all workspaces |
| `npm run test` | Execute test suites across workspaces |
