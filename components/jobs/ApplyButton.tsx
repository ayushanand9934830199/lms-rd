"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ExternalLink, Loader2, CheckCircle } from "lucide-react";

export default function ApplyButton({
  jobId,
  userId,
  applyUrl,
  hasApplied: initial,
}: {
  jobId: string;
  userId: string;
  applyUrl: string;
  hasApplied: boolean;
}) {
  const supabase = createClient();
  const [applied, setApplied] = useState(initial);
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    setLoading(true);
    await supabase
      .from("job_applications")
      .upsert({ job_id: jobId, student_id: userId }, { onConflict: "job_id,student_id" });
    setApplied(true);
    setLoading(false);
    window.open(applyUrl, "_blank", "noopener,noreferrer");
  };

  if (applied) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-rd-success font-medium">
        <CheckCircle className="w-4 h-4" /> Applied
      </div>
    );
  }

  return (
    <button onClick={handleApply} disabled={loading} className="rd-btn text-xs px-3 py-1.5">
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <><ExternalLink className="w-3.5 h-3.5" /> Apply</>
      )}
    </button>
  );
}
