import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, Calendar, Clock, MapPin } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Batches" };

export default async function BatchesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Batches the student is enrolled in
  const { data: myBatches } = await supabase
    .from("batch_students")
    .select(`
      joined_at,
      batch:batches(
        id, title, description, status, start_date, end_date, seat_count, max_students,
        course:courses(id, title, slug),
        live_sessions(id, title, scheduled_at, duration_min, meet_url)
      )
    `)
    .eq("student_id", user.id)
    .order("joined_at", { ascending: false });

  const batches = myBatches?.map((b) => b.batch).filter(Boolean) ?? [];

  // All open batches the student hasn't joined
  const joinedIds = new Set(batches.map((b: any) => b.id));
  const { data: openBatches } = await supabase
    .from("batches")
    .select(`
      id, title, description, status, start_date, end_date, seat_count, max_students,
      course:courses(id, title, slug)
    `)
    .eq("status", "upcoming")
    .order("start_date", { ascending: true });

  const availableBatches = (openBatches ?? []).filter((b) => !joinedIds.has(b.id));

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-rd-ink mb-8">Batches</h1>

      {/* My Batches */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-rd-muted mb-4">
          Enrolled ({batches.length})
        </h2>
        {batches.length === 0 ? (
          <div className="rd-card text-center py-8 text-rd-muted text-sm">
            You haven't joined any batches yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {batches.map((batch: any) => (
              <BatchCard key={batch.id} batch={batch} enrolled />
            ))}
          </div>
        )}
      </section>

      {/* Available */}
      {availableBatches.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-rd-muted mb-4">
            Available to Join
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableBatches.map((batch: any) => (
              <BatchCard key={batch.id} batch={batch} enrolled={false} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function BatchCard({ batch, enrolled }: { batch: any; enrolled: boolean }) {
  const upcomingSessions = (batch.live_sessions ?? [])
    .filter((s: any) => new Date(s.scheduled_at) > new Date())
    .sort((a: any, b: any) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    .slice(0, 2);

  const statusColors: Record<string, string> = {
    upcoming: "bg-rd-accent-lt text-rd-accent",
    active: "bg-green-50 text-rd-success",
    completed: "bg-gray-100 text-rd-muted",
  };

  return (
    <div className="rd-card flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-rd-ink truncate">{batch.title}</h3>
          {batch.course && (
            <Link href={`/courses/${batch.course.slug}`} className="text-xs text-rd-accent hover:text-rd-accent-dk">
              {batch.course.title}
            </Link>
          )}
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${statusColors[batch.status]}`}>
          {batch.status}
        </span>
      </div>

      {batch.description && (
        <p className="text-sm text-rd-muted line-clamp-2 mb-3">{batch.description}</p>
      )}

      {/* Dates */}
      <div className="flex items-center gap-4 text-xs text-rd-muted mb-3">
        {batch.start_date && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(batch.start_date)} {batch.end_date && `→ ${formatDate(batch.end_date)}`}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {batch.seat_count}{batch.max_students ? `/${batch.max_students}` : ""} students
        </span>
      </div>

      {/* Upcoming sessions */}
      {upcomingSessions.length > 0 && (
        <div className="border-t border-rd-border pt-3 mb-3">
          <p className="text-xs font-semibold text-rd-ink mb-1.5">Upcoming sessions</p>
          {upcomingSessions.map((s: any) => (
            <div key={s.id} className="flex items-center justify-between text-xs text-rd-muted py-1">
              <span className="font-medium text-rd-ink truncate flex-1">{s.title}</span>
              <span className="flex items-center gap-1 ml-2">
                <Clock className="w-3 h-3" />
                {formatDate(s.scheduled_at)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="mt-auto pt-2">
        {enrolled ? (
          <Link
            href={`/batches/${batch.id}`}
            className="rd-btn-secondary w-full text-center text-sm"
          >
            View Batch →
          </Link>
        ) : (
          <Link
            href={`/batches/${batch.id}`}
            className="rd-btn w-full text-center text-sm"
          >
            Join Batch →
          </Link>
        )}
      </div>
    </div>
  );
}
