import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { NOTIFICATION_LIMIT } from "@/lib/constants";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(NOTIFICATION_LIMIT);

  const unreadCount =
    notifications?.filter((n) => !n.read).length ?? 0;

  return (
    <div className="flex h-screen bg-rd-paper overflow-hidden">
      {/* Fixed sidebar */}
      <Sidebar role={profile.role} unreadCount={unreadCount} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 ml-[240px]">
        <Topbar
          profile={profile}
          notifications={notifications ?? []}
        />
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-content mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
