import base from './base.js';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactRefreshPlugin from 'eslint-plugin-react-refresh';
import a11yPlugin from 'eslint-plugin-jsx-a11y';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  ...base,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      globals: { ...globals.browser, ...globals.serviceworker },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'react-refresh': reactRefreshPlugin,
      'jsx-a11y': a11yPlugin,
      '@typescript-eslint': tseslint.plugin,
      prettier: prettierPlugin,
    },
    // 'detect' зовёт eslint-plugin-react's context.getFilename(), которого ESLint 10
    // больше не предоставляет — фиксируем версию явно, а не автоопределением.
    settings: { react: { version: '19.2' } },
    rules: {
      // Prettier
      ...prettierConfig.rules,
      'prettier/prettier': ['error', { endOfLine: 'auto' }],

      // TypeScript recommended
      ...tseslint.plugin.configs['recommended'].rules,
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

      //React Hooks
      ...reactHooksPlugin.configs['recommended-latest'].rules,

      //React
      ...reactPlugin.configs.flat.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-refresh/only-export-components': 'warn',
      'react/function-component-definition': 'off',
      'react/jsx-props-no-spreading': 'off',
      'react/jsx-no-useless-fragment': 'off',
      'react/no-unknown-property': ['error', { ignore: ['css'] }],
      'react/require-default-props': 'off',
      'react/jsx-filename-extension': 'off',
      'react/self-closing-comp': 'error',

      ...a11yPlugin.configs.recommended.rules,
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',

      // General
      quotes: ['error', 'single'],
      'no-param-reassign': ['error', { props: true, ignorePropertyModificationsFor: ['state'] }],

      // Границы слоёв FSD — см. 05-frontend.md
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@/app/*'], message: 'app — верхний слой, импорт из него запрещён' },
            { group: ['@/pages/*'], message: 'Импорт из pages разрешён только в app' },
          ],
        },
      ],
    },
  },
  {
    // app — верхний слой FSD, ему разрешён импорт из pages (см. правило выше)
    files: ['**/app/**/*.tsx'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
];
