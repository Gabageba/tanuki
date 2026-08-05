/**
 * Framework-free error hierarchy — apps/api/src/parsers-client/parser-error.mapper.ts is the
 * only place these get turned into HTTP-shaped exceptions (SourceUnavailableException etc.
 * from apps/api/src/common/errors.ts).
 */
export abstract class ParserError extends Error {
  constructor(
    message: string,
    readonly sourceId: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

/** The requested manga/chapter page could not be found upstream (HTTP 404 equivalent). */
export class NotFoundError extends ParserError {}

/** The upstream source demands an authenticated session for this resource. */
export class SourceAuthRequiredError extends ParserError {}

/**
 * A previously-obtained session/token for this source (stored out-of-band, e.g. LibSocial's
 * OAuth refresh_token) is missing, expired, or was rejected on renewal — distinct from
 * SourceAuthRequiredError, which means "this particular resource needs auth we never had,"
 * not "our stored credential went stale." A human has to redo the login flow.
 */
export class SourceTokenExpiredError extends ParserError {}

/** Connect/DNS/timeout failure, or upstream responded with a server error. */
export class SourceUnavailableError extends ParserError {}

/** Upstream responded with an antibot/challenge page instead of real content. */
export class SourceBlockedError extends ParserError {}

/** Upstream responded successfully but the expected markup/JSON shape was not found. */
export class ParseError extends ParserError {}

/** No SourceDescriptor is registered for this source id. */
export class UnknownSourceError extends Error {
  constructor(readonly sourceId: string) {
    super(`Unknown source: ${sourceId}`);
    this.name = 'UnknownSourceError';
  }
}

/** Source is registered but its parser isn't implemented yet (see registry.ts). */
export class NotImplementedError extends ParserError {
  constructor(sourceId: string) {
    super(`Source not implemented yet: ${sourceId}`, sourceId);
  }
}
