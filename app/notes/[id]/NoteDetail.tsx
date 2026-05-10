"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import type { Category, Note, Tag } from "@/types/models";

type LinkRow = {
  id: string;
  relationship_type: string;
  reason: string | null;
  confidence: number | null;
  target: { id: string; title: string | null; ai_summary: string | null } | null;
};

type NotePayload = {
  note: Note;
  categories: Category[];
  tags: Tag[];
  links: LinkRow[];
};

export default function NoteDetail({ id }: { id: string }) {
  const [payload, setPayload] = useState<NotePayload | null>(null);
  const [originalText, setOriginalText] = useState("");
  const [expansion, setExpansion] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function loadNote() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/notes/${id}`, { cache: "no-store" });
      const nextPayload = await response.json();
      if (!response.ok) throw new Error(nextPayload.error ?? "Could not load note.");
      setPayload(nextPayload);
      setOriginalText(nextPayload.note.original_text ?? "");
      setExpansion(nextPayload.note.user_expansion ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load note.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadNote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function addCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!categoryName.trim()) return;

    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/notes/${id}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: categoryName })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not connect category.");
      setCategoryName("");
      await loadNote();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not connect category.");
    } finally {
      setIsSaving(false);
    }
  }

  async function save(refreshAi: boolean) {
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ original_text: originalText, user_expansion: expansion, refresh_ai: refreshAi })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not save note.");
      await loadNote();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save note.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <p>Loading note…</p>;
  if (error) return <div className="error">{error}</div>;
  if (!payload) return <p>Note not found.</p>;

  const { note, categories, tags, links } = payload;

  return (
    <section className="stack">
      <div className="button-row">
        <Link href="/notes" className="button secondary">← Back to notes</Link>
      </div>

      <div className="grid two">
        <div className="card stack">
          <p className="eyebrow">Note</p>
          <h2>{note.title ?? "Untitled thought"}</h2>
          <p>{note.ai_summary}</p>

          <label className="stack">
            <strong>Original thought</strong>
            <textarea value={originalText} onChange={(event) => setOriginalText(event.target.value)} />
          </label>

          <label className="stack">
            <strong>Add more information</strong>
            <textarea
              value={expansion}
              onChange={(event) => setExpansion(event.target.value)}
              placeholder="Add a reflection, example, source, contradiction or new question…"
            />
          </label>

          <div className="button-row">
            <button type="button" onClick={() => save(false)} disabled={isSaving}>Save</button>
            <button type="button" onClick={() => save(true)} disabled={isSaving} className="secondary">
              Save and refresh AI context
            </button>
          </div>
        </div>

        <aside className="stack">
          <div className="card stack">
            <p className="eyebrow">AI context</p>
            <p>{note.ai_context}</p>
          </div>

          <div className="card stack">
            <p className="eyebrow">Themes</p>
            <div className="pill-row">
              {(note.themes ?? []).map((theme) => <span className="pill" key={theme}>{theme}</span>)}
            </div>
          </div>

          <div className="card stack">
            <p className="eyebrow">Reflective questions</p>
            {(note.reflective_questions ?? []).map((question) => <p key={question}>• {question}</p>)}
          </div>
        </aside>
      </div>

      <div className="grid two">
        <div className="card stack">
          <p className="eyebrow">Categories</p>
          <div className="pill-row">
            {categories.map((category) => (
              <Link className="pill" href={`/categories/${category.id}`} key={category.id}>{category.name}</Link>
            ))}
          </div>
          <form className="button-row" onSubmit={addCategory}>
            <input
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              placeholder="Add or create category…"
            />
            <button type="submit" disabled={isSaving || !categoryName.trim()} className="secondary">Connect</button>
          </form>
        </div>

        <div className="card stack">
          <p className="eyebrow">Tags</p>
          <div className="pill-row">
            {tags.map((tag) => <span className="pill" key={tag.id}>{tag.name}</span>)}
          </div>
        </div>
      </div>

      <div className="card stack">
        <p className="eyebrow">Related notes</p>
        {links.length === 0 ? <p>No related notes yet.</p> : null}
        <div className="note-list">
          {links.map((link) => link.target ? (
            <Link className="note-card stack" href={`/notes/${link.target.id}`} key={link.id}>
              <h3>{link.target.title ?? "Untitled thought"}</h3>
              <p>{link.target.ai_summary}</p>
              <p className="meta">{link.relationship_type} · {link.reason}</p>
            </Link>
          ) : null)}
        </div>
      </div>
    </section>
  );
}
