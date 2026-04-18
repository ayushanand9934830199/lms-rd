import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { timeAgo } from "@/lib/utils";
import Link from "next/link";
import { ChevronLeft, CheckCircle, Pin } from "lucide-react";
import ReplyForm from "./ReplyForm";
import type { Metadata } from "next";

interface Props { params: { discussionId: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createClient();
  const { data } = await supabase.from("discussions").select("title").eq("id", params.discussionId).single();
  return { title: data?.title ?? "Discussion" };
}

export default async function DiscussionDetailPage({ params }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: discussion } = await supabase
    .from("discussions")
    .select(`
      *,
      author:profiles!author_id(id, full_name, username, avatar_url, role),
      course:courses(id, title, slug),
      lesson:lessons(id, title, slug),
      replies:discussion_replies(
        id, content, is_solution, created_at,
        author:profiles!author_id(id, full_name, username, avatar_url, role)
      )
    `)
    .eq("id", params.discussionId)
    .single();

  if (!discussion) notFound();

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isMod = profile?.role === "moderator";
  const isAuthor = discussion.author_id === user.id;

  const replies = ((discussion as any).replies ?? []).sort(
    (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <div className="max-w-2xl">
      {/* Back */}
      <Link href="/discussions" className="text-xs text-rd-muted hover:text-rd-ink mb-4 inline-flex items-center gap-1">
        <ChevronLeft className="w-3.5 h-3.5" /> All discussions
      </Link>

      {/* Main thread */}
      <div className="rd-card mb-6">
        <div className="flex items-start gap-3 mb-4">
          <Avatar name={(discussion as any).author?.full_name} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {(discussion as any).is_pinned && (
                <span className="flex items-center gap-0.5 text-[10px] font-bold text-rd-accent uppercase">
                  <Pin className="w-2.5 h-2.5" /> Pinned
                </span>
              )}
              <h1 className="font-display text-xl font-semibold text-rd-ink leading-snug">
                {discussion.title}
              </h1>
            </div>
            <div className="flex items-center gap-2 text-xs text-rd-muted mt-0.5 flex-wrap">
              <span className="font-medium text-rd-ink">{(discussion as any).author?.full_name}</span>
              {(discussion as any).course && (
                <>
                  <span>·</span>
                  <Link href={`/courses/${(discussion as any).course.slug}`} className="hover:text-rd-accent">
                    {(discussion as any).course.title}
                  </Link>
                </>
              )}
              <span>·</span>
              <span>{timeAgo(discussion.created_at)}</span>
            </div>
          </div>
        </div>
        <p className="text-rd-ink leading-relaxed whitespace-pre-wrap text-sm">
          {discussion.content}
        </p>
      </div>

      {/* Replies */}
      <div className="space-y-3 mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-rd-muted">
          {replies.length} {replies.length === 1 ? "Reply" : "Replies"}
        </p>
        {replies.map((reply: any) => (
          <ReplyCard
            key={reply.id}
            reply={reply}
            isMod={isMod}
            currentUserId={user.id}
            discussionId={discussion.id}
          />
        ))}
      </div>

      {/* Reply form */}
      <div className="rd-card">
        <h3 className="font-semibold text-rd-ink mb-4 text-sm">Add a reply</h3>
        <ReplyForm
          discussionId={discussion.id}
          userId={user.id}
          discussionAuthorId={discussion.author_id}
          courseId={(discussion as any).course?.id}
        />
      </div>
    </div>
  );
}

function Avatar({ name }: { name?: string }) {
  return (
    <div className="w-8 h-8 rounded-full bg-rd-accent text-white text-xs font-bold flex items-center justify-center shrink-0">
      {name?.[0] ?? "?"}
    </div>
  );
}

function ReplyCard({
  reply,
  isMod,
  currentUserId,
  discussionId,
}: {
  reply: any;
  isMod: boolean;
  currentUserId: string;
  discussionId: string;
}) {
  return (
    <div className={`rd-card ${reply.is_solution ? "border-rd-success bg-green-50" : ""}`}>
      <div className="flex items-start gap-3">
        <Avatar name={reply.author?.full_name} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-rd-ink">{reply.author?.full_name}</span>
            {reply.author?.role !== "student" && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rd-accent-lt text-rd-accent uppercase tracking-wide">
                {reply.author?.role}
              </span>
            )}
            {reply.is_solution && (
              <span className="flex items-center gap-0.5 text-[10px] font-bold text-rd-success uppercase">
                <CheckCircle className="w-2.5 h-2.5" /> Solution
              </span>
            )}
            <span className="text-xs text-rd-muted ml-auto">{timeAgo(reply.created_at)}</span>
          </div>
          <p className="text-sm text-rd-ink leading-relaxed whitespace-pre-wrap">{reply.content}</p>
        </div>
      </div>
    </div>
  );
}
