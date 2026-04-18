"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import LessonTypeIcon from "@/components/shared/LessonTypeIcon";
import { cn, formatDuration } from "@/lib/utils";
import type { LessonType } from "@/lib/constants";

interface LessonRow {
  id: string;
  title: string;
  slug: string;
  lesson_type: LessonType;
  duration_sec: number | null;
  is_preview: boolean;
}

interface ChapterRow {
  id: string;
  title: string;
  position: number;
  lessons: LessonRow[];
}

interface Props {
  chapters: ChapterRow[];
  isEnrolled: boolean;
  courseSlug: string;
  /** If provided, show checkmarks for completed lessons */
  completedLessonIds?: string[];
  /** Currently active lesson slug */
  activeLessonSlug?: string;
}

export default function ChapterAccordion({
  chapters,
  isEnrolled,
  courseSlug,
  completedLessonIds = [],
  activeLessonSlug,
}: Props) {
  const [openChapters, setOpenChapters] = useState<Set<string>>(
    // Default: open first chapter
    new Set(chapters.length ? [chapters[0].id] : [])
  );

  const toggle = (id: string) => {
    setOpenChapters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="border border-rd-border rounded-card overflow-hidden divide-y divide-rd-border">
      {chapters.map((chapter, chIdx) => {
        const isOpen = openChapters.has(chapter.id);
        const completedInChapter = chapter.lessons.filter(
          (l) => completedLessonIds.includes(l.id)
        ).length;

        return (
          <div key={chapter.id}>
            {/* Chapter header */}
            <button
              onClick={() => toggle(chapter.id)}
              className="w-full flex items-center justify-between px-4 py-3 bg-rd-surface hover:bg-rd-accent-lt transition-colors text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs text-rd-muted font-mono w-5 shrink-0">
                  {String(chIdx + 1).padStart(2, "0")}
                </span>
                <span className="text-sm font-semibold text-rd-ink truncate">
                  {chapter.title}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-3">
                <span className="text-xs text-rd-muted">
                  {completedInChapter > 0 && `${completedInChapter}/`}
                  {chapter.lessons.length} lesson{chapter.lessons.length !== 1 ? "s" : ""}
                </span>
                {isOpen ? (
                  <ChevronDown className="w-4 h-4 text-rd-muted" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-rd-muted" />
                )}
              </div>
            </button>

            {/* Lesson list */}
            {isOpen && (
              <ul className="divide-y divide-rd-border/60 bg-white">
                {chapter.lessons.map((lesson) => {
                  const isCompleted = completedLessonIds.includes(lesson.id);
                  const isActive = lesson.slug === activeLessonSlug;
                  const canAccess = isEnrolled || lesson.is_preview;

                  const LessonContent = () => (
                    <div
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5",
                        isActive && "bg-rd-accent-lt",
                        !isActive && "hover:bg-gray-50",
                        "transition-colors"
                      )}
                    >
                      {/* Completion checkbox */}
                      <div
                        className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                          isCompleted
                            ? "bg-rd-success border-rd-success"
                            : "border-rd-border"
                        )}
                      >
                        {isCompleted && (
                          <svg viewBox="0 0 10 8" className="w-2.5 h-2.5 fill-white">
                            <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" fill="none" />
                          </svg>
                        )}
                      </div>

                      <LessonTypeIcon
                        type={lesson.lesson_type}
                        size="sm"
                        locked={!canAccess}
                      />

                      <span
                        className={cn(
                          "text-sm flex-1 truncate",
                          isActive ? "text-rd-accent font-semibold" : "text-rd-ink",
                          !canAccess && "text-rd-muted"
                        )}
                      >
                        {lesson.title}
                      </span>

                      <div className="flex items-center gap-2 shrink-0">
                        {lesson.is_preview && !isEnrolled && (
                          <span className="text-[10px] font-semibold text-rd-accent bg-rd-accent-lt px-1.5 py-0.5 rounded">
                            Preview
                          </span>
                        )}
                        {lesson.duration_sec && lesson.duration_sec > 0 && (
                          <span className="text-xs text-rd-muted">
                            {formatDuration(lesson.duration_sec)}
                          </span>
                        )}
                      </div>
                    </div>
                  );

                  return (
                    <li key={lesson.id}>
                      {canAccess ? (
                        <Link href={`/learn/${courseSlug}/${lesson.slug}`}>
                          <LessonContent />
                        </Link>
                      ) : (
                        <div className="cursor-not-allowed opacity-70">
                          <LessonContent />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
