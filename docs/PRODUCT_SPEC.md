# Thought Constellation Product Spec

## Product intent

Thought Constellation is a private thought log that prioritises rapid capture first, then AI-supported enrichment, connection and synthesis.

The app is designed for notes that are initially rough, incomplete or intuitive. The system gives them enough structure to become searchable, revisitable and connectable without forcing the user to organise them manually at capture time.

## Core loop

1. User opens the app.
2. User writes a thought in the homepage capture box.
3. The thought is saved as a note.
4. The API creates a structured enrichment:
   - title
   - summary
   - broader context
   - themes
   - tags
   - possible categories
   - reflective questions
5. The app creates an embedding for the note.
6. The app searches for semantically similar notes.
7. Suggested links and categories are stored.
8. Notes and categories appear in the constellation view.

## Current MVP capabilities

- Fast homepage thought capture.
- Notes list and search.
- Note detail page.
- Add further reflection to a note.
- Refresh AI context after editing a note.
- AI-generated tags, themes and categories.
- Supabase Postgres storage.
- pgvector semantic search.
- Category creation.
- Category detail page.
- Category synthesis from connected notes.
- React Flow constellation view.

## Suggested next features

### Authentication

Add Supabase Auth and a `user_id` field to every major table.

### Manual graph editing

Allow users to:

- connect two notes manually
- label the relationship
- delete weak AI-suggested links
- pin important notes
- drag nodes and save graph positions

### Better category management

Add:

- manual add/remove note from category
- merge categories
- category aliases
- category instructions, such as "treat this as a work-related systems design category"

### Better constellation view

Add:

- filter by category
- filter by tag
- graph search
- colour notes by category
- resize nodes by number of links
- save layout positions

### Import/export

Add:

- Markdown export
- JSON export
- Obsidian-compatible export
- CSV export
- import from Markdown folder

### Privacy controls

Add:

- local-only mode
- encrypted note body
- redaction before API enrichment
- per-note "do not send to AI" toggle
