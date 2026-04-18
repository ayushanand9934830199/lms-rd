import { NextResponse } from "next/server";
import { issueCertificateIfComplete } from "@/lib/actions/issueCertificate";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/certificates/issue
 * Body: { courseId, userId }
 * 
 * Called from client-side MarkCompleteButton after the final lesson is marked done.
 * The actual logic (Behavioral Rule #2 guard) lives in issueCertificateIfComplete.
 */
export async function POST(req: Request) {
  try {
    const { courseId, userId } = await req.json();

    if (!courseId || !userId) {
      return NextResponse.json({ error: "Missing courseId or userId" }, { status: 400 });
    }

    // Verify the requester is who they claim to be
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await issueCertificateIfComplete(userId, courseId);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[api/certificates/issue]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
