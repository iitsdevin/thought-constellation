export const authCookieName = "thought_constellation_session";

export function isAuthConfigured() {
  return Boolean(process.env.APP_PASSWORD);
}

export async function createAuthToken(password = process.env.APP_PASSWORD ?? "") {
  const secret = process.env.AUTH_SECRET ?? process.env.APP_PASSWORD ?? "development-secret";
  const input = `${password}:${secret}`;
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
