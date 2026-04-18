"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { QUIZ_PASS_THRESHOLD } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, Loader2, RotateCcw, ArrowRight } from "lucide-react";

interface QuizQuestion {
  id: string;
  question: string;
  options: { id: string; text: string }[];
  correct_opt: string;
  explanation: string | null;
  position: number;
}

interface Props {
  questions: QuizQuestion[];
  lessonId: string;
  courseId: string;
  userId: string;
  completed: boolean;
  onComplete: () => void;
  nextLessonSlug: string | null;
  courseSlug: string;
}

type QuizState = "unanswered" | "submitted" | "reviewing";

export default function QuizLesson({
  questions,
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

  const sorted = [...questions].sort((a, b) => a.position - b.position);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [state, setState] = useState<QuizState>("unanswered");
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelect = (questionId: string, optionId: string) => {
    if (state !== "unanswered") return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < sorted.length) {
      alert("Please answer all questions before submitting.");
      return;
    }

    setLoading(true);

    // Calculate score
    const correct = sorted.filter((q) => answers[q.id] === q.correct_opt).length;
    const pct = Math.round((correct / sorted.length) * 100);
    const passed = pct >= QUIZ_PASS_THRESHOLD;

    await supabase.from("quiz_attempts").insert({
      student_id: userId,
      lesson_id: lessonId,
      answers,
      score: pct,
      passed,
    });

    if (passed) {
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
    }

    setScore(pct);
    setState("submitted");
    setLoading(false);
  };

  const handleReset = () => {
    setAnswers({});
    setState("unanswered");
    setScore(null);
  };

  if (sorted.length === 0) {
    return (
      <div className="rd-card text-center py-12 text-rd-muted">
        No questions in this quiz yet.
      </div>
    );
  }

  const passed = score !== null && score >= QUIZ_PASS_THRESHOLD;

  return (
    <div className="space-y-6">
      {/* Score banner */}
      {state === "submitted" && score !== null && (
        <div
          className={cn(
            "rd-card flex items-center justify-between",
            passed ? "border-rd-success bg-green-50" : "border-rd-danger bg-red-50"
          )}
        >
          <div className="flex items-center gap-3">
            {passed ? (
              <CheckCircle className="w-8 h-8 text-rd-success" />
            ) : (
              <XCircle className="w-8 h-8 text-rd-danger" />
            )}
            <div>
              <p className="font-semibold text-rd-ink">
                {passed ? "Passed! 🎉" : `Score: ${score}% — Need ${QUIZ_PASS_THRESHOLD}% to pass`}
              </p>
              <p className="text-sm text-rd-muted">
                {sorted.filter((q) => answers[q.id] === q.correct_opt).length} / {sorted.length} correct
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!passed && (
              <button onClick={handleReset} className="rd-btn-secondary text-sm">
                <RotateCcw className="w-3.5 h-3.5" /> Retry
              </button>
            )}
            {passed && nextLessonSlug && (
              <button
                onClick={() => router.push(`/learn/${courseSlug}/${nextLessonSlug}`)}
                className="rd-btn text-sm"
              >
                Next <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Questions */}
      {sorted.map((q, qi) => {
        const selected = answers[q.id];
        const isCorrect = selected === q.correct_opt;
        const showResult = state === "submitted";

        return (
          <div key={q.id} className="rd-card">
            <p className="text-sm font-semibold text-rd-ink mb-4">
              <span className="text-rd-muted mr-2">Q{qi + 1}.</span>
              {q.question}
            </p>

            <div className="space-y-2">
              {q.options.map((opt) => {
                const isSelected = selected === opt.id;
                const isCorrectOpt = opt.id === q.correct_opt;

                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelect(q.id, opt.id)}
                    disabled={showResult}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-btn border text-sm transition-all",
                      !showResult && !isSelected && "border-rd-border hover:border-rd-accent hover:bg-rd-accent-lt",
                      !showResult && isSelected && "border-rd-accent bg-rd-accent-lt",
                      showResult && isCorrectOpt && "border-rd-success bg-green-50 text-rd-success font-medium",
                      showResult && isSelected && !isCorrectOpt && "border-rd-danger bg-red-50 text-rd-danger",
                      showResult && !isSelected && !isCorrectOpt && "border-rd-border opacity-60",
                    )}
                  >
                    <span className="font-mono text-xs text-rd-muted mr-3">
                      {opt.id.toUpperCase()}.
                    </span>
                    {opt.text}
                  </button>
                );
              })}
            </div>

            {/* Explanation */}
            {showResult && q.explanation && (
              <div className="mt-3 p-3 bg-rd-accent-lt rounded-btn text-sm text-rd-ink border border-rd-accent/20">
                <span className="font-semibold">Explanation: </span>
                {q.explanation}
              </div>
            )}
          </div>
        );
      })}

      {/* Submit */}
      {state === "unanswered" && (
        <button onClick={handleSubmit} disabled={loading} className="rd-btn">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : "Submit answers"}
        </button>
      )}
    </div>
  );
}
