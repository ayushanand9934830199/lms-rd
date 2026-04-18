import Image from "next/image";
import Link from "next/link";
import { Clock, BookOpen, Users, Star, Lock } from "lucide-react";
import { cn, formatPrice, formatDuration } from "@/lib/utils";

interface CourseCardProps {
  title: string;
  slug: string;
  coverImage?: string | null;
  instructor: {
    name: string;
    avatar?: string | null;
  };
  lessonCount: number;
  durationHours: number;
  isFeatured?: boolean;
  isPaid: boolean;
  price?: number;
  currency?: string;
  tags: string[];
  progress?: number;    // 0–100 if enrolled
  completed?: boolean;
  compact?: boolean;
}

export default function CourseCard({
  title,
  slug,
  coverImage,
  instructor,
  lessonCount,
  durationHours,
  isFeatured = false,
  isPaid,
  price = 0,
  currency = "INR",
  tags,
  progress,
  completed = false,
  compact = false,
}: CourseCardProps) {
  const isEnrolled = typeof progress === "number";

  return (
    <Link
      href={isEnrolled ? `/learn/${slug}` : `/courses/${slug}`}
      className="group rd-card p-0 overflow-hidden hover:border-rd-accent transition-all duration-150 flex flex-col"
    >
      {/* Cover image */}
      <div className="relative aspect-video bg-rd-accent-lt overflow-hidden">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={title}
            fill
            className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-rd-accent/30" />
          </div>
        )}

        {/* Featured badge */}
        {isFeatured && (
          <div className="absolute top-2 left-2 rd-badge text-[10px]">
            ★ Featured
          </div>
        )}

        {/* Completed badge */}
        {completed && (
          <div className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rd-success text-white">
            ✓ Completed
          </div>
        )}

        {/* Progress bar overlay */}
        {isEnrolled && !completed && (
          <div className="absolute bottom-0 left-0 right-0">
            <div className="h-1 bg-black/20">
              <div
                className="h-full bg-rd-accent transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className={cn("flex flex-col flex-1 p-4", compact && "p-3")}>
        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {tags.slice(0, 2).map((tag) => (
              <span key={tag} className="rd-tag">{tag}</span>
            ))}
            {tags.length > 2 && (
              <span className="rd-tag">+{tags.length - 2}</span>
            )}
          </div>
        )}

        {/* Title */}
        <h3 className={cn(
          "font-display font-semibold text-rd-ink leading-snug line-clamp-2 group-hover:text-rd-accent transition-colors",
          compact ? "text-sm mb-2" : "text-base mb-3"
        )}>
          {title}
        </h3>

        {/* Instructor */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-full bg-rd-accent text-white text-[10px] font-bold flex items-center justify-center overflow-hidden shrink-0">
            {instructor.avatar ? (
              <Image src={instructor.avatar} alt={instructor.name} width={20} height={20} className="object-cover" />
            ) : (
              instructor.name[0]?.toUpperCase()
            )}
          </div>
          <span className="text-xs text-rd-muted truncate">{instructor.name}</span>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-xs text-rd-muted mt-auto">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            {lessonCount} lesson{lessonCount !== 1 ? "s" : ""}
          </span>
          {durationHours > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(durationHours * 3600)}
            </span>
          )}
        </div>

        {/* Price row */}
        {!compact && (
          <div className="mt-3 pt-3 border-t border-rd-border flex items-center justify-between">
            <span className={cn(
              "font-semibold text-sm",
              isPaid ? "text-rd-ink" : "text-rd-success"
            )}>
              {isPaid ? formatPrice(price, currency) : "Free"}
            </span>
            {isEnrolled && (
              <span className="text-xs font-medium text-rd-accent">
                {progress}% complete
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
