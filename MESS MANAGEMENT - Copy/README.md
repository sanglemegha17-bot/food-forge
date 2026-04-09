# 🍴 The Food Forge : The Taste Buds

A modern, full-stack **Mess / Canteen Management System** built with **Next.js** (frontend) and **FastAPI** (backend), powered by **Supabase** for authentication, database, and real-time features.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Admin Dashboard** | Hardcoded admin login, manage students, view attendance stats |
| 📱 **QR Attendance** | Students get unique QR codes; staff scan to mark meals |
| 👨‍🍳 **Digital Menu** | Publish daily menus with allergen info |
| 📊 **Real-time Stats** | Live breakfast, lunch & dinner counts |
| 👤 **Student Portal** | Students view their QR code, attendance history |
| 🛡️ **Role-based Access** | Separate views for students, admins, wardens, cooks |
| ➕ **User Management** | Admin can add students, reset passwords, delete accounts |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS |
| **Backend** | Python, FastAPI, Uvicorn |
| **Database & Auth** | Supabase (PostgreSQL + Auth + Realtime) |
| **Icons** | Lucide React |
| **QR Code** | qrcode.react, html5-qrcode |

---

## 📁 Project Structure

```
MESS MANAGEMENT/
├── frontend/                 # Next.js App
│   ├── app/
│   │   ├── page.tsx          # Landing page
│   │   ├── layout.tsx        # Root layout
│   │   ├── globals.css       # Global styles
│   │   ├── login/page.tsx    # Student login/signup
│   │   ├── student/page.tsx  # Student dashboard
│   │   └── admin/page.tsx    # Admin dashboard
│   ├── components/
│   │   ├── Navbar.tsx        # Top navigation bar
│   │   ├── AuthForm.tsx      # Auth form component
│   │   └── QRScanner.tsx     # QR code scanner
│   ├── lib/
│   │   └── supabase.ts       # Supabase client config
│   ├── .env.local            # Frontend env variables
│   └── package.json
│
├── backend/                  # FastAPI Server
│   ├── app/
│   │   ├── main.py           # App entry point + CORS
│   │   └── routes/
│   │       ├── menu.py       # Menu endpoints
│   │       ├── ops.py        # Operations (scan, opt-in)
│   │       ├── reports.py    # Reports endpoints
│   │       └── admin.py      # Admin user management API
│   ├── .env                  # Backend env variables
│   └── requirements.txt
│
├── COPY_TO_SUPABASE_SQL.sql  # Database schema (run in Supabase SQL Editor)
├── AUTH_TRIGGER.sql           # Auth trigger for auto-creating profiles
├── FIX_FOREIGN_KEY.sql        # Foreign key fix script
└── README.md                  # This file
```

---

## 🚀 How to Run (Step-by-Step)

### Prerequisites

Make sure you have these installed on your system:

| Tool | Version | Download Link |
|---|---|---|
| **Node.js** | v18 or higher | [nodejs.org](https://nodejs.org) |
| **Python** | 3.10 or higher | [python.org](https://python.org) |
| **npm** | Comes with Node.js | — |
| **pip** | Comes with Python | — |

---

### Step 1: Set Up Supabase (Database)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a **New Project**
3. Go to **SQL Editor** in the sidebar
4. Copy-paste the contents of `COPY_TO_SUPABASE_SQL.sql` and click **Run**
5. Then copy-paste `AUTH_TRIGGER.sql` and click **Run**
6. Go to **Settings → API** and note down:
   - `Project URL` (e.g., `https://xxxxx.supabase.co`)
   - `anon public key`
   - `service_role secret key`

---

### Step 2: Configure Environment Variables

#### Frontend (`frontend/.env.local`)

Create or edit the file `frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

#### Backend (`backend/.env`)

Create or edit the file `backend/.env`:

```env
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

> ⚠️ **Important:** The backend needs the **service role key** (not the anon key) for admin operations like resetting passwords and deleting users.

---

### Step 3: Install Dependencies & Run

#### Terminal 1 — Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

#### Terminal 2 — Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

You should see:
```
▲ Next.js 14.1.0
- Local: http://localhost:3000
✓ Ready in 3.7s
```

> 💡 **Windows PowerShell users:** If you get a script execution error, run:
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy Bypass
> ```

---

### Step 4: Open in Browser

| Page | URL |
|---|---|
| 🏠 Landing Page | [http://localhost:3000](http://localhost:3000) |
| 🔐 Admin Panel | [http://localhost:3000/admin](http://localhost:3000/admin) |
| 👤 Student Login | [http://localhost:3000/login](http://localhost:3000/login) |
| 📱 Student Dashboard | [http://localhost:3000/student](http://localhost:3000/student) |
| 🔧 Backend API Docs | [http://localhost:8000/docs](http://localhost:8000/docs) |

---

## 🔑 Default Credentials

| Role | Username | Password |
|---|---|---|
| **Admin** | `admin1` | `admin1` |

Students register via the sign-up form at `/login`.

---

## 📋 Database Schema

The system uses these tables in Supabase:

| Table | Purpose |
|---|---|
| `profiles` | User info (name, phone, role) — linked to `auth.users` |
| `mess` | Mess/canteen details |
| `mess_memberships` | Student ↔ Mess mapping with diet & room |
| `menu_days` | Daily menu dates per mess |
| `menu_items` | Individual menu items (meal type, allergens) |
| `meal_opt` | Student meal opt-in/opt-out records |
| `meal_scans` | QR scan attendance records |

---

## 🔧 API Endpoints

### Backend (FastAPI at port 8000)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `GET` | `/api/admin/users` | List all users |
| `POST` | `/api/admin/users` | Create new user |
| `PUT` | `/api/admin/users/password` | Reset user password |
| `PUT` | `/api/admin/users/profile` | Update user profile |
| `DELETE` | `/api/admin/users` | Delete a user |
| `POST` | `/api/ops/scan` | Record meal scan |
| `POST` | `/api/ops/opt` | Meal opt-in/out |

---

## 🛠️ Troubleshooting

| Problem | Solution |
|---|---|
| `npm` script execution error on Windows | Run `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy Bypass` |
| `uvicorn` not found | Use `python -m uvicorn` instead of `uvicorn` directly |
| Module not found errors | Run `npm install` (frontend) or `pip install -r requirements.txt` (backend) |
| Supabase connection fails | Double-check your `.env` / `.env.local` keys |
| Port already in use | Kill the process: `npx kill-port 3000` or `npx kill-port 8000` |

---

## 📄 License

This project is for educational / internal use.

---

**Built with ❤️ by The Food Forge Team**
