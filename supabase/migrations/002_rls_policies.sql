-- ═══════════════════════════════════════════════════════════════════
-- RESTLESS DREAMERS — ROW LEVEL SECURITY
-- Migration 002: RLS policies for every table
-- ═══════════════════════════════════════════════════════════════════

-- Enable RLS on all tables
alter table profiles              enable row level security;
alter table courses               enable row level security;
alter table chapters              enable row level security;
alter table lessons               enable row level security;
alter table enrollments           enable row level security;
alter table lesson_progress       enable row level security;
alter table quiz_questions        enable row level security;
alter table quiz_attempts         enable row level security;
alter table assignments           enable row level security;
alter table assignment_submissions enable row level security;
alter table batches               enable row level security;
alter table batch_students        enable row level security;
alter table live_sessions         enable row level security;
alter table discussions           enable row level security;
alter table discussion_replies    enable row level security;
alter table notifications         enable row level security;
alter table certificates          enable row level security;
alter table job_postings          enable row level security;
alter table job_applications      enable row level security;
alter table course_bookmarks      enable row level security;

-- ─── HELPER FUNCTIONS ─────────────────────────────────────────────

create or replace function auth_role()
returns text language sql stable security definer as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function is_moderator()
returns boolean language sql stable security definer as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'moderator')
$$;

create or replace function is_instructor_or_moderator()
returns boolean language sql stable security definer as $$
  select exists (select 1 from profiles where id = auth.uid() and role in ('instructor', 'moderator'))
$$;

create or replace function is_enrolled(p_course_id uuid)
returns boolean language sql stable security definer as $$
  select exists (select 1 from enrollments where student_id = auth.uid() and course_id = p_course_id)
$$;

-- ─── PROFILES ─────────────────────────────────────────────────────
-- Anyone can read profiles
create policy "profiles_select_public"
  on profiles for select using (true);

-- Users can update their own profile; moderators can update any
create policy "profiles_update_own"
  on profiles for update using (
    auth.uid() = id or is_moderator()
  );

-- Profiles are created via trigger on auth.users insert (service role)
create policy "profiles_insert_own"
  on profiles for insert with check (auth.uid() = id);

-- ─── COURSES ──────────────────────────────────────────────────────
-- Published courses are readable by everyone; instructors see their own drafts
create policy "courses_select"
  on courses for select using (
    status = 'published'
    or (auth.uid() is not null and instructor_id = auth.uid())
    or is_moderator()
  );

-- Instructors can insert their own courses
create policy "courses_insert"
  on courses for insert with check (
    is_instructor_or_moderator()
    and (instructor_id = auth.uid() or is_moderator())
  );

-- Instructors can only update their own courses; moderators can update any
create policy "courses_update"
  on courses for update using (
    (instructor_id = auth.uid() and is_instructor_or_moderator())
    or is_moderator()
  );

-- Only moderators can delete courses
create policy "courses_delete"
  on courses for delete using (is_moderator());

-- ─── CHAPTERS ─────────────────────────────────────────────────────
create policy "chapters_select"
  on chapters for select using (
    exists (
      select 1 from courses c
      where c.id = chapters.course_id
        and (c.status = 'published' or c.instructor_id = auth.uid() or is_moderator())
    )
  );

create policy "chapters_insert"
  on chapters for insert with check (
    exists (
      select 1 from courses c
      where c.id = course_id
        and (c.instructor_id = auth.uid() or is_moderator())
    )
  );

create policy "chapters_update"
  on chapters for update using (
    exists (
      select 1 from courses c
      where c.id = chapters.course_id
        and (c.instructor_id = auth.uid() or is_moderator())
    )
  );

create policy "chapters_delete"
  on chapters for delete using (
    exists (
      select 1 from courses c
      where c.id = chapters.course_id
        and (c.instructor_id = auth.uid() or is_moderator())
    )
  );

-- ─── LESSONS ──────────────────────────────────────────────────────
create policy "lessons_select"
  on lessons for select using (
    -- Free previews are always public
    is_preview = true
    -- Enrolled students see all lessons in their course
    or is_enrolled(course_id)
    -- Instructor sees their own course lessons
    or exists (select 1 from courses c where c.id = lessons.course_id and c.instructor_id = auth.uid())
    or is_moderator()
  );

