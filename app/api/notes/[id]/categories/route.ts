import { NextResponse } from "next/server";
import { attachCategories } from "@/lib/dbHelpers";
import { hasServerConfig } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type Params = Promise<{ id: string }>;

export async function POST(request: Request, context: { params: Params }) {
  if (!hasServerConfig()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const categoryName = typeof body?.name === "string" ? body.name.trim() : "";
  const categoryId = typeof body?.category_id === "string" ? body.category_id : "";

  if (!categoryName && !categoryId) {
    return NextResponse.json({ error: "A category name or category id is required." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  if (categoryName) {
    await attachCategories(supabase, id, [categoryName], "user");
  } else {
    const { error } = await supabase.from("note_categories").upsert(
      {
        note_id: id,
        category_id: categoryId,
        confidence: 1,
        added_by: "user"
      },
      { onConflict: "note_id,category_id" }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
