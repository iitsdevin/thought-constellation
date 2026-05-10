import OpenAI from "openai";
import type { EnrichedThought } from "@/types/models";
import { hasOpenAIConfig } from "./env";

const fallbackThemes = ["reflection", "emerging idea", "personal knowledge"];

export function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing environment variable: OPENAI_API_KEY");
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export function fallbackEnrichment(content: string): EnrichedThought {
  const cleaned = content.trim();
  const title = cleaned.length > 52 ? `${cleaned.slice(0, 52).trim()}…` : cleaned || "Untitled thought";

  return {
    title,
    summary: cleaned.length > 180 ? `${cleaned.slice(0, 180).trim()}…` : cleaned,
    expanded_context: "AI enrichment is not configured yet. Add OPENAI_API_KEY to generate context, themes, categories and reflective questions.",
    themes: fallbackThemes,
    tags: ["uncategorised"],
    possible_categories: ["Inbox"],
    reflective_questions: [
      "What is the central idea in this thought?",
      "What would make this worth revisiting later?",
      "Does this connect to an existing project, concern or question?"
    ],
    follow_up_directions: ["Add more detail", "Connect this to a category", "Re-run AI enrichment"]
  };
}

function safeJsonParse<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      try {
        return JSON.parse(text.slice(firstBrace, lastBrace + 1)) as T;
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
}

export async function enrichThought(content: string, existingContext?: string): Promise<EnrichedThought> {
  if (!hasOpenAIConfig()) {
    return fallbackEnrichment(content);
  }

  const client = getOpenAIClient();
  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
  const fallback = fallbackEnrichment(content);

  const response = await client.responses.create({
    model,
    input: [
      {
        role: "system",
        content:
          "You organise a private thought log into a useful knowledge system. Preserve the user's meaning. Do not diagnose, over-pathologise, moralise or overstate certainty. Return concise structured JSON only."
      },
      {
        role: "user",
        content: JSON.stringify({ thought: content, existingContext: existingContext ?? null })
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "enriched_thought",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: [
            "title",
            "summary",
            "expanded_context",
            "themes",
            "tags",
            "possible_categories",
            "reflective_questions",
            "follow_up_directions"
          ],
          properties: {
            title: { type: "string" },
            summary: { type: "string" },
            expanded_context: { type: "string" },
            themes: { type: "array", items: { type: "string" } },
            tags: { type: "array", items: { type: "string" } },
            possible_categories: { type: "array", items: { type: "string" } },
            reflective_questions: { type: "array", items: { type: "string" } },
            follow_up_directions: { type: "array", items: { type: "string" } }
          }
        }
      }
    }
  });

  return safeJsonParse<EnrichedThought>(response.output_text ?? "", fallback);
}

export async function generateEmbedding(input: string): Promise<number[] | null> {
  if (!hasOpenAIConfig()) {
    return null;
  }

  const client = getOpenAIClient();
  const model = process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";
  const response = await client.embeddings.create({ model, input });
  return response.data[0]?.embedding ?? null;
}

export async function synthesiseCategory(input: {
  categoryName: string;
  categoryDescription?: string | null;
  notes: Array<{ title: string | null; summary: string | null; original_text: string }>;
}): Promise<string> {
  if (!hasOpenAIConfig()) {
    return "AI synthesis is not configured yet. Add OPENAI_API_KEY to generate a living category synthesis.";
  }

  const client = getOpenAIClient();
  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
  const response = await client.responses.create({
    model,
    input: [
      {
        role: "system",
        content:
          "You synthesise a set of private notes into a concise knowledge-cluster summary. Use the user's language where possible. Identify themes, tensions, questions and possible next moves."
      },
      {
        role: "user",
        content: JSON.stringify(input)
      }
    ]
  });

  return response.output_text ?? "No synthesis returned.";
}
