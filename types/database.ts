export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          username: string;
          avatar_url: string | null;
          bio: string | null;
          role: "student" | "instructor" | "moderator";
          headline: string | null;
          linkedin_url: string | null;
          github_url: string | null;
          website_url: string | null;
          onboarding_step: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      courses: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string | null;
          short_intro: string | null;
          cover_image: string | null;
          preview_video: string | null;
          instructor_id: string | null;
          status: "draft" | "published" | "archived";
          is_featured: boolean;
          is_paid: boolean;
          price: number;
          currency: string;
          tags: string[];
          created_at: string;
          published_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["courses"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["courses"]["Insert"]>;
      };
      chapters: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          position: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["chapters"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["chapters"]["Insert"]>;
      };
      lessons: {
        Row: {
          id: string;
          chapter_id: string;
          course_id: string;
          title: string;
          slug: string;
          lesson_type: "article" | "video" | "quiz" | "assignment" | "scorm";
          content: string | null;
          video_url: string | null;
          duration_sec: number | null;
          position: number;
          is_preview: boolean;
          scorm_package_url: string | null;
          scorm_entry_point: string | null;
          scorm_version: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["lessons"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["lessons"]["Insert"]>;
      };
      enrollments: {
        Row: {
          id: string;
          student_id: string;
          course_id: string;
          progress_pct: number;
          enrolled_at: string;
          completed_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["enrollments"]["Row"], "id" | "enrolled_at" | "progress_pct">;
        Update: Partial<Database["public"]["Tables"]["enrollments"]["Insert"]>;
      };
      lesson_progress: {
        Row: {
          id: string;
          student_id: string;
          lesson_id: string;
          course_id: string;
          completed: boolean;
          completed_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["lesson_progress"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["lesson_progress"]["Insert"]>;
      };
      quiz_questions: {
        Row: {
          id: string;
          lesson_id: string;
          question: string;
          options: { id: string; text: string }[];
          correct_opt: string;
          explanation: string | null;
          position: number;
        };
        Insert: Omit<Database["public"]["Tables"]["quiz_questions"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["quiz_questions"]["Insert"]>;
      };
      quiz_attempts: {
        Row: {
          id: string;
          student_id: string;
          lesson_id: string;
          answers: Record<string, string> | null;
          score: number | null;
          passed: boolean | null;
          attempted_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["quiz_attempts"]["Row"], "id" | "attempted_at">;
        Update: Partial<Database["public"]["Tables"]["quiz_attempts"]["Insert"]>;
      };
      assignments: {
        Row: {
          id: string;
          lesson_id: string;
          instructions: string | null;
          max_score: number;
        };
        Insert: Omit<Database["public"]["Tables"]["assignments"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["assignments"]["Insert"]>;
      };
      assignment_submissions: {
        Row: {
          id: string;
          assignment_id: string;
          student_id: string;
          content: string | null;
          file_url: string | null;
          score: number | null;
          feedback: string | null;
          graded_by: string | null;
          submitted_at: string;
          graded_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["assignment_submissions"]["Row"], "id" | "submitted_at">;
        Update: Partial<Database["public"]["Tables"]["assignment_submissions"]["Insert"]>;
      };
      batches: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          description: string | null;
          start_date: string | null;
          end_date: string | null;
          max_students: number | null;
          seat_count: number;
          status: "upcoming" | "active" | "completed";
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["batches"]["Row"], "id" | "created_at" | "seat_count">;
        Update: Partial<Database["public"]["Tables"]["batches"]["Insert"]>;
      };
      batch_students: {
        Row: { batch_id: string; student_id: string; joined_at: string };
        Insert: Omit<Database["public"]["Tables"]["batch_students"]["Row"], "joined_at">;
        Update: never;
      };
      live_sessions: {
        Row: {
          id: string;
          batch_id: string;
          title: string;
          description: string | null;
          scheduled_at: string;
          duration_min: number;
          meet_url: string | null;
          recording_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["live_sessions"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["live_sessions"]["Insert"]>;
      };
      discussions: {
        Row: {
          id: string;
          lesson_id: string | null;
          course_id: string | null;
          author_id: string;
          title: string;
          content: string;
          is_pinned: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["discussions"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["discussions"]["Insert"]>;
      };
      discussion_replies: {
        Row: {
          id: string;
          discussion_id: string;
          author_id: string;
          content: string;
          is_solution: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["discussion_replies"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["discussion_replies"]["Insert"]>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: "new_reply" | "mentioned" | "assignment_graded" | "batch_session" | "enrollment" | "certificate";
          title: string;
          body: string | null;
          link: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["notifications"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
      };
      certificates: {
        Row: {
          id: string;
          cert_id: string;
          student_id: string;
          course_id: string;
          issued_at: string;
          cert_url: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["certificates"]["Row"], "id" | "issued_at">;
        Update: Partial<Database["public"]["Tables"]["certificates"]["Insert"]>;
      };
      job_postings: {
        Row: {
          id: string;
          posted_by: string;
          title: string;
          company: string;
          description: string | null;
          location: string | null;
          job_type: "full-time" | "part-time" | "contract" | "internship" | "remote";
          apply_url: string | null;
          skills: string[];
          is_active: boolean;
          created_at: string;
          expires_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["job_postings"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["job_postings"]["Insert"]>;
      };
      job_applications: {
        Row: {
          id: string;
          job_id: string;
          student_id: string;
          resume_url: string | null;
          applied_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["job_applications"]["Row"], "id" | "applied_at">;
        Update: never;
      };
      course_bookmarks: {
        Row: { student_id: string; course_id: string; bookmarked_at: string };
        Insert: Omit<Database["public"]["Tables"]["course_bookmarks"]["Row"], "bookmarked_at">;
        Update: never;
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_enrolled: { Args: { p_course_id: string }; Returns: boolean };
      is_moderator: { Args: Record<string, never>; Returns: boolean };
      is_instructor_or_moderator: { Args: Record<string, never>; Returns: boolean };
      auth_role: { Args: Record<string, never>; Returns: string };
    };
    Enums: Record<string, never>;
  };
};

// Convenience row types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Course = Database["public"]["Tables"]["courses"]["Row"];
export type Chapter = Database["public"]["Tables"]["chapters"]["Row"];
export type Lesson = Database["public"]["Tables"]["lessons"]["Row"];
export type Enrollment = Database["public"]["Tables"]["enrollments"]["Row"];
export type LessonProgress = Database["public"]["Tables"]["lesson_progress"]["Row"];
export type QuizQuestion = Database["public"]["Tables"]["quiz_questions"]["Row"];
export type QuizAttempt = Database["public"]["Tables"]["quiz_attempts"]["Row"];
export type Assignment = Database["public"]["Tables"]["assignments"]["Row"];
export type AssignmentSubmission = Database["public"]["Tables"]["assignment_submissions"]["Row"];
export type Batch = Database["public"]["Tables"]["batches"]["Row"];
export type LiveSession = Database["public"]["Tables"]["live_sessions"]["Row"];
export type Discussion = Database["public"]["Tables"]["discussions"]["Row"];
export type DiscussionReply = Database["public"]["Tables"]["discussion_replies"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type Certificate = Database["public"]["Tables"]["certificates"]["Row"];
export type JobPosting = Database["public"]["Tables"]["job_postings"]["Row"];
export type JobApplication = Database["public"]["Tables"]["job_applications"]["Row"];

// Extended types with joins
export type CourseWithInstructor = Course & {
  instructor: Pick<Profile, "id" | "full_name" | "username" | "avatar_url" | "headline"> | null;
};

export type LessonWithProgress = Lesson & {
  progress?: Pick<LessonProgress, "completed" | "completed_at"> | null;
};

export type ChapterWithLessons = Chapter & {
  lessons: LessonWithProgress[];
};

export type CourseDetail = CourseWithInstructor & {
  chapters: ChapterWithLessons[];
  enrollment?: Pick<Enrollment, "id" | "progress_pct" | "enrolled_at" | "completed_at"> | null;
  total_lessons: number;
  total_duration_sec: number;
};
