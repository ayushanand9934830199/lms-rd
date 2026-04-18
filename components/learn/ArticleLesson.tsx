"use client";

import { cn } from "@/lib/utils";
import MarkCompleteButton from "./MarkCompleteButton";

interface Props {
  content: string | null;
  lessonId: string;
  courseId: string;
  userId: string;
  completed: boolean;
  onComplete: () => void;
  nextLessonSlug: string | null;
  courseSlug: string;
}

export default function ArticleLesson({ content, ...rest }: Props) {
  if (!content) {
    return (
      <div className="text-center py-16 text-rd-muted">
        No content yet.
      </div>
    );
  }

  // Content is stored as Tiptap JSON — parse and render
  let parsed: any = null;
  try {
    parsed = JSON.parse(content);
  } catch {
    // Plain text fallback
  }

  return (
    <div>
      {parsed ? (
        <TiptapRenderer doc={parsed} />
      ) : (
        <div className="prose prose-sm max-w-none whitespace-pre-wrap text-rd-ink leading-relaxed">
          {content}
        </div>
      )}
    </div>
  );
}

// ── Lightweight Tiptap JSON renderer ──────────────────────────────────────
function TiptapRenderer({ doc }: { doc: any }) {
  if (!doc?.content) return null;
  return (
    <div className="tiptap-rendered text-rd-ink leading-relaxed space-y-4">
      {doc.content.map((node: any, i: number) => (
        <TiptapNode key={i} node={node} />
      ))}
    </div>
  );
}

function TiptapNode({ node }: { node: any }) {
  const text = node.text ?? node.content?.map((c: any) => c.text ?? "").join("") ?? "";

  switch (node.type) {
    case "paragraph":
      return (
        <p className="text-rd-ink leading-relaxed">
          {(node.content ?? []).map((c: any, i: number) => (
            <TiptapInline key={i} node={c} />
          ))}
        </p>
      );
    case "heading":
      const level = node.attrs?.level ?? 2;
      const Tag = `h${level}` as keyof JSX.IntrinsicElements;
      return (
        <Tag className={cn("font-display font-semibold text-rd-ink", {
          "text-3xl": level === 1,
          "text-2xl": level === 2,
          "text-xl": level === 3,
          "text-lg": level >= 4,
        })}>
          {(node.content ?? []).map((c: any, i: number) => <TiptapInline key={i} node={c} />)}
        </Tag>
      );
    case "bulletList":
      return (
        <ul className="list-disc pl-6 space-y-1">
          {(node.content ?? []).map((item: any, i: number) => (
            <li key={i}>{(item.content ?? []).map((c: any, j: number) => <TiptapNode key={j} node={c} />)}</li>
          ))}
        </ul>
      );
    case "orderedList":
      return (
        <ol className="list-decimal pl-6 space-y-1">
          {(node.content ?? []).map((item: any, i: number) => (
            <li key={i}>{(item.content ?? []).map((c: any, j: number) => <TiptapNode key={j} node={c} />)}</li>
          ))}
        </ol>
      );
    case "blockquote":
      return (
        <blockquote className="border-l-4 border-rd-accent pl-4 italic text-rd-muted my-4">
          {(node.content ?? []).map((c: any, i: number) => <TiptapNode key={i} node={c} />)}
        </blockquote>
      );
    case "codeBlock":
      return (
        <pre className="bg-rd-ink text-rd-paper p-4 rounded-card overflow-x-auto font-mono text-sm my-4">
          <code>{(node.content ?? []).map((c: any) => c.text ?? "").join("")}</code>
        </pre>
      );
    case "horizontalRule":
      return <hr className="my-6 border-rd-border" />;
    case "image":
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={node.attrs?.src}
          alt={node.attrs?.alt ?? ""}
          className="max-w-full rounded-card my-4"
        />
      );
    default:
      return (
        <div>
          {(node.content ?? []).map((c: any, i: number) => (
            <TiptapNode key={i} node={c} />
          ))}
        </div>
      );
  }
}

function TiptapInline({ node }: { node: any }) {
  let content: React.ReactNode = node.text ?? "";

  if (node.marks) {
    for (const mark of node.marks) {
      if (mark.type === "bold") content = <strong className="font-semibold">{content}</strong>;
      if (mark.type === "italic") content = <em>{content}</em>;
      if (mark.type === "code") content = <code className="bg-rd-accent-lt text-rd-accent-dk px-1.5 py-0.5 rounded text-sm font-mono">{content}</code>;
      if (mark.type === "link") content = <a href={mark.attrs?.href} className="text-rd-accent underline underline-offset-2 hover:text-rd-accent-dk" target="_blank" rel="noopener noreferrer">{content}</a>;
    }
  }

  return <>{content}</>;
}
