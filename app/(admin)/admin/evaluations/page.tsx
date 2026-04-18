import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Clock, Star, Loader2, ChevronDown } from "lucide-react";
import { formatDate, timeAgo } from "@/lib/utils";
import GradeForm from "./GradeForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Evaluations" };

export default async function EvaluationsPage({
  searchParams,
}: {
  searchParams: { status?: "pending" | "graded"; submission?: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();

  if (!profile || !["instructor", "moderator"].includes(profile.role)) {
    redirect("/my-courses");
  }

  // Get all submissions for courses this instructor owns
  const filterPending = !searchParams.status || searchParams.status === "pending";

  const { data: submissions } = await supabase
    .from("assignment_submissions")
    .select(`
      id, content, file_url, score, feedback, submitted_at, graded_at,
      student:profiles!student_id(id, full_name, username, avatar_url),
      assignment:assignments(
        id, max_score, instructions,
        lesson:lessons(
          id, title,
          course:courses(id, title, slug, instructor_id)
        )
      )
    `)
    .is(filterPending ? "graded_at" : undefined, filterPending ? null : undefined)
    .not(filterPending ? undefined : "graded_at", filterPending ? undefined : "is", null)
    .order("submitted_at", { ascending: filterPending })
    .limit(50);

  // Filter to only this instructor's courses (unless moderator)
  const mySubmissions = profile.role === "moderator"
    ? (submissions ?? [])
    : (submissions ?? []).filter(
        (s) => (s.assignment as any)?.lesson?.course?.instructor_id === user.id
      );

  const activeSubmission = searchParams.submission
    ? mySubmissions.find((s) => s.id === searchParams.submission)
    : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-semibold text-rd-ink">Evaluations</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/evaluations?status=pending"
            className={`rd-btn-secondary text-xs ${filterPending ? "border-rd-accent text-rd-accent" : ""}`}
          >
            Pending {filterPending && `(${mySubmissions.length})`}
          </Link>
          <Link
            href="/admin/evaluations?status=graded"
            className={`rd-btn-secondary text-xs ${!filterPending ? "border-rd-accent text-rd-accent" : ""}`}
          >
            Graded
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Submission list */}
        <div className="space-y-2">
          {mySubmissions.length === 0 ? (
            <div className="rd-card text-center py-10">
              <CheckCircle className="w-10 h-10 text-rd-success mx-auto mb-3" />
              <p className="text-rd-muted text-sm">All caught up — no pending submissions.</p>
            </div>
          ) : (
            mySubmissions.map((s: any) => {
              const lesson = s.assignment?.lesson;
              const course = lesson?.course;
              const isActive = activeSubmission?.id === s.id;

              return (
                <Link
                  key={s.id}
                  href={`/admin/evaluations?status=${searchParams.status ?? "pending"}&submission=${s.id}`}
                  className={`block rd-card transition-colors ${
                    isActive ? "border-rd-accent bg-rd-accent-lt/20" : "hover:border-rd-accent/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-rd-accent text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {s.student?.full_name?.[0] ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-rd-ink">{s.student?.full_name}</p>
                      <p className="text-xs text-rd-muted truncate">{lesson?.title}</p>
                      <p className="text-xs text-rd-accent truncate">{course?.title}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-rd-muted">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeAgo(s.submitted_at)}
                        </span>
                        {s.score !== null && (
                          <span className="flex items-center gap-1 text-rd-success font-semibold">
                            <Star className="w-3 h-3" />
                            {s.score}/{s.assignment?.max_score}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {/* Grade panel */}
        {activeSubmission ? (
          <div className="rd-card h-fit sticky top-20">
            <GradeForm
              submission={activeSubmission as any}
              graderId={user.id}
            />
          </div>
        ) : (
          <div className="rd-card h-48 flex items-center justify-center text-rd-muted text-sm">
            Select a submission to grade →
          </div>
        )}
      </div>
    </div>
  );
}
