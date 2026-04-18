"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Package, CheckCircle } from "lucide-react";

interface Props {
  packageUrl: string | null;
  entryPoint: string;
  scormVersion: string;
  lessonId: string;
  courseId: string;
  userId: string;
  completed: boolean;
  onComplete: () => void;
  nextLessonSlug: string | null;
  courseSlug: string;
}

// ── SCORM 1.2 / 2004 API Adapter ──────────────────────────────────────────
// Injected into the iframe window to provide the SCORM API surface.
// Completion is communicated back via postMessage.
const SCORM_API_SCRIPT = `
(function() {
  var _data = {};
  var _commitCallback = null;

  // SCORM 1.2 API
  window.API = {
    LMSInitialize: function() { return "true"; },
    LMSFinish: function() { window.parent.postMessage({ type: 'scorm_finish' }, '*'); return "true"; },
    LMSGetValue: function(k) { return _data[k] || ""; },
    LMSSetValue: function(k, v) {
      _data[k] = v;
      if (k === 'cmi.core.lesson_status' && (v === 'passed' || v === 'completed')) {
        window.parent.postMessage({ type: 'scorm_complete', status: v }, '*');
      }
      return "true";
    },
    LMSCommit: function() { return "true"; },
    LMSGetLastError: function() { return "0"; },
    LMSGetErrorString: function() { return "No error"; },
    LMSGetDiagnostic: function() { return ""; }
  };

  // SCORM 2004 API
  window.API_1484_11 = {
    Initialize: function() { return "true"; },
    Terminate: function() { window.parent.postMessage({ type: 'scorm_finish' }, '*'); return "true"; },
    GetValue: function(k) { return _data[k] || ""; },
    SetValue: function(k, v) {
      _data[k] = v;
      if (k === 'cmi.completion_status' && (v === 'completed')) {
        window.parent.postMessage({ type: 'scorm_complete', status: v }, '*');
      }
      if (k === 'cmi.success_status' && (v === 'passed')) {
        window.parent.postMessage({ type: 'scorm_complete', status: v }, '*');
      }
      return "true";
    },
    Commit: function() { return "true"; },
    GetLastError: function() { return "0"; },
    GetErrorString: function() { return "No error"; },
    GetDiagnostic: function() { return ""; }
  };

  console.log('[SCORM] API initialized (1.2 + 2004)');
})();
`;

export default function ScormLesson({
  packageUrl,
  entryPoint,
  scormVersion,
  lessonId,
  courseId,
  userId,
  completed,
  onComplete,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [scormCompleted, setScormCompleted] = useState(completed);
  const supabase = createClient();

  // Listen for SCORM completion messages from iframe
  useEffect(() => {
    const handler = async (event: MessageEvent) => {
      if (!event.data?.type) return;

      if (
        (event.data.type === "scorm_complete" || event.data.type === "scorm_finish") &&
        !scormCompleted
      ) {
        setScormCompleted(true);
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

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [scormCompleted, lessonId, courseId, userId, supabase, onComplete]);

  // Inject SCORM API into iframe when it loads
  const handleIframeLoad = () => {
    setLoading(false);
    try {
      const iframe = iframeRef.current;
      if (!iframe?.contentWindow) return;

      // Inject API via script element
      const doc = iframe.contentDocument;
      if (doc) {
        const script = doc.createElement("script");
        script.text = SCORM_API_SCRIPT;
        (doc.head || doc.body)?.appendChild(script);
      }
    } catch (e) {
      // Cross-origin iframes: API injection via srcdoc or same-origin proxy instead
      console.warn("[SCORM] Cannot inject API (cross-origin). Using postMessage fallback.", e);
    }
  };

  if (!packageUrl) {
    return (
      <div className="rd-card text-center py-12">
        <Package className="w-12 h-12 text-rd-muted mx-auto mb-3" />
        <p className="text-rd-muted">No SCORM package uploaded yet.</p>
      </div>
    );
  }

  // The SCORM package URL points to the zip storage path.
  // For the iframe src, we use a /api/scorm/[lessonId] route that serves the extracted package.
  const iframeSrc = `/api/scorm/serve?lesson=${lessonId}&entry=${encodeURIComponent(entryPoint)}`;

  return (
    <div>
      {/* Status bar */}
      {scormCompleted && (
        <div className="flex items-center gap-2 text-rd-success text-sm font-medium mb-4">
          <CheckCircle className="w-4 h-4" />
          Module completed
        </div>
      )}

      {/* SCORM iframe */}
      <div className="relative rounded-card overflow-hidden border border-rd-border bg-white" style={{ minHeight: 500 }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-rd-paper z-10">
            <Loader2 className="w-8 h-8 animate-spin text-rd-accent" />
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          onLoad={handleIframeLoad}
          className="w-full"
          style={{ height: 600, border: "none" }}
          allow="fullscreen"
          title="SCORM Content"
        />
      </div>

      <p className="text-xs text-rd-muted mt-3">
        SCORM {scormVersion} · Completion tracked automatically
      </p>
    </div>
  );
}
