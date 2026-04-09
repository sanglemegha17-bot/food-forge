-- =============================================================
-- THE FOOD FORGE - COMPLETE DATABASE SCHEMA (NEON POSTGRES)
-- Paste this entire file into Neon SQL Editor > Run
-- =============================================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- 2. TABLES
-- =============================================================

-- USERS (Combined Auth & Profile for Custom NextAuth)
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  phone         TEXT,
  role          TEXT NOT NULL CHECK (role IN ('student', 'admin', 'warden', 'cook', 'accountant')) DEFAULT 'student',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- MEAL SESSIONS
-- Admin creates a session → a QR code is displayed →
-- Students scan it → they land on /checkin → attendance is marked
CREATE TABLE IF NOT EXISTS meal_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal         TEXT NOT NULL CHECK (meal IN ('breakfast', 'lunch', 'dinner')),
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expires_at   TIMESTAMPTZ NOT NULL,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- MEAL SCANS (attendance log — one row per student per meal per day)
-- session_id links back to the session QR that was scanned
CREATE TABLE IF NOT EXISTS meal_scans (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id  UUID REFERENCES meal_sessions(id) ON DELETE SET NULL,
  scan_time   TIMESTAMPTZ DEFAULT NOW(),
  scan_date   DATE DEFAULT CURRENT_DATE,
  meal        TEXT NOT NULL CHECK (meal IN ('breakfast', 'lunch', 'dinner')),
  UNIQUE (user_id, scan_date, meal)   -- one entry per meal per student per day
);

-- MENU DAYS
CREATE TABLE IF NOT EXISTS menu_days (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_date   DATE NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- MENU ITEMS
CREATE TABLE IF NOT EXISTS menu_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_day_id  UUID REFERENCES menu_days(id) ON DELETE CASCADE,
  meal         TEXT NOT NULL CHECK (meal IN ('breakfast', 'lunch', 'dinner')),
  item_name    TEXT NOT NULL,
  is_special   BOOLEAN DEFAULT FALSE
);

-- MEAL OPT-IN / OPT-OUT (optional feature)
CREATE TABLE IF NOT EXISTS meal_opt (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  opt_date    DATE NOT NULL,
  meal        TEXT NOT NULL CHECK (meal IN ('breakfast', 'lunch', 'dinner')),
  is_opted    BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, opt_date, meal)
);

-- Note: We are no longer using Supabase RLS here because Next.js API Routes 
-- will connect directly and manage authorization server-side through NextAuth.

-- =============================================================
-- DONE!
-- Next steps:
--  1. Update frontend/.env.local with DATABASE_URL
--  2. Update frontend/.env.local with NEXTAUTH_SECRET
-- =============================================================
