"use client";

import { useEffect, useState, type FormEvent } from "react";

type SettingsPayload = {
  configured: boolean;
  supabaseUrlConfigured: boolean;
  supabaseServiceRoleConfigured: boolean;
  openaiEnvConfigured: boolean;
  hasStoredOpenAIKey: boolean;
  openaiModel: string;
  openaiEmbeddingModel: string;
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsPayload | null>(null);
  const [openaiKey, setOpenaiKey] = useState("");
  const [openaiModel, setOpenaiModel] = useState("gpt-4.1-mini");
  const [embeddingModel, setEmbeddingModel] = useState("text-embedding-3-small");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadSettings() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/settings", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not load settings.");
      setSettings(payload);
      setOpenaiModel(payload.openaiModel);
      setEmbeddingModel(payload.openaiEmbeddingModel);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load settings.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          openai_api_key: openaiKey,
          openai_model: openaiModel,
          openai_embedding_model: embeddingModel
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not save settings.");
      setOpenaiKey("");
      setMessage("Settings saved.");
      await loadSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save settings.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <p>Loading settings...</p>;

  return (
    <section className="stack">
      <div className="stack">
        <p className="eyebrow">Settings</p>
        <h1>App setup</h1>
        <p className="lede">
          Add the AI key used for note enrichment. Supabase still needs to be connected in Vercel first so the app has
          somewhere secure to store notes and settings.
        </p>
      </div>

      {error ? <div className="error">{error}</div> : null}
      {message ? <div className="success">{message}</div> : null}

      <div className="grid two">
        <div className="card stack">
          <p className="eyebrow">Connection status</p>
          <StatusRow label="Supabase URL" ready={Boolean(settings?.supabaseUrlConfigured)} />
          <StatusRow label="Supabase service role" ready={Boolean(settings?.supabaseServiceRoleConfigured)} />
          <StatusRow
            label="OpenAI key"
            ready={Boolean(settings?.openaiEnvConfigured || settings?.hasStoredOpenAIKey)}
          />
        </div>

        <form className="card stack" onSubmit={saveSettings}>
          <p className="eyebrow">AI settings</p>
          {!settings?.configured ? (
            <div className="callout">
              Add the two Supabase environment variables in Vercel first, then redeploy. After that this form can save
              the OpenAI key inside Supabase.
            </div>
          ) : null}

          <label className="stack">
            <strong>OpenAI API key</strong>
            <input
              value={openaiKey}
              onChange={(event) => setOpenaiKey(event.target.value)}
              placeholder={settings?.hasStoredOpenAIKey ? "Saved. Enter a new key to replace it." : "sk-..."}
              type="password"
              autoComplete="off"
            />
          </label>

          <label className="stack">
            <strong>Text model</strong>
            <input value={openaiModel} onChange={(event) => setOpenaiModel(event.target.value)} />
          </label>

          <label className="stack">
            <strong>Embedding model</strong>
            <input value={embeddingModel} onChange={(event) => setEmbeddingModel(event.target.value)} />
          </label>

          <button type="submit" disabled={isSaving || !settings?.configured}>
            {isSaving ? "Saving..." : "Save settings"}
          </button>
        </form>
      </div>
    </section>
  );
}

function StatusRow({ label, ready }: { label: string; ready: boolean }) {
  return (
    <div className="status-row">
      <span>{label}</span>
      <strong className={ready ? "status-ready" : "status-missing"}>{ready ? "Ready" : "Missing"}</strong>
    </div>
  );
}
