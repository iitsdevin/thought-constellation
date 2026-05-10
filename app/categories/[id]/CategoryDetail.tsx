"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import NoteCard from "@/components/NoteCard";
import type { Category, Note } from "@/types/models";

type CategoryPayload = {
  category: Category;
  notes: Note[];
};

export default function CategoryDetail({ id }: { id: string }) {
  const [payload, setPayload] = useState<CategoryPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSynthesising, setIsSynthesising] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadCategory() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/categories/${id}`, { cache: "no-store" });
      const nextPayload = await response.json();
      if (!response.ok) throw new Error(nextPayload.error ?? "Could not load category.");
      setPayload(nextPayload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load category.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCategory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function synthesise() {
    setIsSynthesising(true);
    setError(null);
    try {
      const response = await fetch(`/api/categories/${id}/synthesise`, { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not synthesise category.");
      await loadCategory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not synthesise category.");
    } finally {
      setIsSynthesising(false);
    }
  }

  if (isLoading) return <p>Loading category…</p>;
  if (error) return <div className="error">{error}</div>;
  if (!payload) return <p>Category not found.</p>;

  const { category, notes } = payload;

  return (
    <section className="stack">
      <div className="button-row">
        <Link href="/categories" className="button secondary">← Back to categories</Link>
        <button type="button" onClick={synthesise} disabled={isSynthesising}>
          {isSynthesising ? "Synthesising…" : "Synthesise category"}
        </button>
      </div>

      <div className="card stack">
        <p className="eyebrow">Category</p>
        <h1>{category.name}</h1>
        {category.description ? <p className="lede">{category.description}</p> : null}
      </div>

      <div className="card stack">
        <p className="eyebrow">Living synthesis</p>
        {category.ai_synthesis ? (
          <div className="stack">
            {category.ai_synthesis.split("\n").filter(Boolean).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
        ) : (
          <p>No synthesis yet. Use the synthesis button to generate one from connected notes.</p>
        )}
      </div>

      <div className="stack">
        <p className="eyebrow">Connected notes</p>
        <div className="note-list">
          {notes.map((note) => <NoteCard note={note} key={note.id} />)}
        </div>
      </div>
    </section>
  );
}
