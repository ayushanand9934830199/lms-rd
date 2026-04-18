"use client";

import { useState } from "react";
import Link from "next/link";
import CourseCard from "@/components/courses/CourseCard";
import { BookOpen, Bookmark, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "inProgress" | "completed" | "bookmarked";

interface Enrollment {
  id: string;
  progress_pct: number;
  enrolled_at: string;
  completed_at: string | null;
  course: any;
}

interface Props {
  inProgress: Enrollment[];
  completed: Enrollment[];
  bookmarked: any[];
}

export default function TabsClient({ inProgress, completed, bookmarked }: Props) {
  const [tab, setTab] = useState<Tab>("inProgress");

  const tabs = [
    { key: "inProgress" as Tab, label: "In Progress", count: inProgress.length, icon: BookOpen },
    { key: "completed" as Tab, label: "Completed", count: completed.length, icon: CheckCircle },
    { key: "bookmarked" as Tab, label: "Bookmarked", count: bookmarked.length, icon: Bookmark },
  ];

  function CourseGrid({ items, type }: { items: any[]; type: Tab }) {
    if (items.length === 0) {
      return (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto rounded-full bg-rd-accent-lt flex items-center justify-center mb-4">
            <BookOpen className="w-7 h-7 text-rd-accent" />
          </div>
          <p className="text-rd-muted mb-4">
            {type === "inProgress" && "No courses in progress yet."}
            {type === "completed" && "No courses completed yet. Keep going!"}
            {type === "bookmarked" && "No bookmarked courses."}
          </p>
          <Link href="/courses" className="rd-btn text-sm">
            Browse Courses →
          </Link>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((item) => {
          const course = type === "bookmarked" ? item : item.course;
          if (!course) return null;

          const lessons = (course.chapters ?? []).flatMap((c: any) => c.lessons ?? []);
          const totalSec = lessons.reduce((acc: number, l: any) => acc + (l.duration_sec ?? 0), 0);
          const progress = type !== "bookmarked" ? item.progress_pct : undefined;
          const isCompleted = type === "completed";

          return (
            <CourseCard
              key={course.id}
              title={course.title}
              slug={course.slug}
              coverImage={course.cover_image}
              instructor={{
                name: course.instructor?.full_name ?? "Instructor",
                avatar: course.instructor?.avatar_url,
              }}
              lessonCount={lessons.length}
              durationHours={totalSec / 3600}
              isFeatured={course.is_featured}
              isPaid={course.is_paid}
              price={course.price}
              currency={course.currency}
              tags={course.tags ?? []}
              progress={progress}
              completed={isCompleted}
            />
          );
        })}
      </div>
    );
  }

  const currentItems =
    tab === "inProgress" ? inProgress :
    tab === "completed" ? completed :
    bookmarked;

  return (
    <div>
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-rd-border mb-6">
        {tabs.map(({ key, label, count, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px",
              tab === key
                ? "border-rd-accent text-rd-accent"
                : "border-transparent text-rd-muted hover:text-rd-ink hover:border-rd-border"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
            {count > 0 && (
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-full font-semibold",
                tab === key ? "bg-rd-accent-lt text-rd-accent" : "bg-rd-border text-rd-muted"
              )}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      <CourseGrid items={currentItems} type={tab} />
    </div>
  );
}
