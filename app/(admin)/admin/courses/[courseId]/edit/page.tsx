import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import CourseEditorClient from "./CourseEditorClient";
import type { Metadata } from "next";

interface Props {
  params: { courseId: string };
}

export const metadata: Metadata = { title: "Edit Course" };

export default async function CourseEditorPage({ params }: Props) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role;
  if (!role || !["instructor", "moderator"].includes(role)) {
    redirect("/courses");
  }

  const { data: course } = await supabase
    .from("courses")
    .select(`
      *,
      chapters(
        id, title, position,
        lessons(id, title, slug, lesson_type, duration_sec, position, is_preview)
      )
    `)
    .eq("id", params.courseId)
    .single();

  if (!course) notFound();

  // Instructors can only edit their own courses — Behavioral Rule #8
  if (role === "instructor" && course.instructor_id !== user.id) {
    redirect("/admin/dashboard");
  }

  const sortedChapters = ((course as any).chapters ?? [])
    .sort((a: any, b: any) => a.position - b.position)
    .map((c: any) => ({
      ...c,
      lessons: (c.lessons ?? []).sort((a: any, b: any) => a.position - b.position),
    }));

  return (
    <CourseEditorClient
      course={{ ...course, chapters: sortedChapters }}
      userId={user.id}
    />
  );
}
