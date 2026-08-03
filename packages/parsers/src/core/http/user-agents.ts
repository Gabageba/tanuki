export const UserAgents = {
  CHROME_DESKTOP:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  CHROME_MOBILE:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
  /** kotatsu's own UA string — Desu is happier serving this than a bare Chrome UA. */
  KOTATSU: 'Kotatsu/8 (Android 14; SDK 34; arm64-v8a)',
  /** Grouple network serves a lighter page to this UA — not cargo-cult, verified in the fork. */
  GROUPLE_ARORA:
    'Mozilla/5.0 (X11; U; UNICOS lcLinux; en-US) Gecko/20140730 (KHTML, like Gecko, Safari/419.3) Arora/0.8.0',
} as const;
