"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Profile } from "@/lib/types";

export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .ilike("username", `%${query}%`)
      .limit(20);
    setResults((data as Profile[]) ?? []);
    setSearched(true);
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-ivory">Explore</h1>
      <p className="mt-1 text-sm text-muted">Find people by username and follow them.</p>

      <form onSubmit={handleSearch} className="mt-6 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search username"
          className="flex-1 rounded border border-border bg-panel px-3 py-2 text-ivory outline-none focus:border-safelight"
        />
        <button
          type="submit"
          className="rounded-full bg-safelight px-4 py-2 font-display text-ivory"
        >
          Search
        </button>
      </form>

      <div className="mt-6 space-y-3">
        {results.map((profile) => (
          <Link
            key={profile.id}
            href={`/profile/${profile.username}`}
            className="block rounded border border-border bg-panel px-4 py-3 hover:border-safelight"
          >
            <p className="font-display text-ivory">@{profile.username}</p>
            {profile.bio && <p className="text-sm text-muted">{profile.bio}</p>}
          </Link>
        ))}
        {searched && results.length === 0 && (
          <p className="text-muted">No one matches that search.</p>
        )}
      </div>
    </div>
  );
}
