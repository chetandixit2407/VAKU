# White Collar Realty (WCR) — Reception, Visitor, Interview & Room Management PWA

A progressive web application (PWA) built for **White Collar Realty** to automate and streamline front-desk operations, visitor check-in, scheduled candidate interview lifecycle, meeting room allocations, and pantry hospitality tasks.

Designed with a mobile-first, responsive interface and real-time Server-Sent Events (SSE) synchronization across all staff dashboards.

---

## 1. Project Overview

The **White Collar Realty Office Operations Platform** connects Receptionists, HR Managers, Interviewers, Pantry Stewards, and Executive Leadership (CEO & Co-Founder) into a coordinated operational workflow.

### Key Objectives
- **Frictionless Candidate Arrival**: Fast-track QR pass scanning, self check-in registration, and live arrival photo verification.
- **Unified Room Management**: Dynamic meeting room and cabin management serving as the **single source of truth** across all modules.
- **Automated Hospitality Tasks**: Instant preparation and sanitization task generation for pantry stewards whenever a candidate is allocated to a room.
- **Role-Based Privacy & Separation**: Strict visibility controls ensuring pantry stewards, interviewers, and receptionists view only relevant operational data without exposing confidential HR records.
- **Mobile-First PWA**: Installable on Android, iOS, and Desktop with offline indicators and service worker caching.

---

## 2. Main Modules

| Module | Primary Role | Core Features |
| :--- | :--- | :--- |
| **Reception Dashboard** | Receptionists (`RECEPTION`) | Live candidate queue, walk-in registration, QR scanning, arrival camera capture, visitor tracking, checkout processing. |
| **HR Dashboard** | HR Executives (`HR`) | Candidate pipeline, interview scheduling, round progression, double-booking protected room assignment, candidate dossiers. |
| **Interviewer Dashboard** | Evaluators (`INTERVIEWER`) | Interview schedule, start/conclude evaluation, score recording, candidate resume viewer, stage advancement. |
| **Room Management** | Administrators (`ADMIN`) | Centralized room catalogue, status toggling, custom room creation, room editing, rename cascade. |
| **Hospitality / Pantry** | Stewards (`PANTRY`) | Dynamic task queue, room preparation checklist, water and beverage delivery, room reset, custom task assignment. |
| **Candidate Check-In** | Public / Candidates | Self-service registration, QR code retrieval, arrival details verification, resume upload. |
| **Executive Briefing** | Leadership (`CEO`, `CO_FOUNDER`) | High-level summary of active evaluations, offers made, room utilization, and executive candidate briefings. |
| **Notifications & Audit** | All Staff / Admin | Real-time event notifications with actionable quick-buttons, full audit logging of administrative and operational actions. |

---

## 3. Room Management Architecture

Room Management is the **Single Source of Truth** for all rooms across the entire platform.

```
                  ┌──────────────────────────────┐
                  │    Room Management (Admin)   │
                  │   (Single Source of Truth)   │
                  └──────────────┬───────────────┘
                                 │
           ┌─────────────────────┼─────────────────────┐
           ▼                     ▼                     ▼
┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐
│   HR Assignment    │ │   Interviewer UI   │ │   Pantry / Tasks   │
│ (Uses stable ID)   │ │  (Dynamic Name)    │ │  (Dynamic Name)    │
└────────────────────┘ └────────────────────┘ └────────────────────┘
```

### Architectural Principles
1. **Stable Room IDs**: All internal references (interviews, candidate room assignments, pantry tasks, notifications) store and reference the stable `roomId` (e.g. `room-lalit-cabin`, `room-skyline`).
2. **Dynamic Name Resolution**: Screens resolve the current `roomName` directly from the active Room Management dataset.
3. **No Hardcoded Room Arrays**: The Pantry, Reception, and Interview modules do not maintain separate, static, or sample room lists.
4. **Cascade on Room Rename**: If an admin updates a room's name, all active candidate locations, interview schedules, pantry tasks, and notification badges update immediately.
5. **Safe Room Deletion / Fallback**: If a room is unassigned or removed, tasks and candidate profiles clearly display `"Room Not Assigned"` rather than falling back to demo room names.

---

## 4. Hospitality & Pantry Operations

The Pantry module assists hospitality stewards in preparing meeting rooms with requested beverages and amenities before interviews begin.

