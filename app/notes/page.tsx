"use client";

import { useEffect, useMemo, useState } from "react";
import NoteCard from "@/components/NoteCard";
import type { Note } from "@/types/models";

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadNotes() {
      try {
        const response = await fetch("/api/notes", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Could not load notes.");
        setNotes(payload.notes ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load notes.");
      } finally {
        setIsLoading(false);
      }
    }

    loadNotes();
  }, []);

  const filteredNotes = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return notes;
    return notes.filter((note) => {
      const haystack = [note.title, note.original_text, note.ai_summary, note.ai_context, ...(note.themes ?? [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(search);
    });
  }, [notes, query]);

  return (
    <section className="stack">
      <div className="stack">
        <p className="eyebrow">Notes</p>
        <h1>Thought log</h1>
        <p className="lede">Browse, search and reopen captured thoughts.</p>
      </div>

      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search notes, themes or context…" />

      {isLoading ? <p>Loading notes…</p> : null}
      {error ? <div className="error">{error}</div> : null}
      {!isLoading && !error && filteredNotes.length === 0 ? <p>No notes found yet.</p> : null}

      <div className="note-list">
        {filteredNotes.map((note) => (
          <NoteCard key={note.id} note={note} />
        ))}
      </div>
    </section>
  );
}
