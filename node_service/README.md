# FinnovaX Node.js Backend

> Express.js REST API — Auth, Tickets, L1/L2 Workflows, Notifications, Chatbot

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4-000000?style=flat&logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat&logo=mongodb)](https://mongodb.com/)

---

## What This Is

The Node.js service is the **central orchestration layer** of FinnovaX. It:

1. Validates authentication and enforces role-based access control on every route
2. Orchestrates the ticket lifecycle (create → L1 → L2 → resolve → auto-close)
3. Proxies all AI requests to the FastAPI engine via `mlService.js`
4. Dispatches branded HTML emails for every lifecycle event
5. Manages JWT access tokens (15min) and rotating refresh tokens (7 days) with replay attack detection

---

## Real-World Purpose

When an L1 agent clicks **"Reject Ticket"** in the browser:

```
Browser → PUT /api/l1/tickets/:id/reject
  → authenticate (JWT cookie verified)
  → authorize('ADMIN_L1', 'ADMIN_SUPER') (role check)
  → l1.controller.rejectTicket()
    → ticket.status = 'REJECTED'
    → AuditLog.create({ action: 'L1_REJECTED', performedBy: req.user.id })
    → notificationService.createNotification({ type: 'TICKET_REJECTED', email: true })
      → sesService.sendEmail() → branded HTML rejection email sent to investor
```

Every action is logged, every important state change sends a notification.

---

## Setup

```bash
npm install
cp .env.example .env
# Fill in MONGODB_URI, JWT_SECRET, CLOUDINARY_URL, SMTP_USER, etc.
npm run dev
```

Server starts on `http://localhost:5000`.

Health check: `GET http://localhost:5000/health`

---

## Route Map

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/verify-otp
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
POST   /api/auth/change-password
PUT    /api/auth/profile
POST   /api/auth/profile/documents
DELETE /api/auth/profile/documents/:docType
POST   /api/auth/2fa/generate
POST   /api/auth/2fa/verify
POST   /api/auth/2fa/email/generate
POST   /api/auth/2fa/email/verify

POST   /api/tickets
GET    /api/tickets
POST   /api/tickets/sentiment
GET    /api/tickets/:id
POST   /api/tickets/:id/comments
POST   /api/tickets/:id/resubmit
POST   /api/tickets/:id/documents/:docId/ocr

GET    /api/l1/tickets
POST   /api/l1/tickets/:id/assign
POST   /api/l1/tickets/:id/escalate
POST   /api/l1/tickets/:id/reject
POST   /api/l1/tickets/:id/summarize

GET    /api/l2/tickets
POST   /api/l2/finalize

GET    /api/admin/metrics
GET    /api/admin/users
PUT    /api/admin/users/:id/status
GET    /api/admin/tickets
GET    /api/admin/tickets/flagged
GET    /api/admin/reports/export
GET    /api/admin/agents/activities
POST   /api/admin/verify-document

GET    /api/chat/history
POST   /api/chat/ask

GET    /api/dashboard/stats
GET    /api/notifications
PATCH  /api/notifications/:id/read
```

---

## Key Files

| File | Purpose | Test By |
|------|---------|---------|
| `server.js` | App factory, middleware stack, route mounting, MongoDB connection | `GET /health` |
| `middleware/auth.middleware.js` | JWT validation, RBAC authorization, optional auth for chatbot | Access `/api/admin/metrics` as Investor — expect 403 |
| `services/auth/token.service.js` | JWT generation, refresh token rotation, replay attack detection | Use same refresh token twice — all sessions are revoked |
| `services/mlService.js` | Proxy to FastAPI for sentiment, OCR, and summarization | Stop FastAPI, create a ticket — mock fallback activates |
| `services/notificationService.js` | In-app + HTML email notifications for ticket lifecycle events | Create a ticket — check inbox for branded email |
| `services/autoCloseService.js` | Background job, resolves `RESOLVED` tickets after grace period | Set `AUTO_CLOSE_GRACE_PERIOD_MS=5000`, resolve a ticket, wait 60s |
| `controllers/auth/twoFactor.controller.js` | TOTP generation via speakeasy, email OTP 2FA | Enable 2FA, scan QR in Google Authenticator |
| `models/Ticket.js` | Ticket schema with 8 compound indexes for performance | See EXPLAIN output on a ticket query |

---

## Environment Variables

See `.env.example` for the full list. Critical vars:

```env
MONGODB_URI        — MongoDB Atlas connection string
JWT_SECRET         — Must be cryptographically random, 64+ chars
ML_SERVICE_URL     — URL of the FastAPI service
CLOUDINARY_URL     — Full Cloudinary URL from dashboard
SMTP_USER          — Gmail or SMTP address
SMTP_PASS          — Gmail App Password (not your login password)
```

---

## Security Architecture

```
Request
  → Helmet.js (security headers)
  → CORS check (whitelist only)
  → Rate Limiter (5000/15min global, 10/15min login)
  → express-mongo-sanitize (NoSQL injection prevention)
  → cookieParser
  → authenticate (JWT verify)
  → authorize (role check)
  → Controller
```
