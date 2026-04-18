-- ═══════════════════════════════════════════════════════════════════
-- RESTLESS DREAMERS — INITIAL SCHEMA
-- Migration 001: All 19 tables
-- gemini.md is Law. Do not deviate from this schema.
-- ═══════════════════════════════════════════════════════════════════

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- For fuzzy search

-- ─── PROFILES ─────────────────────────────────────────────────────
create table profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  full_name       text not null,
  username        text unique not null,
  avatar_url      text,
  bio             text check (char_length(bio) <= 300),
  role            text not null default 'student'
                  check (role in ('student', 'instructor', 'moderator')),
  headline        text,
  linkedin_url    text,
  github_url      text,
  website_url     text,
  onboarding_step int not null default 0 check (onboarding_step between 0 and 4),
  created_at      timestamptz default now()
);

-- GIN index for username search
create index profiles_username_trgm_idx on profiles using gin (username gin_trgm_ops);
create index profiles_full_name_trgm_idx on profiles using gin (full_name gin_trgm_ops);

-- ─── COURSES ──────────────────────────────────────────────────────
create table courses (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  slug           text unique not null,
  description    text,
  short_intro    text check (char_length(short_intro) <= 150),
  cover_image    text,
  preview_video  text,
  instructor_id  uuid references profiles(id),
  status         text not null default 'draft'
                 check (status in ('draft', 'published', 'archived')),
  is_featured    boolean not null default false,
  is_paid        boolean not null default false,
  price          numeric(10, 2) not null default 0,
  currency       text not null default 'INR',
  tags           text[] not null default '{}',
  created_at     timestamptz default now(),
  published_at   timestamptz
);

create index courses_slug_idx on courses (slug);
create index courses_status_idx on courses (status);
create index courses_instructor_idx on courses (instructor_id);
create index courses_tags_idx on courses using gin (tags);

-- ─── CHAPTERS ─────────────────────────────────────────────────────
create table chapters (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid not null references courses(id) on delete cascade,
  title      text not null,
  position   int not null default 0,
  created_at timestamptz default now()
);

create index chapters_course_id_idx on chapters (course_id, position);

-- ─── LESSONS ──────────────────────────────────────────────────────
create table lessons (
  id             uuid primary key default gen_random_uuid(),
  chapter_id     uuid not null references chapters(id) on delete cascade,
  course_id      uuid not null references courses(id) on delete cascade,
  title          text not null,
  slug           text not null,
  lesson_type    text not null default 'article'
                 check (lesson_type in ('article', 'video', 'quiz', 'assignment', 'scorm')),
  content        text,          -- Tiptap JSON stringified (article) or instructions (assignment)
  video_url      text,          -- Supabase Storage URL
  duration_sec   int,
  position       int not null default 0,
  is_preview     boolean not null default false,
  -- SCORM fields
  scorm_package_url  text,      -- Supabase Storage path to .zip
  scorm_entry_point  text,      -- e.g. "index.html" within the ZIP
  scorm_version      text,      -- '1.2' | '2004'
  created_at         timestamptz default now(),
  unique (chapter_id, slug)
);

create index lessons_chapter_id_idx on lessons (chapter_id, position);
create index lessons_course_id_idx on lessons (course_id);

-- ─── ENROLLMENTS ──────────────────────────────────────────────────
create table enrollments (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references profiles(id) on delete cascade,
  course_id     uuid not null references courses(id) on delete cascade,
  progress_pct  int not null default 0 check (progress_pct between 0 and 100),
  enrolled_at   timestamptz default now(),
  completed_at  timestamptz,
  unique (student_id, course_id)
);

create index enrollments_student_idx on enrollments (student_id);
create index enrollments_course_idx on enrollments (course_id);

-- ─── LESSON PROGRESS ──────────────────────────────────────────────
create table lesson_progress (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references profiles(id) on delete cascade,
  lesson_id    uuid not null references lessons(id) on delete cascade,
  course_id    uuid not null references courses(id) on delete cascade,
  completed    boolean not null default false,
  completed_at timestamptz,
  unique (student_id, lesson_id)
);

create index lesson_progress_student_course_idx on lesson_progress (student_id, course_id);

-- ─── QUIZ QUESTIONS ───────────────────────────────────────────────
create table quiz_questions (
  id          uuid primary key default gen_random_uuid(),
  lesson_id   uuid not null references lessons(id) on delete cascade,
  question    text not null,
  options     jsonb not null,   -- [{ "id": "a", "text": "..." }, ...]
  correct_opt text not null,    -- option id that is correct
  explanation text,
  position    int not null default 0
);

create index quiz_questions_lesson_idx on quiz_questions (lesson_id, position);

-- ─── QUIZ ATTEMPTS ────────────────────────────────────────────────
create table quiz_attempts (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references profiles(id) on delete cascade,
  lesson_id    uuid not null references lessons(id) on delete cascade,
  answers      jsonb,           -- { "question_uuid": "chosen_option_id", ... }
  score        numeric(5, 2),   -- percentage 0–100
  passed       boolean,
  attempted_at timestamptz default now()
);

create index quiz_attempts_student_lesson_idx on quiz_attempts (student_id, lesson_id);

