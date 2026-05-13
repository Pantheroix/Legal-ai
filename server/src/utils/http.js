import { TUNNEL_USER_AGENT } from "../config/index.js";

export async function fetchJson(url, options = {}) {
  const existingHeaders =
    options.headers instanceof Headers
      ? Object.fromEntries(options.headers.entries())
      : options.headers || {};

  const headers = {
    "User-Agent": TUNNEL_USER_AGENT,
    ...existingHeaders,
  };

  const response = await fetch(url, { ...options, headers });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const errorText =
      payload?.error ||
      payload?.message ||
      `HTTP ${response.status} from ${url}`;
    throw new Error(errorText);
  }

  return payload;
}
