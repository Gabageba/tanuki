import 'dotenv/config';
import { SENTRY } from './sentry-sdk';
import { sanitizeEvent } from './sentry';

if (SENTRY) {
  SENTRY.init({
    dsn: process.env['SENTRY_API_DSN'],
    sendDefaultPii: false,
    defaultIntegrations: false,
    integrations: [
      SENTRY.onUncaughtExceptionIntegration(),
      SENTRY.onUnhandledRejectionIntegration(),
    ],
    enableLogs: false,
    tracesSampleRate: 0,
    beforeSend: sanitizeEvent,
  });
}
