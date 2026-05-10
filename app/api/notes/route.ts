import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { hasServerConfig } from "@/lib/env";
import { enrichThought, generateEmbedding } from "@/lib/openai";
import { vectorToSql } from "@/lib/vector";
import { attachCategories, attachSemanticLinks, attachTags } from "@/lib/dbHelpers";

export async function GET() {
  if (!hasServerConfig()) {
    return NextResponse.json({ notes: [] });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("notes")
    .select("id,title,original_text,user_expansion,ai_summary,ai_context,reflective_questions,themes,created_at,updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ notes: data ?? [] });
}

export async function POST(request: Request) {
  if (!hasServerConfig()) {
    return NextResponse.json(
      {
        error:
          "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local, then run db/schema.sql in Supabase."
      },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => null);
  const content = typeof body?.content === "string" ? body.content.trim() : "";

  if (!content) {
    return NextResponse.json({ error: "A thought is required." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const enriched = await enrichThought(content);
  const embedding = await generateEmbedding(
    [content, enriched.title, enriched.summary, enriched.expanded_context, enriched.themes.join(", ")].join("\n")
  );

  let matches: Array<{ id: string; title: string | null; similarity: number }> = [];
  if (embedding) {
    const { data: matchData } = await supabase.rpc("match_notes", {
      query_embedding: vectorToSql(embedding),
      match_count: 6
    });
    matches = matchData ?? [];
  }

  const { data: note, error } = await supabase
    .from("notes")
    .insert({
      title: enriched.title,
      original_text: content,
      ai_summary: enriched.summary,
      ai_context: enriched.expanded_context,
      reflective_questions: enriched.reflective_questions,
      themes: enriched.themes,
      embedding: embedding ? vectorToSql(embedding) : null
    })
    .select("id,title,original_text,user_expansion,ai_summary,ai_context,reflective_questions,themes,created_at,updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  try {
    await attachTags(supabase, note.id, enriched.tags);
    await attachCategories(supabase, note.id, enriched.possible_categories);
    await attachSemanticLinks(supabase, note.id, matches);
  } catch (attachmentError) {
    console.error("Post-save enrichment attachment failed", attachmentError);
  }

  return NextResponse.json({ note, enrichment: enriched, related: matches });
}
