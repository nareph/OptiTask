# OptiTask - Intelligent Productivity SaaS

OptiTask is a SaaS web application designed to boost your productivity through intuitive task management, effective time tracking, smart automations, and insightful analytics. This project utilizes a modern tech stack featuring Next.js for the frontend, and Rust/Python for a performant and intelligent backend.

## ✨ Features (MVP & Beyond)

### Implemented MVP Features:
*   ✅ **Advanced Task Management:**
    *   Create, edit, and delete tasks.
    *   Organize tasks by projects.
    *   **Labels:** Create and assign colorful labels to your tasks for better organization.
    *   **Drag & Drop:** Easily reorder tasks and change their status with an intuitive Kanban board interface.
*   ⏱️ **Integrated Pomodoro & Time Tracking:**
    *   Configurable Pomodoro timer (work sessions, breaks).
    *   Manual or automatic time tracking per task.
    *   Persistence of time sessions for analysis.
*   📊 **Productivity Analytics:**
    *   Visualization of time spent per project.
    *   Productivity trend charts (time tracked per day/week).
    *   Period selectors to filter data.
*   📅 **Google Calendar Integration:**
    *   Connect your Google Calendar account.
    *   View your Google Calendar events directly within OptiTask.

### Planned Features (To Stand Out):
*   🤖 **Smart Automations:**
    *   Example: "If a task takes more than 2 hours, split it into sub-tasks."
    *   Custom notifications and reminders.
*   🔍 **Focus Mode:**
    *   "Deep Work" mode with a blocker for distracting websites and applications.
*   🧠 **AI Task Assistant:**
    *   Automatic sub-task generation (e.g., "Plan a trip" → "Book ticket," "Find hotel"...).
    *   Intelligent suggestions based on your habits.
*   📱 **PWA (Progressive Web App):** For a native app-like experience.
*   💡 **Third-Party Tool Integrations:** Slack, GitHub, Notion, etc.
*   🔄 **Full Outlook Calendar Integration.**

## 🛠️ Tech Stack

*   **Frontend:**
    *   [Next.js](https://nextjs.org/) (React Framework)
    *   [Tailwind CSS](https://tailwindcss.com/)
    *   [TypeScript](https://www.typescriptlang.org/)
    *   [NextAuth.js](https://next-auth.js.org/) for authentication (Google, GitHub)
    *   [@dnd-kit](https://dndkit.com/) for Drag & Drop
    *   [Recharts](https://recharts.org/) for charts
    *   [Headless UI](https://headlessui.com/) for accessible UI components
*   **Backend:**
    *   Main API in **Rust** with [Actix-web](https://actix.rs/) (for performance and CRUD operations)
        *   [Diesel.rs](https://diesel.rs/) as ORM and query builder for PostgreSQL.
    *   AI Services (planned) in **Python** (e.g., for task classification, sub-task generation).
    *   Next.js API Routes for Calendar OAuth management and potentially other direct integrations.
*   **Database:**
    *   [PostgreSQL](https://www.postgresql.org/)
    *   Hosted on [Supabase](https://supabase.io/) (used for DB, and potentially Auth if NextAuth Adapter wasn't used for OAuth accounts directly)
*   **Frontend Dependency Management:** [pnpm](https://pnpm.io/)

## 🚀 Quick Start (Development)

### Prerequisites
*   Node.js (v18+ recommended)
*   pnpm (or npm/yarn, but project is set up for pnpm)
*   Rust (stable toolchain, via `rustup`)
*   Diesel CLI (`cargo install diesel_cli --no-default-features --features postgres`)
*   Supabase CLI (optional, if managing Supabase migrations via CLI)
*   A Supabase account and a created project.
*   Google Cloud & GitHub developer accounts for OAuth credentials.

### Backend Setup (Rust)
1.  Clone the repository.
2.  Navigate to the `backend-api` directory: `cd backend-api`
3.  Create a `.env` file based on `.env.example` (create if it doesn't exist) and fill in the variables:
    ```env
    DATABASE_URL="postgresql://postgres:[YOUR_SUPABASE_DB_PASSWORD]@[YOUR_SUPABASE_PROJECT_REF_ID].db.supabase.co:6543/postgres" # Supabase Pooler URL
    SERVER_ADDRESS="127.0.0.1:8080"
    # Add other variables if needed
    ```
4.  Apply Diesel migrations:
    ```bash
    diesel database setup
    diesel migration run
    ```
5.  Run the backend server:
    ```bash
    cargo run
    ```
    The backend should be accessible at `http://localhost:8080`.

### Frontend Setup (Next.js)
1.  Navigate to the project root directory (or the frontend directory if separate).
2.  Install dependencies:
    ```bash
    pnpm install
    ```
3.  Create a `.env.local` file in the frontend project root and fill in the necessary variables:
    ```env
    NEXTAUTH_URL=http://localhost:3000
    NEXTAUTH_SECRET= # Generate a strong secret key (e.g., openssl rand -base64 32)

    GOOGLE_CLIENT_ID= # Your Google Client ID
    GOOGLE_CLIENT_SECRET= # Your Google Client Secret

    GITHUB_CLIENT_ID= # Your GitHub Client ID
    GITHUB_CLIENT_SECRET= # Your GitHub Client Secret
    
    NEXT_PUBLIC_SUPABASE_URL= # Your Supabase Project URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY= # Your Supabase Anon Public Key
    # If using SupabaseAdapter with NextAuth for storing OAuth accounts/sessions
    # SUPABASE_SERVICE_ROLE_KEY= # Your Supabase Service Role Key (VERY SENSITIVE)
    # SUPABASE_JWT_SECRET= # Your Supabase JWT Secret (for signing adapter JWTs)
    ```
4.  Run the Next.js development server:
    ```bash
    pnpm dev
    ```
    The frontend application should be accessible at `http://localhost:3000`.

### OAuth Application Setup
*   **Google:** Create a project on Google Cloud Console, configure the OAuth consent screen, and create OAuth 2.0 Client IDs.
    *   **Authorized JavaScript origins:** `http://localhost:3000`
    *   **Authorized redirect URIs:** `http://localhost:3000/api/auth/callback/google`
    *   Enable "Google People API" (for profile) and "Google Calendar API".
    *   Add necessary scopes in `authOptions` (e.g., `openid email profile https://www.googleapis.com/auth/calendar.readonly`).
*   **GitHub:** Create a new OAuth App in GitHub Developer Settings.
    *   **Homepage URL:** `http://localhost:3000`
    *   **Authorization callback URL:** `http://localhost:3000/api/auth/callback/github`

## 🤝 Contributing

Contributions are welcome! Please read the contributing guidelines (see `CONTRIBUTING.md`) before submitting a Pull Request.

## 📜 License

This project is licensed under the [MIT License](LICENSE.md).