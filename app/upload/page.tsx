"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { enqueueUploads } from "@/lib/uploadQueue";
import { Privacy } from "@/lib/types";

interface PendingPhoto {
  id: string;
  file: File;
  previewUrl: string;
  takenAt: string;
  caption: string;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function UploadPage() {
  const router = useRouter();
  const [items, setItems] = useState<PendingPhoto[]>([]);
  const [privacy, setPrivacy] = useState<Privacy>("public");
  const [error, setError] = useState<string | null>(null);

  function handleFilesSelected(fileList: FileList | null) {
    if (!fileList) return;
    const newItems: PendingPhoto[] = Array.from(fileList).map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      takenAt: todayISO(),
      caption: "",
    }));
    setItems((prev) => [...prev, ...newItems]);
  }

  function updateItem(id: string, patch: Partial<PendingPhoto>) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function removeItem(id: string) {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (items.length === 0) {
      setError("Add at least one photo.");
      return;
    }
    if (items.some((item) => !item.takenAt)) {
      setError("Every photo needs a date taken.");
      return;
    }

    try {
      // Hands off to the background queue and returns immediately — the
      // actual uploads keep running after we navigate away.
      await enqueueUploads(
        items.map((item) => ({ file: item.file, takenAt: item.takenAt, caption: item.caption })),
        privacy
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      return;
    }

    router.push("/");
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="font-display text-2xl text-ivory">Add photos</h1>
      <p className="mt-1 text-sm text-muted">
        Pick as many as you like, set each one&apos;s date, then post — you can head back to the
        feed right away while they finish uploading in the background.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div>
          <label className="block text-xs uppercase tracking-widest text-muted">Photos</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFilesSelected(e.target.files)}
            className="mt-1 w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-safelight file:px-3 file:py-1.5 file:text-ivory"
          />
        </div>

        {items.length > 0 && (
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={item.id} className="flex gap-3 rounded-lg border border-border bg-panel p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.previewUrl}
                  alt={`Preview ${index + 1}`}
                  className="h-20 w-20 shrink-0 rounded object-cover"
                />
                <div className="flex-1 space-y-2">
                  <input
                    type="date"
                    required
                    value={item.takenAt}
                    onChange={(e) => updateItem(item.id, { takenAt: e.target.value })}
                    className="w-full rounded border border-border bg-canvas px-2 py-1 text-sm text-ivory outline-none focus:border-safelight"
                  />
                  <input
                    value={item.caption}
                    onChange={(e) => updateItem(item.id, { caption: e.target.value })}
                    placeholder="Caption (optional)"
                    className="w-full rounded border border-border bg-canvas px-2 py-1 text-sm text-ivory outline-none focus:border-safelight"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="self-start text-xs text-muted hover:text-safelight"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <div>
          <label className="block text-xs uppercase tracking-widest text-muted">
            Who can see these
          </label>
          <div className="mt-2 flex gap-2">
            {(["public", "followers", "private"] as Privacy[]).map((option) => (
              <button
                type="button"
                key={option}
                onClick={() => setPrivacy(option)}
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  privacy === option
                    ? "border-safelight bg-safelight text-ivory"
                    : "border-border text-muted hover:text-ivory"
                }`}
              >
                {option === "public" ? "Public" : option === "followers" ? "Followers" : "Only you"}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-muted">Applies to every photo in this batch.</p>
        </div>

        {error && <p className="text-sm text-safelight">{error}</p>}

        <button
          type="submit"
          disabled={items.length === 0}
          className="w-full rounded-full bg-safelight py-2 font-display text-ivory disabled:opacity-50"
        >
          {items.length > 1 ? `Post ${items.length} photos` : "Post photo"}
        </button>
      </form>
    </div>
  );
}
