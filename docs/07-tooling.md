# 07 — Тулинг и конвенции

За основу взяты конфиги `web/gabageba-ui`. Ниже — что перенесено как есть, что обновлено
под актуальные мажоры и что изменено осознанно.

## Что изменилось относительно gabageba-ui

| Изменение                                                                         | Причина                                                                                                                                                                      |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@typescript-eslint/parser` + `/eslint-plugin` → единый пакет `typescript-eslint` | Официально рекомендуемый способ с v8, меньше рассинхрона версий                                                                                                              |
| `project: './tsconfig.eslint.json'` → `projectService: true`                      | Не нужно вручную поддерживать список файлов, быстрее на монорепо                                                                                                             |
| Ручной список `globals` (~40 строк) → пакет `globals`                             | Ваш список неполон (нет `AbortController`, `caches`, `crypto`) и его придётся дополнять вечно                                                                                |
| `eslint-plugin-prettier` удалён                                                   | Prettier как ESLint-правило заметно замедляет линт. Оставлен только `eslint-config-prettier` (отключает конфликтующие правила), сам Prettier — отдельным шагом в lint-staged |
| Конфиги вынесены в `packages/eslint-config` и `packages/stylelint-config`         | Три пакета (`web`, `api`, `contracts`) должны линтиться одинаково                                                                                                            |

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
pnpm lint-staged --concurrent false --hide-all --diff-filter=ACMRD
```

`.husky/commit-msg`:

```
pnpm commitlint --edit "$1"
```

`.lintstagedrc.mjs` запускает ESLint, Stylelint, Prettier, сортировку `package.json` и аудит i18n.
Последней задачей (`*`) выполняется `node scripts/checks/run.mjs --staged --task local`:
typecheck затронутых пакетов и связанные unit-тесты. Задачи идут последовательно, после
автоисправлений. `--hide-all` скрывает незастейдженные изменения и untracked-файлы на время
проверок; lint-staged восстанавливает их после выполнения. Удаления включены в выборку, но
удалённые файлы не передаются линтерам и форматтерам. Хука `pre-push` нет.

Порядок в `*.{ts,tsx}` важен: сначала `eslint --fix`, потом `prettier --write`. Обратный
порядок даёт коммиты, где Prettier переформатировал то, что ESLint только что починил.

`scripts/check-i18n.mjs` (`pnpm lint:i18n`, входит в `pnpm lint`) сверяет словари
`apps/web/src/shared/locales/{ru,en}.json` с кодом `apps/web/src` (без `pages/Playground`).
Ошибки — коммит не пройдёт: ключ из `t('…')`/`i18nKey` отсутствует в словаре, ключ есть только
в одном языке, неполные plural-формы, разные `{{переменные}}` в ru и en. Предупреждения — нет:
неиспользуемые ключи, одно русское значение под разными ключами, обычный пробел вместо
` ` между числом и сокращением, динамические `t(variable)`.

## Claude Code: /review и /commit

- `/review` — ревью всех незакоммиченных изменений: линтеры с `--fix` и три субагента из
  `.claude/agents/` (`review-bugs` — opus, `review-rules` — sonnet, `review-i18n` — haiku).
  Механику и переводы чинит сам, баги и спорные нарушения правил сообщает.
- `/commit` — `/review`, затем разбиение на conventional-коммиты, push и PR в `master`, если
  его ещё нет. Typecheck и тесты оставлены хуку `pre-commit`.

## Turborepo

`turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**", "build/**"] },
    "typecheck": { "dependsOn": ["^build"] },
    "lint": {},
    "test": { "dependsOn": ["^build"] },
    "dev": { "cache": false, "persistent": true }
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

GitHub Actions: `.github/workflows/ci.yml` на PR, merge queue и push в `master`/`main`.
`scripts/checks/plan.mjs` выбирает проверки по файлам и зависимостям workspace-пакетов
(включая потребителей). PR сравнивается с merge-base базовой ветки, push — с предыдущим SHA.
Checkout определения изменений получает всю историю. Если база недоступна, изменился lockfile,
корневая конфигурация или неизвестный механизму файл, выполняются все проверки.

```
lint (eslint + stylelint + prettier --check)
typecheck (затронутые пакеты и потребители)
test (связанные unit-тесты; полные наборы при изменении зависимостей/фикстур)
build (затронутые production-пакеты и потребители)
visual (полный набор Storybook при изменении web, кроме playground и отдельных test/e2e)
e2e (полный набор при изменении рабочего приложения, инфраструктуры или e2e/self-host)
parsers-contract (раз в сутки: по запросу на каждый P0/P1-источник)
```

Изменения только документации не запускают тесты приложения; изменения только историй
запускают typecheck web и visual. Фикстуры и миграции, читаемые с диска, а также удаления
модулей запускают полный unit-набор своего пакета. API и parsers используют `vitest related
--run`; небольшой web-набор на `node:test` выполняется целиком. Частичные наборы запускаются
вне Turbo, чтобы кеш частичного прогона не мог удовлетворить полный прогон.

Имена обязательных проверок `lint`, `typecheck`, `test`, `build`, `visual`, `e2e` сохранены:
job без затронутой работы завершается успешно с сообщением `not affected`, без установки
зависимостей и запуска тестов. Workflow не фильтруется через `paths`. При ошибке определения
изменений зависимые jobs запускаются через `always()` и падают, чтобы не разрешить слияние
без проверок. Существующие required checks в защите ветки менять не требуется.

**Релиз:** `release.yml` вызывает CI с `full: true`; тег релиза также принудительно включает
полный режим. Все релизные проверки, включая `checks/e2e`, выполняются независимо от diff;
unit, self-host, visual и e2e выполняются без кеширования результатов тестов. Проверки готовых
образов amd64/arm64 в release workflow остаются обязательными. Live-контракты источников
сохраняют отдельный ночной запуск.

Ручные команды:

```sh
pnpm checks:changed --base origin/master --plan # показать выборку для ветки
pnpm checks:changed --base origin/master --task all # выполнить выбранные проверки
pnpm checks:changed --staged --dry-run # показать локальные команды для index
pnpm checks:full # полный прогон, включая Docker visual/e2e
pnpm test:checks # регрессии механизма выбора проверок
```

Ручной `--staged` вне lint-staged выбирает файлы из index, но выполняет тесты рабочего дерева;
автоматический pre-commit использует скрытие незастейдженных изменений, описанное выше.

`parsers-contract` вынесен из PR-пайплайна намеренно: он ходит в интернет и падает по
причинам, не связанным с вашим кодом. Красный джоб от того, что у ReadManga профилактика,
не должен блокировать мерж. Но узнать об этом раньше пользователей — должны.

## Self-host release

`pnpm docker`/`pnpm start` используют `docker-compose.dev.yml`; production Compose полный и требует конфигурацию. `pnpm test:e2e` использует отдельные временные volumes и настоящий API/БД/Valkey/Mailpit/Caddy, HTTP-фикстуры AComics, Chromium desktop/mobile. В PR и master запуск зависит от изменений; в релизе он обязателен. Release workflow строит multiarch GHCR и draft bundle с digest/SHA256 и отдельными sourcemaps; native-smoke на amd64/arm64 проверяет анонимный pull и native-модули.

Установка, эксплуатация и диагностика: [README](../README.md#self-host).
План и критерии: [self-host-release](plans/self-host-release.md).
