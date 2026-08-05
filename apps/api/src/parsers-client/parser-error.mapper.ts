import {
  NotFoundError,
  ParseError,
  SourceAuthRequiredError,
  SourceBlockedError,
  SourceTokenExpiredError,
  SourceUnavailableError,
  UnknownSourceError,
} from '@tanuki/parsers';
import {
  NotFoundApiException,
  ParserFailedException,
  SourceAuthRequiredException,
  SourceBlockedException,
  SourceTokenExpiredException,
  SourceUnavailableException,
  type ApiException,
} from '../common/errors';

/**
 * Replaces the old httpGet() status-code ladder — parsers now run in-process and throw
 * ParserError subclasses directly instead of the sidecar's HTTP status codes, so this is a
 * pure type-to-exception mapping with no heuristics (those live in
 * @tanuki/parsers's classify.ts, applied against the real upstream response).
 */
export function toApiException(error: unknown, sourceId: string): ApiException {
  if (error instanceof SourceBlockedError) return new SourceBlockedException(sourceId);
  if (error instanceof NotFoundError) return new NotFoundApiException();
  if (error instanceof SourceTokenExpiredError) return new SourceTokenExpiredException(sourceId);
  if (error instanceof SourceAuthRequiredError) return new SourceAuthRequiredException(sourceId);
  if (error instanceof SourceUnavailableError) return new SourceUnavailableException(sourceId);
  if (error instanceof ParseError) return new ParserFailedException(error.message, sourceId);
  if (error instanceof UnknownSourceError) return new NotFoundApiException();
  return new ParserFailedException(undefined, sourceId);
}
