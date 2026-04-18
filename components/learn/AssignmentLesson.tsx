"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Upload, CheckCircle, FileText, ArrowRight } from "lucide-react";
import { STORAGE_BUCKETS } from "@/lib/constants";

interface Assignment {
  id: string;
  lesson_id: string;
  instructions: string | null;
  max_score: number;
}

interface Props {
  assignment: Assignment;
  lessonId: string;
  courseId: string;
  userId: string;
  completed: boolean;
  onComplete: () => void;
  nextLessonSlug: string | null;
  courseSlug: string;
}

export default function AssignmentLesson({
  assignment,
  lessonId,
  courseId,
  userId,
  completed,
  onComplete,
  nextLessonSlug,
  courseSlug,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(completed);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !file) return;

    setLoading(true);

    let fileUrl: string | null = null;

    // Upload file if provided
    if (file) {
      const path = `${userId}/${assignment.id}/${file.name}`;
      const { data: uploadData } = await supabase.storage
        .from(STORAGE_BUCKETS.SUBMISSIONS)
        .upload(path, file, { upsert: true });
      if (uploadData?.path) {
        const { data: { publicUrl } } = supabase.storage
          .from(STORAGE_BUCKETS.SUBMISSIONS)
          .getPublicUrl(uploadData.path);
        fileUrl = publicUrl;
      }
    }

    // Upsert submission
    await supabase.from("assignment_submissions").upsert(
      {
        assignment_id: assignment.id,
        student_id: userId,
        content: content || null,
        file_url: fileUrl,
      },
      { onConflict: "assignment_id,student_id" }
    );

    // Mark lesson complete on submission
    await supabase.from("lesson_progress").upsert(
      {
        student_id: userId,
        lesson_id: lessonId,
        course_id: courseId,
        completed: true,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "student_id,lesson_id" }
    );

    onComplete();
    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="rd-card text-center py-10">
        <CheckCircle className="w-12 h-12 text-rd-success mx-auto mb-3" />
        <h3 className="font-display text-xl font-semibold text-rd-ink mb-2">
          Assignment submitted!
        </h3>
        <p className="text-rd-muted text-sm mb-6">
          Your instructor will review and grade your submission.
        </p>
        {nextLessonSlug && (
          <button
            onClick={() => router.push(`/learn/${courseSlug}/${nextLessonSlug}`)}
            className="rd-btn"
          >
            Next lesson <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Instructions */}
      {assignment.instructions && (
        <div className="rd-card mb-6">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-rd-accent" />
            <h3 className="font-semibold text-rd-ink text-sm">Instructions</h3>
          </div>
          <div className="text-sm text-rd-ink leading-relaxed whitespace-pre-wrap">
            {assignment.instructions}
          </div>
          <p className="text-xs text-rd-muted mt-3">
            Max score: {assignment.max_score} points
          </p>
        </div>
      )}

      {/* Submission form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-rd-ink mb-1.5">
            Your answer / work
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            placeholder="Write your answer here…"
            className="rd-input resize-y font-mono text-sm"
          />
        </div>

        {/* File upload */}
        <div>
          <label className="block text-sm font-medium text-rd-ink mb-1.5">
            Attach file <span className="text-rd-muted">(optional)</span>
          </label>
          <label className="flex items-center gap-2 rd-btn-secondary cursor-pointer w-fit">
            <Upload className="w-4 h-4" />
            {file ? file.name : "Choose file"}
            <input
              type="file"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={loading || (!content.trim() && !file)}
          className="rd-btn"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
          ) : (
            "Submit assignment"
          )}
        </button>
      </form>
    </div>
  );
}
