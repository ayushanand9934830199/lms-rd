"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, ArrowRight, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ProgressBar from "@/components/courses/ProgressBar";

interface Props {
  courseId: string;
  courseSlug: string;
  isEnrolled: boolean;
  isLoggedIn: boolean;
  firstLessonSlug?: string;
  lastLessonSlug?: string | null;
  progressPct?: number;
}

export default function EnrollButton({
  courseId,
  courseSlug,
  isEnrolled,
  isLoggedIn,
  firstLessonSlug,
  lastLessonSlug,
  progressPct = 0,
}: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const handleEnroll = async () => {
    if (!isLoggedIn) {
      router.push(`/login?redirect=/courses/${courseSlug}`);
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    await supabase.from("enrollments").upsert({
      student_id: user.id,
      course_id: courseId,
    }, { onConflict: "student_id,course_id" });

    const target = firstLessonSlug
      ? `/learn/${courseSlug}/${firstLessonSlug}`
      : `/learn/${courseSlug}`;

    router.push(target);
    router.refresh();
  };

  if (isEnrolled) {
    const resumeTarget = lastLessonSlug
      ? `/learn/${courseSlug}/${lastLessonSlug}`
      : firstLessonSlug
      ? `/learn/${courseSlug}/${firstLessonSlug}`
      : `/learn/${courseSlug}`;

    return (
      <div className="space-y-3">
        <button
          onClick={() => router.push(resumeTarget)}
          className="rd-btn w-full text-sm"
        >
          <BookOpen className="w-4 h-4" />
          Continue Learning
          <ArrowRight className="w-4 h-4" />
        </button>
        {progressPct > 0 && (
          <div>
            <ProgressBar value={progressPct} showLabel height="default" />
            <p className="text-xs text-rd-muted mt-1">{progressPct}% complete</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={handleEnroll}
      disabled={loading}
      className="rd-btn w-full text-sm"
    >
      {loading ? (
        <><Loader2 className="w-4 h-4 animate-spin" /> Enrolling…</>
      ) : (
        <>Enroll Now — Free <ArrowRight className="w-4 h-4" /></>
      )}
    </button>
  );
}
