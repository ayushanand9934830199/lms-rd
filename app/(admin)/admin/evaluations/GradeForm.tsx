"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Star, FileText, Download, CheckCircle } from "lucide-react";

interface Submission {
  id: string;
  content: string | null;
  file_url: string | null;
  score: number | null;
  feedback: string | null;
  submitted_at: string;
  graded_at: string | null;
  student: { id: string; full_name: string; username: string };
  assignment: { id: string; max_score: number; instructions: string | null; lesson: { title: string } };
}

export default function GradeForm({
  submission,
  graderId,
}: {
  submission: Submission;
  graderId: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [score, setScore] = useState<number>(submission.score ?? 0);
  const [feedback, setFeedback] = useState(submission.feedback ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(!!submission.graded_at);

  const maxScore = submission.assignment?.max_score ?? 100;
  const pct = Math.round((score / maxScore) * 100);

  const handleGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    await supabase
      .from("assignment_submissions")
      .update({
        score,
        feedback,
        graded_by: graderId,
        graded_at: new Date().toISOString(),
      })
      .eq("id", submission.id);

    // Notify student
    await supabase.from("notifications").insert({
      user_id: submission.student.id,
      type: "assignment_graded",
      title: `Assignment graded: ${submission.assignment?.lesson?.title}`,
      body: `Score: ${score}/${maxScore}${feedback ? ` — "${feedback.slice(0, 60)}"` : ""}`,
      link: `/my-courses`,
    });

    // Send grade email via API route
    try {
      await fetch("/api/email/assignment-graded", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: submission.student.id,
          lessonTitle: submission.assignment?.lesson?.title,
          score,
          maxScore,
          feedback,
        }),
      });
    } catch (err) {
      console.error("[GradeForm] Email notification failed:", err);
    }

    setSaved(true);
    setSaving(false);
    router.refresh();
  };

  return (
    <div>
      {/* Student + lesson info */}
      <div className="mb-5 pb-5 border-b border-rd-border">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-full bg-rd-accent text-white text-sm font-bold flex items-center justify-center shrink-0">
            {submission.student?.full_name?.[0]}
          </div>
          <div>
            <p className="font-semibold text-rd-ink text-sm">{submission.student?.full_name}</p>
            <p className="text-xs text-rd-muted">{submission.assignment?.lesson?.title}</p>
          </div>
        </div>

        {/* Instructions */}
        {submission.assignment?.instructions && (
          <div className="bg-rd-accent-lt rounded-btn p-3 text-xs text-rd-ink mb-3">
            <p className="font-semibold mb-1 text-rd-muted uppercase tracking-widest text-[10px]">Assignment</p>
            {submission.assignment.instructions.slice(0, 200)}
            {submission.assignment.instructions.length > 200 && "…"}
          </div>
        )}
      </div>

      {/* Student submission */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-rd-muted uppercase tracking-widest mb-2">Submission</p>
        {submission.content && (
          <div className="rd-card bg-gray-50 text-sm text-rd-ink whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
            {submission.content}
          </div>
        )}
        {submission.file_url && (
          <a
            href={submission.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-rd-accent hover:text-rd-accent-dk mt-2"
          >
            <Download className="w-4 h-4" /> Download attachment
          </a>
        )}
        {!submission.content && !submission.file_url && (
          <p className="text-sm text-rd-muted">No submission content.</p>
        )}
      </div>

      {saved ? (
        <div className="flex items-center gap-2 text-sm text-rd-success font-medium py-3">
          <CheckCircle className="w-5 h-5" />
          Graded: {submission.score}/{maxScore}
          {submission.feedback && (
            <span className="text-rd-muted font-normal ml-2 text-xs">"{submission.feedback.slice(0, 40)}"</span>
          )}
        </div>
      ) : (
        <form onSubmit={handleGrade} className="space-y-4">
          {/* Score slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-rd-ink">Score</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={score}
                  onChange={(e) => setScore(Math.min(maxScore, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-16 rd-input text-center text-sm py-1"
                  min={0}
                  max={maxScore}
                />
                <span className="text-rd-muted text-sm">/ {maxScore}</span>
                <span className={`text-xs font-bold ml-1 ${pct >= 70 ? "text-rd-success" : "text-rd-danger"}`}>
                  ({pct}%)
                </span>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={maxScore}
              value={score}
              onChange={(e) => setScore(parseInt(e.target.value))}
              className="w-full accent-rd-accent"
            />
          </div>

          {/* Feedback */}
          <div>
            <label className="block text-sm font-medium text-rd-ink mb-1.5">Feedback</label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              placeholder="Add constructive feedback for the student…"
              className="rd-input resize-none text-sm"
            />
          </div>

          <button type="submit" disabled={saving} className="rd-btn w-full">
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving grade…</>
            ) : (
              <><Star className="w-4 h-4" /> Submit grade</>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
