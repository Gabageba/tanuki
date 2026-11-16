import { existsSync } from 'node:fs';

// Deleted paths still trigger checks, but must not be passed to formatters/linters.
// lint-staged parses these strings into argv and spawns without a shell.
const forExistingFiles = (commands) => (files) => {
  const paths = files
    .filter(existsSync)
    .map((file) => JSON.stringify(file))
    .join(' ');
  return paths ? commands.map((command) => `${command} ${paths}`) : [];
};

export default {
  '*.{ts,tsx}': forExistingFiles(['eslint --fix', 'prettier --write']),
  '*.scss': forExistingFiles(['stylelint --fix', 'prettier --write']),
  '*.{json,md,yml,yaml}': forExistingFiles(['prettier --write']),
  'package.json': forExistingFiles(['sort-package-json']),
  // The check reads both dictionaries and the whole of apps/web/src, so the staged file list is ignored.
  'apps/web/src/**/*.{ts,tsx,json}': () => 'node scripts/check-i18n.mjs',
  // Run last, while lint-staged still hides all unstaged changes and untracked files.
  '*': () => 'node scripts/checks/run.mjs --staged --task local',
};
