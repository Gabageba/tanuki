import crypto from 'node:crypto';
import type { HttpRequest, HttpResponse, Interceptor } from './client';

type AnubisChallengePayload = {
  rules?: {
    algorithm?: string;
    difficulty?: number;
  };
  challenge: {
    id: string;
    randomData: string;
    difficulty?: number;
    method?: string;
  };
};

const CHALLENGE_REGEX = /<script\b[^>]*\bid=["']anubis_challenge["'][^>]*>([\s\S]*?)<\/script>/i;

const checkDifficulty = (hashBuffer: Buffer, difficulty: number): boolean => {
  const fullBytes = Math.floor(difficulty / 2);
  for (let i = 0; i < fullBytes; i += 1) {
    if (hashBuffer[i] !== 0) return false;
  }
  if (difficulty % 2 !== 0) {
    if (hashBuffer[fullBytes]! >> 4 !== 0) return false;
  }
  return true;
};

const solveAnubisChallenge = (
  randomData: string,
  difficulty: number,
): { hash: string; nonce: number; elapsedTime: number } => {
  let nonce = 0;
  const startTime = Date.now();

  while (true) {
    const hash = crypto.createHash('sha256').update(`${randomData}${nonce}`).digest();

    if (checkDifficulty(hash, difficulty)) {
      return {
        hash: hash.toString('hex'),
        nonce,
        elapsedTime: Math.max(10, Date.now() - startTime),
      };
    }
    nonce += 1;
  }
};

const parseAnubisChallenge = (res: HttpResponse): AnubisChallengePayload | null => {
  const contentType = String(res.headers['content-type'] ?? '');
  if (!contentType.includes('text/html')) return null;

  const html = res.text();
  if (!html.includes('anubis_challenge')) return null;

  const match = html.match(CHALLENGE_REGEX);
  const rawJson = match?.[1];
  if (!rawJson) return null;

  try {
    const parsed = JSON.parse(rawJson) as AnubisChallengePayload;
    if (!parsed?.challenge?.randomData || !parsed?.challenge?.id) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const createAnubisInterceptor = (): Interceptor => {
  const inflightByOrigin = new Map<string, Promise<void>>();

  return async (
    req: HttpRequest,
    next: (r: HttpRequest) => Promise<HttpResponse>,
  ): Promise<HttpResponse> => {
    const res = await next(req);

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return res;
    }

    const payload = parseAnubisChallenge(res);
    if (!payload) {
      return res;
    }

    const origin = new URL(res.url).origin;
    let solvePromise = inflightByOrigin.get(origin);

    if (!solvePromise) {
      solvePromise = (async () => {
        const difficulty = payload.rules?.difficulty ?? payload.challenge.difficulty ?? 4;
        const solution = solveAnubisChallenge(payload.challenge.randomData, difficulty);

        const passUrl = new URL('/.within.website/x/cmd/anubis/api/pass-challenge', res.url);
        passUrl.searchParams.set('id', payload.challenge.id);
        passUrl.searchParams.set('response', solution.hash);
        passUrl.searchParams.set('nonce', String(solution.nonce));
        passUrl.searchParams.set('redir', res.url);
        passUrl.searchParams.set('elapsedTime', String(solution.elapsedTime));

        await next({
          method: 'GET',
          url: passUrl.toString(),
          headers: req.headers,
          signal: req.signal,
        });
      })().finally(() => {
        inflightByOrigin.delete(origin);
      });

      inflightByOrigin.set(origin, solvePromise);
    }

    await solvePromise;

    return next(req);
  };
};
