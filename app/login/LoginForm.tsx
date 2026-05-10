"use client";

import { useState, type FormEvent } from "react";

export default function LoginForm({ nextPath }: { nextPath: string }) {
  const [password, setPassword] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSigningIn(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not sign in.");
      window.location.href = nextPath;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setIsSigningIn(false);
    }
  }

  return (
    <form className="card stack login-card" onSubmit={signIn}>
      <div className="stack">
        <p className="eyebrow">Private access</p>
        <h1>Sign in</h1>
        <p>Enter the app password to open your thought log.</p>
      </div>

      <label className="stack">
        <strong>Password</strong>
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          autoComplete="current-password"
          autoFocus
        />
      </label>

      <button type="submit" disabled={isSigningIn || !password}>
        {isSigningIn ? "Signing in..." : "Sign in"}
      </button>

      {error ? <div className="error">{error}</div> : null}
    </form>
  );
}
