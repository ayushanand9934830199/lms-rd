import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Award, Download, ExternalLink } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Certificates" };

export default async function CertificatesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: certificates } = await supabase
    .from("certificates")
    .select(`
      id, cert_id, issued_at, cert_url,
      course:courses(id, title, slug, cover_image,
        instructor:profiles!instructor_id(full_name))
    `)
    .eq("student_id", user.id)
    .order("issued_at", { ascending: false });

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-rd-ink mb-2">My Certificates</h1>
      <p className="text-rd-muted mb-8">
        {certificates?.length ?? 0} certificate{certificates?.length !== 1 ? "s" : ""} earned
      </p>

      {!certificates || certificates.length === 0 ? (
        <div className="text-center py-16">
          <Award className="w-16 h-16 text-rd-border mx-auto mb-4" />
          <h2 className="font-display text-xl font-semibold text-rd-ink mb-2">
            No certificates yet
          </h2>
          <p className="text-rd-muted mb-6">
            Complete a course to earn your first certificate.
          </p>
          <Link href="/courses" className="rd-btn">Browse Courses →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {certificates.map((cert: any) => (
            <div key={cert.id} className="rd-card flex flex-col">
              {/* Certificate card */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-card bg-rd-accent-lt flex items-center justify-center shrink-0">
                  <Award className="w-7 h-7 text-rd-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-rd-ink text-sm truncate">
                    {cert.course?.title}
                  </h3>
                  <p className="text-xs text-rd-muted">
                    {cert.course?.instructor?.full_name}
                  </p>
                </div>
              </div>

              <div className="border-t border-rd-border pt-3 space-y-1 mb-4">
                <div className="flex justify-between text-xs">
                  <span className="text-rd-muted">Certificate ID</span>
                  <code className="text-rd-ink font-mono">{cert.cert_id}</code>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-rd-muted">Issued</span>
                  <span className="text-rd-ink">{formatDate(cert.issued_at)}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-auto">
                <Link
                  href={`/verify/${cert.cert_id}`}
                  className="rd-btn-secondary text-xs flex items-center gap-1.5 flex-1 justify-center"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Verify
                </Link>
                {cert.cert_url && (
                  <a
                    href={cert.cert_url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rd-btn text-xs flex items-center gap-1.5 flex-1 justify-center"
                  >
                    <Download className="w-3.5 h-3.5" /> Download PDF
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
