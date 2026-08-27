"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Photo, Privacy } from "@/lib/types";

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const privacyLabel: Record<Photo["privacy"], string> = {
  public: "Public",
  followers: "Followers",
  private: "Only you",
};

export default function PhotoCard({
  photo,
  showOwner = false,
  isOwner = false,
  onChange,
}: {
  photo: Photo;
  showOwner?: boolean;
  isOwner?: boolean;
  onChange?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [caption, setCaption] = useState(photo.caption ?? "");
  const [privacy, setPrivacy] = useState<Privacy>(photo.privacy);
  const [saving, setSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSave() {
    setSaving(true);
    await supabase.from("photos").update({ caption: caption || null, privacy }).eq("id", photo.id);
    setSaving(false);
    setEditing(false);
    onChange?.();
  }

  async function handleDelete() {
    if (!confirm("Delete this photo? This can't be undone.")) return;
    await supabase.from("photos").delete().eq("id", photo.id);
    onChange?.();
  }

  return (
    <article
      className={`mb-6 overflow-hidden rounded-lg border border-border bg-panel ${
        menuOpen ? "relative z-20" : ""
      }`}
    >      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.image_url} alt={photo.caption ?? "Photo"} className="w-full object-cover" />

      {editing ? (
        <div className="space-y-3 px-4 py-3">
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Caption"
            className="w-full rounded border border-border bg-canvas px-3 py-1.5 text-sm text-ivory outline-none focus:border-safelight"
          />
          <div className="flex gap-2">
            {(["public", "followers", "private"] as Privacy[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setPrivacy(option)}
                className={`rounded-full border px-2.5 py-1 text-xs ${
                  privacy === option
                    ? "border-safelight bg-safelight text-ivory"
                    : "border-border text-muted hover:text-ivory"
                }`}
              >
                {privacyLabel[option]}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-full bg-safelight px-3 py-1 text-xs text-ivory disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-full border border-border px-3 py-1 text-xs text-muted hover:text-ivory"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            {showOwner && photo.profiles && (
              <Link
                href={`/profile/${photo.profiles.username}`}
                className="font-display text-sm text-ivory hover:text-safelight"
              >
                @{photo.profiles.username}
              </Link>
            )}
            {photo.caption && <p className="text-sm text-muted">{photo.caption}</p>}
          </div>
          <div className="flex items-start gap-2">
            <div className="text-right">
              <p className="date-stamp text-xs text-gold">{formatDate(photo.taken_at)}</p>
              <p className="text-[10px] uppercase tracking-widest text-muted">
                {privacyLabel[photo.privacy]}
              </p>
            </div>
            {isOwner && (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="rounded-full border border-border px-2 py-0.5 text-xs text-muted hover:text-ivory"
                >
                  ⋯
                </button>
                {menuOpen && (
                  <div className="absolute bottom-6 right-0 z-20 w-28 rounded border border-border bg-panel py-1 shadow-lg">
                    <button
                      onClick={() => {
                        setEditing(true);
                        setMenuOpen(false);
                      }}
                      className="block w-full px-3 py-1.5 text-left text-xs text-ivory hover:bg-canvas"
                    >
                      Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      className="block w-full px-3 py-1.5 text-left text-xs text-safelight hover:bg-canvas"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
