import { NextResponse } from "next/server";
import { hasServerConfig } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  if (!hasServerConfig()) {
    return NextResponse.json({ categories: [] });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("categories")
    .select("id,name,description,ai_synthesis,created_at,updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ categories: data ?? [] });
}

export async function POST(request: Request) {
  if (!hasServerConfig()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const description = typeof body?.description === "string" ? body.description.trim() : null;

  if (!name) {
    return NextResponse.json({ error: "A category name is required." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("categories")
    .upsert({ name, description }, { onConflict: "name" })
    .select("id,name,description,ai_synthesis,created_at,updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ category: data });
}
