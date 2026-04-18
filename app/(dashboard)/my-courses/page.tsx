import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CourseCard from "@/components/courses/CourseCard";
import { BookOpen } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Courses" };

export default async function MyCoursesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Enrolled courses with progress
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(`
      id, progress_pct, enrolled_at, completed_at,
      course:courses(
        id, title, slug, cover_image, is_paid, is_featured, price, currency, tags,
        instructor:profiles!instructor_id(id, full_name, avatar_url),
        chapters(id, lessons(id, duration_sec))
      )
    `)
    .eq("student_id", user.id)
    .order("enrolled_at", { ascending: false });

  // Bookmarks
  const { data: bookmarks } = await supabase
    .from("course_bookmarks")
    .select(`
      course:courses(
        id, title, slug, cover_image, is_paid, is_featured, price, currency, tags,
        instructor:profiles!instructor_id(id, full_name, avatar_url),
        chapters(id, lessons(id, duration_sec))
      )
    `)
    .eq("student_id", user.id);

  const inProgress = enrollments?.filter(
    (e) => !e.completed_at && e.progress_pct < 100
  ) ?? [];
  const completed = enrollments?.filter(
    (e) => e.completed_at || e.progress_pct >= 100
  ) ?? [];
  const bookmarked = bookmarks?.map((b) => b.course).filter(Boolean) ?? [];

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-rd-ink mb-6">My Courses</h1>

      {/* Tabs */}
      <Tabs
        inProgress={inProgress}
        completed={completed}
        bookmarked={bookmarked}
      />
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────
// Note: Making this a separate client component would be cleaner,
// but for simplicity we render all tab contents and use CSS to show/hide.
// A real implementation would use shadcn Tabs component.

import TabsClient from "./TabsClient";

function Tabs({ inProgress, completed, bookmarked }: {
  inProgress: any[];
  completed: any[];
  bookmarked: any[];
}) {
  return (
    <TabsClient
      inProgress={inProgress}
      completed={completed}
      bookmarked={bookmarked}
    />
  );
}
