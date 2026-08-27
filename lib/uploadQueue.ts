"use client";

import { supabase } from "@/lib/supabase/client";
import { Privacy } from "@/lib/types";

export interface QueuedUpload {
  id: string;
  fileName: string;
  previewUrl: string;
  status: "pending" | "uploading" | "done" | "error";
  errorMessage?: string;
}

type Listener = (items: QueuedUpload[]) => void;

// Module-level state: persists across page navigations within the same
// browser tab because it isn't tied to any single component's lifecycle.
let queue: QueuedUpload[] = [];
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener([...queue]);
}

export function subscribeToUploadQueue(listener: Listener): () => void {
  listeners.add(listener);
  listener([...queue]);
  return () => listeners.delete(listener);
}

export function clearFinishedUploads() {
  queue = queue.filter((item) => item.status !== "done");
  emit();
}

interface UploadInput {
  file: File;
  takenAt: string;
  caption: string;
}

export async function enqueueUploads(items: UploadInput[], privacy: Privacy) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You need to be signed in.");
  }

  const queuedItems: QueuedUpload[] = items.map((item) => ({
    id: `${item.file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    fileName: item.file.name,
    previewUrl: URL.createObjectURL(item.file),
    status: "pending",
  }));

  queue = [...queue, ...queuedItems];
  emit();

  // Fire and forget: runs independently of whatever page is mounted.
  (async () => {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const queuedItem = queuedItems[i];

      queue = queue.map((q) => (q.id === queuedItem.id ? { ...q, status: "uploading" } : q));
      emit();

      const path = `${user.id}/${Date.now()}-${item.file.name}`;
      const { error: uploadError } = await supabase.storage.from("photos").upload(path, item.file);

      if (uploadError) {
        queue = queue.map((q) =>
          q.id === queuedItem.id ? { ...q, status: "error", errorMessage: uploadError.message } : q
        );
        emit();
        continue;
      }

      const { data: publicUrlData } = supabase.storage.from("photos").getPublicUrl(path);

      const { error: insertError } = await supabase.from("photos").insert({
        user_id: user.id,
        image_url: publicUrlData.publicUrl,
        taken_at: item.takenAt,
        caption: item.caption || null,
        privacy,
      });

      if (insertError) {
        queue = queue.map((q) =>
          q.id === queuedItem.id ? { ...q, status: "error", errorMessage: insertError.message } : q
        );
        emit();
        continue;
      }

      queue = queue.map((q) => (q.id === queuedItem.id ? { ...q, status: "done" } : q));
      emit();
    }
  })();
}
