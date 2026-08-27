"use client";

import { useEffect, useState } from "react";
import { clearFinishedUploads, QueuedUpload, subscribeToUploadQueue } from "@/lib/uploadQueue";

export default function UploadProgressWidget() {
  const [items, setItems] = useState<QueuedUpload[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToUploadQueue((next) => {
      setItems(next);
      if (next.some((i) => i.status === "pending" || i.status === "uploading")) {
        setDismissed(false);
      }
    });
    return unsubscribe;
  }, []);

  if (items.length === 0 || dismissed) return null;

  const total = items.length;
  const done = items.filter((i) => i.status === "done").length;
  const errored = items.filter((i) => i.status === "error").length;
  const allSettled = done + errored === total;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-lg border border-border bg-panel p-3 shadow-lg">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ivory">
          {allSettled
            ? errored > 0
              ? `${done}/${total} uploaded, ${errored} failed`
              : `${total} photo${total > 1 ? "s" : ""} uploaded`
            : `Uploading ${done + 1}/${total}...`}
        </p>
        <button
          onClick={() => {
            if (allSettled) clearFinishedUploads();
            setDismissed(true);
          }}
          className="text-xs text-muted hover:text-ivory"
        >
          {allSettled ? "Dismiss" : "Hide"}
        </button>
      </div>
      {!allSettled && (
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-canvas">
          <div
            className="h-full bg-safelight transition-all"
            style={{ width: `${(done / total) * 100}%` }}
          />
        </div>
      )}
      {errored > 0 && (
        <ul className="mt-2 space-y-0.5 text-xs text-safelight">
          {items
            .filter((i) => i.status === "error")
            .map((i) => (
              <li key={i.id}>
                {i.fileName}: {i.errorMessage}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
