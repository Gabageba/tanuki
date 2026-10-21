#!/bin/sh
# Визуальные тесты в Linux-образе Playwright — том же, что в CI: эталоны, снятые на macOS, с CI бы
# не сошлись из-за другого сглаживания шрифтов. Версия образа берётся из установленного
# @playwright/test, браузеры уже лежат в образе. Аргументы уходят в `playwright test`
# (`--update-snapshots`, `-g <история>`).
set -e
cd "$(dirname "$0")/.."
VERSION=$(node -p "require('@playwright/test/package.json').version")
ROOT=$(cd ../.. && pwd)
exec docker run --rm --ipc=host --init \
  -v "$ROOT":/work -w /work/apps/web \
  "mcr.microsoft.com/playwright:v$VERSION-noble" \
  node node_modules/@playwright/test/cli.js test -c visual "$@"
