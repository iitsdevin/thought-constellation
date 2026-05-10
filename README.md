# Thought Constellation

A private thought log that turns rough thoughts into connected notes, categories and a visual constellation.

## What this starter app does

- Opens directly to a fast thought capture page.
- Saves each thought as a note.
- Uses the OpenAI API to generate a title, summary, broader context, themes, tags, categories and reflective questions.
- Stores notes in Supabase Postgres.
- Uses pgvector embeddings to find related notes.
- Lets you browse, search and edit notes.
- Lets you create categories.
- Synthesises a category from connected notes.
- Displays notes and categories in a React Flow constellation graph.

## Readiness status

This app builds and runs as a single-user MVP. Without environment variables it will still load, and read-only API routes return empty data so the interface can be inspected safely.

To use it as the thought log described in the original brief, you must:

1. Create a Supabase project and run `db/schema.sql`.
2. Add the Supabase and OpenAI values from `.env.example` to `.env.local`.
3. Set `APP_PASSWORD` and `AUTH_SECRET` so the app is password protected.
4. Run `npm run dev` and capture a thought from the homepage.

The current MVP is intentionally private/single-user. Before sharing it with other users, add authentication, user-scoped database rows and Supabase row-level security.

## Stack

- Next.js App Router
- React
- TypeScript
- Supabase Postgres
- Supabase pgvector
- OpenAI API
- @xyflow/react for the constellation graph

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

Create a Supabase project, then open the SQL editor and run:

```bash
db/schema.sql
```

This creates the notes, categories, tags, note links and vector search function.

### 3. Add environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
APP_PASSWORD=
AUTH_SECRET=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

Important: `SUPABASE_SERVICE_ROLE_KEY` must only be used server-side. This app keeps it inside API routes and never exposes it to client components.

`OPENAI_API_KEY` can be added here or saved later from the in-app Settings page after Supabase is configured. Supabase values cannot be saved from inside the app because the server needs them before it can connect to the database.

### 4. Run the app

```bash
npm run dev
```

Open:

```bash
http://localhost:3000
```

## GitHub setup

From inside the project folder:

```bash
git init
git add .
git commit -m "Initial Thought Constellation starter"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/thought-constellation.git
git push -u origin main
```

## Deploying

The simplest deployment path is Vercel:

1. Push the repository to GitHub.
2. Import the repository into Vercel.
3. Add the same environment variables in Vercel project settings.
4. Deploy.

## Notes on the MVP architecture

This starter is deliberately designed as a single-user MVP. The API routes use a Supabase service role key from the server. Before using this as a multi-user app, add Supabase Auth and user-scoped row-level security.

Recommended next database migration:

- Add `user_id uuid` to `notes`, `categories`, `tags`, `note_links`, `note_categories` and `note_tags`.
- Enable RLS.
- Restrict queries to the authenticated user.

## Main files

```text
app/page.tsx                         Homepage capture
app/api/notes/route.ts               Create/list notes
app/api/notes/[id]/route.ts          Read/update notes
app/api/notes/[id]/categories        Connect notes to categories
app/api/categories/route.ts          Create/list categories
app/api/categories/[id]/route.ts     Read/update category
app/api/categories/[id]/synthesise   Synthesise a category
app/api/constellation/route.ts       Graph payload
app/constellation/ConstellationView  React Flow graph
lib/openai.ts                        AI enrichment, embeddings and synthesis
lib/dbHelpers.ts                     Tags, categories and links
lib/supabaseAdmin.ts                 Server-side Supabase client
db/schema.sql                        Supabase schema
```

## Safety and privacy note

Any note sent for enrichment is sent to the configured OpenAI API. For highly sensitive notes, add a per-note privacy toggle before using this beyond personal testing.