-- ─── ASSIGNMENTS ──────────────────────────────────────────────────
create table assignments (
  id           uuid primary key default gen_random_uuid(),
  lesson_id    uuid not null references lessons(id) on delete cascade unique,
  instructions text,
  max_score    int not null default 100
);

create table assignment_submissions (
  id             uuid primary key default gen_random_uuid(),
  assignment_id  uuid not null references assignments(id) on delete cascade,
  student_id     uuid not null references profiles(id) on delete cascade,
  content        text,
  file_url       text,
  score          int check (score >= 0),
  feedback       text,
  graded_by      uuid references profiles(id),
  submitted_at   timestamptz default now(),
  graded_at      timestamptz,
  unique (assignment_id, student_id)
);

create index assignment_submissions_assignment_idx on assignment_submissions (assignment_id);
create index assignment_submissions_student_idx on assignment_submissions (student_id);

-- ─── BATCHES ──────────────────────────────────────────────────────
create table batches (
  id            uuid primary key default gen_random_uuid(),
  course_id     uuid not null references courses(id) on delete cascade,
  title         text not null,
  description   text,
  start_date    date,
  end_date      date,
  max_students  int,
  seat_count    int not null default 0,
  status        text not null default 'upcoming'
                check (status in ('upcoming', 'active', 'completed')),
  created_at    timestamptz default now()
);

create index batches_course_id_idx on batches (course_id);
create index batches_status_idx on batches (status);

create table batch_students (
  batch_id   uuid not null references batches(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  joined_at  timestamptz default now(),
  primary key (batch_id, student_id)
);

-- ─── LIVE SESSIONS ────────────────────────────────────────────────
create table live_sessions (
  id              uuid primary key default gen_random_uuid(),
  batch_id        uuid not null references batches(id) on delete cascade,
  title           text not null,
  description     text,
  scheduled_at    timestamptz not null,
  duration_min    int not null default 60,
  meet_url        text,
  recording_url   text,
  created_at      timestamptz default now()
);

create index live_sessions_batch_id_idx on live_sessions (batch_id, scheduled_at);

-- ─── DISCUSSIONS ──────────────────────────────────────────────────
create table discussions (
  id         uuid primary key default gen_random_uuid(),
  lesson_id  uuid references lessons(id) on delete cascade,
  course_id  uuid references courses(id) on delete set null,
  author_id  uuid not null references profiles(id) on delete cascade,
  title      text not null,
  content    text not null,
  is_pinned  boolean not null default false,
  created_at timestamptz default now()
);

create index discussions_lesson_id_idx on discussions (lesson_id);
create index discussions_course_id_idx on discussions (course_id);
create index discussions_author_idx on discussions (author_id);

create table discussion_replies (
  id             uuid primary key default gen_random_uuid(),
  discussion_id  uuid not null references discussions(id) on delete cascade,
  author_id      uuid not null references profiles(id) on delete cascade,
  content        text not null,
  is_solution    boolean not null default false,
  created_at     timestamptz default now()
);

create index discussion_replies_discussion_idx on discussion_replies (discussion_id, created_at);

-- ─── NOTIFICATIONS ────────────────────────────────────────────────
create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  type       text not null
             check (type in ('new_reply', 'mentioned', 'assignment_graded', 'batch_session', 'enrollment', 'certificate')),
  title      text not null,
  body       text,
  link       text,
  read       boolean not null default false,
  created_at timestamptz default now()
);

create index notifications_user_id_idx on notifications (user_id, read, created_at desc);

-- ─── CERTIFICATES ─────────────────────────────────────────────────
create table certificates (
  id         uuid primary key default gen_random_uuid(),
  cert_id    text unique not null,           -- e.g. RD-2025-A3F2
  student_id uuid not null references profiles(id) on delete cascade,
  course_id  uuid not null references courses(id) on delete cascade,
  issued_at  timestamptz default now(),
  cert_url   text,                           -- Supabase Storage PDF URL
  unique (student_id, course_id)
);

create index certificates_cert_id_idx on certificates (cert_id);

-- ─── JOB POSTINGS ─────────────────────────────────────────────────
create table job_postings (
  id          uuid primary key default gen_random_uuid(),
  posted_by   uuid not null references profiles(id),
  title       text not null,
  company     text not null,
  description text,
  location    text,
  job_type    text not null default 'full-time'
              check (job_type in ('full-time', 'part-time', 'contract', 'internship', 'remote')),
  apply_url   text,
  skills      text[] not null default '{}',
  is_active   boolean not null default true,
  created_at  timestamptz default now(),
  expires_at  timestamptz
);

create index job_postings_is_active_idx on job_postings (is_active, created_at desc);
create index job_postings_skills_idx on job_postings using gin (skills);

create table job_applications (
  id         uuid primary key default gen_random_uuid(),
  job_id     uuid not null references job_postings(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  resume_url text,
  applied_at timestamptz default now(),
  unique (job_id, student_id)
);

-- ─── BOOKMARKS ────────────────────────────────────────────────────
-- (Extended from spec — needed for My Courses "Bookmarked" tab)
create table course_bookmarks (
  student_id  uuid not null references profiles(id) on delete cascade,
  course_id   uuid not null references courses(id) on delete cascade,
  bookmarked_at timestamptz default now(),
  primary key (student_id, course_id)
);
