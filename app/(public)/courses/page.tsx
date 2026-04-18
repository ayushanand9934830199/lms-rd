import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import CourseCatalogueClient from "./CourseCatalogueClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Courses",
  description: "Browse all courses on Restless Dreamers. Filter by tag, type, and more.",
};

export default async function CoursesPage() {
  const supabase = await createClient();

  // Fetch all published courses with instructor + lesson counts
  const { data: courses } = await supabase
    .from("courses")
    .select(`
      *,
      instructor:profiles!instructor_id(id, full_name, username, avatar_url),
      chapters(id, lessons(id, duration_sec))
    `)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  // Collect all unique tags for filter panel
  const tagSet = new Set<string>();
  courses?.forEach((c) => c.tags?.forEach((t: string) => tagSet.add(t)));
  const allTags = Array.from(tagSet).sort();

  return (
    <Suspense>
      <CourseCatalogueClient
        courses={courses ?? []}
        allTags={allTags}
      />
    </Suspense>
  );
}
