# 📋 task_plan.md — B.L.A.S.T. Phase Tracker
> **Status:** `PHASE 1 COMPLETE — AWAITING PHASE 2 (LINK)`
> **Last Updated:** 2026-04-18

---

## Phase 0: Initialization ✅

- [x] Create `gemini.md` (Project Constitution)
- [x] Create `task_plan.md` (this file)
- [x] Create `findings.md`
- [x] Create `progress.md`
- [x] Discovery Questions answered (via spec)
- [x] Data Schema defined in `gemini.md`

---

## Phase 1: B — Blueprint ✅

- [x] North Star confirmed: Production-grade LMS "Restless Dreamers"
- [x] Integrations identified: Supabase, Resend, Google OAuth, Vercel
- [x] Source of Truth: Supabase PostgreSQL
- [x] Delivery Payload: Next.js 14 app on Vercel
- [x] Behavioral Rules defined (12 rules in gemini.md)
- [x] Full schema defined (19 tables)
- [x] Blueprint approved by user

---

## Phase 2: L — Link

- [ ] Supabase project created or identified
- [ ] `.env.local` populated with all credentials
- [ ] Supabase Auth: email/password enabled
- [ ] Supabase Auth: Google OAuth enabled
- [ ] Supabase Storage buckets created (6 buckets)
- [ ] Resend API key ready
- [ ] Connection verified (test query runs)

---

## Phase 3: A — Architect (The Build)

### 3A — Project Scaffold
- [ ] Next.js 14 project initialized (`create-next-app`)
- [ ] TypeScript, Tailwind, App Router configured
- [ ] shadcn/ui installed and initialized
- [ ] Google Fonts (Fraunces, DM Sans, JetBrains Mono) loaded
- [ ] Tailwind theme extended with RD design tokens
- [ ] Supabase client + server utils configured
- [ ] Auth middleware.ts implemented
- [ ] lib/constants.ts created

### 3B — Database
- [ ] All 19 tables migrated to Supabase
- [ ] RLS policies applied to every table
- [ ] Supabase triggers for `enrollments.progress_pct`
- [ ] Storage buckets created + policies set
- [ ] Seed data created

### 3C — Core Layout
- [ ] Root layout with fonts
- [ ] Sidebar.tsx (with role-based nav sections)
- [ ] Topbar.tsx (breadcrumbs, notifications, avatar)
- [ ] MobileNav.tsx
- [ ] Notification bell (Realtime subscription)

### 3D — Auth Pages
- [ ] /login page
- [ ] /signup page (creates profile on first login)
- [ ] Google OAuth callback handler

### 3E — Public Pages
- [ ] Homepage (/)
- [ ] Course Catalogue (/courses)
- [ ] Course Detail (/courses/[slug])

### 3F — Learner Dashboard
- [ ] My Courses (/my-courses)
- [ ] Lesson Player (/learn/[courseSlug]/[lessonSlug])
  - [ ] Video lesson (Plyr.js + 90% completion)
  - [ ] Article lesson (Tiptap render)
  - [ ] Quiz lesson (QuizEngine.tsx)
  - [ ] Assignment lesson (submission + file upload)
- [ ] Batches (/batches + /batches/[id])
- [ ] Discussions (/discussions + /discussions/[id])
- [ ] Profile (/profile/[username])
- [ ] Certificates (/certificates)
- [ ] Jobs Board (/jobs)

### 3G — Admin
- [ ] Admin Dashboard (/admin/dashboard) — Recharts
- [ ] Course Builder (/admin/courses/new + /admin/courses/[id]/edit)
  - [ ] dnd-kit chapter/lesson reordering
  - [ ] Lesson editor modal (all 4 types)
- [ ] Student Management (/admin/students)
- [ ] Batch Management (/admin/batches)
- [ ] Evaluations (/admin/evaluations)

### 3H — Supporting Systems
- [ ] Certificate generation (@react-pdf/renderer)
- [ ] /verify/[certId] public page
- [ ] Email templates (6 templates via Resend)
- [ ] Job auto-expiry Edge Function

---

## Phase 4: S — Stylize

- [ ] Responsive review (390px mobile)
- [ ] Empty states with illustrations
- [ ] Loading skeletons on all data-fetching pages
- [ ] Error boundaries
- [ ] Toast notifications
- [ ] User feedback collected

---

## Phase 5: T — Trigger (Deployment)

- [ ] Vercel project linked
- [ ] Environment variables set in Vercel
- [ ] `npm run build` passes with zero type errors
- [ ] Production deploy fired
- [ ] README.md finalized
- [ ] gemini.md Maintenance Log updated

---

## 🚨 Five Flows That Define "Done"

1. Learner: Browse → Enroll → First Lesson (no jarring reload)
2. Instructor: Create course with 3 chapters / 10 lessons in <15 min
3. Student: Complete last lesson → Certificate email within 5 seconds
4. Moderator: Search student → View all-course progress → Change role
5. Realtime: Reply to discussion → notification bell updates without refresh
