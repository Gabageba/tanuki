import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import importX from 'eslint-plugin-import-x';
import perfectionist from 'eslint-plugin-perfectionist';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist/**', 'build/**', 'coverage/**', '**/*.gen.ts'] },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    plugins: { 'import-x': importX, perfectionist },
    rules: {
      // Порядок импортов: сперва библиотеки, затем внутренние модули, в конце стили.
      'perfectionist/sort-imports': [
        'error',
        {
          type: 'unsorted',
          newlinesBetween: 'ignore',
          sortSideEffects: true,
          internalPattern: ['^@/.*', '^@tanuki/.*'],
          customGroups: [{ groupName: 'styles', elementNamePattern: '\\.(css|scss|sass|less)$' }],
          groups: [
            // Побочные импорты вроде 'reflect-metadata' обязаны выполняться до всего остального.
            'side-effect',
            ['builtin', 'external'],
            ['internal', 'tsconfig-path', 'parent', 'sibling', 'index', 'subpath'],
            'unknown',
            'styles',
          ],
        },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'import-x/no-extraneous-dependencies': [
        'error',
        { devDependencies: ['**/*.test.ts', '**/*.stories.tsx', '**/*.config.ts'] },
      ],
      'import-x/prefer-default-export': 'off',
      quotes: ['error', 'single'],
      'no-param-reassign': ['error', { props: true, ignorePropertyModificationsFor: ['state'] }],
    },
  },

  prettierConfig,
);
