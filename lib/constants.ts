// ─── Restless Dreamers — Single Source of Truth ───────────────────────────
// gemini.md is Law. All numeric constants live here exclusively.

export const QUIZ_PASS_THRESHOLD   = 70;   // percent — a score >= this is a pass
export const VIDEO_COMPLETE_PCT    = 90;   // percent watch time to mark video complete
export const COURSES_PER_PAGE      = 12;   // catalogue pagination
export const SEARCH_DEBOUNCE_MS    = 300;  // search input debounce
export const BIO_MAX_CHARS         = 300;  // profile bio limit
export const SHORT_INTRO_MAX_CHARS = 150;  // course short_intro limit
export const CERT_ID_PREFIX        = "RD"; // certificate ID prefix e.g. RD-2025-XXXX
export const HQ_MAX_PLAYERS        = 3;    // (reserved — from SURGE, unused in LMS)
export const RIDE_RESET_DELAY      = 2000; // (reserved — from SURGE, unused in LMS)
export const NOTIFICATION_LIMIT    = 10;   // how many notifications to show in dropdown
export const ONBOARDING_STEPS      = 4;    // instructor onboarding steps 0–4
export const SESSION_REMINDER_H    = 24;   // hours before session to send reminder email

// Lesson types
export const LESSON_TYPES = ['article', 'video', 'quiz', 'assignment', 'scorm'] as const;
export type LessonType = (typeof LESSON_TYPES)[number];

// User roles
export const USER_ROLES = ['student', 'instructor', 'moderator'] as const;
export type UserRole = (typeof USER_ROLES)[number];

// Job types
export const JOB_TYPES = ['full-time', 'part-time', 'contract', 'internship', 'remote'] as const;
export type JobType = (typeof JOB_TYPES)[number];

// Course statuses
export const COURSE_STATUSES = ['draft', 'published', 'archived'] as const;
export type CourseStatus = (typeof COURSE_STATUSES)[number];

// Batch statuses
export const BATCH_STATUSES = ['upcoming', 'active', 'completed'] as const;
export type BatchStatus = (typeof BATCH_STATUSES)[number];

// Notification types
export const NOTIFICATION_TYPES = [
  'new_reply',
  'mentioned',
  'assignment_graded',
  'batch_session',
  'enrollment',
  'certificate',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

// Supabase Storage bucket names
export const STORAGE_BUCKETS = {
  COURSE_COVERS:  'course-covers',
  LESSON_VIDEOS:  'lesson-videos',
  AVATARS:        'avatars',
  CERTIFICATES:   'certificates',
  SUBMISSIONS:    'submissions',
  RESUMES:        'resumes',
  SCORM_PACKAGES: 'scorm-packages',
} as const;