### Workflow
1. **Automated Task Dispatch**: When HR assigns an office room to a candidate, the backend workflow engine automatically generates a hospitality preparation task for that room.
2. **Dynamic Room Association**: The task is bound to the room's `roomId`, displaying the exact configured room name from Room Management.
3. **Task Checklist**: Tasks include specific checklists such as:
   - *2x Bottled Mineral Water*
   - *Sanitized Glassware & Coasters*
   - *Hot Coffee / Masala Tea Service*
   - *Whiteboard Marker & Duster Check*
4. **Manual Task Assignment**: Stewards can use the **Assign Task** modal to create custom hospitality tasks by selecting from currently active rooms in Room Management.
5. **Completion & Reset**: Stewards click **"Confirm Ready & Mark Completed"**, which logs the completion in the audit trail, notifies the interviewer, and timestamps the preparation log.

---

## 5. QR Check-in & Visitor Arrival Flow

The platform supports both pre-scheduled candidate QR passes and walk-in arrivals:

1. **Scheduled Candidate QR Pass**:
   - Each candidate appointment is issued a unique QR token (e.g., `WCR-APPT-901`).
   - The QR code can be generated, downloaded, or shared via modal.
2. **Scanner & Verification**:
   - Receptionists can scan the candidate's physical or mobile QR pass using the built-in camera scanner.
   - The system retrieves candidate records, verified appointment stage, and scheduled interviewer.
3. **Live Arrival Photo Capture**:
   - Reception captures a timestamped arrival photo using the device camera (`CameraCapture.tsx`).
   - Photo is saved and linked to the candidate profile as a verified badge.
4. **Notification Dispatch**:
   - Workflow engine broadcasts `CANDIDATE_ARRIVED` to HR and assigned interviewers.

---

## 6. End-to-End Interview Lifecycle

```
1. Candidate Arrival ──► 2. Reception Check-In ──► 3. HR Room Assignment
   (QR Scan / Photo)         (Status: WAITING)         (Room status: ASSIGNED)
                                                               │
                                                               ▼
6. Complete / Advance ◄── 5. Interview Session ◄── 4. Pantry Preparation
   (Outcome recorded)        (Status: IN_INTERVIEW)    (Water & setup ready)
```

1. **Schedule**: Candidate created with assigned interviewer and target position.
2. **Arrival**: Candidate arrives at reception, scans QR pass, receives photo verification.
3. **Room Allocation**: HR selects an available room from Room Management (preventing double-booking).
4. **Hospitality Preparation**: Pantry receives real-time task with room name and required items.
5. **Interview Execution**: Interviewer receives notification, escorts candidate, starts session.
6. **Conclude & Transition**: Interviewer records outcome (Advance Round / Selected / Rejected), automatically triggering room release, pantry reset task, or checkout routing.

---

## 7. Technology Stack

- **Frontend**:
  - React 19 (`react`, `react-dom`)
  - TypeScript (`typescript`)
  - Tailwind CSS v4 (`@tailwindcss/vite`, `tailwindcss`)
  - Vite 8 (`vite`, `@vitejs/plugin-react`)
  - Progressive Web App (`vite-plugin-pwa`)
  - Icons: `lucide-react`
  - Animations: `motion`
  - QR Code Generation: `qrcode`
- **Backend**:
  - Node.js (`tsx`, `node`)
  - Express.js (`express`)
  - Server-Sent Events (SSE) for real-time dashboard updates
  - File-backed persistent database (`data/wcr_database.json`)
  - Session-based staff authentication with role-based permissions
- **AI & Integrations**:
  - Google GenAI SDK (`@google/genai`) for server-side evaluation analysis

---

## 8. Project Structure

