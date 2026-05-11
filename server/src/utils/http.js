export async function fetchJson(url, options) {
  const response = await fetch(url, options);
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
