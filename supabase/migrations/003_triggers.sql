-- ═══════════════════════════════════════════════════════════════════
-- RESTLESS DREAMERS — TRIGGERS & FUNCTIONS
-- Migration 003: Auto-create profiles, progress_pct updates
-- ═══════════════════════════════════════════════════════════════════

-- ─── AUTO-CREATE PROFILE ON SIGNUP ────────────────────────────────
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base_username text;
  final_username text;
  counter int := 0;
begin
  -- Generate username from email prefix
  base_username := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9]', '', 'g'));
  final_username := base_username;

  -- Ensure uniqueness
  while exists (select 1 from profiles where username = final_username) loop
    counter := counter + 1;
    final_username := base_username || counter::text;
  end loop;

  insert into profiles (id, full_name, username, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    final_username,
    new.raw_user_meta_data->>'avatar_url',
    'student'
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─── UPDATE ENROLLMENT PROGRESS PCT ──────────────────────────────
create or replace function update_enrollment_progress()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  total_lessons int;
  completed_lessons int;
  new_pct int;
  all_done boolean;
begin
  -- Count total lessons in the course
  select count(*) into total_lessons
  from lessons
  where course_id = new.course_id;

  if total_lessons = 0 then
    return new;
  end if;

  -- Count completed lessons for this student in this course
  select count(*) into completed_lessons
  from lesson_progress
  where student_id = new.student_id
    and course_id = new.course_id
    and completed = true;

  new_pct := floor((completed_lessons::numeric / total_lessons) * 100);
  all_done := (completed_lessons >= total_lessons);

  update enrollments
  set
    progress_pct = new_pct,
    completed_at = case when all_done and completed_at is null then now() else completed_at end
  where student_id = new.student_id
    and course_id = new.course_id;

  return new;
end;
$$;

create trigger on_lesson_progress_change
  after insert or update on lesson_progress
  for each row execute function update_enrollment_progress();

-- ─── AUTO-INCREMENT BATCH SEAT COUNT ─────────────────────────────
create or replace function update_batch_seat_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    update batches set seat_count = seat_count + 1 where id = new.batch_id;
  elsif (tg_op = 'DELETE') then
    update batches set seat_count = greatest(seat_count - 1, 0) where id = old.batch_id;
  end if;
  return null;
end;
$$;

create trigger on_batch_student_change
  after insert or delete on batch_students
  for each row execute function update_batch_seat_count();

-- ─── FREEZE SLUG ON UPDATE ────────────────────────────────────────
-- Behavioral Rule #6: Slugs are frozen after creation.
create or replace function prevent_slug_update()
returns trigger language plpgsql as $$
begin
  if new.slug <> old.slug then
    raise exception 'Slug is immutable. Create a new record to change the slug.';
  end if;
  return new;
end;
$$;

create trigger courses_slug_frozen
  before update on courses
  for each row execute function prevent_slug_update();

-- ─── CERTIFICATE GENERATION GUARD ────────────────────────────────
-- Behavioral Rule #2: Certificate only generates once.
-- Enforced by unique(student_id, course_id) on certificates table.
-- Additional guard via application layer in /api/certificates/generate.

-- ─── STORAGE BUCKET POLICIES ─────────────────────────────────────
-- Run these in Supabase Dashboard → Storage → [bucket] → Policies
-- Or via the Supabase CLI:

-- course-covers: public read, authenticated write (instructor/moderator)
-- lesson-videos: public read, authenticated write (instructor/moderator)
-- avatars: public read, authenticated write (own)
-- certificates: public read, service-role write only
-- submissions: private — student (own) + instructor of course
-- resumes: private — student (own) + job poster
-- scorm-packages: authenticated write (instructor/moderator), enrolled read
