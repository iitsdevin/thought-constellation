import type { SupabaseClient } from "@supabase/supabase-js";

type Supabase = SupabaseClient<any, "public", any>;

export async function attachTags(supabase: Supabase, noteId: string, tags: string[]) {
  const cleaned = [...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
  for (const name of cleaned) {
    const { data: tag, error: tagError } = await supabase
      .from("tags")
      .upsert({ name }, { onConflict: "name" })
      .select("id")
      .single();

    if (tagError) throw tagError;

    await supabase
      .from("note_tags")
      .upsert({ note_id: noteId, tag_id: tag.id }, { onConflict: "note_id,tag_id" });
  }
}

export async function attachCategories(
  supabase: Supabase,
  noteId: string,
  categories: string[],
  addedBy: "ai" | "user" = "ai"
) {
  const cleaned = [...new Set(categories.map((category) => category.trim()).filter(Boolean))];
  for (const name of cleaned) {
    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .upsert({ name }, { onConflict: "name" })
      .select("id")
      .single();

    if (categoryError) throw categoryError;

    await supabase.from("note_categories").upsert(
      {
        note_id: noteId,
        category_id: category.id,
        confidence: addedBy === "ai" ? 0.68 : 1,
        added_by: addedBy
      },
      { onConflict: "note_id,category_id" }
    );
  }
}

export async function attachSemanticLinks(
  supabase: Supabase,
  noteId: string,
  matches: Array<{ id: string; title: string | null; similarity: number }>
) {
  const links = matches
    .filter((match) => match.id !== noteId && match.similarity >= 0.72)
    .map((match) => ({
      source_note_id: noteId,
      target_note_id: match.id,
      relationship_type: "semantically related",
      reason: `Vector similarity ${Math.round(match.similarity * 100)}%. Review and refine this relationship if useful.`,
      confidence: match.similarity
    }));

  if (links.length === 0) return;

  await supabase.from("note_links").upsert(links, { onConflict: "source_note_id,target_note_id" });
}
