"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle, Loader2, ArrowRight, Award } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  lessonId: string;
  courseId: string;
  userId: string;
  completed: boolean;
  onComplete: () => void;
  nextLessonSlug: string | null;
  courseSlug: string;
}

export default function MarkCompleteButton({
  lessonId,
  courseId,
  userId,
  completed,
  onComplete,
  nextLessonSlug,
  courseSlug,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [certIssued, setCertIssued] = useState(false);
  const supabase = createClient();

  const handleComplete = async () => {
    if (completed) {
      if (nextLessonSlug) router.push(`/learn/${courseSlug}/${nextLessonSlug}`);
      else router.push(`/courses/${courseSlug}`);
      return;
    }

    setLoading(true);
    // Atomic upsert — Behavioral Rule #1
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

    // Check if course is now 100% complete and issue certificate — Behavioral Rule #2
    // We call the server-side API route to avoid exposing service role key on client
    if (!nextLessonSlug) {
      try {
        const res = await fetch("/api/certificates/issue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courseId, userId }),
        });
        const data = await res.json();
        if (data.issued) setCertIssued(true);
      } catch (err) {
        console.error("[MarkComplete] Certificate check failed:", err);
      }
    }

    setLoading(false);

    if (nextLessonSlug) {
      router.push(`/learn/${courseSlug}/${nextLessonSlug}`);
    } else {
      router.push(`/courses/${courseSlug}`);
    }
  };

  return (
    <div className="mt-10 pt-6 border-t border-rd-border space-y-4">
      {/* Certificate issued banner */}
      {certIssued && (
        <div className="flex items-center gap-3 p-4 bg-rd-accent-lt border border-rd-accent/30 rounded-card animate-fade-in">
          <Award className="w-8 h-8 text-rd-accent shrink-0" />
          <div>
            <p className="font-semibold text-rd-ink text-sm">🎓 Certificate Issued!</p>
            <p className="text-xs text-rd-muted">Check <a href="/certificates" className="text-rd-accent underline">My Certificates</a> to download your PDF.</p>
          </div>
        </div>
      )}
      <button
        onClick={handleComplete}
        disabled={loading}
        className="rd-btn w-full sm:w-auto"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
        ) : completed ? (
          <><CheckCircle className="w-4 h-4" /> {nextLessonSlug ? "Next lesson" : "Back to course"} <ArrowRight className="w-4 h-4" /></>
        ) : (
          <><CheckCircle className="w-4 h-4" /> Mark complete {nextLessonSlug && <><span className="mx-1">·</span> Next lesson</>} <ArrowRight className="w-4 h-4" /></>
        )}
      </button>
    </div>
  );
}
