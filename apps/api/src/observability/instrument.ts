import 'dotenv/config';
import * as Sentry from '@sentry/nestjs';
import { sanitizeEvent } from './sentry';

if (process.env['SENTRY_API_DSN']) {
  Sentry.init({
    dsn: process.env['SENTRY_API_DSN'],
    sendDefaultPii: false,
    defaultIntegrations: false,
    integrations: [
      Sentry.onUncaughtExceptionIntegration(),
      Sentry.onUnhandledRejectionIntegration(),
    ],
    enableLogs: false,
    tracesSampleRate: 0,
    beforeSend: sanitizeEvent,
  });
}
