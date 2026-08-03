// Эвристика для docs/03-parsers.md — различаем "источник упал" от "источник отдал
// антибот-челлендж", не поднимая headless-браузер (см. docs/03-parsers.md, раздел
// "Устойчивость"). Ложноположительные срабатывания не страшны — SOURCE_BLOCKED и
// SOURCE_UNAVAILABLE ведут себя для клиента почти одинаково, отличается только текст.

const CHALLENGE_MARKERS = [
  'cf-browser-verification',
  'cf-chl-',
  'challenge-platform',
  'just a moment',
  'attention required',
  'checking your browser',
  'ddos protection by',
];

export function looksLikeAntibotChallenge(
  statusCode: number,
  headers: Record<string, string | string[] | undefined>,
  bodySample: string,
): boolean {
  if (statusCode < 400) {
    return false;
  }

  const server = headers['server'];
  const serverHeader = Array.isArray(server) ? server.join(' ') : (server ?? '');
  const hasCloudflareHeader =
    'cf-mitigated' in headers ||
    'cf-ray' in headers ||
    serverHeader.toLowerCase().includes('cloudflare');

  const lowerBody = bodySample.toLowerCase();
  const hasChallengeMarker = CHALLENGE_MARKERS.some((marker) => lowerBody.includes(marker));

  if (!hasChallengeMarker) {
    return false;
  }

  return (statusCode === 403 || statusCode === 503) && (hasCloudflareHeader || hasChallengeMarker);
}