create policy "lessons_insert"
  on lessons for insert with check (
    exists (
      select 1 from courses c
      where c.id = course_id
        and (c.instructor_id = auth.uid() or is_moderator())
    )
  );

create policy "lessons_update"
  on lessons for update using (
    exists (
      select 1 from courses c
      where c.id = lessons.course_id
        and (c.instructor_id = auth.uid() or is_moderator())
    )
  );

create policy "lessons_delete"
  on lessons for delete using (
    exists (
      select 1 from courses c
      where c.id = lessons.course_id
        and (c.instructor_id = auth.uid() or is_moderator())
    )
  );

-- ─── ENROLLMENTS ──────────────────────────────────────────────────
create policy "enrollments_select"
  on enrollments for select using (
    student_id = auth.uid()
    or exists (select 1 from courses c where c.id = enrollments.course_id and c.instructor_id = auth.uid())
    or is_moderator()
  );

create policy "enrollments_insert"
  on enrollments for insert with check (student_id = auth.uid());

create policy "enrollments_update"
  on enrollments for update using (
    student_id = auth.uid()
    or is_moderator()
  );

-- ─── LESSON PROGRESS ──────────────────────────────────────────────
create policy "lesson_progress_select"
  on lesson_progress for select using (
    student_id = auth.uid()
    or exists (select 1 from courses c where c.id = lesson_progress.course_id and c.instructor_id = auth.uid())
    or is_moderator()
  );

create policy "lesson_progress_insert"
  on lesson_progress for insert with check (student_id = auth.uid());

create policy "lesson_progress_update"
  on lesson_progress for update using (student_id = auth.uid());

-- ─── QUIZ QUESTIONS ───────────────────────────────────────────────
create policy "quiz_questions_select"
  on quiz_questions for select using (
    exists (select 1 from lessons l where l.id = quiz_questions.lesson_id
      and (l.is_preview or is_enrolled(l.course_id)
           or exists (select 1 from courses c where c.id = l.course_id and c.instructor_id = auth.uid())
           or is_moderator()))
  );

create policy "quiz_questions_manage"
  on quiz_questions for all using (
    exists (
      select 1 from lessons l
      join courses c on c.id = l.course_id
      where l.id = quiz_questions.lesson_id
        and (c.instructor_id = auth.uid() or is_moderator())
    )
  );

-- ─── QUIZ ATTEMPTS ────────────────────────────────────────────────
create policy "quiz_attempts_select"
  on quiz_attempts for select using (
    student_id = auth.uid()
    or exists (select 1 from lessons l join courses c on c.id = l.course_id where l.id = quiz_attempts.lesson_id and c.instructor_id = auth.uid())
    or is_moderator()
  );

create policy "quiz_attempts_insert"
  on quiz_attempts for insert with check (student_id = auth.uid());

-- ─── ASSIGNMENTS ──────────────────────────────────────────────────
create policy "assignments_select"
  on assignments for select using (
    exists (select 1 from lessons l where l.id = assignments.lesson_id
      and (is_enrolled(l.course_id)
           or exists (select 1 from courses c where c.id = l.course_id and c.instructor_id = auth.uid())
           or is_moderator()))
  );

create policy "assignments_manage"
  on assignments for all using (
    exists (
      select 1 from lessons l join courses c on c.id = l.course_id
      where l.id = assignments.lesson_id and (c.instructor_id = auth.uid() or is_moderator())
    )
  );

-- ─── ASSIGNMENT SUBMISSIONS ───────────────────────────────────────
create policy "assignment_submissions_select"
  on assignment_submissions for select using (
    student_id = auth.uid()
    or exists (
      select 1 from assignments a join lessons l on l.id = a.lesson_id join courses c on c.id = l.course_id
      where a.id = assignment_submissions.assignment_id and (c.instructor_id = auth.uid() or is_moderator())
    )
  );

create policy "assignment_submissions_insert"
  on assignment_submissions for insert with check (student_id = auth.uid());

create policy "assignment_submissions_update"
  on assignment_submissions for update using (
    student_id = auth.uid()
    or exists (
      select 1 from assignments a join lessons l on l.id = a.lesson_id join courses c on c.id = l.course_id
      where a.id = assignment_submissions.assignment_id and (c.instructor_id = auth.uid() or is_moderator())
    )
  );

