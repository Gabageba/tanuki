# 07 — Тулинг и конвенции

За основу взяты конфиги `web/gabageba-ui`. Ниже — что перенесено как есть, что обновлено
под актуальные мажоры и что изменено осознанно.

## Что изменилось относительно gabageba-ui

| Изменение | Причина |
| --------- | ------- |
| `@typescript-eslint/parser` + `/eslint-plugin` → единый пакет `typescript-eslint` | Официально рекомендуемый способ с v8, меньше рассинхрона версий |
| `project: './tsconfig.eslint.json'` → `projectService: true` | Не нужно вручную поддерживать список файлов, быстрее на монорепо |
| Ручной список `globals` (~40 строк) → пакет `globals` | Ваш список неполон (нет `AbortController`, `caches`, `crypto`) и его придётся дополнять вечно |
| `eslint-plugin-prettier` удалён | Prettier как ESLint-правило заметно замедляет линт. Оставлен только `eslint-config-prettier` (отключает конфликтующие правила), сам Prettier — отдельным шагом в lint-staged |
| Конфиги вынесены в `packages/eslint-config` и `packages/stylelint-config` | Три пакета (`web`, `api`, `contracts`) должны линтиться одинаково |

Правила именования (`selector-class-pattern` в camelCase, `custom-property-pattern` в
kebab-case, `quotes: single`, `consistent-type-imports`) перенесены **без изменений** —
это ваши конвенции, их менять незачем.

## ESLint

`packages/eslint-config/base.js` — общая часть для любого TS-пакета:

```js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import importX from 'eslint-plugin-import-x';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist/**', 'build/**', 'coverage/**', '**/*.gen.ts'] },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    plugins: { 'import-x': importX },
    rules: {
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
```

`packages/eslint-config/react.js` — добавка для `apps/web`:

```js
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
    settings: { react: { version: 'detect' } },
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
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['@/app/*'],      message: 'app — верхний слой, импорт из него запрещён' },
          { group: ['@/pages/*'],    message: 'Импорт из pages разрешён только в app' },
        ],
      }],
    },
  },
];
```

Для `apps/api` — `globals.node` вместо browser и без React-плагинов.

## Stylelint

`packages/stylelint-config/index.json` — ваши правила один в один, только под Stylelint 17:

```json
{
  "extends": ["stylelint-config-standard-scss"],
  "customSyntax": "postcss-scss",
  "rules": {
    "selector-class-pattern": "[a-z]+([A-Z][a-z0-9]+)*",
    "scss/dollar-variable-pattern": "[a-z]+([A-Z][a-z0-9]+)*",
    "custom-property-pattern": "^_?[a-z][a-z0-9]*(-[a-z0-9]+)*$",
    "rule-empty-line-before": [
      "always-multi-line",
      { "except": ["first-nested"], "ignore": ["after-comment"] }
    ],
    "import-notation": "string",
    "declaration-property-value-no-unknown": null,
    "at-rule-no-unknown": null
  }
}
```

camelCase в `selector-class-pattern` — то, что нужно для CSS Modules: класс `.chapterList`
импортируется как `styles.chapterList` без квадратных скобок. С Mantine это работает
из коробки.

## Prettier

`.prettierrc.json` — без изменений:

```json
{
  "semi": true,
  "tabWidth": 2,
  "printWidth": 100,
  "singleQuote": true,
  "trailingComma": "all",
  "endOfLine": "auto"
}
```

`jsxBracketSameLine` из вашего конфига удалён — опция устарела ещё в Prettier 2.4 и
переименована в `bracketSameLine`; в 3.x она игнорируется. Дефолт (`false`) и так тот,
что вам нужен.

## husky + lint-staged

`.husky/pre-commit`:

```
pnpm lint-staged
```

`.husky/commit-msg`:

```
pnpm commitlint --edit "$1"
```

`.husky/pre-push`:

```
pnpm turbo typecheck test
```

Корневой `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.scss": ["stylelint --fix", "prettier --write"],
    "*.{json,md,yml,yaml}": ["prettier --write"],
    "apps/parsers/**/*.kt": ["./gradlew ktlintFormat --quiet"],
    "package.json": "sort-package-json"
  }
}
```

Порядок в `*.{ts,tsx}` важен: сначала `eslint --fix`, потом `prettier --write`. Обратный
порядок даёт коммиты, где Prettier переформатировал то, что ESLint только что починил.

## Turborepo

`turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build":     { "dependsOn": ["^build"], "outputs": ["dist/**", "build/**"] },
    "typecheck": { "dependsOn": ["^build"] },
    "lint":      {},
    "test":      { "dependsOn": ["^build"] },
    "dev":       { "cache": false, "persistent": true }
  }
}
```

`packages/contracts` собирается первым (`^build`), поэтому `web` и `api` всегда
типизируются против свежих схем.

## Конвенции кода

- **Именование файлов:** компоненты `PascalCase.tsx`, всё остальное `camelCase.ts`,
  стили `ComponentName.module.scss`.
- **Экспорты:** именованные. `export default` — только для ленивых чанков маршрутов.
- **Публичный API модуля:** каждая папка в `features/` и `entities/` имеет `index.ts`;
  импорт внутренностей мимо него запрещён линтом (правило уже есть в `gabageba-ui`).
- **Типы:** `import type { … }` обязателен (`consistent-type-imports`).
- **Коммиты:** Conventional Commits, скоуп = имя пакета —
  `feat(reader): вертикальный режим`, `fix(api): подпись image proxy`.

## CI

GitHub Actions, один воркфлоу на PR:

```
lint (eslint + stylelint + prettier --check)
typecheck (tsc --noEmit во всех пакетах)
test (vitest run --coverage)
build (turbo build)
e2e (playwright, только на main и по метке)
parsers-contract (раз в сутки: по запросу на каждый P0/P1-источник)
```

`parsers-contract` вынесен из PR-пайплайна намеренно: он ходит в интернет и падает по
причинам, не связанным с вашим кодом. Красный джоб от того, что у ReadManga профилактика,
не должен блокировать мерж. Но узнать об этом раньше пользователей — должны.
