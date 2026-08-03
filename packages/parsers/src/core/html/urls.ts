/** Resolves a possibly-relative URL against a domain (scheme defaults to https). */
export function toAbsoluteUrl(url: string, domain: string): string {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  return new URL(url, `https://${domain}/`).toString();
}

/** Strips scheme+host from an absolute URL that belongs to `domain`, else returns it unchanged. */
export function toRelativeUrl(url: string, domain: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === domain || parsed.hostname === `www.${domain}`) {
      return parsed.pathname + parsed.search + parsed.hash;
    }
    return url;
  } catch {
    return url;
  }
}

/** Joins a base URL (possibly without scheme) and a path, tolerating either being empty. */
export function concatUrl(base: string, path: string): string {
  if (!base) return path;
  const normalizedBase = /^https?:\/\//i.test(base) ? base : `https://${base}`;
  return new URL(
    path,
    normalizedBase.endsWith('/') ? normalizedBase : `${normalizedBase}/`,
  ).toString();
}
