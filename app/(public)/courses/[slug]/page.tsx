import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, formatDuration } from "@/lib/utils";
import { BookOpen, Clock, Award, ChevronRight, Play } from "lucide-react";
import ChapterAccordion from "@/components/courses/ChapterAccordion";
import EnrollButton from "./EnrollButton";
import type { Metadata } from "next";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select("title, short_intro")
    .eq("slug", params.slug)
    .single();

  return {
    title: course?.title ?? "Course",
    description: course?.short_intro ?? undefined,
  };
}

export default async function CourseDetailPage({ params }: Props) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Full course with chapters + lessons
  const { data: course } = await supabase
    .from("courses")
    .select(`
      *,
      instructor:profiles!instructor_id(id, full_name, username, avatar_url, headline, bio),
      chapters(
        id, title, position,
        lessons(id, title, slug, lesson_type, duration_sec, position, is_preview)
      )
    `)
    .eq("slug", params.slug)
    .eq("status", "published")
    .single();

  if (!course) notFound();

  // Check enrollment
  let enrollment = null;
  let lastLesson = null;
  if (user) {
    const { data: enr } = await supabase
      .from("enrollments")
      .select("id, progress_pct")
      .eq("student_id", user.id)
      .eq("course_id", course.id)
      .single();
    enrollment = enr;

    if (enr) {
      // Find last completed lesson to resume
      const { data: lastProgress } = await supabase
        .from("lesson_progress")
        .select("lesson_id, lessons(slug, course_id, chapters(course_id))")
        .eq("student_id", user.id)
        .eq("course_id", course.id)
        .eq("completed", true)
        .order("completed_at", { ascending: false })
        .limit(1)
        .single();
      lastLesson = (lastProgress?.lessons as any)?.slug ?? null;
    }
  }

  const instructor = (course as any).instructor;
  const chapters = ((course as any).chapters ?? []).sort(
    (a: any, b: any) => a.position - b.position
  );

  const allLessons = chapters.flatMap((c: any) =>
    (c.lessons ?? []).sort((a: any, b: any) => a.position - b.position)
  );
  const totalLessons = allLessons.length;
  const totalSec = allLessons.reduce(
    (acc: number, l: any) => acc + (l.duration_sec ?? 0), 0
  );
  const chapterCount = chapters.length;

  const isEnrolled = !!enrollment;
  const firstLessonSlug = allLessons[0]?.slug;

  return (
    <div className="min-h-screen bg-rd-paper">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-rd-paper/80 backdrop-blur-sm border-b border-rd-border">
        <div className="max-w-content mx-auto px-6 h-14 flex items-center gap-3">
          <Link href="/" className="text-rd-muted hover:text-rd-ink text-sm transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-rd-border" />
          <Link href="/courses" className="text-rd-muted hover:text-rd-ink text-sm transition-colors">Courses</Link>
          <ChevronRight className="w-3.5 h-3.5 text-rd-border" />
          <span className="text-rd-ink text-sm font-medium truncate">{course.title}</span>
        </div>
      </nav>

      <div className="max-w-content mx-auto px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-10">

          {/* ── Left column ─── */}
          <div className="flex-1 min-w-0">
            {/* Tags */}
            {course.tags && course.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {course.tags.map((tag: string) => (
                  <span key={tag} className="rd-tag">{tag}</span>
                ))}
              </div>
            )}

            {/* Title */}
            <h1 className="font-display text-4xl font-semibold text-rd-ink leading-tight mb-4">
              {course.title}
            </h1>

            {/* Short intro */}
            {course.short_intro && (
              <p className="text-rd-muted text-lg leading-relaxed mb-6">
                {course.short_intro}
              </p>
            )}

            {/* Instructor */}
            {instructor && (
              <div className="flex items-center gap-3 mb-8 p-4 rd-card">
                <div className="w-10 h-10 rounded-full bg-rd-accent text-white font-bold text-sm flex items-center justify-center overflow-hidden shrink-0">
                  {instructor.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={instructor.avatar_url} alt={instructor.full_name} className="w-full h-full object-cover" />
                  ) : (
                    instructor.full_name[0]
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-rd-ink">{instructor.full_name}</p>
                  {instructor.headline && (
                    <p className="text-xs text-rd-muted truncate">{instructor.headline}</p>
                  )}
                </div>
                <Link
                  href={`/profile/${instructor.username}`}
                  className="rd-btn-ghost text-xs"
                >
                  View profile →
                </Link>
              </div>
            )}

            {/* Full description */}
            {course.description && (
              <div className="prose-sm text-rd-ink leading-relaxed mb-8 whitespace-pre-wrap">
                {course.description}
              </div>
            )}

            {/* Chapter accordion */}
            {chapters.length > 0 && (
              <div>
                <h2 className="font-display text-2xl font-semibold text-rd-ink mb-4">
                  Course content
                </h2>
                <p className="text-sm text-rd-muted mb-4">
                  {chapterCount} chapter{chapterCount !== 1 ? "s" : ""} ·{" "}
                  {totalLessons} lesson{totalLessons !== 1 ? "s" : ""} ·{" "}
                  {formatDuration(totalSec)} total
                </p>
                <ChapterAccordion
                  chapters={chapters}
                  isEnrolled={isEnrolled}
                  courseSlug={course.slug}
                />
              </div>
            )}
          </div>

          {/* ── Right column (sticky) ─── */}
          <div className="w-full lg:w-80 xl:w-96 shrink-0">
            <div className="sticky top-20">
              <div className="rd-card overflow-hidden p-0">
                {/* Cover / Preview */}
                <div className="relative aspect-video bg-rd-accent-lt">
                  {course.cover_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={course.cover_image}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BookOpen className="w-16 h-16 text-rd-accent/20" />
                    </div>
                  )}
                  {course.preview_video && (
                    <a
                      href={course.preview_video}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors group"
                    >
                      <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play className="w-6 h-6 text-rd-accent ml-0.5" fill="currentColor" />
                      </div>
                    </a>
                  )}
                </div>

                <div className="p-5">
                  {/* Price */}
                  <div className="mb-4">
                    <span className="font-display text-3xl font-semibold text-rd-ink">
                      {course.is_paid ? formatPrice(course.price, course.currency) : "Free"}
                    </span>
                  </div>

                  {/* Enroll / Resume CTA */}
                  <EnrollButton
                    courseId={course.id}
                    courseSlug={course.slug}
                    isEnrolled={isEnrolled}
                    isLoggedIn={!!user}
                    firstLessonSlug={firstLessonSlug}
                    lastLessonSlug={lastLesson}
                    progressPct={enrollment?.progress_pct}
                  />

                  {/* Course stats */}
                  <div className="mt-5 pt-5 border-t border-rd-border space-y-2.5">
                    <div className="flex items-center gap-2 text-sm text-rd-muted">
                      <BookOpen className="w-4 h-4 shrink-0 text-rd-accent" />
                      <span>{chapterCount} chapters · {totalLessons} lessons</span>
                    </div>
                    {totalSec > 0 && (
                      <div className="flex items-center gap-2 text-sm text-rd-muted">
                        <Clock className="w-4 h-4 shrink-0 text-rd-accent" />
                        <span>{formatDuration(totalSec)} of content</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-rd-muted">
                      <Award className="w-4 h-4 shrink-0 text-rd-accent" />
                      <span>Certificate on completion</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
