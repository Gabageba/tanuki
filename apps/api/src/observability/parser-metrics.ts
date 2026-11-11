import { API_ERROR_CODE } from '@tanuki/contracts';
import { SOURCE_IDS, type Parser } from '@tanuki/parsers';
import { toApiException } from '../parsers-client/parser-error.mapper';
import { getParserCallContext } from './parser-context';
import { PARSER_OPERATION, type ParserOperation, type ParserCallContext } from './models';
import { reportParserFailure } from './sentry';

const COUNTERS = new Map<string, number>();
const OPERATIONS = new Set<string>(Object.values(PARSER_OPERATION));
const SOURCES = new Set<string>(SOURCE_IDS);

export const recordParserFailure = (
  sourceId: string,
  operation: ParserOperation,
  context: ParserCallContext,
  error?: unknown,
) => {
  // Labels only come from the finite parser catalog, never from a request parameter.
  if (!SOURCES.has(sourceId)) return;
  const labels = `source_id="${sourceId}",operation="${operation}",context="${context}"`;
  COUNTERS.set(labels, (COUNTERS.get(labels) ?? 0) + 1);
  reportParserFailure(sourceId, operation, context, error);
};

export const renderParserMetrics = () =>
  '# HELP tanuki_parser_failures_total Failed parser method calls\n' +
  '# TYPE tanuki_parser_failures_total counter\n' +
  [...COUNTERS]
    .map(([labels, count]) => `tanuki_parser_failures_total{${labels}} ${count}\n`)
    .join('');

/** Observe individual methods, including calls swallowed by source-contract probes and cache.
 * No observation of registry lookup, queue admission, breaker or internal HTTP retries. */
export const observeParser = (parser: Parser): Parser =>
  new Proxy(parser, {
    get(target, property, receiver) {
      const value: unknown = Reflect.get(target, property, receiver);
      if (
        typeof property !== 'string' ||
        !OPERATIONS.has(property) ||
        typeof value !== 'function'
      ) {
        return value;
      }
      return async (...args: unknown[]) => {
        try {
          return await Reflect.apply(value, target, args);
        } catch (error) {
          if (toApiException(error, parser.id).code === API_ERROR_CODE.PARSER_FAILED) {
            recordParserFailure(
              parser.id,
              property as ParserOperation,
              getParserCallContext(),
              error,
            );
          }
          throw error;
        }
      };
    },
  });