```
.
├── .env.example                  # Environment variable template
├── data/
│   └── wcr_database.json         # Local persistent file-based JSON store
├── index.html                    # Single-page application entry HTML
├── metadata.json                 # AI Studio applet metadata & permissions
├── package.json                  # Dependencies and build scripts
├── public/                       # Static public assets, icons, PWA manifest
├── server.ts                     # Express server & API endpoints
├── tsconfig.json                 # TypeScript compiler configuration
├── vite.config.ts                # Vite build and PWA service worker configuration
└── src/
    ├── App.tsx                   # Main application layout, state & role router
    ├── main.tsx                  # React entry point
    ├── index.css                 # Tailwind CSS imports & global styles
    ├── components/               # UI components & modals
    │   ├── AdminChangeCredentialsModal.tsx
    │   ├── AssignRoomModal.tsx
    │   ├── CameraCapture.tsx
    │   ├── CandidateCheckInForm.tsx
    │   ├── CandidateDossierModal.tsx
    │   ├── EndInterviewModal.tsx
    │   ├── ForgotPasswordModal.tsx
    │   ├── GeneralNewCandidateRegister.tsx
    │   ├── GovernmentIdModal.tsx
    │   ├── Navbar.tsx
    │   ├── NotificationDrawer.tsx
    │   ├── OfflineIndicator.tsx
    │   ├── PWAInstallButton.tsx
    │   ├── QRPassModal.tsx
    │   ├── ReceptionPhotoModal.tsx
    │   ├── ResetPasswordView.tsx
    │   ├── ResumeDocumentModal.tsx
    │   ├── SecureDocumentViewerModal.tsx
    │   ├── WalkInModal.tsx
    │   └── dashboards/           # Role-specific dashboard views
    │       ├── AdminDashboard.tsx
    │       ├── CEODashboard.tsx
    │       ├── HRDashboard.tsx
    │       ├── InterviewerDashboard.tsx
    │       ├── PantryDashboard.tsx
    │       └── ReceptionDashboard.tsx
    ├── hooks/                    # Custom React hooks
    │   ├── useOnlineStatus.ts
    │   ├── usePWAInstall.ts
    │   └── useRealtimeEvents.ts
    ├── server/                   # Server-side business logic
    │   ├── auth.ts               # Password hashing & session management
    │   ├── db.ts                 # Database persistence & sanitization service
    │   ├── validationEngine.ts   # Form validation & security sanitizers
    │   └── workflowEngine.ts     # Domain events, state transitions & SSE broadcast
    ├── types/                    # Shared TypeScript interfaces
    │   └── index.ts
    └── utils/                    # Helper functions
        ├── dateFormatter.ts
        └── publicOrigin.ts
```

---

## 9. Local Development

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or bun

### Setup & Run
```bash
# 1. Install dependencies
npm install

# 2. Start full-stack development server (Express + Vite)
npm run dev

# 3. Access in browser
# http://localhost:3000
```

### Additional Commands
```bash
# Type check & lint
npm run lint

# Production build
npm run build

# Run production server
npm start

# Preview client build
npm run preview
```

---

## 10. Environment Variables

Define the following configuration variables in your local `.env` file (refer to `.env.example`):

| Variable | Description |
| :--- | :--- |
| `VITE_PUBLIC_APP_URL` | Optional base URL for public check-in QR links. |
| `GEMINI_API_KEY` | Optional API key for server-side evaluation AI capabilities. |
| `PORT` | Optional port override (defaults to `3000`). |

> **Security Note:** Never commit `.env` files, production credentials, API secrets, or passwords to source control.

---

## 11. Important Architecture Rules

1. **Single Source of Truth for Rooms**: The `rooms` table managed under Admin Room Management is the authoritative source of truth. All modules reference rooms by `roomId` and display `roomName` dynamically.
2. **No Floor or Capacity Fields**: Floor numbers and seating capacity fields have been removed from all UI modals, forms, data models, filters, and API payloads to keep the management interface clean and focused.
3. **Double-Booking Protection**: An office room cannot be assigned to multiple active candidates simultaneously; the workflow engine enforces room availability validations before creating assignments.
4. **Confidentiality Rules**: Role-based privacy filters ensure Pantry Stewards only see operational information (**What, Where, When**), hiding sensitive candidate resumes, contact numbers, and compensation remarks.

---

## 12. Deployment

The application is architected as a full-stack Node.js + Express application serving the compiled Vite React frontend in production.

To deploy:
1. Run `npm run build` to generate the optimized client bundle in `dist/`.
2. Run `npm start` (executing `node server.ts`) to serve API routes and static frontend files on port `3000`.

---

## 13. Testing & Verification

- **TypeScript Compilation & Syntax Verification**:
  ```bash
  npm run lint
  ```
- **Full Production Build Verification**:
  ```bash
  npm run build
  ```
