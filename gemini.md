# 📜 gemini.md — Project Constitution
> **Status:** `BLUEPRINT APPROVED`
> **Last Updated:** 2026-04-18
> **Project:** Restless Dreamers — Full-Featured Learning Management System

---

## 1. North Star

> A production-grade LMS called **Restless Dreamers** — spiritually identical to Frappe LMS in structure, feature-set, and UX philosophy. Two audiences: Learners (browse, enroll, progress, discuss, certify) and Instructors/Moderators (create courses, manage batches, track students, post jobs). Built on Next.js 14 + Supabase + TypeScript. This is not a prototype.

---

## 2. Tech Stack (NON-NEGOTIABLE)

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript — no `any` types |
| Database | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| Auth | Supabase Auth (Email/password + Google OAuth) |
| Styling | Tailwind CSS (no CSS files) |
| Components | shadcn/ui |
| Rich Text | Tiptap |
| Video | Plyr.js |
| Charts | Recharts |
| Email | Resend |
| Deployment | Vercel |
| Dates | date-fns |
| Client State | zustand (only where React state insufficient) |
| DnD | @dnd-kit/core |
| PDF | @react-pdf/renderer |

**Forbidden:** class components, Redux, jQuery, moment.js, any-typed TypeScript

---

## 3. Data Schema (LAW — DO NOT DEVIATE)

### Tables
- `profiles` — users (student | instructor | moderator)
- `courses` — with slug, status (draft|published|archived), is_featured, is_paid
- `chapters` — ordered sections within courses
- `lessons` — article | video | quiz | assignment | scorm
- `enrollments` — student↔course many:many
- `lesson_progress` — per lesson completion tracking
- `quiz_questions` — questions with JSONB options
- `quiz_attempts` — student quiz runs with score
- `assignments` — lesson-linked instructions
- `assignment_submissions` — student submissions + grading
- `batches` — cohort groups with dates
- `batch_students` — batch↔student many:many
- `live_sessions` — scheduled calls within batches
- `discussions` — lesson-linked threads
- `discussion_replies` — threaded replies
- `notifications` — Realtime-driven alerts
- `certificates` — issued cert with PDF URL
- `job_postings` — company job listings
- `job_applications` — student applications

### Key Schema Rules
- All IDs are `uuid` with `gen_random_uuid()`
- All timestamps are `timestamptz default now()`
- Slugs are auto-generated on create, then FROZEN
- `profiles.onboarding_step` int 0–4 for instructor onboarding
- `enrollments.progress_pct` updated via Supabase trigger

---

## 4. Constants (lib/constants.ts — single source of truth)

```ts
QUIZ_PASS_THRESHOLD   = 70    // percent
VIDEO_COMPLETE_PCT    = 90    // percent watch time to mark complete
RIDE_RESET_DELAY      = 2000  // (unused in LMS — from SURGE)
COURSES_PER_PAGE      = 12
SEARCH_DEBOUNCE_MS    = 300
BIO_MAX_CHARS         = 300
SHORT_INTRO_MAX_CHARS = 150
CERT_ID_PREFIX        = "RD"
```

---

## 5. Supabase Storage Buckets

| Bucket | Access |
|--------|--------|
| `course-covers` | public read |
| `lesson-videos` | public read |
| `avatars` | public read |
| `certificates` | public read |
| `submissions` | private (student + instructor) |
| `resumes` | private (student + job poster) |

---

## 6. Visual Identity

### Palette
```
--rd-ink:       #0F0F0F   (primary text)
--rd-paper:     #FAFAF8   (page background)
--rd-surface:   #FFFFFF   (card/panel)
--rd-border:    #E4E4E0   (borders)
--rd-muted:     #888884   (secondary text)
--rd-accent:    #D97706   (amber brand)
--rd-accent-lt: #FEF3C7   (accent tint)
--rd-accent-dk: #92400E   (hover)
--rd-success:   #16A34A
--rd-danger:    #DC2626
--rd-info:      #2563EB
--rd-warning:   #D97706
```

### Typography
- Display/Headings: Fraunces (Google Fonts — serif)
- Body: DM Sans (Google Fonts — humanist)
- Mono: JetBrains Mono (Google Fonts)

### Layout Rules
- Left sidebar: fixed 240px desktop, collapses mobile
- Content: starts at 240px, max-width 1200px centered
- Card border-radius: 8px | Button: 6px
- No box shadows — use `1px solid var(--rd-border)`
- All transitions: 150ms ease
- Sidebar active: 3px amber left border + accent-lt bg

---

## 7. Behavioral Rules (IMMUTABLE)

1. Lesson completion is atomic — use Supabase upsert on `lesson_progress`
2. Certificate generation happens exactly once — check before generating
3. Course progress % = completed / total lessons × 100 (cached in `enrollments.progress_pct` via DB trigger)
4. Quiz pass threshold is 70% — constant in `lib/constants.ts` ONLY
5. Video lessons complete at 90% watch time — fire once, not on seek
6. Slugs auto-generated on create, then FROZEN — title change never changes slug
7. Moderators > Instructors > Students in permission hierarchy
8. Instructors can only edit their own courses (RLS + server-side)
9. Discussions require enrollment (student) — moderator/instructor bypass
10. Jobs expire via Supabase Edge Function (daily cron)
11. No client-side redirects for auth — all in middleware.ts
12. Role checks: always server-side in Server Components or Server Actions

---

## 8. Auth & Routing Rules

```
Public:    / | /courses | /courses/[slug] | /login | /signup | /verify/[certId]
Protected: /learn/* | /my-courses | /batches/* | /discussions/* | /profile/* | /certificates | /jobs
Admin:     /admin/* (instructor | moderator role — redirect to /courses if insufficient)
```

---

## 9. Email Triggers (Resend)

| Event | Template | Recipient |
|-------|----------|-----------|
| Course enrollment | EnrollmentConfirm | Student |
| Certificate issued | CertificateIssued (PDF) | Student |
| Assignment graded | AssignmentGraded | Student |
| New discussion reply | NewReply | Thread author |
| Batch session (24h) | SessionReminder | Batch students |
| Job application received | JobApplication (resume) | Job poster |

---

## 10. Architectural Invariants

1. **App Router only** — no pages/ directory
2. **Server Components by default** — use 'use client' only when necessary
3. **All auth handled in middleware.ts** — never client-side
4. **Supabase server client** for Server Components, browser client for Client Components
5. **No hardcoded strings** — all configurable values in `lib/constants.ts`
6. **`gemini.md` is Law** — supersedes all other documentation

---

## 11. Maintenance Log

| Date | Change | Author |
|------|--------|--------|
| 2026-04-18 | Constitution initialized from spec | System Pilot |
