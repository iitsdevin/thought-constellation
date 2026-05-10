import type { SupabaseClient } from "@supabase/supabase-js";

type Supabase = SupabaseClient<any, "public", any>;

export type AiSettings = {
  apiKey?: string;
  model: string;
  embeddingModel: string;
};

export async function getAiSettings(supabase: Supabase): Promise<AiSettings> {
  const envApiKey = process.env.OPENAI_API_KEY;
  const envModel = process.env.OPENAI_MODEL;
  const envEmbeddingModel = process.env.OPENAI_EMBEDDING_MODEL;

  const defaults = {
    apiKey: envApiKey,
    model: envModel ?? "gpt-4.1-mini",
    embeddingModel: envEmbeddingModel ?? "text-embedding-3-small"
  };

  const { data, error } = await supabase
    .from("app_settings")
    .select("openai_api_key,openai_model,openai_embedding_model")
    .eq("id", true)
    .maybeSingle();

  if (error || !data) {
    return defaults;
  }

  return {
    apiKey: envApiKey ?? data.openai_api_key ?? undefined,
    model: data.openai_model ?? defaults.model,
    embeddingModel: data.openai_embedding_model ?? defaults.embeddingModel
  };
}
