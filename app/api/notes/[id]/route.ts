import { NextResponse } from "next/server";
import { attachCategories, attachSemanticLinks, attachTags } from "@/lib/dbHelpers";
import { hasServerConfig } from "@/lib/env";
import { enrichThought, generateEmbedding } from "@/lib/openai";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { vectorToSql } from "@/lib/vector";
import { getAiSettings } from "@/lib/appSettings";

type Params = Promise<{ id: string }>;

export async function GET(_request: Request, context: { params: Params }) {
  if (!hasServerConfig()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const { id } = await context.params;
  const supabase = getSupabaseAdmin();

  const { data: note, error } = await supabase
    .from("notes")
    .select("id,title,original_text,user_expansion,ai_summary,ai_context,reflective_questions,themes,created_at,updated_at")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  const { data: categories } = await supabase
    .from("note_categories")
    .select("category:categories(id,name,description,ai_synthesis)")
    .eq("note_id", id);

  const { data: tags } = await supabase
    .from("note_tags")
    .select("tag:tags(id,name)")
    .eq("note_id", id);

  const { data: links } = await supabase
    .from("note_links")
    .select("id,relationship_type,reason,confidence,target:notes!note_links_target_note_id_fkey(id,title,ai_summary)")
    .eq("source_note_id", id)
    .order("confidence", { ascending: false });

  return NextResponse.json({
    note,
    categories: (categories ?? []).map((row: any) => row.category).filter(Boolean),
    tags: (tags ?? []).map((row: any) => row.tag).filter(Boolean),
    links: links ?? []
  });
}

export async function PATCH(request: Request, context: { params: Params }) {
  if (!hasServerConfig()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const originalText = typeof body?.original_text === "string" ? body.original_text.trim() : undefined;
  const userExpansion = typeof body?.user_expansion === "string" ? body.user_expansion.trim() : undefined;
  const refreshAi = Boolean(body?.refresh_ai);

  const supabase = getSupabaseAdmin();

  const { data: current, error: currentError } = await supabase
    .from("notes")
    .select("id,original_text,user_expansion,ai_context")
    .eq("id", id)
    .single();

  if (currentError) {
    return NextResponse.json({ error: currentError.message }, { status: 404 });
  }

  const nextOriginal = originalText ?? current.original_text;
  const nextExpansion = userExpansion ?? current.user_expansion ?? "";
  const updatePayload: Record<string, unknown> = {
    original_text: nextOriginal,
    user_expansion: nextExpansion,
    updated_at: new Date().toISOString()
  };

  if (refreshAi) {
    const aiSettings = await getAiSettings(supabase);
    const combined = [nextOriginal, nextExpansion].filter(Boolean).join("\n\nAdditional reflection:\n");
    const enriched = await enrichThought(combined, current.ai_context ?? undefined, aiSettings);
    const embedding = await generateEmbedding(
      [combined, enriched.title, enriched.summary, enriched.expanded_context, enriched.themes.join(", ")].join("\n"),
      aiSettings
    );

    Object.assign(updatePayload, {
      title: enriched.title,
      ai_summary: enriched.summary,
      ai_context: enriched.expanded_context,
      reflective_questions: enriched.reflective_questions,
      themes: enriched.themes,
      embedding: embedding ? vectorToSql(embedding) : null
    });

    if (embedding) {
      const { data: matchData } = await supabase.rpc("match_notes", {
        query_embedding: vectorToSql(embedding),
        match_count: 6
      });
      await attachSemanticLinks(supabase, id, (matchData ?? []).filter((match: any) => match.id !== id));
    }

    await attachTags(supabase, id, enriched.tags);
    await attachCategories(supabase, id, enriched.possible_categories);
  }

  const { data: note, error } = await supabase
    .from("notes")
    .update(updatePayload)
    .eq("id", id)
    .select("id,title,original_text,user_expansion,ai_summary,ai_context,reflective_questions,themes,created_at,updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ note });
}
