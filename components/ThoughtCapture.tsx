"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

type CreatedNote = {
  id: string;
  title: string | null;
  ai_summary: string | null;
};

export default function ThoughtCapture() {
  const [thought, setThought] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [created, setCreated] = useState<CreatedNote | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submitThought(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!thought.trim()) return;

    setIsSaving(true);
    setError(null);
    setCreated(null);

    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: thought })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not save thought.");
      }

      setCreated(payload.note);
      setThought("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save thought.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="card stack" onSubmit={submitThought}>
      <div className="stack">
        <p className="eyebrow">Capture</p>
        <h2>Drop the thought here.</h2>
        <p>
          Write it roughly. The app will turn it into a note, add context, suggest themes and look for connections.
        </p>
      </div>

      <textarea
        aria-label="Thought"
        value={thought}
        onChange={(event) => setThought(event.target.value)}
        placeholder="I keep thinking that..."
      />

      <div className="button-row">
        <button type="submit" disabled={isSaving || !thought.trim()}>
          {isSaving ? "Saving and enriching…" : "Save thought"}
        </button>
        <Link href="/notes" className="button secondary">
          Browse notes
        </Link>
      </div>

      {created ? (
        <div className="callout stack">
          <strong>{created.title ?? "Thought saved"}</strong>
          {created.ai_summary ? <p>{created.ai_summary}</p> : null}
          <Link href={`/notes/${created.id}`} className="button secondary">
            Open note
          </Link>
        </div>
      ) : null}

      {error ? <div className="error">{error}</div> : null}
    </form>
  );
}
