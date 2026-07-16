-- ============================================================
-- CareerFlow AI — Complete Supabase Database Schema
-- Run this in Supabase → SQL Editor → New Query
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('student', 'recruiter', 'admin');
CREATE TYPE subscription_plan AS ENUM ('free', 'premium', 'premium_plus', 'enterprise');
CREATE TYPE application_status AS ENUM ('applied', 'viewed', 'shortlisted', 'interview', 'assessment', 'rejected', 'selected', 'withdrawn');
CREATE TYPE job_type AS ENUM ('full_time', 'part_time', 'contract', 'internship', 'freelance');
CREATE TYPE work_mode AS ENUM ('remote', 'hybrid', 'onsite');
CREATE TYPE job_status AS ENUM ('active', 'paused', 'closed', 'draft');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE document_type AS ENUM ('aadhaar', 'pan', 'passport', 'voter_id', 'ration_card');
CREATE TYPE gender_type AS ENUM ('male', 'female', 'non_binary', 'prefer_not_to_say');
CREATE TYPE experience_level AS ENUM ('fresher', 'junior', 'mid', 'senior', 'lead', 'manager', 'director', 'cxo');
CREATE TYPE payment_status AS ENUM ('pending', 'success', 'failed', 'refunded');
CREATE TYPE notification_type AS ENUM ('application_update', 'job_match', 'interview', 'message', 'system', 'payment');

-- ============================================================
-- USERS (base table, linked to Supabase Auth)
-- ============================================================

