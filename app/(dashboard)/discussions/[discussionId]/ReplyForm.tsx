"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, SendHorizonal } from "lucide-react";

export default function ReplyForm({
  discussionId,
  userId,
  discussionAuthorId,
  courseId,
}: {
  discussionId: string;
  userId: string;
  discussionAuthorId: string;
  courseId?: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);

    await supabase.from("discussion_replies").insert({
      discussion_id: discussionId,
      author_id: userId,
      content,
    });

    // Notify discussion author (if different from replier)
    if (discussionAuthorId !== userId) {
      await supabase.from("notifications").insert({
        user_id: discussionAuthorId,
        type: "new_reply",
        title: "New reply on your discussion",
        body: content.slice(0, 80),
        link: `/discussions/${discussionId}`,
      });
    }

    setContent("");
    setLoading(false);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        placeholder="Write a helpful reply…"
        className="rd-input resize-y"
        required
      />
      <button type="submit" disabled={loading || !content.trim()} className="rd-btn text-sm">
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Posting…</>
        ) : (
          <><SendHorizonal className="w-4 h-4" /> Post reply</>
        )}
      </button>
    </form>
  );
}
