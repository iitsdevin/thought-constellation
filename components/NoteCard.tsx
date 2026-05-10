import Link from "next/link";
import type { Note } from "@/types/models";

export default function NoteCard({ note }: { note: Note }) {
  return (
    <Link className="note-card stack" href={`/notes/${note.id}`}>
      <div className="stack">
        <h3>{note.title ?? "Untitled thought"}</h3>
        <p>{note.ai_summary ?? note.original_text}</p>
      </div>
      <div className="pill-row">
        {(note.themes ?? []).slice(0, 5).map((theme) => (
          <span className="pill" key={theme}>{theme}</span>
        ))}
      </div>
      <span className="meta">{new Date(note.created_at).toLocaleString()}</span>
    </Link>
  );
}
