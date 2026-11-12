import 'dotenv/config';
import { createRequire } from 'node:module';
import type * as Sentry from '@sentry/nestjs';

// Keep initialization synchronous and ahead of Nest imports, but do not load the SDK
// (including its instrumentation dependencies) when error reporting is not configured.
export const SENTRY = process.env['SENTRY_API_DSN']
  ? (createRequire(__filename)('@sentry/nestjs') as typeof Sentry)
  : undefined;
