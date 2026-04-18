"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createClient } from "@/lib/supabase/client";
import { createSlug, slugSuffix } from "@/lib/utils";
import {
  GripVertical,
  PlusCircle,
  Trash2,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Save,
  Loader2,
  Globe,
  Archive,
  Pencil,
} from "lucide-react";
import LessonTypeIcon from "@/components/shared/LessonTypeIcon";
import { LESSON_TYPES, type LessonType } from "@/lib/constants";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Lesson {
  id: string;
  title: string;
  slug: string;
  lesson_type: LessonType;
  duration_sec: number | null;
  position: number;
  is_preview: boolean;
}

interface Chapter {
  id: string;
  title: string;
  position: number;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  short_intro: string | null;
  cover_image: string | null;
  status: "draft" | "published" | "archived";
  is_featured: boolean;
  is_paid: boolean;
  price: number;
  currency: string;
  tags: string[];
  chapters: Chapter[];
}

interface Props {
  course: Course;
  userId: string;
}

export default function CourseEditorClient({ course: initial, userId }: Props) {
  const router = useRouter();
  const supabase = createClient();

  // Course meta state
  const [title, setTitle] = useState(initial.title);
  const [shortIntro, setShortIntro] = useState(initial.short_intro ?? "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [tags, setTags] = useState((initial.tags ?? []).join(", "));
  const [status, setStatus] = useState(initial.status);
  const [isFeatured, setIsFeatured] = useState(initial.is_featured);
  const [chapters, setChapters] = useState<Chapter[]>(initial.chapters);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"content" | "settings">("content");
  const [openChapters, setOpenChapters] = useState<Set<string>>(
    new Set(initial.chapters.length ? [initial.chapters[0].id] : [])
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ── Chapter DnD ──────────────────────────────────────────────────
  const handleChapterDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIdx = chapters.findIndex((c) => c.id === active.id);
    const newIdx = chapters.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(chapters, oldIdx, newIdx).map((c, i) => ({ ...c, position: i }));
    setChapters(reordered);

    // Persist positions
    await Promise.all(
      reordered.map((c) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        supabase.from("chapters").update({ position: c.position } as any).eq("id", c.id)
      )
    );
  };

  // ── Lesson DnD ───────────────────────────────────────────────────
  const handleLessonDragEnd = async (chapterId: string, event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setChapters((prev) =>
      prev.map((c) => {
        if (c.id !== chapterId) return c;
        const oldIdx = c.lessons.findIndex((l) => l.id === active.id);
        const newIdx = c.lessons.findIndex((l) => l.id === over.id);
        const reordered = arrayMove(c.lessons, oldIdx, newIdx).map((l, i) => ({ ...l, position: i }));

        // Persist async
        void Promise.all(
          reordered.map((l) =>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            supabase.from("lessons").update({ position: l.position } as any).eq("id", l.id)
          )
        );

        return { ...c, lessons: reordered };
      })
    );
  };

  // ── Add chapter ──────────────────────────────────────────────────
  const addChapter = async () => {
    const position = chapters.length;
    const { data: ch } = await supabase
      .from("chapters")
      .insert({ course_id: initial.id, title: `Chapter ${position + 1}`, position })
      .select()
      .single();
    if (ch) {
      setChapters((prev) => [...prev, { ...ch, lessons: [] }]);
      setOpenChapters((prev) => new Set([...prev, ch.id]));
    }
  };

  // ── Add lesson ───────────────────────────────────────────────────
  const addLesson = async (chapterId: string, type: LessonType = "article") => {
    const chapter = chapters.find((c) => c.id === chapterId);
    if (!chapter) return;
    const position = chapter.lessons.length;
    const title = `New ${type} lesson`;
    const slug = `${createSlug(title)}-${slugSuffix()}`;

    const { data: lesson } = await supabase
      .from("lessons")
      .insert({
        chapter_id: chapterId,
        course_id: initial.id,
        title,
        slug,
        lesson_type: type,
        position,
      })
      .select()
      .single();

    if (lesson) {
      setChapters((prev) =>
        prev.map((c) =>
          c.id === chapterId
            ? { ...c, lessons: [...c.lessons, lesson as Lesson] }
            : c
        )
      );
    }
  };

  // ── Update chapter title ─────────────────────────────────────────
  const updateChapterTitle = async (chapterId: string, newTitle: string) => {
    setChapters((prev) =>
      prev.map((c) => (c.id === chapterId ? { ...c, title: newTitle } : c))
    );
    await supabase.from("chapters").update({ title: newTitle }).eq("id", chapterId);
  };

  // ── Delete chapter ───────────────────────────────────────────────
  const deleteChapter = async (chapterId: string) => {
    if (!confirm("Delete this chapter and all its lessons?")) return;
    await supabase.from("chapters").delete().eq("id", chapterId);
    setChapters((prev) => prev.filter((c) => c.id !== chapterId));
  };

  // ── Delete lesson ─────────────────────────────────────────────────
  const deleteLesson = async (chapterId: string, lessonId: string) => {
    await supabase.from("lessons").delete().eq("id", lessonId);
    setChapters((prev) =>
      prev.map((c) =>
        c.id === chapterId
          ? { ...c, lessons: c.lessons.filter((l) => l.id !== lessonId) }
          : c
      )
    );
  };

  // ── Toggle preview ───────────────────────────────────────────────
  const togglePreview = async (chapterId: string, lessonId: string) => {
    setChapters((prev) =>
      prev.map((c) =>
        c.id !== chapterId
          ? c
          : {
              ...c,
              lessons: c.lessons.map((l) =>
                l.id === lessonId ? { ...l, is_preview: !l.is_preview } : l
              ),
            }
      )
    );
    const lesson = chapters.find((c) => c.id === chapterId)?.lessons.find((l) => l.id === lessonId);
    if (lesson) {
      await supabase.from("lessons").update({ is_preview: !lesson.is_preview }).eq("id", lessonId);
    }
  };

  // ── Save meta ─────────────────────────────────────────────────────
  const saveMeta = async () => {
    setSaving(true);
    const tagArray = tags.split(",").map((t) => t.trim()).filter(Boolean);
    await supabase
      .from("courses")
      .update({
        title,
        short_intro: shortIntro || null,
        description: description || null,
        tags: tagArray,
        status,
        is_featured: isFeatured,
        published_at: status === "published" ? new Date().toISOString() : undefined,
      })
      .eq("id", initial.id);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/admin/dashboard"
            className="text-xs text-rd-muted hover:text-rd-ink mb-1 inline-block"
          >
            ← Dashboard
          </Link>
          <h1 className="font-display text-2xl font-semibold text-rd-ink truncate max-w-lg">
            {title || "Untitled Course"}
          </h1>
          <p className="text-xs text-rd-muted mt-0.5">
            Slug: <code className="text-rd-ink">{initial.slug}</code>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/courses/${initial.slug}`}
            target="_blank"
            className="rd-btn-secondary text-xs"
          >
            <Eye className="w-3.5 h-3.5" /> Preview
          </Link>
          <button onClick={saveMeta} disabled={saving} className="rd-btn text-sm">
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
            ) : saved ? (
              "✓ Saved"
            ) : (
              <><Save className="w-4 h-4" /> Save</>
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-rd-border mb-6">
        {(["content", "settings"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px capitalize",
              activeTab === tab
                ? "border-rd-accent text-rd-accent"
                : "border-transparent text-rd-muted hover:text-rd-ink"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Content tab ── */}
      {activeTab === "content" && (
        <div>
          {/* Chapter list with DnD */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleChapterDragEnd}
          >
            <SortableContext
              items={chapters.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {chapters.map((chapter) => (
                  <SortableChapter
                    key={chapter.id}
                    chapter={chapter}
                    isOpen={openChapters.has(chapter.id)}
                    onToggle={() =>
                      setOpenChapters((prev) => {
                        const next = new Set(prev);
                        prev.has(chapter.id) ? next.delete(chapter.id) : next.add(chapter.id);
                        return next;
                      })
                    }
                    onTitleChange={updateChapterTitle}
                    onDelete={deleteChapter}
                    onAddLesson={addLesson}
                    onDeleteLesson={deleteLesson}
                    onTogglePreview={togglePreview}
                    onLessonDragEnd={handleLessonDragEnd}
                    sensors={sensors}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <button
            onClick={addChapter}
            className="mt-4 rd-btn-secondary w-full text-sm"
          >
            <PlusCircle className="w-4 h-4" /> Add Chapter
          </button>
        </div>
      )}

      {/* ── Settings tab ── */}
      {activeTab === "settings" && (
        <div className="max-w-xl space-y-5">
          <div>
            <label className="block text-sm font-medium text-rd-ink mb-1.5">Course title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rd-input"
              maxLength={120}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-rd-ink mb-1.5">
              Short intro <span className="text-rd-muted text-xs">(max 150 chars)</span>
            </label>
            <input
              type="text"
              value={shortIntro}
              onChange={(e) => setShortIntro(e.target.value)}
              className="rd-input"
              maxLength={150}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-rd-ink mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="rd-input resize-y"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-rd-ink mb-1.5">
              Tags <span className="text-rd-muted text-xs">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="rd-input"
              placeholder="React, TypeScript, Next.js"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-rd-ink mb-1.5">Status</label>
            <div className="flex gap-2">
              {(["draft", "published", "archived"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-btn border text-sm font-medium transition-all",
                    status === s
                      ? "border-rd-accent bg-rd-accent text-white"
                      : "border-rd-border text-rd-muted hover:border-rd-accent hover:text-rd-accent"
                  )}
                >
                  {s === "published" && <Globe className="w-3.5 h-3.5" />}
                  {s === "draft" && <Pencil className="w-3.5 h-3.5" />}
                  {s === "archived" && <Archive className="w-3.5 h-3.5" />}
                  <span className="capitalize">{s}</span>
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="accent-rd-accent w-4 h-4"
            />
            <span className="text-sm text-rd-ink">Feature this course on homepage</span>
          </label>
        </div>
      )}
    </div>
  );
}

// ─── Sortable Chapter ────────────────────────────────────────────────────────

function SortableChapter({
  chapter,
  isOpen,
  onToggle,
  onTitleChange,
  onDelete,
  onAddLesson,
  onDeleteLesson,
  onTogglePreview,
  onLessonDragEnd,
  sensors,
}: {
  chapter: Chapter;
  isOpen: boolean;
  onToggle: () => void;
  onTitleChange: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onAddLesson: (chapterId: string, type: LessonType) => void;
  onDeleteLesson: (chapterId: string, lessonId: string) => void;
  onTogglePreview: (chapterId: string, lessonId: string) => void;
  onLessonDragEnd: (chapterId: string, event: DragEndEvent) => void;
  sensors: ReturnType<typeof useSensors>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: chapter.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [editTitle, setEditTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(chapter.title);
  const [showAddLesson, setShowAddLesson] = useState(false);

  return (
    <div ref={setNodeRef} style={style} className="rd-card p-0 overflow-hidden">
      {/* Chapter header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-rd-surface border-b border-rd-border">
        {/* Drag handle */}
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab text-rd-border hover:text-rd-muted"
        >
          <GripVertical className="w-4 h-4" />
        </span>

        {/* Title (editable) */}
        {editTitle ? (
          <input
            autoFocus
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onBlur={() => {
              setEditTitle(false);
              onTitleChange(chapter.id, titleInput);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setEditTitle(false);
                onTitleChange(chapter.id, titleInput);
              }
            }}
            className="flex-1 text-sm font-semibold bg-transparent border-b border-rd-accent outline-none text-rd-ink"
          />
        ) : (
          <button
            onClick={() => setEditTitle(true)}
            className="flex-1 text-left text-sm font-semibold text-rd-ink hover:text-rd-accent transition-colors truncate"
          >
            {chapter.title}
          </button>
        )}

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs text-rd-muted">{chapter.lessons.length} lessons</span>
          <button
            onClick={() => onDelete(chapter.id)}
            className="text-rd-muted hover:text-rd-danger transition-colors"
            title="Delete chapter"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onToggle} className="text-rd-muted hover:text-rd-ink transition-colors">
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Lessons */}
      {isOpen && (
        <div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(e) => onLessonDragEnd(chapter.id, e)}
          >
            <SortableContext
              items={chapter.lessons.map((l) => l.id)}
              strategy={verticalListSortingStrategy}
            >
              {chapter.lessons.map((lesson) => (
                <SortableLesson
                  key={lesson.id}
                  lesson={lesson}
                  chapterId={chapter.id}
                  courseSlug=""
                  onDelete={() => onDeleteLesson(chapter.id, lesson.id)}
                  onTogglePreview={() => onTogglePreview(chapter.id, lesson.id)}
                />
              ))}
            </SortableContext>
          </DndContext>

          {/* Add lesson */}
          <div className="px-4 pb-3 pt-2">
            {showAddLesson ? (
              <div className="bg-rd-accent-lt rounded-btn p-3">
                <p className="text-xs font-semibold text-rd-ink mb-2">Add lesson type:</p>
                <div className="flex flex-wrap gap-2">
                  {(["article", "video", "quiz", "assignment", "scorm"] as LessonType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        onAddLesson(chapter.id, t);
                        setShowAddLesson(false);
                      }}
                      className="flex items-center gap-1.5 px-2 py-1 rounded border border-rd-border bg-white text-xs hover:border-rd-accent hover:text-rd-accent transition-all"
                    >
                      <LessonTypeIcon type={t} size="sm" />
                      <span className="capitalize">{t}</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowAddLesson(false)}
                  className="text-xs text-rd-muted mt-2 hover:text-rd-ink"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAddLesson(true)}
                className="text-xs text-rd-accent hover:text-rd-accent-dk font-medium flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Add lesson
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sortable Lesson ─────────────────────────────────────────────────────────

function SortableLesson({
  lesson,
  chapterId,
  courseSlug,
  onDelete,
  onTogglePreview,
}: {
  lesson: Lesson;
  chapterId: string;
  courseSlug: string;
  onDelete: () => void;
  onTogglePreview: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lesson.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 px-4 py-2 border-b border-rd-border/60 hover:bg-rd-accent-lt/30 group"
    >
      <span {...attributes} {...listeners} className="cursor-grab text-rd-border hover:text-rd-muted shrink-0">
        <GripVertical className="w-3.5 h-3.5" />
      </span>

      <LessonTypeIcon type={lesson.lesson_type} size="sm" />

      <Link
        href={`/admin/lessons/${lesson.id}/edit`}
        className="flex-1 text-sm text-rd-ink hover:text-rd-accent transition-colors truncate"
      >
        {lesson.title}
      </Link>

      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={onTogglePreview}
          title={lesson.is_preview ? "Remove preview" : "Make preview"}
          className="text-rd-muted hover:text-rd-ink"
        >
          {lesson.is_preview ? (
            <Eye className="w-3.5 h-3.5 text-rd-accent" />
          ) : (
            <EyeOff className="w-3.5 h-3.5" />
          )}
        </button>
        <button onClick={onDelete} className="text-rd-muted hover:text-rd-danger">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
