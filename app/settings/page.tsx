"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Profile } from "@/lib/types";

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bio, setBio] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (data) {
        setProfile(data as Profile);
        setBio((data as Profile).bio ?? "");
      }
    }
    load();
  }, [router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setError(null);
    setSaving(true);

    let avatar_url = profile.avatar_url;

    if (file) {
      const path = `${profile.id}/avatar-${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, {
        upsert: true,
      });
      if (uploadError) {
        setError(uploadError.message);
        setSaving(false);
        return;
      }
      const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(path);
      avatar_url = publicUrlData.publicUrl;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ bio: bio || null, avatar_url })
      .eq("id", profile.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    router.push(`/profile/${profile.username}`);
  }

  if (!profile) return <p className="text-muted">Loading...</p>;

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="font-display text-2xl text-ivory">Account settings</h1>
      <p className="mt-1 text-sm text-muted">@{profile.username}</p>

      <form onSubmit={handleSave} className="mt-6 space-y-4">
        <div>
          <label className="block text-xs uppercase tracking-widest text-muted">Avatar</label>
          {profile.avatar_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt="Current avatar"
              className="mt-2 h-16 w-16 rounded-full border border-border object-cover"
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-2 w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-safelight file:px-3 file:py-1.5 file:text-ivory"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-muted">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded border border-border bg-panel px-3 py-2 text-ivory outline-none focus:border-safelight"
          />
        </div>

        {error && <p className="text-sm text-safelight">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-full bg-safelight py-2 font-display text-ivory disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  );
}
