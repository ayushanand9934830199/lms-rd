import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { studentId, lessonTitle, score, maxScore, feedback } = await req.json();

    const supabase = await createClient();
    const { data: userAuth } = await supabase.auth.admin.getUserById(studentId);
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", studentId).single();

    if (!userAuth.user?.email) {
      return NextResponse.json({ error: "No email found" }, { status: 404 });
    }

    const pct = Math.round((score / maxScore) * 100);

    await resend.emails.send({
      from: "Restless Dreamers <noreply@restlessdreamers.in>",
      to: userAuth.user.email,
      subject: `Your assignment has been graded — ${lessonTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
          <h1 style="color: #0F0F0F; font-size: 22px; margin-bottom: 8px;">Assignment Graded</h1>
          <p style="color: #888884; font-size: 15px;">Hi ${profile?.full_name ?? "there"},</p>
          <p style="color: #0F0F0F; font-size: 15px; margin-bottom: 24px;">Your assignment for <strong>${lessonTitle}</strong> has been reviewed.</p>
          <div style="background: ${pct >= 70 ? "#F0FDF4" : "#FEF2F2"}; border-left: 4px solid ${pct >= 70 ? "#16A34A" : "#DC2626"}; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 20px; font-weight: bold; color: #0F0F0F;">${score} / ${maxScore} <span style="font-size: 14px; color: #888884;">(${pct}%)</span></p>
          </div>
          ${feedback ? `
          <div style="margin-bottom: 24px;">
            <p style="color: #888884; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Instructor Feedback</p>
            <p style="color: #0F0F0F; font-size: 15px; line-height: 1.6;">${feedback}</p>
          </div>` : ""}
          <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://restlessdreamers.in"}/my-courses" style="display: inline-block; background: #D97706; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">Continue Learning →</a>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[email/assignment-graded]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
