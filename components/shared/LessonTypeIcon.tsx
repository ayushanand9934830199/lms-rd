import {
  FileText,
  PlayCircle,
  HelpCircle,
  ClipboardList,
  Package,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LessonType } from "@/lib/constants";

const CONFIG: Record<
  LessonType,
  { icon: React.ElementType; bg: string; color: string; label: string }
> = {
  article:    { icon: FileText,      bg: "bg-blue-50",   color: "text-blue-500",   label: "Article" },
  video:      { icon: PlayCircle,    bg: "bg-rd-accent-lt", color: "text-rd-accent", label: "Video" },
  quiz:       { icon: HelpCircle,    bg: "bg-purple-50", color: "text-purple-500", label: "Quiz" },
  assignment: { icon: ClipboardList, bg: "bg-green-50",  color: "text-green-600",  label: "Assignment" },
  scorm:      { icon: Package,       bg: "bg-orange-50", color: "text-orange-500", label: "Interactive" },
};

interface LessonTypeIconProps {
  type: LessonType;
  size?: "sm" | "md";
  locked?: boolean;
}

export default function LessonTypeIcon({
  type,
  size = "md",
  locked = false,
}: LessonTypeIconProps) {
  if (locked) {
    return (
      <div className={cn(
        "lesson-icon",
        size === "sm" ? "w-5 h-5" : "w-7 h-7",
        "bg-rd-border/60"
      )}>
        <Lock className={cn("text-rd-muted", size === "sm" ? "w-3 h-3" : "w-4 h-4")} />
      </div>
    );
  }

  const cfg = CONFIG[type];
  const Icon = cfg.icon;

  return (
    <div className={cn(
      "lesson-icon",
      size === "sm" ? "w-5 h-5" : "w-7 h-7",
      cfg.bg
    )}>
      <Icon className={cn(cfg.color, size === "sm" ? "w-3 h-3" : "w-4 h-4")} />
    </div>
  );
}

export function lessonTypeLabel(type: LessonType): string {
  return CONFIG[type].label;
}
