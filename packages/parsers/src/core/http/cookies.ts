import { CookieJar } from 'tough-cookie';

/**
 * Cookie jars are scoped per source *family*, not per process and not per individual source.
 *
 * - Per-process (what the Kotlin sidecar did) leaks a challenge/session cookie from one site
 *   into 22 unrelated ones.
 * - Per-source is also wrong: MANGALIB/HENTAILIB/YAOILIB all hit the same host
 *   `api.cdnlibs.org`, disambiguated only by a `Site-Id` header — separate jars would mean
 *   three separate sessions to one host, and any antibot cookie earned by one thrown away by
 *   the others.
 *
 * `cookieScope` on a SourceDescriptor picks the bucket; sources with no natural family use
 * their own id as the scope.
 */
const jars = new Map<string, CookieJar>();

export function jarFor(scope: string): CookieJar {
  let jar = jars.get(scope);
  if (!jar) {
    jar = new CookieJar();
    jars.set(scope, jar);
  }
  return jar;
}

export function resetAllJars(): void {
  jars.clear();
}
