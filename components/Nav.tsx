"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function Nav() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSignedIn(!!data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-display text-xl tracking-tight text-ivory">
          Photochron
        </Link>
        <nav className="flex items-center gap-5 text-sm text-muted">
          <Link href="/" className="hover:text-ivory">
            Feed
          </Link>
          <Link href="/explore" className="hover:text-ivory">
            Explore
          </Link>
          {signedIn ? (
            <>
              <Link href="/upload" className="hover:text-ivory">
                Upload
              </Link>
              <Link href="/settings" className="hover:text-ivory">
                Settings
              </Link>
              <button
                onClick={() => supabase.auth.signOut()}
                className="rounded-full border border-border px-3 py-1 hover:border-safelight hover:text-ivory"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full border border-border px-3 py-1 hover:border-safelight hover:text-ivory"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