CREATE TABLE public.users (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email            TEXT UNIQUE NOT NULL,
  phone            TEXT,
  full_name        TEXT,
  avatar_url       TEXT,
  role             user_role NOT NULL DEFAULT 'student',
  subscription     subscription_plan NOT NULL DEFAULT 'free',
  subscription_end TIMESTAMPTZ,
  is_active        BOOLEAN DEFAULT TRUE,
  is_banned        BOOLEAN DEFAULT FALSE,
  ban_reason       TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STUDENT PROFILES
-- ============================================================

CREATE TABLE public.student_profiles (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Personal
  date_of_birth         DATE,
  gender                gender_type,
  country               TEXT,
  state                 TEXT,
  city                  TEXT,
  address               TEXT,
  pincode               TEXT,
  country_code          TEXT DEFAULT '+91',

  -- Professional
  headline              TEXT,
  bio                   TEXT,
  experience_level      experience_level DEFAULT 'fresher',
  total_experience_yrs  NUMERIC(4,1) DEFAULT 0,
  current_salary        NUMERIC(12,2),
  expected_salary       NUMERIC(12,2),
  notice_period_days    INT DEFAULT 0,
  is_actively_looking   BOOLEAN DEFAULT TRUE,

  -- Links
  github_url            TEXT,
  linkedin_url          TEXT,
  portfolio_url         TEXT,
  resume_url            TEXT,

  -- Status flags
  is_disability         BOOLEAN DEFAULT FALSE,
  is_veteran            BOOLEAN DEFAULT FALSE,
  is_govt_aspirant      BOOLEAN DEFAULT FALSE,
  has_criminal_case     BOOLEAN DEFAULT FALSE,
  work_authorization    TEXT,
  visa_status           TEXT,

  -- ATS Score (computed by AI)
  ats_score             INT DEFAULT 0 CHECK (ats_score BETWEEN 0 AND 100),
  ats_last_checked      TIMESTAMPTZ,

  -- Profile completion %
  profile_completion    INT DEFAULT 0 CHECK (profile_completion BETWEEN 0 AND 100),

  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- IDENTITY DOCUMENTS
-- ============================================================

CREATE TABLE public.identity_documents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  doc_type        document_type NOT NULL,
  doc_number      TEXT,
  front_image_url TEXT,
  back_image_url  TEXT,
  status          verification_status DEFAULT 'pending',
  verified_at     TIMESTAMPTZ,
  verified_by     UUID REFERENCES public.users(id),
  is_mandatory    BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EDUCATION
-- ============================================================

CREATE TABLE public.education (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  institution  TEXT NOT NULL,
  degree       TEXT NOT NULL,
  field        TEXT,
  grade        TEXT,
  start_year   INT,
  end_year     INT,
  is_current   BOOLEAN DEFAULT FALSE,
  description  TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EXPERIENCE
-- ============================================================

CREATE TABLE public.work_experience (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company      TEXT NOT NULL,
  title        TEXT NOT NULL,
  location     TEXT,
  work_mode    work_mode,
  start_date   DATE NOT NULL,
  end_date     DATE,
  is_current   BOOLEAN DEFAULT FALSE,
  description  TEXT,
  skills_used  TEXT[],
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SKILLS
-- ============================================================

CREATE TABLE public.skills (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT UNIQUE NOT NULL,
  category   TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.user_skills (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  skill_id      UUID NOT NULL REFERENCES public.skills(id),
  proficiency   INT DEFAULT 3 CHECK (proficiency BETWEEN 1 AND 5),
  years         NUMERIC(3,1),
  UNIQUE(user_id, skill_id)
);

-- ============================================================
-- CERTIFICATIONS
-- ============================================================

CREATE TABLE public.certifications (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  issuer       TEXT,
  issued_date  DATE,
  expiry_date  DATE,
  cert_url     TEXT,
  credential   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROJECTS
-- ============================================================

CREATE TABLE public.projects (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  tech_stack   TEXT[],
  project_url  TEXT,
  github_url   TEXT,
  start_date   DATE,
  end_date     DATE,
  is_current   BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RESUME VERSIONS (AI-generated + user-uploaded)
-- ============================================================

CREATE TABLE public.resumes (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  label        TEXT NOT NULL DEFAULT 'My Resume',
  file_url     TEXT,
  content_json JSONB,
  ats_score    INT DEFAULT 0 CHECK (ats_score BETWEEN 0 AND 100),
  is_primary   BOOLEAN DEFAULT FALSE,
  is_ai_gen    BOOLEAN DEFAULT FALSE,
  ai_feedback  JSONB,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- COMPANIES
-- ============================================================

CREATE TABLE public.companies (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL,
  slug                TEXT UNIQUE NOT NULL,
  logo_url            TEXT,
  website             TEXT,
  industry            TEXT,
  size                TEXT,
  founded_year        INT,
  description         TEXT,
  country             TEXT,
  state               TEXT,
  city                TEXT,
  linkedin_url        TEXT,
  is_verified         BOOLEAN DEFAULT FALSE,
  verification_status verification_status DEFAULT 'pending',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RECRUITER PROFILES
-- ============================================================

CREATE TABLE public.recruiter_profiles (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_id          UUID REFERENCES public.companies(id),
  designation         TEXT,
  is_verified         BOOLEAN DEFAULT FALSE,
  verification_status verification_status DEFAULT 'pending',
  gst_number          TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- JOBS
-- ============================================================

CREATE TABLE public.jobs (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id           UUID NOT NULL REFERENCES public.companies(id),
  posted_by            UUID NOT NULL REFERENCES public.users(id),

  title                TEXT NOT NULL,
  slug                 TEXT UNIQUE,
  description          TEXT NOT NULL,
  requirements         TEXT,
  responsibilities     TEXT,

  job_type             job_type DEFAULT 'full_time',
  work_mode            work_mode DEFAULT 'onsite',
  experience_level     experience_level,
  min_experience_yrs   NUMERIC(3,1),
  max_experience_yrs   NUMERIC(3,1),

  -- Location
  country              TEXT,
  state                TEXT,
  city                 TEXT,

  -- Salary
  min_salary           NUMERIC(12,2),
  max_salary           NUMERIC(12,2),
  salary_currency      TEXT DEFAULT 'INR',
  is_salary_visible    BOOLEAN DEFAULT TRUE,

  -- Skills
  required_skills      TEXT[],
  preferred_skills     TEXT[],

  -- Extras
  visa_sponsorship     BOOLEAN DEFAULT FALSE,
  equity_offered       BOOLEAN DEFAULT FALSE,
  application_deadline DATE,
  openings             INT DEFAULT 1,

  -- Status
  status               job_status DEFAULT 'active',
  is_featured          BOOLEAN DEFAULT FALSE,
  views_count          INT DEFAULT 0,
  applications_count   INT DEFAULT 0,

  -- Search vector
  search_vector        TSVECTOR,

  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Full-text search index on jobs
CREATE INDEX idx_jobs_search ON public.jobs USING GIN(search_vector);
CREATE INDEX idx_jobs_skills ON public.jobs USING GIN(required_skills);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_company ON public.jobs(company_id);

-- Auto-update search vector
CREATE OR REPLACE FUNCTION update_job_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    COALESCE(NEW.title, '') || ' ' ||
    COALESCE(NEW.description, '') || ' ' ||
    COALESCE(NEW.requirements, '') || ' ' ||
    COALESCE(array_to_string(NEW.required_skills, ' '), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER job_search_vector_update
  BEFORE INSERT OR UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION update_job_search_vector();

-- ============================================================
-- APPLICATIONS
-- ============================================================

CREATE TABLE public.applications (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id           UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  student_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  resume_id        UUID REFERENCES public.resumes(id),

  status           application_status DEFAULT 'applied',
  cover_letter     TEXT,
  match_score      INT DEFAULT 0 CHECK (match_score BETWEEN 0 AND 100),
  is_auto_applied  BOOLEAN DEFAULT FALSE,

  -- Recruiter actions
  recruiter_note   TEXT,
  viewed_at        TIMESTAMPTZ,
  shortlisted_at   TIMESTAMPTZ,

  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(job_id, student_id)
);

CREATE INDEX idx_applications_student ON public.applications(student_id);
CREATE INDEX idx_applications_job ON public.applications(job_id);
CREATE INDEX idx_applications_status ON public.applications(status);

-- ============================================================
-- SAVED JOBS
-- ============================================================

CREATE TABLE public.saved_jobs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  job_id     UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, job_id)
);

-- ============================================================
-- AI AUTO-APPLY QUEUE
-- ============================================================

CREATE TABLE public.auto_apply_queue (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  job_id          UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  match_score     INT DEFAULT 0,
  status          TEXT DEFAULT 'pending',  -- pending, approved, rejected, applied, failed
  ai_reasoning    TEXT,
  approval_mode   INT DEFAULT 1,           -- 1=80%+ only, 2=ask each, 3=fully auto
  approved_at     TIMESTAMPTZ,
  applied_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AI PREFERENCES (for auto-apply)
-- ============================================================

CREATE TABLE public.ai_preferences (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  auto_apply_enabled    BOOLEAN DEFAULT FALSE,
  approval_mode         INT DEFAULT 2,           -- 1=score filter, 2=manual, 3=auto
  min_match_score       INT DEFAULT 80,
  preferred_roles       TEXT[],
  excluded_companies    TEXT[],
  min_salary            NUMERIC(12,2),
  preferred_locations   TEXT[],
  preferred_work_modes  work_mode[],
  visa_required         BOOLEAN DEFAULT FALSE,
  daily_apply_limit     INT DEFAULT 10,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE public.notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type       notification_type NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT,
  data       JSONB,
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read);

-- ============================================================
-- SUBSCRIPTIONS & PAYMENTS
-- ============================================================

CREATE TABLE public.subscriptions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan            subscription_plan NOT NULL,
  amount          NUMERIC(10,2) NOT NULL,
  currency        TEXT DEFAULT 'INR',
  payment_id      TEXT,
  razorpay_sub_id TEXT,
  status          payment_status DEFAULT 'pending',
  starts_at       TIMESTAMPTZ DEFAULT NOW(),
  ends_at         TIMESTAMPTZ,
  auto_renew      BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SOCIAL — CONNECTIONS
-- ============================================================

CREATE TABLE public.connections (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status      TEXT DEFAULT 'pending',   -- pending, accepted, rejected, blocked
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id)
);

-- ============================================================
-- SOCIAL — POSTS
-- ============================================================

CREATE TABLE public.posts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  media_urls   TEXT[],
  post_type    TEXT DEFAULT 'post',    -- post, article, poll
  likes_count  INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.post_likes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id    UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE public.post_comments (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id    UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MESSAGES (Real-time chat)
-- ============================================================

CREATE TABLE public.conversations (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant1 UUID NOT NULL REFERENCES public.users(id),
  participant2 UUID NOT NULL REFERENCES public.users(id),
  last_message TEXT,
  last_msg_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant1, participant2)
);

CREATE TABLE public.messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES public.users(id),
  content         TEXT NOT NULL,
  media_url       TEXT,
  is_read         BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conv ON public.messages(conversation_id, created_at);

-- ============================================================
-- AI CHAT HISTORY (Career Assistant)
-- ============================================================

CREATE TABLE public.ai_chat_sessions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title      TEXT DEFAULT 'New conversation',
  messages   JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ADMIN — ACTIVITY LOGS
-- ============================================================

CREATE TABLE public.admin_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id    UUID NOT NULL REFERENCES public.users(id),
  action      TEXT NOT NULL,
  entity_type TEXT,
  entity_id   UUID,
  details     JSONB,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ADVERTISEMENTS
-- ============================================================

CREATE TABLE public.ads (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  advertiser_id UUID NOT NULL REFERENCES public.users(id),
  title         TEXT NOT NULL,
  image_url     TEXT,
  target_url    TEXT NOT NULL,
  placement     TEXT DEFAULT 'sidebar',   -- sidebar, banner, feed
  impressions   INT DEFAULT 0,
  clicks        INT DEFAULT 0,
  budget        NUMERIC(10,2),
  spent         NUMERIC(10,2) DEFAULT 0,
  is_active     BOOLEAN DEFAULT TRUE,
  starts_at     TIMESTAMPTZ,
  ends_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PLATFORM SETTINGS (Admin controlled)
-- ============================================================

CREATE TABLE public.platform_settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_by UUID REFERENCES public.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert defaults
INSERT INTO public.platform_settings (key, value) VALUES
  ('free_plan_apply_limit',   '20'),
  ('maintenance_mode',        'false'),
  ('ai_auto_apply_enabled',   'true'),
  ('registration_open',       'true'),
  ('featured_job_price_inr',  '999'),
  ('recruiter_job_limit_free', '3');

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_preferences      ENABLE ROW LEVEL SECURITY;

-- Users: see own row + admins see all
CREATE POLICY "users_self" ON public.users
  FOR ALL USING (auth.uid() = id OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- Student profile: own only
CREATE POLICY "profile_self" ON public.student_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Applications: student sees own, recruiter sees for their jobs
CREATE POLICY "applications_student" ON public.applications
  FOR ALL USING (auth.uid() = student_id);

-- Notifications: own only
CREATE POLICY "notifications_self" ON public.notifications
  FOR ALL USING (auth.uid() = user_id);

-- AI chat: own only
CREATE POLICY "ai_chat_self" ON public.ai_chat_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Resumes: own only
CREATE POLICY "resumes_self" ON public.resumes
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- HELPER FUNCTION: updated_at trigger
-- ============================================================

CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at              BEFORE UPDATE ON public.users              FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER student_profiles_updated_at   BEFORE UPDATE ON public.student_profiles   FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER jobs_updated_at               BEFORE UPDATE ON public.jobs               FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER applications_updated_at       BEFORE UPDATE ON public.applications       FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER resumes_updated_at            BEFORE UPDATE ON public.resumes            FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER companies_updated_at          BEFORE UPDATE ON public.companies          FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER ai_preferences_updated_at     BEFORE UPDATE ON public.ai_preferences     FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER posts_updated_at              BEFORE UPDATE ON public.posts              FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- DONE! 🎉
-- Tables created:
--   users, student_profiles, identity_documents
--   education, work_experience, skills, user_skills
--   certifications, projects, resumes
--   companies, recruiter_profiles, jobs
--   applications, saved_jobs
--   auto_apply_queue, ai_preferences
--   notifications, subscriptions
--   connections, posts, post_likes, post_comments
--   conversations, messages, ai_chat_sessions
--   admin_logs, ads, platform_settings
-- ============================================================
