import { describe, expect, it, vi } from 'vitest';
import { API_ERROR_CODE } from '@tanuki/contracts';
import {
  ParseError,
  NotFoundError,
  SourceUnavailableError,
  SOURCE_ID,
  type Parser,
} from '@tanuki/parsers';
import { observeParser, renderParserMetrics } from './parser-metrics';
import { runWithParserContext } from './parser-context';
import { PARSER_CALL_CONTEXT } from './models';
import { sanitizeEvent } from './sentry';

vi.mock('./sentry', async (original) => ({
  ...(await original<object>()),
  reportParserFailure: vi.fn(),
}));

describe('parser boundary telemetry', () => {
  it('counts each failed call once, including concurrent contexts; excludes network/404 and retains the original error', async () => {
    const error = new ParseError('private@example.org token=secret', SOURCE_ID.ACOMICS);
    const parser = observeParser({
      id: SOURCE_ID.ACOMICS,
      getPages: vi.fn().mockRejectedValue(error),
    } as unknown as Parser);
    for (const context of Object.values(PARSER_CALL_CONTEXT)) {
      await expect(runWithParserContext(context, () => parser.getPages('/private'))).rejects.toBe(
        error,
      );
      expect(renderParserMetrics()).toContain(
        `source_id="acomics",operation="getPages",context="${context}"} 1`,
      );
    }
    const before = renderParserMetrics();
    for (const failure of [
      new NotFoundError('missing', SOURCE_ID.ACOMICS),
      new SourceUnavailableError('offline', SOURCE_ID.ACOMICS),
    ]) {
      const available = observeParser({
        id: SOURCE_ID.ACOMICS,
        getList: async () => {
          throw failure;
        },
      } as unknown as Parser);
      await expect(available.getList({ offset: 0, limit: 1 })).rejects.toBe(failure);
    }
    expect(renderParserMetrics()).toBe(before);
  });

  it('rebuilds events without PII, source response, URL, breadcrumbs or stack context', () => {
    const secret = 'private@example.org?token=secret';
    const cleaned = sanitizeEvent({
      type: undefined,
      event_id: 'test',
      message: secret,
      user: { email: secret },
      request: { url: `https://${secret}`, headers: { authorization: secret }, data: secret },
      breadcrumbs: [{ message: secret }],
      extra: { response: secret },
      exception: {
        values: [
          {
            type: secret,
            value: secret,
            stacktrace: {
              frames: [
                {
                  filename: `https://host/dist/main.js?token=${secret}`,
                  context_line: secret,
                  pre_context: [secret],
                  vars: { password: secret },
                  lineno: 1,
                },
              ],
            },
          },
        ],
      },
      tags: {
        source_id: SOURCE_ID.ACOMICS,
        operation: 'getPages',
        context: 'probe',
        code: API_ERROR_CODE.PARSER_FAILED,
      },
    });
    expect(JSON.stringify(cleaned)).not.toContain(secret);
    expect(cleaned.tags).toMatchObject({ source_id: SOURCE_ID.ACOMICS, operation: 'getPages' });
    expect(cleaned.exception?.values?.[0]?.stacktrace?.frames?.[0]).toMatchObject({
      filename: 'dist/main.js',
      lineno: 1,
    });
  });
});
