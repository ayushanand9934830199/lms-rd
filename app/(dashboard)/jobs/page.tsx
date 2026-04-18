import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Briefcase, MapPin, Clock, ExternalLink, PlusCircle } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Jobs" };

export default async function JobsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();

  const { data: jobs } = await supabase
    .from("job_postings")
    .select(`
      id, title, company, location, job_type, skills,
      is_active, created_at, expires_at, apply_url, description,
      poster:profiles!posted_by(id, full_name, username)
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  // Jobs I've applied to
  const { data: myApplications } = await supabase
    .from("job_applications")
    .select("job_id")
    .eq("student_id", user.id);

  const appliedIds = new Set(myApplications?.map((a) => a.job_id) ?? []);
  const canPost = profile?.role === "instructor" || profile?.role === "moderator";

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-semibold text-rd-ink">Jobs</h1>
          <p className="text-rd-muted mt-1">{jobs?.length ?? 0} active opportunities</p>
        </div>
        {canPost && (
          <Link href="/jobs/new" className="rd-btn">
            <PlusCircle className="w-4 h-4" /> Post a Job
          </Link>
        )}
      </div>

      {!jobs || jobs.length === 0 ? (
        <div className="text-center py-16">
          <Briefcase className="w-12 h-12 text-rd-border mx-auto mb-3" />
          <p className="text-rd-muted">No active jobs right now.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job: any) => {
            const hasApplied = appliedIds.has(job.id);
            return (
              <div key={job.id} className="rd-card hover:border-rd-accent transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-rd-ink">{job.title}</h3>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                        job.job_type === "full-time" ? "bg-green-50 text-rd-success" :
                        job.job_type === "internship" ? "bg-rd-accent-lt text-rd-accent" :
                        "bg-gray-100 text-rd-muted"
                      }`}>
                        {job.job_type}
                      </span>
                      {hasApplied && (
                        <span className="text-[10px] font-semibold text-rd-info border border-rd-info/30 bg-blue-50 px-2 py-0.5 rounded-full uppercase">
                          Applied
                        </span>
                      )}
                    </div>
                    <p className="text-rd-accent font-medium text-sm mb-2">{job.company}</p>
                    {job.description && (
                      <p className="text-sm text-rd-muted line-clamp-2 mb-3">{job.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-rd-muted flex-wrap">
                      {job.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {job.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {timeAgo(job.created_at)}
                      </span>
                    </div>
                    {job.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {job.skills.map((s: string) => (
                          <span key={s} className="rd-tag text-xs">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Apply CTA */}
                  <div className="shrink-0">
                    {job.apply_url ? (
                      <ApplyButton
                        jobId={job.id}
                        userId={user.id}
                        applyUrl={job.apply_url}
                        hasApplied={hasApplied}
                      />
                    ) : (
                      <span className="text-xs text-rd-muted">No link</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─ Client component wrapper is needed to call supabase on click ─
// We'll use a server action-style approach via a separate client component
import ApplyButton from "@/components/jobs/ApplyButton";
