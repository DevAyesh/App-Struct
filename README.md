# AppStruct - AI-Powered Architecture Blueprint Generator 🚀

> Transform your app ideas into production-ready technical architecture blueprints with real-time AI streaming.

![UI](https://img.shields.io/badge/UI-Clean%20%26%20Modern-zinc)
![React](https://img.shields.io/badge/React-18.2-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.3-38bdf8)
![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini%20Flash-4285F4)
![Security](https://img.shields.io/badge/Security-Hardened-success)

---

## ✨ Features

### 🎨 Modern 3-Column Workspace UI
- **Collapsible Sidebar**: Scalable saved blueprints list with search, platform filters, favorites, sorting, renaming, duplication, and export.
- **Persistent Generation Feedback**: Real-time animated three-dot indicator in sidebar and blueprint viewer that survives navigation between Home and Blueprint views.
- **Right Context Panel**: Real-time summary of target platform, detail level, and AI stream status.
- **Responsive 3-Column Layout**: Adaptive layout with mobile drawer navigation and collapsible context summary.
- **Developer-Grade Markdown Document Viewer**: Custom typography with code blocks, headings, checklists, and copy/download actions.

### 🎯 Core Functionality
- **Real-Time Streaming Generation**: High-throughput SSE streaming powered by Google Gemini (with automatic multi-model failover).
- **Explicit Stream Completion Protocol**: Prevents partial-stream corruption by validating full stream delivery before auto-saving.
- **Per-User Concurrency Locks**: Prevents duplicate parallel generations by returning HTTP 409 Conflict.
- **Platform Customization**: Web, Mobile, or Cross-platform (Both) architectural specifications.
- **Detail Level Selection**: Quick Overview (brief) vs. Comprehensive Architecture (full).
- **Blueprint CRUD Management**: Save, view, rename, duplicate, favorite, export (.md), and delete blueprints.
- **Secure Authentication**: Register, email verification, login, Google OAuth, and self-service password reset flow.

### 🛡️ Security Hardening
- **NoSQL Injection Defense**: Strict type validation (`typeof === 'string'`) on all query and route parameters.
- **Prompt Injection Guardrails**: Normalizes unicode bracket variants and strips delimiter escape sequences (`</application_concept>`, `<system>`, `<role>`).
- **Tenant Data Isolation**: Strict tenant scoping on all MongoDB read, update, and delete queries.
- **API Input Validation**: Pre-database validation of all MongoDB `ObjectId` parameters returning HTTP 400.
- **Supply-Chain & Secret Protection**: Strict `.dockerignore` preventing `.env` leaks into Docker images; client environment isolation.
- **Safe Database Outage Semantics**: Transient database errors return HTTP 503 rather than prematurely expiring user login sessions.

---

## 🏗️ Project Structure

```
App Struct/
├── .github/
│   └── workflows/
│       └── ci.yml                 # GitHub Actions CI build & test workflow
├── build/                         # Optimized production build artifacts
├── public/
│   ├── index.html                # HTML entry point with meta tags
│   └── manifest.json             # Web application manifest
├── server/
│   ├── config/
│   │   └── config.js             # Environment validation and configuration
│   ├── middleware/
│   │   └── auth.js               # JWT authentication middleware with 503 handling
│   ├── models/
│   │   ├── Blueprint.js          # Mongoose Blueprint schema with compound indexes
│   │   └── User.js               # Mongoose User schema with password hashing
│   ├── routes/
│   │   └── auth.js               # Auth routes (login, register, forgot/reset password)
│   ├── services/
│   │   └── deepseek.js           # Gemini AI streaming service & prompt sanitizer
│   ├── .env.example              # Template server environment variables
│   └── server.js                 # Express application entry point & rate limiters
├── src/
│   ├── components/
│   │   ├── AuthModal.jsx         # Sign in, registration, and password reset modal
│   │   ├── ContextPanel.jsx      # Right context summary panel
│   │   ├── DashboardLayout.jsx   # 3-column workspace shell with responsive drawers
│   │   ├── GenerationStepper.jsx # Step-by-step architecture progress tracker
│   │   ├── IdeaInput.jsx         # App idea description form with platform pills
│   │   └── SavedBlueprintsList.jsx # Sidebar blueprints list with animated indicators
│   ├── config/
│   │   └── api.js                # Dynamic API endpoint configuration
│   ├── App.jsx                   # Core application state & streaming controller
│   ├── index.css                 # Design system styles & keyframe animations
│   └── index.js                  # React DOM root
├── tests/
│   ├── remediation_verification.js # Full-stack automated security test suite
│   └── test_stream_generation.js   # Live SSE AI stream verification
├── .dockerignore                 # Strict build context exclusion for secrets
├── .env.example                  # Template client environment variables
├── Dockerfile                    # Production container build definition
├── package.json                  # Root dependencies and scripts
└── tailwind.config.js            # Tailwind CSS theme extensions
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **MongoDB** (Local instance or MongoDB Atlas cluster)
- **Google Gemini API Key** (Obtain from [Google AI Studio](https://aistudio.google.com/))

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd "App Struct"
   ```

2. **Install frontend dependencies:**
   ```bash
   npm install
   ```

3. **Install backend dependencies:**
   ```bash
   cd server
   npm install
   cd ..
   ```

4. **Configure Environment Variables:**

   **Backend (`server/.env`):**
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority
   JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters
   GEMINI_API_KEY=your_gemini_api_key_from_google_ai_studio
   FRONTEND_URL=http://localhost:3000
   ```

   **Frontend (`.env`):**
   ```env
   REACT_APP_API_URL=http://localhost:5000
   ```

---

## 💻 Running the Application

### Development Mode

**Terminal 1 — Backend API Server:**
```bash
cd server
node server.js
```
*Backend runs at `http://localhost:5000`*

**Terminal 2 — Frontend Development Server:**
```bash
npm start
```
*Frontend runs at `http://localhost:3000`*

---

### Production Build

1. **Build frontend bundle:**
   ```bash
   npm run build
   ```

2. **Start backend:**
   ```bash
   cd server
   node server.js
   ```

---

### Running with Docker

1. **Build the container image:**
   ```bash
   docker build -t appstruct:latest .
   ```

2. **Run the container:**
   ```bash
   docker run -p 5000:5000 \
     -e MONGODB_URI="your_mongodb_uri" \
     -e JWT_SECRET="your_jwt_secret" \
     -e GEMINI_API_KEY="your_gemini_api_key" \
     appstruct:latest
   ```
   *Access application at `http://localhost:5000`*

---

## 🧪 Testing & Automated Verification

Run the automated regression and security test suites:

```bash
# Run comprehensive security, isolation, and auth tests
node tests/remediation_verification.js

# Run live AI SSE stream verification
node tests/test_stream_generation.js
```

### Test Coverage Highlights:
- **NoSQL Operator Injection**: `{ "email": { "$gt": "" } }` rejected with HTTP 400.
- **Tenant Isolation**: Cross-user read, update, and delete attempts return HTTP 404.
- **Malformed ObjectIds**: Rejected with HTTP 400 before reaching MongoDB queries.
- **Generation Concurrency**: Parallel requests by the same user return HTTP 409 Conflict.
- **Password Reset Flow**: Generic anti-enumeration response, single-use SHA-256 token verification, password update, and token invalidation.
- **AI Streaming Protocol**: Verified typed SSE chunking (`chunk`, `done`, `error`) and graceful fallback.

---

## 📊 API Reference

### Authentication Routes
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Create account with email verification |
| `POST` | `/api/auth/verify-email` | Verify email token |
| `POST` | `/api/auth/login` | Authenticate user & receive JWT token / HTTP-only cookie |
| `POST` | `/api/auth/google` | Sign in with Google OAuth token |
| `POST` | `/api/auth/forgot-password` | Request password reset email |
| `POST` | `/api/auth/reset-password` | Reset password using verified token |
| `GET` | `/api/auth/me` | Fetch authenticated user session profile |

### Blueprint Routes
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/generate-stream` | Real-time SSE streaming blueprint generation (Protected) |
| `POST` | `/api/blueprints` | Auto-save / create persistent blueprint (Protected) |
| `GET` | `/api/blueprints` | List authenticated user's blueprints (Protected) |
| `PUT` | `/api/blueprints/:id` | Rename blueprint document (Protected) |
| `DELETE` | `/api/blueprints/:id` | Permanently delete blueprint document (Protected) |

### Health & Monitoring
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/healthz` | Container health probe |
| `GET` | `/api/health` | Service & database status probe |

---

## 📄 License

This project is licensed under the MIT License.