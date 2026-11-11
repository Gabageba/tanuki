#!/bin/sh
set -eu
# jq serializes untrusted configuration as data, never executable JavaScript.
jq -cn --arg sentryDsn "${SENTRY_WEB_DSN:-}" --arg release "${TANUKI_VERSION:-development}" \
  '{sentryDsn:$sentryDsn,release:$release}' | sed 's/^/window.__TANUKI_CONFIG__ = /;s/$/;/' > /srv/runtime-config.js
exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
