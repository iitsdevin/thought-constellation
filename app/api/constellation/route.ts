import { NextResponse } from "next/server";
import { hasServerConfig } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { GraphPayload } from "@/types/models";

export async function GET() {
  if (!hasServerConfig()) {
    return NextResponse.json({ nodes: [], edges: [] satisfies GraphPayload["edges"] });
  }

  const supabase = getSupabaseAdmin();
  const [{ data: notes, error: notesError }, { data: categories, error: categoriesError }, { data: noteCategories }, { data: noteLinks }] =
    await Promise.all([
      supabase.from("notes").select("id,title,ai_summary,themes,created_at").limit(80),
      supabase.from("categories").select("id,name,description").limit(50),
      supabase.from("note_categories").select("note_id,category_id"),
      supabase.from("note_links").select("id,source_note_id,target_note_id,relationship_type")
    ]);

  if (notesError || categoriesError) {
    return NextResponse.json({ error: notesError?.message ?? categoriesError?.message }, { status: 500 });
  }

  const nodes: GraphPayload["nodes"] = [
    ...(categories ?? []).map((category) => ({
      id: `category:${category.id}`,
      type: "category" as const,
      label: category.name,
      summary: category.description
    })),
    ...(notes ?? []).map((note) => ({
      id: `note:${note.id}`,
      type: "note" as const,
      label: note.title ?? "Untitled thought",
      summary: note.ai_summary
    }))
  ];

  const edges: GraphPayload["edges"] = [
    ...(noteCategories ?? []).map((join) => ({
      id: `note-category:${join.note_id}:${join.category_id}`,
      source: `note:${join.note_id}`,
      target: `category:${join.category_id}`,
      label: "belongs to"
    })),
    ...(noteLinks ?? []).map((link) => ({
      id: `note-link:${link.id}`,
      source: `note:${link.source_note_id}`,
      target: `note:${link.target_note_id}`,
      label: link.relationship_type
    }))
  ];

  return NextResponse.json({ nodes, edges });
}
