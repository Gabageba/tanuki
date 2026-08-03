export default {
  '*.{ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.scss': ['stylelint --fix', 'prettier --write'],
  '*.{json,md,yml,yaml}': ['prettier --write'],
  'package.json': 'sort-package-json',
};
