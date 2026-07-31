export default {
  '*.{ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.scss': ['stylelint --fix', 'prettier --write'],
  '*.{json,md,yml,yaml}': ['prettier --write'],
  'apps/parsers/**/*.kt': () => 'apps/parsers/gradlew -p apps/parsers ktlintFormat --quiet',
  'package.json': 'sort-package-json',
};
