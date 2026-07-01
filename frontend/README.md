# FinnovaX Frontend

> React + Vite + Tailwind CSS — Investor Portal, Admin Desks & AI Chatbot

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-Latest-646CFF?style=flat&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=flat&logo=tailwindcss)](https://tailwindcss.com/)

---

## What This Is

The frontend is a Single Page Application (SPA) that serves four distinct role-based interfaces over a unified codebase:

| Portal | Route | Users |
|--------|-------|-------|
| Landing Page | `/` | All visitors |
| Auth Pages | `/login`, `/register`, `/forgot-password` | Unauthenticated |
| Investor Dashboard | `/investor` | `INVESTOR` role |
| L1 Maker Desk | `/l1-maker` | `ADMIN_L1` role |
| L2 Checker Desk | `/l2-checker` | `ADMIN_L2` role |
| Super Admin Dashboard | `/admin` | `ADMIN_SUPER` role |
| Profile Page | `/profile` | All authenticated |

Navigation between portals is guarded by `ProtectedRoute.jsx`, which checks the user's role from `AuthContext` and redirects unauthorized access.

---

## Real-World Purpose

This is not a mock UI. Every button triggers a real API call:

- **Investor submitting a ticket** → `POST /api/tickets` → FinBERT analyzes the text → Cloudinary stores documents → email is sent
- **L1 clicking "Get AI Summary"** → `POST /api/l1/tickets/:id/summarize` → Gemini/Ollama generates 3 bullets
- **L2 clicking "Approve"** → `POST /api/l2/finalize` → ticket resolved → investor gets a branded HTML email
- **Chat input** → `POST /api/chat/ask` → ChromaDB + Gemini RAG response rendered in WhatsApp-style bubble

---

## Setup

```bash
npm install

# For development:
npm run dev

# For production build:
npm run build
```

**Environment variables (`.env.local`):**
```
VITE_API_URL=http://localhost:5000/api
```

---

## Key Files

| File | Purpose | Test By |
|------|---------|---------|
| `src/App.jsx` | Root routing, RBAC route guards, global layout | Check that `/admin` redirects an investor to `/investor` |
| `src/context/AuthContext.jsx` | JWT user state, role-aware routing | Log in as different roles |
| `src/context/ThemeContext.jsx` | Dark/Light mode, persisted in localStorage | Toggle theme, refresh page — state should persist |
| `src/components/common/ChatbotWidget.jsx` | Finnora AI chatbot with interactive eyes, sound FX, WhatsApp bubbles | Focus a password field — Finnora closes her eyes |
| `src/config/serviceTypes.js` | Source of truth for service types, SLA, required documents | Create a BANK_UPDATE ticket and see the checklist |
| `src/pages/L1MakerDesk.jsx` | Full L1 triage dashboard — queue, sentiment, OCR, summary | Log in as L1, assign and summarize a ticket |
| `src/pages/L2CheckerDesk.jsx` | L2 approval dashboard | Log in as L2, finalize an escalated ticket |

---

## Architecture

```
src/
  api/client.js         ← Axios instance, auto-attaches JWT
  context/              ← AuthContext (user state), ThemeContext (dark/light)
  components/
    common/             ← ChatbotWidget, Sidebar, ThemeToggle, Navbar
    investor/           ← CreateTicketFlow, MyTickets, TicketDetail, Profile
    admin/              ← StatCard, DashboardHeader, DashboardToolbar
    ui/                 ← shadcn/ui + custom animations
  pages/                ← One file per route
  config/               ← serviceTypes.js
```
