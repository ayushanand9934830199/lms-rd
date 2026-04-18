import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Award, CheckCircle, ExternalLink } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import type { Metadata } from "next";

interface Props { params: { certId: string } }

export const metadata: Metadata = { title: "Verify Certificate" };

export default async function VerifyCertPage({ params }: Props) {
  const supabase = await createClient();

  const { data: cert } = await supabase
    .from("certificates")
    .select(`
      id, cert_id, issued_at, cert_url,
      student:profiles!student_id(id, full_name, username),
      course:courses(id, title, slug,
        instructor:profiles!instructor_id(full_name))
    `)
    .eq("cert_id", params.certId)
    .single();

  if (!cert) notFound();

  return (
    <div className="min-h-screen bg-rd-paper flex flex-col items-center justify-center p-6">
      {/* Verification card */}
      <div className="max-w-md w-full">
        {/* Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-rd-ink">
            <span className="text-2xl">🔥</span>
            <span className="font-display text-xl font-semibold">Restless Dreamers</span>
          </Link>
        </div>

        <div className="rd-card text-center">
          {/* Verified badge */}
          <div className="w-20 h-20 mx-auto rounded-full bg-green-50 border-2 border-rd-success flex items-center justify-center mb-5">
            <CheckCircle className="w-10 h-10 text-rd-success" />
          </div>

          <div className="rd-badge mx-auto w-fit mb-2 text-rd-success border-rd-success/30 bg-green-50">
            ✓ Certificate Verified
          </div>

          <h1 className="font-display text-2xl font-semibold text-rd-ink mt-4 mb-1">
            {(cert as any).student?.full_name}
          </h1>
          <p className="text-rd-muted text-sm mb-6">has successfully completed</p>

          <h2 className="font-display text-xl font-semibold text-rd-ink mb-1">
            {(cert as any).course?.title}
          </h2>
          <p className="text-sm text-rd-muted mb-6">
            by {(cert as any).course?.instructor?.full_name}
          </p>

          {/* Details */}
          <div className="border-t border-rd-border pt-5 space-y-2 text-left mb-5">
            <div className="flex justify-between text-sm">
              <span className="text-rd-muted">Certificate ID</span>
              <code className="text-rd-ink font-mono text-xs">{cert.cert_id}</code>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-rd-muted">Issued on</span>
              <span className="text-rd-ink">{formatDate(cert.issued_at)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Link href="/courses" className="rd-btn-secondary text-sm flex-1 justify-center">
              Explore Courses
            </Link>
            {cert.cert_url && (
              <a
                href={cert.cert_url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="rd-btn text-sm flex-1 justify-center"
              >
                Download PDF
              </a>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-rd-muted mt-6">
          This certificate was issued by Restless Dreamers and can be verified at{" "}
          <code>restlessdreamers.in/verify/{params.certId}</code>
        </p>
      </div>
    </div>
  );
}
