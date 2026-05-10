export type Note = {
  id: string;
  title: string | null;
  original_text: string;
  user_expansion: string | null;
  ai_summary: string | null;
  ai_context: string | null;
  reflective_questions: string[] | null;
  themes: string[] | null;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  name: string;
  description: string | null;
  ai_synthesis: string | null;
  created_at: string;
  updated_at: string;
};

export type Tag = {
  id: string;
  name: string;
};

export type NoteLink = {
  id: string;
  source_note_id: string;
  target_note_id: string;
  relationship_type: string;
  reason: string | null;
  confidence: number | null;
};

export type EnrichedThought = {
  title: string;
  summary: string;
  expanded_context: string;
  themes: string[];
  tags: string[];
  possible_categories: string[];
  reflective_questions: string[];
  follow_up_directions: string[];
};

export type GraphPayload = {
  nodes: Array<{
    id: string;
    type: "note" | "category" | "theme";
    label: string;
    summary?: string | null;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label?: string | null;
  }>;
};
