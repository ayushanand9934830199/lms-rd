import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileSettingsClient from "./ProfileSettingsClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Profile Settings" };

export default async function ProfileSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, username, avatar_url, bio, headline, linkedin_url, github_url, website_url")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-rd-ink mb-2">Profile Settings</h1>
      <p className="text-rd-muted mb-8">Update your public profile and preferences.</p>
      <ProfileSettingsClient profile={profile} />
    </div>
  );
}
