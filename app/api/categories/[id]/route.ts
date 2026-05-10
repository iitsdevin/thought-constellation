import { NextResponse } from "next/server";
import { hasServerConfig } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type Params = Promise<{ id: string }>;

export async function GET(_request: Request, context: { params: Params }) {
  if (!hasServerConfig()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const { id } = await context.params;
  const supabase = getSupabaseAdmin();

  const { data: category, error } = await supabase
    .from("categories")
    .select("id,name,description,ai_synthesis,created_at,updated_at")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  const { data: joinedNotes } = await supabase
    .from("note_categories")
    .select("note:notes(id,title,original_text,user_expansion,ai_summary,ai_context,reflective_questions,themes,created_at,updated_at)")
    .eq("category_id", id);

  return NextResponse.json({
    category,
    notes: (joinedNotes ?? []).map((row: any) => row.note).filter(Boolean)
  });
}

export async function PATCH(request: Request, context: { params: Params }) {
  if (!hasServerConfig()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const supabase = getSupabaseAdmin();

  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body?.name === "string") updatePayload.name = body.name.trim();
  if (typeof body?.description === "string") updatePayload.description = body.description.trim();

  const { data, error } = await supabase
    .from("categories")
    .update(updatePayload)
    .eq("id", id)
    .select("id,name,description,ai_synthesis,created_at,updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ category: data });
}
