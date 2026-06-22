# 🎨 KFintech Nexus Portal — Enterprise Frontend UI

Welcome to the frontend repository for the **KFintech Nexus Portal**. This interface is engineered for high-volume enterprise data entry and grievance management, providing a frictionless user experience for both external investors and internal compliance officers.

## 🌟 Business Impact & UX Strategy
In the financial services sector, clunky internal tools lead to fatigue, errors, and increased Turnaround Times (TAT). We built this frontend to solve that:
- **Glassmorphic Design System:** Provides a modern, calm, and distraction-free environment that reduces cognitive load for agents processing hundreds of tickets a day.
- **Role-Based Workspaces:** Context-switching is eliminated. Investors see a clean submission portal; L1 Makers see triage dashboards enriched with AI summaries; L2 Checkers see strict approval interfaces.
- **Real-Time Data Feeds:** Immediate feedback loops on file uploads, OCR verification, and Sentiment Analysis scores.

## 🛠️ Technology Stack
- **Framework:** React.js powered by Vite for lightning-fast HMR (Hot Module Replacement) and optimized production builds.
- **Styling:** TailwindCSS for utility-first, highly responsive design scaling from mobile devices to ultrawide enterprise monitors.
- **State Management:** React Hooks and Context API for lightweight, prop-drilling-free data flow.
- **Routing:** React Router DOM for seamless Single Page Application (SPA) navigation.

## 🚀 Development Setup
*(Note: If you are running the full stack via Docker Compose from the root directory, you do not need to run these commands manually).*

To run the frontend in standalone development mode:

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

3. **Build for Production:**
   ```bash
   npm run build
   ```
   This generates an optimized, minified bundle in the `dist` directory, ready to be served by NGINX in our Docker container.

## 🛡️ Hackathon Focus: Maker-Checker Enforcement
A critical aspect of our UI is the enforcement of the **Maker-Checker** principle:
- **Investor Dashboard:** Cannot view internal AI metrics or approve their own tickets.
- **L1 Maker Desk:** Can view AI summaries and escalate, but the "Finalize" button is structurally disabled or hidden.
- **L2 Checker Desk:** The only interface capable of triggering the final `POST /api/l2/finalize` endpoint, ensuring 100% audit compliance.
