"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Photo } from "@/lib/types";
import PhotoCard from "@/components/PhotoCard";

export default function FeedPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  async function loadPhotos() {
    // RLS handles exactly which rows are visible: public photos,
    // followers-only photos from people this user follows, and
    // this user's own private photos.
    const { data } = await supabase
      .from("photos")
      .select("*, profiles(id, username, avatar_url)")
      .order("taken_at", { ascending: false })
      .limit(50);

    setPhotos((data as Photo[]) ?? []);
  }

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setSignedIn(!!user);
      setUserId(user?.id ?? null);

      await loadPhotos();
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p className="text-muted">Loading feed...</p>;

  if (signedIn === false) {
    return (
      <div className="rounded-lg border border-border bg-panel p-8 text-center">
        <h1 className="font-display text-2xl text-ivory">See where everyone&apos;s been.</h1>
        <p className="mt-2 text-sm text-muted">
          Sign in to follow people and see their photos arranged by date.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block rounded-full bg-safelight px-4 py-2 font-display text-ivory"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-panel p-8 text-center">
        <p className="text-muted">
          Nothing here yet. Follow people on{" "}
          <Link href="/explore" className="text-safelight">
            Explore
          </Link>{" "}
          or post your first photo.
        </p>
      </div>
    );
  }

  return (
    <div className="sprocket-rail">
      {photos.map((photo) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          showOwner
          isOwner={photo.user_id === userId}
          onChange={loadPhotos}
        />
      ))}
    </div>
  );
}
