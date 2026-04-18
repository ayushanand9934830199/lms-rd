import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  PlusCircle,
  Users,
  Eye,
  Pencil,
  BarChart2,
  Archive,
  TrendingUp,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Instructor Dashboard" };

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  // My courses
  const { data: courses } = await supabase
    .from("courses")
    .select(`
      id, title, slug, status, is_published:status,
      cover_image, created_at, published_at,
      chapters(id, lessons(id)),
      enrollments:enrollments(count)
    `)
    .eq("instructor_id", user.id)
    .order("created_at", { ascending: false });

  const totalEnrollments = courses?.reduce((acc, c) => {
    const count = (c.enrollments as any[])[0]?.count ?? 0;
    return acc + count;
  }, 0) ?? 0;

  const published = courses?.filter((c) => c.status === "published").length ?? 0;
  const drafts = courses?.filter((c) => c.status === "draft").length ?? 0;

  // Recent submissions to grade
  const { data: pendingGrades } = await supabase
    .from("assignment_submissions")
    .select(`
      id, submitted_at,
      student:profiles!student_id(full_name),
      assignment:assignments(lesson:lessons(title, courses(instructor_id)))
    `)
    .is("graded_at", null)
    .order("submitted_at", { ascending: false })
    .limit(5);

  const myPending = pendingGrades?.filter(
    (s) =>
      (s.assignment as any)?.lesson?.courses?.instructor_id === user.id
  ) ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-semibold text-rd-ink">
            Dashboard
          </h1>
          <p className="text-rd-muted mt-1">
            Welcome back, {profile?.full_name?.split(" ")[0]}
          </p>
        </div>
        <Link href="/admin/courses/new" className="rd-btn">
          <PlusCircle className="w-4 h-4" /> New Course
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "My Courses", value: courses?.length ?? 0, icon: BookOpen },
          { label: "Published", value: published, icon: Eye },
          { label: "Drafts", value: drafts, icon: Pencil },
          { label: "Total Enrollments", value: totalEnrollments, icon: Users },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rd-card flex items-center gap-4">
            <div className="w-10 h-10 rounded-card bg-rd-accent-lt flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-rd-accent" />
            </div>
            <div>
              <p className="text-2xl font-display font-semibold text-rd-ink">{value}</p>
              <p className="text-xs text-rd-muted">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course list */}
        <div className="lg:col-span-2">
          <div className="rd-card p-0 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-rd-border">
              <h2 className="font-semibold text-rd-ink">My Courses</h2>
              <Link href="/admin/courses" className="text-xs text-rd-accent hover:text-rd-accent-dk">
                View all
              </Link>
            </div>
            {!courses || courses.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-10 h-10 text-rd-border mx-auto mb-3" />
                <p className="text-rd-muted text-sm">No courses yet.</p>
                <Link href="/admin/courses/new" className="rd-btn mt-4 text-sm inline-flex">
                  Create your first course
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-rd-border">
                {courses.slice(0, 8).map((course) => {
                  const lessonCount = (course.chapters as any[]).flatMap((c: any) => c.lessons).length;
                  const enrollCount = (course.enrollments as any[])[0]?.count ?? 0;

                  return (
                    <li key={course.id} className="flex items-center gap-4 px-5 py-3 hover:bg-rd-accent-lt/50 transition-colors">
                      <div className="w-8 h-8 rounded bg-rd-accent-lt flex items-center justify-center shrink-0">
                        <BookOpen className="w-4 h-4 text-rd-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-rd-ink truncate">{course.title}</p>
                        <p className="text-xs text-rd-muted">
                          {lessonCount} lesson{lessonCount !== 1 ? "s" : ""} · {enrollCount} enrolled
                        </p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        course.status === "published"
                          ? "bg-green-50 text-rd-success"
                          : course.status === "archived"
                          ? "bg-gray-100 text-rd-muted"
                          : "bg-rd-accent-lt text-rd-accent"
                      }`}>
                        {course.status}
                      </span>
                      <Link
                        href={`/admin/courses/${course.id}/edit`}
                        className="rd-btn-ghost text-xs"
                      >
                        Edit →
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Pending grades */}
        <div className="rd-card p-0 overflow-hidden h-fit">
          <div className="flex items-center justify-between px-5 py-4 border-b border-rd-border">
            <h2 className="font-semibold text-rd-ink">Pending Grades</h2>
            {myPending.length > 0 && (
              <span className="rd-badge text-[10px]">{myPending.length}</span>
            )}
          </div>
          {myPending.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <TrendingUp className="w-8 h-8 text-rd-border mx-auto mb-2" />
              <p className="text-sm text-rd-muted">All caught up!</p>
            </div>
          ) : (
            <ul className="divide-y divide-rd-border">
              {myPending.map((s) => (
                <li key={s.id} className="px-5 py-3">
                  <p className="text-sm font-medium text-rd-ink truncate">
                    {(s.student as any)?.full_name}
                  </p>
                  <p className="text-xs text-rd-muted truncate">
                    {(s.assignment as any)?.lesson?.title}
                  </p>
                  <Link
                    href={`/admin/evaluations?submission=${s.id}`}
                    className="text-xs text-rd-accent hover:text-rd-accent-dk mt-1 inline-block"
                  >
                    Grade →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
