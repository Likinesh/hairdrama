# 💇 Hairdrama Task Manager

A full-stack collaborative task management application featuring a **drag-and-drop Kanban board**, **Google OAuth authentication**, **team assignment**, and **automated email notifications** via the Gmail API.

Built with **Next.js 16**, **Flask**, and **Supabase**.

---

## Features

- **Kanban Board** — Drag-and-drop tasks across _To Do_, _In Progress_, and _Completed_ columns
- **Google OAuth 2.0** — Secure sign-in via Google with NextAuth.js
- **Task Management** — Create, edit, delete, and filter tasks by status or assignment
- **Team Assignment** — Assign tasks to any registered team member
- **Priority Levels** — High / Medium / Low with color-coded badges
- **Email Notifications** — Auto-notify assignees and creators via the Gmail API
- **Filter Tabs** — Quickly filter by _All_, _Assigned to Me_, or _Created by Me_
- **Responsive UI** — Works seamlessly across desktop, tablet, and mobile

---

## Tech Stack

| Layer      | Technology                                                     |
| ---------- | -------------------------------------------------------------- |
| Frontend   | Next.js, TypeScript, Tailwind CSS                              |
| Backend    | Flask                                                          |
| Database   | Supabase                                                       |
| Auth       | Google OAuth, NextAuth.js, PyJWT                               |
| Email      | Gmail API                                                      |
| Drag & Drop| dnd-kit                                                        |
| Deployment | Vercel (frontend)                                              |
---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.10
- A **Supabase** project (free tier works)
- A **Google Cloud** project with OAuth 2.0 credentials and the Gmail API enabled

---

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/hairdrama.git
cd hairdrama
```

### 2. Set up the database

Run the SQL migrations **in order** in the Supabase SQL Editor (or via the Supabase CLI):

```
backend/migrations/001_create_users.sql
backend/migrations/002_create_tasks.sql
backend/migrations/003_add_indexes.sql
```

### 3. Configure the backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Fill in the values:

| Variable               | Description                                  |
| ---------------------- | -------------------------------------------- |
| `SUPABASE_URL`         | Your Supabase project URL                    |
| `SUPABASE_KEY`         | Service-role or publishable key              |
| `JWT_SECRET`           | A secure random string (≥ 32 chars)          |
| `GOOGLE_CLIENT_ID`     | OAuth 2.0 client ID from Google Cloud        |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 client secret                      |
| `FRONTEND_URL`         | `http://localhost:3000` (or deployed URL)     |

Start the dev server:

```bash
python run.py
```

The API will be available at **http://localhost:8000** by default.

### 4. Configure the frontend

```bash
cd frontend
npm install
```

Create a `.env.local` file with the following variables (adjust as needed):

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<random-secret>
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start the dev server:

```bash
npm run dev
```

The app will be running at **http://localhost:3000**.

---

## Google OAuth Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Navigate to **APIs & Services → Credentials**
4. Create an **OAuth 2.0 Client ID** (Web application)
5. Add authorised redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://your-domain.com/api/auth/callback/google` (production)
6. Enable the **Gmail API** under **APIs & Services → Library**
7. Copy the Client ID and Client Secret into both backend `.env` and frontend `.env.local`

---

## API Endpoints

| Method   | Endpoint               | Description                        |
| -------- | ---------------------- | ---------------------------------- |
| `GET`    | `/health`              | Health check                       |
| `POST`   | `/auth/google`         | Initiate Google OAuth login        |
| `GET`    | `/auth/google/callback`| OAuth callback & JWT issuance      |
| `GET`    | `/tasks`               | List tasks (with filter support)   |
| `POST`   | `/tasks`               | Create a new task                  |
| `GET`    | `/tasks/:id`           | Get a single task                  |
| `PUT`    | `/tasks/:id`           | Update a task                      |
| `PATCH`  | `/tasks/:id/status`    | Update task status (Kanban move)   |
| `DELETE` | `/tasks/:id`           | Delete a task                      |
| `GET`    | `/users`               | List registered users              |

---

## Database Schema

### `users`

| Column         | Type        | Notes                              |
| -------------- | ----------- | ---------------------------------- |
| `id`           | UUID (PK)   | Auto-generated                     |
| `google_id`    | TEXT UNIQUE  | Google `sub` claim                 |
| `email`        | TEXT UNIQUE  |                                    |
| `name`         | TEXT         |                                    |
| `avatar_url`   | TEXT         | Google profile picture             |
| `access_token` | TEXT         | For Gmail API                      |
| `refresh_token`| TEXT         | For Gmail API                      |
| `created_at`   | TIMESTAMPTZ  |                                    |

### `tasks`

| Column        | Type          | Notes                              |
| ------------- | ------------- | ---------------------------------- |
| `id`          | UUID (PK)     | Auto-generated                     |
| `title`       | TEXT          | Min 1 character                    |
| `description` | TEXT          |                                    |
| `status`      | ENUM          | `todo` · `in_progress` · `completed` |
| `priority`    | ENUM          | `low` · `medium` · `high`         |
| `due_date`    | DATE          | Nullable                          |
| `created_by`  | UUID (FK)     | References `users.id`             |
| `assigned_to` | UUID (FK)     | Nullable, references `users.id`   |
| `created_at`  | TIMESTAMPTZ   |                                    |
| `updated_at`  | TIMESTAMPTZ   | Auto-updated via trigger           |
