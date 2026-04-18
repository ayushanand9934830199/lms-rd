import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Menu, X, CheckCircle } from "lucide-react";
import ChapterAccordion from "@/components/courses/ChapterAccordion";
import LessonPlayer from "@/components/learn/LessonPlayer";
import type { Metadata } from "next";
import type { LessonType } from "@/lib/constants";

interface Props {
  params: { slug: string; lessonSlug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lessons")
    .select("title, courses(title)")
    .eq("slug", params.lessonSlug)
    .single();
  return { title: data?.title ?? "Lesson" };
}

export default async function LearnLessonPage({ params }: Props) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/learn/${params.slug}/${params.lessonSlug}`);

  // Verify enrollment
  const { data: course } = await supabase
    .from("courses")
    .select("id, title, slug")
    .eq("slug", params.slug)
    .eq("status", "published")
    .single();

  if (!course) notFound();

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id, progress_pct")
    .eq("student_id", user.id)
    .eq("course_id", course.id)
    .single();

  if (!enrollment) redirect(`/courses/${params.slug}`);

  // Current lesson
  const { data: lesson } = await supabase
    .from("lessons")
    .select("*, assignments(*), quiz_questions(*)")
    .eq("slug", params.lessonSlug)
    .eq("course_id", course.id)
    .single();

  if (!lesson) notFound();

  // All chapters + lessons for sidebar
  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, title, position, lessons(id, title, slug, lesson_type, duration_sec, position, is_preview)")
    .eq("course_id", course.id)
    .order("position");

  const sortedChapters = (chapters ?? []).map((c) => ({
    ...c,
    lessons: (c.lessons ?? []).sort((a: any, b: any) => a.position - b.position),
  })).sort((a, b) => a.position - b.position);

  // Completed lesson IDs
  const { data: progressRows } = await supabase
    .from("lesson_progress")
    .select("lesson_id")
    .eq("student_id", user.id)
    .eq("course_id", course.id)
    .eq("completed", true);

  const completedIds = progressRows?.map((p) => p.lesson_id) ?? [];

  // Already completed this lesson?
  const isCompleted = completedIds.includes(lesson.id);

  // Build flat list for prev/next navigation
  const allLessons = sortedChapters.flatMap((c) => c.lessons);
  const currentIdx = allLessons.findIndex((l: any) => l.slug === params.lessonSlug);
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;

  return (
    <div className="flex h-screen bg-rd-paper overflow-hidden">
      {/* ── Lesson Sidebar ── */}
      <aside className="hidden lg:flex flex-col w-lesson-sidebar bg-rd-surface border-r border-rd-border shrink-0 overflow-hidden">
        {/* Course title */}
        <div className="p-4 border-b border-rd-border">
          <Link
            href={`/courses/${params.slug}`}
            className="text-xs text-rd-muted hover:text-rd-ink transition-colors"
          >
            ← {course.title}
          </Link>
          <p className="text-sm font-semibold text-rd-ink mt-1 leading-snug line-clamp-2">
            {course.title}
          </p>
          <div className="mt-2">
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{ width: `${enrollment.progress_pct}%` }}
              />
            </div>
            <p className="text-xs text-rd-muted mt-1">{enrollment.progress_pct}% complete</p>
          </div>
        </div>

        {/* Chapter accordion */}
        <div className="flex-1 overflow-y-auto p-2">
          <ChapterAccordion
            chapters={sortedChapters}
            isEnrolled={true}
            courseSlug={params.slug}
            completedLessonIds={completedIds}
            activeLessonSlug={params.lessonSlug}
          />
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-12 bg-rd-surface border-b border-rd-border flex items-center px-4 gap-3 shrink-0">
          <Link
            href={`/courses/${params.slug}`}
            className="text-sm text-rd-muted hover:text-rd-ink transition-colors hidden sm:block"
          >
            ← Back to course
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-rd-ink truncate">{lesson.title}</p>
          </div>
          {isCompleted && (
            <div className="flex items-center gap-1.5 text-rd-success text-xs font-semibold">
              <CheckCircle className="w-4 h-4" />
              <span className="hidden sm:block">Completed</span>
            </div>
          )}
        </header>

        {/* Lesson content */}
        <main className="flex-1 overflow-y-auto">
          <LessonPlayer
            lesson={{
              id: lesson.id,
              title: lesson.title,
              lesson_type: lesson.lesson_type as LessonType,
              content: lesson.content,
              video_url: lesson.video_url,
              duration_sec: lesson.duration_sec,
              scorm_package_url: lesson.scorm_package_url,
              scorm_entry_point: lesson.scorm_entry_point,
              scorm_version: lesson.scorm_version,
            }}
            courseId={course.id}
            courseSlug={params.slug}
            userId={user.id}
            isCompleted={isCompleted}
            quizQuestions={(lesson as any).quiz_questions ?? []}
            assignment={(lesson as any).assignments ?? null}
            nextLessonSlug={nextLesson?.slug ?? null}
          />
        </main>

        {/* Prev / Next navigation */}
        <nav className="h-12 bg-rd-surface border-t border-rd-border flex items-center justify-between px-4 shrink-0">
          {prevLesson ? (
            <Link
              href={`/learn/${params.slug}/${(prevLesson as any).slug}`}
              className="rd-btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:block truncate max-w-[140px]">{(prevLesson as any).title}</span>
              <span className="sm:hidden">Prev</span>
            </Link>
          ) : <div />}

          {nextLesson ? (
            <Link
              href={`/learn/${params.slug}/${(nextLesson as any).slug}`}
              className="rd-btn text-xs px-3 py-1.5 flex items-center gap-1.5"
            >
              <span className="hidden sm:block truncate max-w-[140px]">{(nextLesson as any).title}</span>
              <span className="sm:hidden">Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <Link
              href={`/courses/${params.slug}`}
              className="rd-btn text-xs px-3 py-1.5"
            >
              ✓ Course complete →
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}
