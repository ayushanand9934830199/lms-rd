"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { VIDEO_COMPLETE_PCT } from "@/lib/constants";
import { formatDuration } from "@/lib/utils";
import { CheckCircle } from "lucide-react";

interface Props {
  videoUrl: string | null;
  durationSec: number | null;
  lessonId: string;
  courseId: string;
  userId: string;
  completed: boolean;
  onComplete: () => void;
  nextLessonSlug: string | null;
  courseSlug: string;
}

export default function VideoLesson({
  videoUrl,
  durationSec,
  lessonId,
  courseId,
  userId,
  completed,
  onComplete,
  nextLessonSlug,
  courseSlug,
}: Props) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fired, setFired] = useState(completed); // only fire completion event once
  const supabase = createClient();

  useEffect(() => {
    const video = videoRef.current;
    if (!video || fired) return;

    const handleTimeUpdate = async () => {
      const pct = (video.currentTime / video.duration) * 100;
      // Behavioral Rule #5: complete at VIDEO_COMPLETE_PCT, fire once, not on seek
      if (pct >= VIDEO_COMPLETE_PCT && !fired) {
        setFired(true);
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
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, [fired, lessonId, courseId, userId, supabase, onComplete]);

  if (!videoUrl) {
    return (
      <div className="rd-card text-center py-12 text-rd-muted">
        No video uploaded yet.
      </div>
    );
  }

  return (
    <div>
      {/* Player */}
      <div className="rounded-card overflow-hidden bg-black aspect-video mb-4">
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          className="w-full h-full"
          playsInline
          preload="metadata"
        />
      </div>

      {/* Meta */}
      <div className="flex items-center justify-between text-sm text-rd-muted mb-6">
        {durationSec && <span>{formatDuration(durationSec)}</span>}
        {(completed || fired) && (
          <div className="flex items-center gap-1.5 text-rd-success font-medium">
            <CheckCircle className="w-4 h-4" />
            Completed
            {nextLessonSlug && (
              <button
                onClick={() => router.push(`/learn/${courseSlug}/${nextLessonSlug}`)}
                className="ml-3 text-rd-accent hover:text-rd-accent-dk font-semibold"
              >
                Next lesson →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Note */}
      <p className="text-xs text-rd-muted mb-6">
        Video marks complete automatically after {VIDEO_COMPLETE_PCT}% watched.
      </p>
    </div>
  );
}
