"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function NewDiscussionPage() {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: discussion } = await supabase
      .from("discussions")
      .insert({ title, content, author_id: user.id })
      .select("id")
      .single();

    if (discussion) router.push(`/discussions/${discussion.id}`);
    setLoading(false);
  };

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-3xl font-semibold text-rd-ink mb-8">New Discussion</h1>

      <form onSubmit={handleSubmit} className="rd-card space-y-5">
        <div>
          <label className="block text-sm font-medium text-rd-ink mb-1.5">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What do you want to discuss?"
            className="rd-input"
            required
            maxLength={200}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-rd-ink mb-1.5">Your question or thought</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            placeholder="Be specific and concise…"
            className="rd-input resize-y"
            required
          />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={loading || !title.trim() || !content.trim()} className="rd-btn">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Posting…</> : "Post discussion"}
          </button>
          <button type="button" onClick={() => router.back()} className="rd-btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  );
}
