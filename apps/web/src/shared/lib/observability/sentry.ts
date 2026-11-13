import * as Sentry from '@sentry/react';

const REPORTED = new WeakSet<object>();

export const isExpectedNetworkError = (error: unknown) =>
  error instanceof TypeError && /fetch|network|load failed/i.test(error.message);

export const reportWebError = (error: unknown) => {
  if (error && typeof error === 'object') {
    if (REPORTED.has(error)) return;
    REPORTED.add(error);
  }
  // API responses and offline network errors are handled by the query layer.
  if (isExpectedNetworkError(error)) return;
  Sentry.captureException(error);
};

export const sanitizeWebEvent = (event: Sentry.ErrorEvent): Sentry.ErrorEvent => ({
  type: undefined,
  event_id: event.event_id,
  timestamp: event.timestamp,
  platform: 'javascript',
  release: event.release,
  environment: 'production',
  tags: { layer: 'web' },
  exception: {
    values: (event.exception?.values ?? []).map((value) => ({
      type: 'Error',
      value: 'Unexpected browser error',
      stacktrace: {
        frames: (value.stacktrace?.frames ?? []).map((frame) => ({
          filename: frame.filename?.match(/\/assets\/[\w.-]+\.js/)?.[0],
          lineno: frame.lineno,
          colno: frame.colno,
          in_app: frame.in_app,
        })),
      },
    })),
  },
});

export const initObservability = () => {
  const config: unknown = (window as Window & { __TANUKI_CONFIG__?: unknown }).__TANUKI_CONFIG__;
  if (!config || typeof config !== 'object') return;
  const dsn = 'sentryDsn' in config ? config.sentryDsn : undefined;
  const release = 'release' in config ? config.release : undefined;
  if (typeof dsn !== 'string' || !dsn) return;
  try {
    const url = new URL(dsn);
    if (
      !['https:', 'http:'].includes(url.protocol) ||
      !url.username ||
      !/\/\d+$/.test(url.pathname)
    )
      return;
  } catch {
    return;
  }
  Sentry.init({
    dsn,
    release: typeof release === 'string' && /^[\w.-]{1,100}$/.test(release) ? release : undefined,
    sendDefaultPii: false,
    defaultIntegrations: false,
    integrations: [Sentry.globalHandlersIntegration()],
    enableLogs: false,
    tracesSampleRate: 0,
    beforeSend: (event, hint) =>
      isExpectedNetworkError(hint.originalException) ? null : sanitizeWebEvent(event),
  });
};
