import { afterEach, describe, expect, it, vi } from 'vitest';
import { API_ERROR_CODE } from '@tanuki/contracts';
import { PARSER_CALL_CONTEXT, PARSER_OPERATION } from './models';

afterEach(() => {
  vi.doUnmock('./sentry-sdk');
  vi.resetModules();
});

describe('optional error reporting', () => {
  it('does nothing when Sentry is not configured', async () => {
    vi.doMock('./sentry-sdk', () => ({ SENTRY: undefined }));
    const { reportUnexpected, reportParserFailure } = await import('./sentry.js');

    expect(() => reportUnexpected(new Error('unexpected'))).not.toThrow();
    expect(() =>
      reportParserFailure('acomics', PARSER_OPERATION.GET_PAGES, PARSER_CALL_CONTEXT.REQUEST),
    ).not.toThrow();
  });

  it('reports unexpected errors once and ignores known API errors', async () => {
    const captureException = vi.fn();
    vi.doMock('./sentry-sdk', () => ({ SENTRY: { captureException } }));
    const { reportUnexpected } = await import('./sentry.js');
    const error = new Error('unexpected');

    reportUnexpected(error);
    reportUnexpected(error);
    reportUnexpected({ code: API_ERROR_CODE.NOT_FOUND });

    expect(captureException).toHaveBeenCalledExactlyOnceWith(error);
  });

  it('reports parser failures in their scope without reporting the original error twice', async () => {
    const captureException = vi.fn();
    const scope = { setTags: vi.fn(), setFingerprint: vi.fn() };
    const withScope = vi.fn((callback: (value: typeof scope) => void) => callback(scope));
    vi.doMock('./sentry-sdk', () => ({ SENTRY: { captureException, withScope } }));
    const { reportUnexpected, reportParserFailure } = await import('./sentry.js');
    const error = new Error('private source response');

    reportParserFailure('acomics', PARSER_OPERATION.GET_PAGES, PARSER_CALL_CONTEXT.PROBE, error);
    reportUnexpected(error);

    expect(scope.setTags).toHaveBeenCalledWith({
      source_id: 'acomics',
      operation: PARSER_OPERATION.GET_PAGES,
      context: PARSER_CALL_CONTEXT.PROBE,
      code: API_ERROR_CODE.PARSER_FAILED,
    });
    expect(captureException).toHaveBeenCalledExactlyOnceWith(new Error('Parser failed'));
  });
});
