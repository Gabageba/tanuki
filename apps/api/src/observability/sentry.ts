import * as Sentry from '@sentry/nestjs';
import { API_ERROR_CODE, SOURCE_CATALOG } from '@tanuki/contracts';
import { PARSER_OPERATION, PARSER_CALL_CONTEXT } from './models';
import type { ParserCallContext, ParserOperation } from './models';

const SOURCES = new Set<unknown>(Object.keys(SOURCE_CATALOG));
const OPERATIONS = new Set<unknown>(Object.values(PARSER_OPERATION));
const CONTEXTS = new Set<unknown>(Object.values(PARSER_CALL_CONTEXT));

// Rebuild events from an allowlist. Arbitrary exception text, request context, source HTML,
// SQL, breadcrumbs and stack source lines never leave the process.
export const sanitizeEvent = (event: Sentry.ErrorEvent): Sentry.ErrorEvent => ({
  type: undefined,
  event_id: event.event_id,
  timestamp: event.timestamp,
  platform: event.platform,
  release: process.env['TANUKI_VERSION'],
  environment: process.env['NODE_ENV'] === 'production' ? 'production' : 'development',
  tags: {
    layer: 'api',
    ...(SOURCES.has(event.tags?.['source_id']) ? { source_id: event.tags?.['source_id'] } : {}),
    ...(OPERATIONS.has(event.tags?.['operation']) ? { operation: event.tags?.['operation'] } : {}),
    ...(CONTEXTS.has(event.tags?.['context']) ? { context: event.tags?.['context'] } : {}),
    ...(event.tags?.['code'] === 'parserFailed' ? { code: 'parserFailed' } : {}),
  },
  fingerprint:
    SOURCES.has(event.tags?.['source_id']) && OPERATIONS.has(event.tags?.['operation'])
      ? ['parserFailed', String(event.tags?.['source_id']), String(event.tags?.['operation'])]
      : undefined,
  exception: {
    values: (event.exception?.values ?? []).map((value) => ({
      type: 'Error',
      value: 'Unexpected application error',
      stacktrace: {
        frames: (value.stacktrace?.frames ?? []).map((frame) => ({
          filename: frame.filename?.match(/(?:dist|dist-cli)\/[\w./-]+\.js/)?.[0],
          lineno: frame.lineno,
          colno: frame.colno,
          in_app: frame.in_app,
        })),
      },
    })),
  },
});

const REPORTED = new WeakSet<object>();
export const reportUnexpected = (error: unknown) => {
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    Object.values(API_ERROR_CODE).some((code) => code === error.code)
  )
    return;
  if (error && typeof error === 'object') {
    if (REPORTED.has(error)) return;
    REPORTED.add(error);
  }
  Sentry.captureException(error);
};

export const reportParserFailure = (
  sourceId: string,
  operation: ParserOperation,
  context: ParserCallContext,
  originalError?: unknown,
) => {
  if (originalError && typeof originalError === 'object') REPORTED.add(originalError);
  Sentry.withScope((scope) => {
    scope.setTags({ source_id: sourceId, operation, context, code: 'parserFailed' });
    scope.setFingerprint(['parserFailed', sourceId, operation, context]);
    Sentry.captureException(new Error('Parser failed'));
  });
};
