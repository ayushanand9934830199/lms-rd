"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createSlug, slugSuffix } from "@/lib/utils";

export default function NewCoursePage() {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [shortIntro, setShortIntro] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const baseSlug = createSlug(title);
    const slug = `${baseSlug}-${slugSuffix()}`;
    const tagArray = tags.split(",").map((t) => t.trim()).filter(Boolean);

    const { data: course, error: insertError } = await supabase
      .from("courses")
      .insert({
        title,
        slug,
        short_intro: shortIntro || null,
        tags: tagArray,
        instructor_id: user.id,
        status: "draft",
      })
      .select("id")
      .single();

    if (insertError || !course) {
      setError(insertError?.message ?? "Failed to create course.");
      setLoading(false);
      return;
    }

    router.push(`/admin/courses/${course.id}/edit`);
  };

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-3xl font-semibold text-rd-ink mb-2">New Course</h1>
      <p className="text-rd-muted mb-8">Start with the basics — you can add content next.</p>

      <form onSubmit={handleCreate} className="rd-card space-y-5">
        <div>
          <label className="block text-sm font-medium text-rd-ink mb-1.5">
            Course title <span className="text-rd-danger">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Full Stack Development with Next.js"
            className="rd-input"
            maxLength={120}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-rd-ink mb-1.5">
            Short intro
            <span className="text-rd-muted ml-1 text-xs">(max 150 chars)</span>
          </label>
          <input
            type="text"
            value={shortIntro}
            onChange={(e) => setShortIntro(e.target.value)}
            placeholder="One-line hook for your course"
            className="rd-input"
            maxLength={150}
          />
          <p className="text-xs text-rd-muted mt-1">{shortIntro.length}/150</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-rd-ink mb-1.5">
            Tags <span className="text-rd-muted text-xs">(comma-separated)</span>
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="React, TypeScript, Web Dev"
            className="rd-input"
          />
        </div>

        {error && (
          <p className="text-sm text-rd-danger bg-red-50 border border-red-200 rounded-btn px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading || !title.trim()} className="rd-btn">
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
            ) : (
              "Create course →"
            )}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rd-btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
