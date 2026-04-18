"use client";

import dynamic from "next/dynamic";
import { useState, useCallback } from "react";
import ArticleLesson from "./ArticleLesson";
import VideoLesson from "./VideoLesson";
import QuizLesson from "./QuizLesson";
import AssignmentLesson from "./AssignmentLesson";
import ScormLesson from "./ScormLesson";
import MarkCompleteButton from "./MarkCompleteButton";
import type { LessonType } from "@/lib/constants";

interface QuizQuestion {
  id: string;
  question: string;
  options: { id: string; text: string }[];
  correct_opt: string;
  explanation: string | null;
  position: number;
}

interface Assignment {
  id: string;
  lesson_id: string;
  instructions: string | null;
  max_score: number;
}

interface LessonPlayerProps {
  lesson: {
    id: string;
    title: string;
    lesson_type: LessonType;
    content: string | null;
    video_url: string | null;
    duration_sec: number | null;
    scorm_package_url: string | null;
    scorm_entry_point: string | null;
    scorm_version: string | null;
  };
  courseId: string;
  courseSlug: string;
  userId: string;
  isCompleted: boolean;
  quizQuestions: QuizQuestion[];
  assignment: Assignment | null;
  nextLessonSlug: string | null;
}

export default function LessonPlayer({
  lesson,
  courseId,
  courseSlug,
  userId,
  isCompleted,
  quizQuestions,
  assignment,
  nextLessonSlug,
}: LessonPlayerProps) {
  const [completed, setCompleted] = useState(isCompleted);

  const handleComplete = useCallback(() => setCompleted(true), []);

  const commonProps = {
    lessonId: lesson.id,
    courseId,
    userId,
    completed,
    onComplete: handleComplete,
    nextLessonSlug,
    courseSlug,
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-2xl sm:text-3xl font-semibold text-rd-ink mb-6 leading-tight">
        {lesson.title}
      </h1>

      {/* Lesson type content */}
      {lesson.lesson_type === "article" && (
        <ArticleLesson
          content={lesson.content}
          {...commonProps}
        />
      )}

      {lesson.lesson_type === "video" && (
        <VideoLesson
          videoUrl={lesson.video_url}
          durationSec={lesson.duration_sec}
          {...commonProps}
        />
      )}

      {lesson.lesson_type === "quiz" && (
        <QuizLesson
          questions={quizQuestions}
          {...commonProps}
        />
      )}

      {lesson.lesson_type === "assignment" && assignment && (
        <AssignmentLesson
          assignment={assignment}
          {...commonProps}
        />
      )}

      {lesson.lesson_type === "scorm" && (
        <ScormLesson
          packageUrl={lesson.scorm_package_url}
          entryPoint={lesson.scorm_entry_point ?? "index.html"}
          scormVersion={lesson.scorm_version ?? "1.2"}
          {...commonProps}
        />
      )}

      {/* Mark complete for article/scorm (video auto-completes; quiz/assignment auto-complete on submission) */}
      {(lesson.lesson_type === "article") && (
        <MarkCompleteButton
          lessonId={lesson.id}
          courseId={courseId}
          userId={userId}
          completed={completed}
          onComplete={handleComplete}
          nextLessonSlug={nextLessonSlug}
          courseSlug={courseSlug}
        />
      )}
    </div>
  );
}
