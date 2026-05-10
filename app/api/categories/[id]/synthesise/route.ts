import { NextResponse } from "next/server";
import { hasServerConfig } from "@/lib/env";
import { synthesiseCategory } from "@/lib/openai";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type Params = Promise<{ id: string }>;

export async function POST(_request: Request, context: { params: Params }) {
  if (!hasServerConfig()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const { id } = await context.params;
  const supabase = getSupabaseAdmin();

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id,name,description")
    .eq("id", id)
    .single();

  if (categoryError) {
    return NextResponse.json({ error: categoryError.message }, { status: 404 });
  }

  const { data: joinedNotes } = await supabase
    .from("note_categories")
    .select("note:notes(title,ai_summary,original_text)")
    .eq("category_id", id);

  const notes = (joinedNotes ?? []).map((row: any) => row.note).filter(Boolean);
  const synthesis = await synthesiseCategory({
    categoryName: category.name,
    categoryDescription: category.description,
    notes
  });

  const { data, error } = await supabase
    .from("categories")
    .update({ ai_synthesis: synthesis, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id,name,description,ai_synthesis,created_at,updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ category: data, synthesis });
}
