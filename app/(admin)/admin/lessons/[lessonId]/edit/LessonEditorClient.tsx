"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Save, Loader2, Eye, EyeOff, Video, Plus, Trash2, ArrowUp, ArrowDown, Upload
} from "lucide-react";
import { cn } from "@/lib/utils";
import LessonTypeIcon from "@/components/shared/LessonTypeIcon";
import { STORAGE_BUCKETS, QUIZ_PASS_THRESHOLD, type LessonType } from "@/lib/constants";

const TiptapEditor = dynamic(() => import("@/components/editor/TiptapEditor"), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-rd-surface border border-rd-border rounded-card flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-rd-muted" />
    </div>
  ),
});

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
  instructions: string | null;
  max_score: number;
}

interface Props {
  lesson: any;
  course: any;
  userId: string;
  quizQuestions: QuizQuestion[];
  assignment: Assignment | null;
}

export default function LessonEditorClient({
  lesson: initial,
  course,
  userId,
  quizQuestions: initialQuestions,
  assignment: initialAssignment,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState(initial.title);
  const [content, setContent] = useState(initial.content ?? "");
  const [videoUrl, setVideoUrl] = useState(initial.video_url ?? "");
  const [durationSec, setDurationSec] = useState(initial.duration_sec ?? "");
  const [isPreview, setIsPreview] = useState(initial.is_preview);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Quiz
  const [questions, setQuestions] = useState<QuizQuestion[]>(initialQuestions);
  
  // Assignment
  const [instructions, setInstructions] = useState(initialAssignment?.instructions ?? "");
  const [maxScore, setMaxScore] = useState(initialAssignment?.max_score ?? 100);

  const lessonType: LessonType = initial.lesson_type;

  const save = async () => {
    setSaving(true);

    const updates: Record<string, any> = { title, is_preview: isPreview };
    if (lessonType === "article") updates.content = content;
    if (lessonType === "video") {
      updates.video_url = videoUrl;
      updates.duration_sec = durationSec ? parseInt(durationSec as string) : null;
    }

    await supabase.from("lessons").update(updates).eq("id", initial.id);

    // Quiz questions upsert
    if (lessonType === "quiz") {
      for (const q of questions) {
        await supabase.from("quiz_questions").upsert(
          { ...q, lesson_id: initial.id },
          { onConflict: "id" }
        );
      }
    }

    // Assignment upsert
    if (lessonType === "assignment") {
      await supabase.from("assignments").upsert(
        {
          id: initialAssignment?.id,
          lesson_id: initial.id,
          instructions,
          max_score: maxScore,
        },
        { onConflict: "lesson_id" }
      );
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        question: "",
        options: [
          { id: "a", text: "" },
          { id: "b", text: "" },
          { id: "c", text: "" },
          { id: "d", text: "" },
        ],
        correct_opt: "a",
        explanation: "",
        position: prev.length,
      },
    ]);
  };

  const deleteQuestion = async (qId: string) => {
    await supabase.from("quiz_questions").delete().eq("id", qId);
    setQuestions((prev) => prev.filter((q) => q.id !== qId));
  };

  const updateQuestion = (qId: string, updates: Partial<QuizQuestion>) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, ...updates } : q))
    );
  };

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href={`/admin/courses/${course?.id}/edit`}
            className="text-xs text-rd-muted hover:text-rd-ink mb-1 inline-block"
          >
            ← {course?.title}
          </Link>
          <div className="flex items-center gap-2">
            <LessonTypeIcon type={lessonType} size="sm" />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="font-display text-2xl font-semibold text-rd-ink bg-transparent border-b border-transparent hover:border-rd-border focus:border-rd-accent outline-none transition-colors w-full"
            />
          </div>
          <p className="text-xs text-rd-muted mt-0.5">
            Slug: <code>{initial.slug}</code>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsPreview((p: boolean) => !p)}
            title={isPreview ? "Remove Preview" : "Mark as Preview"}
            className={cn("rd-btn-secondary text-xs", isPreview && "border-rd-accent text-rd-accent")}
          >
            {isPreview ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            {isPreview ? "Preview" : "Not Preview"}
          </button>
          <button onClick={save} disabled={saving} className="rd-btn text-sm">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> 
             : saved ? "✓ Saved" 
             : <><Save className="w-4 h-4" /> Save</>}
          </button>
        </div>
      </div>

      {/* ── Article editor ── */}
      {lessonType === "article" && (
        <TiptapEditor
          content={content}
          onChange={setContent}
          placeholder="Write your lesson content here…"
        />
      )}

      {/* ── Video lesson ── */}
      {lessonType === "video" && (
        <div className="rd-card space-y-5">
          <div>
            <label className="block text-sm font-medium text-rd-ink mb-1.5">
              Video URL <span className="text-rd-muted text-xs">(Supabase storage URL or external)</span>
            </label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://..."
              className="rd-input"
            />
          </div>
          <div className="w-48">
            <label className="block text-sm font-medium text-rd-ink mb-1.5">
              Duration (seconds)
            </label>
            <input
              type="number"
              value={durationSec}
              onChange={(e) => setDurationSec(e.target.value)}
              placeholder="e.g. 900"
              className="rd-input"
              min={0}
            />
          </div>
          <VideoUploader
            lessonId={initial.id}
            userId={userId}
            onUploaded={(url, dur) => { setVideoUrl(url); if (dur) setDurationSec(dur); }}
          />
        </div>
      )}

      {/* ── Quiz editor ── */}
      {lessonType === "quiz" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-rd-muted">
              Pass threshold: <strong>{QUIZ_PASS_THRESHOLD}%</strong> (set in constants.ts)
            </p>
            <button onClick={addQuestion} className="rd-btn-secondary text-sm">
              <Plus className="w-4 h-4" /> Add Question
            </button>
          </div>

          {questions.map((q, qi) => (
            <div key={q.id} className="rd-card space-y-3">
              <div className="flex items-start gap-2">
                <span className="text-xs text-rd-muted font-mono mt-1 shrink-0">Q{qi + 1}</span>
                <textarea
                  value={q.question}
                  onChange={(e) => updateQuestion(q.id, { question: e.target.value })}
                  placeholder="Question text…"
                  rows={2}
                  className="rd-input flex-1 resize-none text-sm"
                />
                <button
                  onClick={() => deleteQuestion(q.id)}
                  className="text-rd-muted hover:text-rd-danger mt-0.5"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Options */}
              <div className="space-y-2 pl-6">
                {q.options.map((opt) => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct_${q.id}`}
                      checked={q.correct_opt === opt.id}
                      onChange={() => updateQuestion(q.id, { correct_opt: opt.id })}
                      className="accent-rd-success shrink-0"
                      title="Mark as correct"
                    />
                    <span className="text-xs font-mono text-rd-muted w-4">{opt.id.toUpperCase()}.</span>
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => {
                        const newOpts = q.options.map((o) =>
                          o.id === opt.id ? { ...o, text: e.target.value } : o
                        );
                        updateQuestion(q.id, { options: newOpts });
                      }}
                      placeholder={`Option ${opt.id.toUpperCase()}`}
                      className="rd-input text-sm py-1.5"
                    />
                  </div>
                ))}
              </div>

              {/* Explanation */}
              <div className="pl-6">
                <input
                  type="text"
                  value={q.explanation ?? ""}
                  onChange={(e) => updateQuestion(q.id, { explanation: e.target.value })}
                  placeholder="Explanation (shown after submission)…"
                  className="rd-input text-sm"
                />
              </div>
            </div>
          ))}

          {questions.length === 0 && (
            <div className="rd-card text-center py-10 text-rd-muted text-sm">
              No questions yet. Add one above.
            </div>
          )}
        </div>
      )}

      {/* ── Assignment editor ── */}
      {lessonType === "assignment" && (
        <div className="rd-card space-y-5">
          <div>
            <label className="block text-sm font-medium text-rd-ink mb-1.5">Instructions</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={8}
              placeholder="Describe the assignment task clearly…"
              className="rd-input resize-y"
            />
          </div>
          <div className="w-32">
            <label className="block text-sm font-medium text-rd-ink mb-1.5">Max Score</label>
            <input
              type="number"
              value={maxScore}
              onChange={(e) => setMaxScore(parseInt(e.target.value))}
              min={1}
              max={1000}
              className="rd-input"
            />
          </div>
        </div>
      )}

      {/* ── SCORM editor ── */}
      {lessonType === "scorm" && (
        <ScormUploader lessonId={initial.id} userId={userId} />
      )}
    </div>
  );
}

// ─── Video Uploader ────────────────────────────────────────────────────────

function VideoUploader({
  lessonId,
  userId,
  onUploaded,
}: {
  lessonId: string;
  userId: string;
  onUploaded: (url: string, dur?: string) => void;
}) {
  const supabase = createClient();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const path = `${userId}/${lessonId}/${file.name}`;
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.LESSON_VIDEOS)
      .upload(path, file, { upsert: true });

    if (data?.path) {
      const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_BUCKETS.LESSON_VIDEOS)
        .getPublicUrl(data.path);
      onUploaded(publicUrl);
    }
    setUploading(false);
  };

  return (
    <div>
      <p className="text-xs font-medium text-rd-ink mb-1.5">Upload video to Supabase</p>
      <label className="flex items-center gap-2 rd-btn-secondary cursor-pointer w-fit text-sm">
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        {uploading ? "Uploading…" : "Upload video"}
        <input type="file" accept="video/*" className="hidden" onChange={handleUpload} disabled={uploading} />
      </label>
    </div>
  );
}

// ─── SCORM Uploader ─────────────────────────────────────────────────────────

function ScormUploader({ lessonId, userId }: { lessonId: string; userId: string }) {
  const supabase = createClient();
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const path = `${userId}/${lessonId}/${file.name}`;
    const { data } = await supabase.storage
      .from("scorm-packages")
      .upload(path, file, { upsert: true });

    if (data?.path) {
      const { data: { publicUrl } } = supabase.storage
        .from("scorm-packages")
        .getPublicUrl(data.path);

      await supabase.from("lessons").update({
        scorm_package_url: publicUrl,
        scorm_entry_point: "index.html",
        scorm_version: "1.2",
      }).eq("id", lessonId);

      setUploaded(true);
    }
    setUploading(false);
  };

  return (
    <div className="rd-card space-y-4">
      <h3 className="font-semibold text-rd-ink text-sm">SCORM Package</h3>
      <p className="text-sm text-rd-muted">
        Upload a SCORM 1.2 or 2004 .zip package. The system will host it and inject the LMS API automatically.
      </p>
      {uploaded && (
        <p className="text-sm text-rd-success font-medium">✓ Package uploaded successfully.</p>
      )}
      <label className="flex items-center gap-2 rd-btn-secondary cursor-pointer w-fit">
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        {uploading ? "Uploading…" : "Upload .zip package"}
        <input
          type="file"
          accept=".zip"
          className="hidden"
          onChange={handleUpload}
          disabled={uploading}
        />
      </label>
    </div>
  );
}
