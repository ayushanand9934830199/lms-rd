import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/scorm/serve?lesson=<lessonId>&entry=<entryPoint>
 *
 * Redirects to the public Supabase storage URL for the SCORM entry file.
 * For a production setup, this would unzip on-demand and serve the files.
 * Here we serve the zip's public URL and let the browser handle it, or
 * redirect to the hosted entry point within the extracted package.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lessonId = searchParams.get("lesson");
  const entry = searchParams.get("entry") ?? "index.html";

  if (!lessonId) {
    return new NextResponse("Missing lesson param", { status: 400 });
  }

  const supabase = await createClient();

  const { data: lesson } = await supabase
    .from("lessons")
    .select("scorm_package_url, scorm_entry_point")
    .eq("id", lessonId)
    .single();

  if (!lesson?.scorm_package_url) {
    return new NextResponse("SCORM package not found", { status: 404 });
  }

  // Serve the SCORM entry point from the Supabase CDN.
  // The package URL points to a directory in storage (after extraction).
  // Pattern: storage/{bucket}/{userId}/{lessonId}/
  const baseUrl = lesson.scorm_package_url.replace(/\/[^/]+$/, "");
  const entryUrl = `${baseUrl}/${entry}`;

  return NextResponse.redirect(entryUrl);
}
