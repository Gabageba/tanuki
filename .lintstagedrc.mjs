export default {
  '*.{ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.scss': ['stylelint --fix', 'prettier --write'],
  '*.{json,md,yml,yaml}': ['prettier --write'],
  'package.json': 'sort-package-json',
  // The check reads both dictionaries and the whole of apps/web/src, so the staged file list is ignored.
  'apps/web/src/**/*.{ts,tsx,json}': () => 'node scripts/check-i18n.mjs',
};
