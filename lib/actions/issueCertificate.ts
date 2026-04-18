"use server";

import { createClient } from "@/lib/supabase/server";
import { generateCertId } from "@/lib/utils";
import { CERT_ID_PREFIX, STORAGE_BUCKETS } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Checks if a student has completed all lessons in a course (100%).
 * If yes — issues a certificate exactly once (Behavioral Rule #2).
 * Returns the certificate record if issued or already exists.
 */
export async function issueCertificateIfComplete(
  studentId: string,
  courseId: string
): Promise<{ issued: boolean; certId: string | null }> {
  const supabase = await createClient();

  // Behavioral Rule #2: check before generating
  const { data: existing } = await supabase
    .from("certificates")
    .select("cert_id")
    .eq("student_id", studentId)
    .eq("course_id", courseId)
    .single();

  if (existing) {
    return { issued: false, certId: existing.cert_id };
  }

  // Check progress_pct — trigger keeps this up to date
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("progress_pct")
    .eq("student_id", studentId)
    .eq("course_id", courseId)
    .single();

  if (!enrollment || enrollment.progress_pct < 100) {
    return { issued: false, certId: null };
  }

  // Fetch student + course for the PDF
  const [{ data: student }, { data: course }] = await Promise.all([
    supabase.from("profiles").select("full_name, email:id").eq("id", studentId).single(),
    supabase.from("courses").select("title, instructor:profiles!instructor_id(full_name)").eq("id", courseId).single(),
  ]);

  if (!student || !course) return { issued: false, certId: null };

  // Generate cert ID — Behavioral Rule #2
  const certId = `${CERT_ID_PREFIX}-${new Date().getFullYear()}-${generateCertId().split("-").pop()}`;

  // Generate PDF (lazy import to avoid SSR issues)
  const { generateCertificatePdf } = await import("@/lib/pdf/generateCertificate");
  const pdfBuffer = await generateCertificatePdf({
    studentName: student.full_name,
    courseTitle: course.title,
    instructorName: (course.instructor as any)?.full_name ?? "Restless Dreamers",
    certId,
    issuedAt: new Date(),
  });

  // Upload PDF to storage
  const pdfPath = `${studentId}/${certId}.pdf`;
  const { data: uploadData } = await supabase.storage
    .from(STORAGE_BUCKETS.CERTIFICATES)
    .upload(pdfPath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: false,
    });

  let certUrl: string | null = null;
  if (uploadData?.path) {
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKETS.CERTIFICATES)
      .getPublicUrl(uploadData.path);
    certUrl = publicUrl;
  }

  // Insert exactly once — unique constraint on (student_id, course_id) guards duplicates
  const { data: cert, error } = await supabase
    .from("certificates")
    .insert({
      cert_id: certId,
      student_id: studentId,
      course_id: courseId,
      cert_url: certUrl,
    })
    .select("cert_id")
    .single();

  if (error || !cert) {
    // Duplicate race — already exists
    return { issued: false, certId: null };
  }

  // Notify student
  await supabase.from("notifications").insert({
    user_id: studentId,
    type: "certificate",
    title: `Certificate issued: ${course.title}`,
    body: `Your certificate ID is ${certId}. Download it from My Certificates.`,
    link: `/verify/${certId}`,
  });

  // Send email (Resend)
  try {
    const { data: userAuth } = await supabase.auth.admin.getUserById(studentId);
    if (userAuth.user?.email) {
      await resend.emails.send({
        from: "Restless Dreamers <noreply@restlessdreamers.in>",
        to: userAuth.user.email,
        subject: `🎓 Certificate: ${course.title}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
            <h1 style="color: #0F0F0F; font-size: 24px; margin-bottom: 8px;">Congratulations, ${student.full_name}!</h1>
            <p style="color: #888884; font-size: 16px; margin-bottom: 24px;">You have successfully completed <strong style="color: #0F0F0F">${course.title}</strong>.</p>
            <div style="background: #FEF3C7; border-left: 4px solid #D97706; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
              <p style="margin: 0; color: #92400E; font-size: 14px;">Certificate ID: <strong>${certId}</strong></p>
            </div>
            ${certUrl ? `<a href="${certUrl}" style="display: inline-block; background: #D97706; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-bottom: 16px;">Download Certificate PDF</a>` : ""}
            <p style="color: #888884; font-size: 14px;"><a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://restlessdreamers.in"}/verify/${certId}" style="color: #D97706;">Verify this certificate</a></p>
          </div>
        `,
      });
    }
  } catch (emailErr) {
    console.error("[Certificate] Email send failed:", emailErr);
  }

  revalidatePath("/certificates");
  return { issued: true, certId: cert.cert_id };
}
