export function requireEnv(name: string): string {
  const value = getEnv(name);
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export function getEnv(name: string): string | undefined {
  if (name === "SUPABASE_SERVICE_ROLE_KEY") {
    return process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.service_role_key;
  }

  return process.env[name];
}

export function hasServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && getEnv("SUPABASE_SERVICE_ROLE_KEY"));
}

export function hasOpenAIConfig() {
  return Boolean(process.env.OPENAI_API_KEY);
}
