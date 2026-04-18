import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MessageSquare, Plus } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Discussions" };

export default async function DiscussionsPage({
  searchParams,
}: {
  searchParams: { course?: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let query = supabase
    .from("discussions")
    .select(`
      id, title, content, is_pinned, created_at,
      author:profiles!author_id(id, full_name, username, avatar_url),
      course:courses(id, title, slug),
      replies:discussion_replies(count)
    `)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);

  if (searchParams.course) {
    query = query.eq("course_id", searchParams.course);
  }

  const { data: discussions } = await query;

  // All enrolled courses for filter dropdown
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("course:courses(id, title)")
    .eq("student_id", user.id);

  const enrolledCourses = enrollments?.map((e) => e.course).filter(Boolean) ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-semibold text-rd-ink">Discussions</h1>
        <Link href="/discussions/new" className="rd-btn">
          <Plus className="w-4 h-4" /> New Discussion
        </Link>
      </div>

      {/* Course filter */}
      {enrolledCourses.length > 0 && (
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <Link
            href="/discussions"
            className={`rd-tag cursor-pointer ${!searchParams.course ? "bg-rd-accent text-white border-rd-accent" : ""}`}
          >
            All
          </Link>
          {enrolledCourses.map((c: any) => (
            <Link
              key={c.id}
              href={`/discussions?course=${c.id}`}
              className={`rd-tag cursor-pointer transition-all ${
                searchParams.course === c.id
                  ? "bg-rd-accent text-white border-rd-accent"
                  : "hover:bg-rd-accent-lt"
              }`}
            >
              {c.title}
            </Link>
          ))}
        </div>
      )}

      {/* Discussion list */}
      {!discussions || discussions.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare className="w-12 h-12 text-rd-border mx-auto mb-3" />
          <p className="text-rd-muted">No discussions yet.</p>
          <Link href="/discussions/new" className="rd-btn mt-4">
            Start one →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {discussions.map((d: any) => {
            const replyCount = d.replies?.[0]?.count ?? 0;
            const author = d.author;

            return (
              <Link
                key={d.id}
                href={`/discussions/${d.id}`}
                className="block rd-card hover:border-rd-accent transition-colors group"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-rd-accent text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {author?.full_name?.[0] ?? "?"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {d.is_pinned && (
                        <span className="text-[10px] font-bold text-rd-accent bg-rd-accent-lt px-1.5 py-0.5 rounded uppercase tracking-wider">
                          Pinned
                        </span>
                      )}
                      <h3 className="text-sm font-semibold text-rd-ink group-hover:text-rd-accent transition-colors truncate">
                        {d.title}
                      </h3>
                    </div>
                    <p className="text-xs text-rd-muted line-clamp-1 mb-2">{d.content}</p>
                    <div className="flex items-center gap-3 text-xs text-rd-muted">
                      <span>{author?.full_name}</span>
                      {d.course && (
                        <>
                          <span>·</span>
                          <span>{d.course.title}</span>
                        </>
                      )}
                      <span>·</span>
                      <span>{timeAgo(d.created_at)}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {replyCount}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
