import { NextResponse } from "next/server";
import { hasServerConfig } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  if (!hasServerConfig()) {
    return NextResponse.json({
      configured: false,
      supabaseUrlConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      supabaseServiceRoleConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      openaiEnvConfigured: Boolean(process.env.OPENAI_API_KEY),
      hasStoredOpenAIKey: false,
      openaiModel: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
      openaiEmbeddingModel: process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small"
    });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("app_settings")
    .select("openai_api_key,openai_model,openai_embedding_model")
    .eq("id", true)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    configured: true,
    supabaseUrlConfigured: true,
    supabaseServiceRoleConfigured: true,
    openaiEnvConfigured: Boolean(process.env.OPENAI_API_KEY),
    hasStoredOpenAIKey: Boolean(data?.openai_api_key),
    openaiModel: data?.openai_model ?? process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
    openaiEmbeddingModel:
      data?.openai_embedding_model ?? process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small"
  });
}

export async function PATCH(request: Request) {
  if (!hasServerConfig()) {
    return NextResponse.json(
      { error: "Supabase must be configured in Vercel before app settings can be saved." },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => null);
  const openaiApiKey = typeof body?.openai_api_key === "string" ? body.openai_api_key.trim() : "";
  const openaiModel = typeof body?.openai_model === "string" ? body.openai_model.trim() : "gpt-4.1-mini";
  const openaiEmbeddingModel =
    typeof body?.openai_embedding_model === "string"
      ? body.openai_embedding_model.trim()
      : "text-embedding-3-small";

  const updatePayload: Record<string, unknown> = {
    id: true,
    openai_model: openaiModel || "gpt-4.1-mini",
    openai_embedding_model: openaiEmbeddingModel || "text-embedding-3-small"
  };

  if (openaiApiKey) {
    updatePayload.openai_api_key = openaiApiKey;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("app_settings")
    .upsert(updatePayload, { onConflict: "id" })
    .select("openai_api_key,openai_model,openai_embedding_model")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    hasStoredOpenAIKey: Boolean(data.openai_api_key),
    openaiModel: data.openai_model,
    openaiEmbeddingModel: data.openai_embedding_model
  });
}
