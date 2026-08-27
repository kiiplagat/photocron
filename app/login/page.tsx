"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === "signup") {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      });
      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }
      // The profile row is created automatically by a database trigger
      // (see supabase/trigger.sql), which sidesteps the RLS timing issue
      // where auth.uid() isn't set yet immediately after signUp().
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="font-display text-2xl text-ivory">
        {mode === "signin" ? "Welcome back" : "Create your account"}
      </h1>
      <p className="mt-1 text-sm text-muted">
        {mode === "signin"
          ? "Sign in to see your feed."
          : "Pick a username people will find you by."}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {mode === "signup" && (
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted">Username</label>
            <input
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded border border-border bg-panel px-3 py-2 text-ivory outline-none focus:border-safelight"
            />
          </div>
        )}
        <div>
          <label className="block text-xs uppercase tracking-widest text-muted">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border border-border bg-panel px-3 py-2 text-ivory outline-none focus:border-safelight"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-muted">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded border border-border bg-panel px-3 py-2 text-ivory outline-none focus:border-safelight"
          />
        </div>

        {error && <p className="text-sm text-safelight">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-safelight py-2 font-display text-ivory disabled:opacity-50"
        >
          {loading ? "Working..." : mode === "signin" ? "Sign in" : "Sign up"}
        </button>
      </form>

      <button
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        className="mt-4 text-sm text-muted hover:text-ivory"
      >
        {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
      </button>
    </div>
  );
}
