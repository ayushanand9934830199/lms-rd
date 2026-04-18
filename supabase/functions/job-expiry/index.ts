import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * Job Expiry Cron — Behavioral Rule #10
 * Runs daily, marks expired job_postings as inactive.
 * Scheduled via Supabase Dashboard → Edge Functions → Cron: 0 0 * * *
 */
Deno.serve(async (req: Request) => {
  // Verify cron secret to prevent unauthorized invocation
  const authHeader = req.headers.get("Authorization");
  const cronSecret = Deno.env.get("CRON_SECRET");
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const now = new Date().toISOString();

  // Mark expired jobs as inactive
  const { data, error } = await supabase
    .from("job_postings")
    .update({ is_active: false })
    .eq("is_active", true)
    .lt("expires_at", now)
    .not("expires_at", "is", null)
    .select("id, title, company");

  if (error) {
    console.error("[job-expiry] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  console.log(`[job-expiry] Expired ${data?.length ?? 0} jobs:`, data?.map((j) => `${j.company}: ${j.title}`));

  return new Response(
    JSON.stringify({
      ok: true,
      expired: data?.length ?? 0,
      jobs: data?.map((j) => ({ id: j.id, title: j.title, company: j.company })),
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json", "Connection": "keep-alive" },
    }
  );
});
