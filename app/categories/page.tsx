"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import type { Category } from "@/types/models";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadCategories() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/categories", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not load categories.");
      setCategories(payload.categories ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load categories.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  async function createCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not create category.");
      setName("");
      setDescription("");
      await loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create category.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="stack">
      <div className="stack">
        <p className="eyebrow">Categories</p>
        <h1>Knowledge clusters</h1>
        <p className="lede">Create deliberate categories, or let the AI suggest categories as notes are captured.</p>
      </div>

      <form className="card stack" onSubmit={createCategory}>
        <h2>Create a category</h2>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Category name" />
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Optional description, boundary or guiding question…"
        />
        <button type="submit" disabled={isSaving || !name.trim()}>Create category</button>
      </form>

      {isLoading ? <p>Loading categories…</p> : null}
      {error ? <div className="error">{error}</div> : null}

      <div className="note-list">
        {categories.map((category) => (
          <Link href={`/categories/${category.id}`} className="note-card stack" key={category.id}>
            <h3>{category.name}</h3>
            <p>{category.description ?? category.ai_synthesis ?? "No description yet."}</p>
            <span className="meta">Updated {new Date(category.updated_at).toLocaleString()}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
