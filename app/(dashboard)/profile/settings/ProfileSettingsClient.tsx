"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Save, Camera } from "lucide-react";
import { STORAGE_BUCKETS, BIO_MAX_CHARS } from "@/lib/constants";

interface Props {
  profile: {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string | null;
    bio: string | null;
    headline: string | null;
    linkedin_url: string | null;
    github_url: string | null;
    website_url: string | null;
  };
}

export default function ProfileSettingsClient({ profile }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState(profile.full_name);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [headline, setHeadline] = useState(profile.headline ?? "");
  const [linkedin, setLinkedin] = useState(profile.linkedin_url ?? "");
  const [github, setGithub] = useState(profile.github_url ?? "");
  const [website, setWebsite] = useState(profile.website_url ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);

    const path = `${profile.id}/avatar.${file.name.split(".").pop()}`;
    const { data } = await supabase.storage
      .from(STORAGE_BUCKETS.AVATARS)
      .upload(path, file, { upsert: true });

    if (data?.path) {
      const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_BUCKETS.AVATARS)
        .getPublicUrl(data.path);
      setAvatarUrl(publicUrl);
    }
    setAvatarLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        bio: bio || null,
        headline: headline || null,
        linkedin_url: linkedin || null,
        github_url: github || null,
        website_url: website || null,
        avatar_url: avatarUrl,
      })
      .eq("id", profile.id);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  };

  return (
    <div className="max-w-lg space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-rd-accent text-white text-xl font-bold flex items-center justify-center overflow-hidden">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              fullName[0]
            )}
          </div>
          <label className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-rd-accent text-white flex items-center justify-center cursor-pointer hover:bg-rd-accent-dk transition-colors">
            {avatarLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Camera className="w-3 h-3" />
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={avatarLoading} />
          </label>
        </div>
        <div>
          <p className="text-sm font-medium text-rd-ink">Profile photo</p>
          <p className="text-xs text-rd-muted">JPG, PNG, or GIF. Max 2MB.</p>
        </div>
      </div>

      {/* Full name */}
      <div>
        <label className="block text-sm font-medium text-rd-ink mb-1.5">Full name</label>
        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="rd-input" />
      </div>

      {/* Username (read-only) */}
      <div>
        <label className="block text-sm font-medium text-rd-ink mb-1.5">Username</label>
        <input type="text" value={profile.username} readOnly className="rd-input opacity-60 cursor-not-allowed" />
        <p className="text-xs text-rd-muted mt-1">Username cannot be changed.</p>
      </div>

      {/* Headline */}
      <div>
        <label className="block text-sm font-medium text-rd-ink mb-1.5">Headline</label>
        <input
          type="text"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="e.g. Full-stack developer & educator"
          className="rd-input"
          maxLength={120}
        />
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium text-rd-ink mb-1.5">
          Bio <span className="text-rd-muted text-xs">({bio.length}/{BIO_MAX_CHARS})</span>
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          className="rd-input resize-none"
          maxLength={BIO_MAX_CHARS}
          placeholder="Tell people about yourself…"
        />
      </div>

      {/* Social links */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-rd-ink">Social links</h3>
        {[
          { label: "GitHub", value: github, onChange: setGithub, placeholder: "https://github.com/username" },
          { label: "LinkedIn", value: linkedin, onChange: setLinkedin, placeholder: "https://linkedin.com/in/username" },
          { label: "Website", value: website, onChange: setWebsite, placeholder: "https://yoursite.com" },
        ].map(({ label, value, onChange, placeholder }) => (
          <div key={label}>
            <label className="block text-xs text-rd-muted mb-1">{label}</label>
            <input type="url" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="rd-input text-sm" />
          </div>
        ))}
      </div>

      <button onClick={handleSave} disabled={saving} className="rd-btn">
        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : saved ? "✓ Saved" : <><Save className="w-4 h-4" /> Save profile</>}
      </button>
    </div>
  );
}
