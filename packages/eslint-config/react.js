import base from './base.js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import a11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';

export default [
  ...base,
  {
    files: ['**/*.tsx'],
    languageOptions: { globals: { ...globals.browser, ...globals.serviceworker } },
    plugins: { react, 'react-hooks': reactHooks, 'react-refresh': reactRefresh, 'jsx-a11y': a11y },
    // 'detect' зовёт eslint-plugin-react's context.getFilename(), которого ESLint 10
    // больше не предоставляет — фиксируем версию явно, а не автоопределением.
    settings: { react: { version: '19.2' } },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...reactHooks.configs['recommended-latest'].rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-refresh/only-export-components': 'warn',
      ...a11y.configs.recommended.rules,
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',

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
