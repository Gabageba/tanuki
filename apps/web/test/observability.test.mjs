import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  sanitizeWebEvent,
  isExpectedNetworkError,
} from '../src/shared/lib/observability/sentry.ts';

test('web telemetry excludes private context and expected offline errors', () => {
  const secret = 'private@example.org?token=secret';
  const event = sanitizeWebEvent({
    type: undefined,
    release: 'v0.1.0',
    user: { email: secret },
    request: { url: secret, data: secret },
    breadcrumbs: [{ message: secret }],
    extra: { private: secret },
    tags: { private: secret },
    exception: {
      values: [
        {
          type: secret,
          value: secret,
          stacktrace: {
            frames: [
              {
                filename: `https://example.org/assets/index-hash.js?${secret}`,
                context_line: secret,
                pre_context: [secret],
                vars: { private: secret },
                lineno: 20,
              },
            ],
          },
        },
      ],
    },
  });
  assert.doesNotMatch(JSON.stringify(event), /private@example|token=|breadcrumbs|context_line/);
  assert.equal(event.exception.values[0].stacktrace.frames[0].filename, '/assets/index-hash.js');
  assert.equal(isExpectedNetworkError(new TypeError('Failed to fetch')), true);
  assert.equal(isExpectedNetworkError(new TypeError('Undefined is not an object')), false);
});