-- ─── BATCHES ──────────────────────────────────────────────────────
create policy "batches_select"
  on batches for select using (true);

create policy "batches_manage"
  on batches for all using (is_instructor_or_moderator());

create policy "batch_students_select"
  on batch_students for select using (
    student_id = auth.uid()
    or is_instructor_or_moderator()
  );

create policy "batch_students_insert"
  on batch_students for insert with check (student_id = auth.uid());

create policy "batch_students_delete"
  on batch_students for delete using (
    student_id = auth.uid() or is_moderator()
  );

-- ─── LIVE SESSIONS ────────────────────────────────────────────────
create policy "live_sessions_select"
  on live_sessions for select using (true);

create policy "live_sessions_manage"
  on live_sessions for all using (is_instructor_or_moderator());

-- ─── DISCUSSIONS ──────────────────────────────────────────────────
create policy "discussions_select"
  on discussions for select using (
    -- Course-level discussions: anyone enrolled or instructor/moderator
    course_id is null
    or is_enrolled(course_id)
    or exists (select 1 from courses c where c.id = discussions.course_id and c.instructor_id = auth.uid())
    or is_moderator()
  );

create policy "discussions_insert"
  on discussions for insert with check (
    author_id = auth.uid()
    and (
      course_id is null
      or is_enrolled(course_id)
      or is_instructor_or_moderator()
    )
  );

create policy "discussions_update"
  on discussions for update using (
    author_id = auth.uid() or is_moderator()
  );

create policy "discussions_delete"
  on discussions for delete using (
    author_id = auth.uid() or is_moderator()
  );

-- ─── DISCUSSION REPLIES ───────────────────────────────────────────
create policy "discussion_replies_select"
  on discussion_replies for select using (
    exists (
      select 1 from discussions d where d.id = discussion_replies.discussion_id
        and (d.course_id is null or is_enrolled(d.course_id) or is_instructor_or_moderator())
    )
  );

create policy "discussion_replies_insert"
  on discussion_replies for insert with check (
    author_id = auth.uid()
    and exists (
      select 1 from discussions d where d.id = discussion_id
        and (d.course_id is null or is_enrolled(d.course_id) or is_instructor_or_moderator())
    )
  );

create policy "discussion_replies_update"
  on discussion_replies for update using (
    author_id = auth.uid() or is_moderator()
  );

create policy "discussion_replies_delete"
  on discussion_replies for delete using (
    author_id = auth.uid() or is_moderator()
  );

-- ─── NOTIFICATIONS ────────────────────────────────────────────────
create policy "notifications_owner_only"
  on notifications for all using (user_id = auth.uid());

-- ─── CERTIFICATES ─────────────────────────────────────────────────
-- Public read (for /verify/[certId] page without login)
create policy "certificates_select_public"
  on certificates for select using (true);

-- Only service role can insert (via API route using admin client)
create policy "certificates_insert_service"
  on certificates for insert with check (false); -- blocked for anon/user; use service role

-- ─── JOB POSTINGS ─────────────────────────────────────────────────
create policy "job_postings_select"
  on job_postings for select using (is_active = true or posted_by = auth.uid() or is_moderator());

create policy "job_postings_insert"
  on job_postings for insert with check (
    posted_by = auth.uid() and is_instructor_or_moderator()
  );

create policy "job_postings_update"
  on job_postings for update using (
    posted_by = auth.uid() or is_moderator()
  );

create policy "job_postings_delete"
  on job_postings for delete using (
    posted_by = auth.uid() or is_moderator()
  );

-- ─── JOB APPLICATIONS ────────────────────────────────────────────
create policy "job_applications_select"
  on job_applications for select using (
    student_id = auth.uid()
    or exists (select 1 from job_postings jp where jp.id = job_applications.job_id and jp.posted_by = auth.uid())
    or is_moderator()
  );

create policy "job_applications_insert"
  on job_applications for insert with check (student_id = auth.uid());

-- ─── COURSE BOOKMARKS ─────────────────────────────────────────────
create policy "course_bookmarks_owner_only"
  on course_bookmarks for all using (student_id = auth.uid());
