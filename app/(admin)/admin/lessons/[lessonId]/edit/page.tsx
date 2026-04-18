import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import LessonEditorClient from "./LessonEditorClient";
import type { Metadata } from "next";

interface Props {
  params: { lessonId: string };
}

export const metadata: Metadata = { title: "Edit Lesson" };

export default async function LessonEditorPage({ params }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: lesson } = await supabase
    .from("lessons")
    .select(`
      *,
      chapter:chapters(id, title, course:courses(id, title, slug, instructor_id)),
      quiz_questions(*),
      assignments(*)
    `)
    .eq("id", params.lessonId)
    .single();

  if (!lesson) notFound();

  const course = (lesson.chapter as any)?.course;

  // Permission check
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "instructor" && course?.instructor_id !== user.id) {
    redirect("/admin/dashboard");
  }

  const sortedQuestions = ((lesson as any).quiz_questions ?? []).sort(
    (a: any, b: any) => a.position - b.position
  );

  return (
    <LessonEditorClient
      lesson={lesson}
      course={course}
      userId={user.id}
      quizQuestions={sortedQuestions}
      assignment={(lesson as any).assignments?.[0] ?? null}
    />
  );
}
