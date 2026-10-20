export const AUTH_COOKIE = "posnos-auth";

// The cookie holds an HMAC of the shared password, so changing
// POSNOS_PASSWORD signs everyone out.
export async function authToken(password: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("posnos"));
  return Buffer.from(sig).toString("hex");
}

export async function isAuthorized(
  cookie: string | undefined,
  password: string | undefined,
): Promise<boolean> {
  if (!password || !cookie) return false;
  return cookie === (await authToken(password));
}
