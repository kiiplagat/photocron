"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Photo, Profile } from "@/lib/types";
import PhotoCard from "@/components/PhotoCard";

function groupByMonth(photos: Photo[]) {
  const groups = new Map<string, Photo[]>();
  for (const photo of photos) {
    const d = new Date(photo.taken_at + "T00:00:00");
    const key = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(photo);
  }
  return groups;
}

export default function ProfilePage() {
  const params = useParams<{ username: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isSelf, setIsSelf] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadPhotos(ownerId: string) {
    const { data: photoData } = await supabase
      .from("photos")
      .select("*")
      .eq("user_id", ownerId)
      .order("taken_at", { ascending: false });
    setPhotos((photoData as Photo[]) ?? []);
  }

  useEffect(() => {
    async function load() {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", params.username)
        .single();

      if (!profileData) {
        setLoading(false);
        return;
      }
      setProfile(profileData as Profile);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setIsSelf(user.id === profileData.id);
        const { data: followRow } = await supabase
          .from("follows")
          .select("*")
          .eq("follower_id", user.id)
          .eq("following_id", profileData.id)
          .maybeSingle();
        setIsFollowing(!!followRow);
      }

      // RLS restricts this to whatever rows the viewer is allowed to see.
      await loadPhotos(profileData.id);
      setLoading(false);
    }
    load();
  }, [params.username]);

  async function toggleFollow() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !profile) return;

    if (isFollowing) {
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", profile.id);
      setIsFollowing(false);
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: profile.id });
      setIsFollowing(true);
    }
  }

  if (loading) return <p className="text-muted">Loading...</p>;
  if (!profile) return <p className="text-muted">No one here by that name.</p>;

  const groups = groupByMonth(photos);

  return (
    <div>
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h1 className="font-display text-2xl text-ivory">@{profile.username}</h1>
          {profile.bio && <p className="mt-1 text-sm text-muted">{profile.bio}</p>}
        </div>
        {!isSelf && (
          <button
            onClick={toggleFollow}
            className={`rounded-full border px-4 py-1.5 text-sm ${
              isFollowing
                ? "border-border text-muted hover:text-ivory"
                : "border-safelight bg-safelight text-ivory"
            }`}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        )}
      </div>

      {photos.length === 0 ? (
        <p className="mt-6 text-muted">No photos visible here.</p>
      ) : (
        Array.from(groups.entries()).map(([month, monthPhotos]) => (
          <section key={month} className="mt-8">
            <h2 className="mb-3 font-display text-lg text-gold">{month}</h2>
            <div className="sprocket-rail">
              {monthPhotos.map((photo) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  isOwner={isSelf}
                  onChange={() => loadPhotos(profile.id)}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
