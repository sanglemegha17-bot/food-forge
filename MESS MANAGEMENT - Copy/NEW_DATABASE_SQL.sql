-- =============================================================
-- THE FOOD FORGE - COMPLETE DATABASE SCHEMA (NEW DATABASE)
-- Paste this entire file into Supabase SQL Editor > Run
-- =============================================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- 2. TABLES
-- =============================================================

-- PROFILES (auto-populated by auth trigger below)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  phone       TEXT,
  role        TEXT NOT NULL CHECK (role IN ('student', 'admin', 'warden', 'cook', 'accountant')) DEFAULT 'student',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- MEAL SESSIONS
-- Admin creates a session → a QR code is displayed →
-- Students scan it → they land on /checkin → attendance is marked
CREATE TABLE IF NOT EXISTS public.meal_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal         TEXT NOT NULL CHECK (meal IN ('breakfast', 'lunch', 'dinner')),
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expires_at   TIMESTAMPTZ NOT NULL,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- MEAL SCANS (attendance log — one row per student per meal per day)
-- session_id links back to the session QR that was scanned
-- nullable: also works for admin-direct scans (old flow)
CREATE TABLE IF NOT EXISTS public.meal_scans (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id  UUID REFERENCES public.meal_sessions(id) ON DELETE SET NULL,
  scan_time   TIMESTAMPTZ DEFAULT NOW(),
  scan_date   DATE DEFAULT CURRENT_DATE,
  meal        TEXT NOT NULL CHECK (meal IN ('breakfast', 'lunch', 'dinner')),
  UNIQUE (user_id, scan_date, meal)   -- one entry per meal per student per day
);

-- MENU DAYS
CREATE TABLE IF NOT EXISTS public.menu_days (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_date   DATE NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- MENU ITEMS
CREATE TABLE IF NOT EXISTS public.menu_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_day_id  UUID REFERENCES public.menu_days(id) ON DELETE CASCADE,
  meal         TEXT NOT NULL CHECK (meal IN ('breakfast', 'lunch', 'dinner')),
  item_name    TEXT NOT NULL,
  is_special   BOOLEAN DEFAULT FALSE
);

-- MEAL OPT-IN / OPT-OUT (optional feature)
CREATE TABLE IF NOT EXISTS public.meal_opt (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  opt_date    DATE NOT NULL,
  meal        TEXT NOT NULL CHECK (meal IN ('breakfast', 'lunch', 'dinner')),
  is_opted    BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, opt_date, meal)
);

-- =============================================================
-- 3. ROW LEVEL SECURITY
-- =============================================================
ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_scans    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_days     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_opt      ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- 4. POLICIES
-- NOTE: The admin dashboard uses hardcoded credentials (not Supabase Auth).
--   All admin WRITE operations go through Next.js API routes (/api/admin/*)
--   which use the SERVICE ROLE KEY (bypasses RLS entirely).
--   READ operations are open (TRUE) so the admin anon client can fetch data.
-- =============================================================

-- ── PROFILES ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "Profiles viewable by all" ON public.profiles;
CREATE POLICY "Profiles viewable by all"
  ON public.profiles FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ── MEAL SESSIONS ─────────────────────────────────────────────
-- SELECT open to all (admin reads with anon key, students validate session)
DROP POLICY IF EXISTS "Sessions readable by all" ON public.meal_sessions;
CREATE POLICY "Sessions readable by all"
  ON public.meal_sessions FOR SELECT USING (TRUE);

-- INSERT/UPDATE only via service role (Next.js API routes bypass RLS)
-- No client-side INSERT policy needed for sessions

-- ── MEAL SCANS ────────────────────────────────────────────────
-- SELECT open to all: admin dashboard reads all scans with anon key
DROP POLICY IF EXISTS "Scans readable by all" ON public.meal_scans;
CREATE POLICY "Scans readable by all"
  ON public.meal_scans FOR SELECT USING (TRUE);

-- Students self-insert via /checkin page (authenticated)
DROP POLICY IF EXISTS "Students can insert own scan" ON public.meal_scans;
CREATE POLICY "Students can insert own scan"
  ON public.meal_scans FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin inserts (old QR scan flow) go via API route → service role → no policy needed

-- ── MENU ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Menu readable by all" ON public.menu_days;
CREATE POLICY "Menu readable by all"
  ON public.menu_days FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Menu items readable by all" ON public.menu_items;
CREATE POLICY "Menu items readable by all"
  ON public.menu_items FOR SELECT USING (TRUE);

-- ── MEAL OPT ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "Meal opt access for authenticated" ON public.meal_opt;
CREATE POLICY "Meal opt access for authenticated"
  ON public.meal_opt FOR ALL USING (auth.role() = 'authenticated');

-- =============================================================
-- 5. AUTH TRIGGER (auto-create profile row on every new signup)
-- =============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Student'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO NOTHING;  -- safe to re-run
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =============================================================
-- DONE! Your database is ready.
-- Next steps:
--  1. Update frontend/.env.local with new Supabase URL + keys
--  2. Update backend/.env with new URL + service role key
--  3. Set NEXT_PUBLIC_APP_URL to your deployed URL later
-- =============================================================
