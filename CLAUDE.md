# Code style rules

## Components

- Every UI component lives in its own file and is exported via `export default`.
- Components are always written as a `function` declaration — never an arrow function assigned to a
  const.
- The `export default` goes **after** the component declaration, on its own line at the end of the
  file (`function SourceCard() {...}` … `export default SourceCard;`) — never inline on the
  declaration.
- No `index.ts` barrels that only import a component and re-export it. Import components straight
  from their own file.
- Mantine first. Layout and text are built from Mantine components (`Box`, `Stack`, `Group`,
  `Flex`, `Center`, `Text`, `Title`, …) and their style props (`pos`, `w`, `mt`, `ff`, `fw`, `ta`,
  …), not from raw `div`/`span`/`p` plus a CSS module. Before writing a custom component, check
  whether Mantine already ships one. A CSS module is only for what style props can't express —
  pseudo-elements, container queries, color-scheme-dependent values, `z-index`, custom properties
  — and holds just those declarations.
- Elements with no children are self-closing — `<ActionIcon />`, never
  `<ActionIcon></ActionIcon>`.
- Every button, input, tab and menu item carries an icon in its `leftSection` — `Button`,
  `TextInput`, `PasswordInput`, `NumberInput`, `Select`, `MultiSelect`, `Autocomplete`,
  `DateInput`, …, `Tabs.Tab` and `Menu.Item`: `<Button leftSection={<DownloadIcon />}>`,
  `<Tabs.Tab leftSection={<BookOpenIcon />}>`, `<Menu.Item leftSection={<TrashIcon />}>`. Icons come from `@phosphor-icons/react`.
  `ActionIcon` is exempt — it is an icon already. A modal's cancel button is exempt too: the
  «Отмена» `Button` that closes a `Modal` carries no `leftSection` icon. Every other button in
  the modal — the confirm action included — keeps its icon.
- No `renderXxx()` helpers inside a component that switch between whole branches of markup
  (skeleton / empty / list). Such a branch is its own component in its own file
  (`renderList()` → `UsersList`).
- Icons are always taken from `@phosphor-icons/react` as components, never copied in as raw SVG
  paths. When an icon has to be tinted in parts, layer library icons (e.g. two `CaretUpDownIcon`s,
  each cut to its half with `clip-path`) instead of redrawing it.

## UI patterns

- **Tabs** are built from a `TABS` array in `useMemo` — `{ id, title, icon, content }` — that is
  mapped once into `Tabs.Tab` and once into `Tabs.Panel` (see `pages/Settings/index.tsx`). No
  hand-written `Tabs.Tab`/`Tabs.Panel` pairs.
- **Loading** of a block or tab is a skeleton that repeats the block's layout (a sibling
  `XxxSkeleton.tsx`, built from `Skeleton` and `TextSkeleton`), never a centered `Loader`.
- **Errors** of a query inside a page block or tab are not rendered: the global handler in
  `QueryClientProvider` already shows a notification. `QueryError` is only for the page's main
  query and is rendered by `PageLayout.Content`, not by blocks. A block whose query failed shows
  its empty state.
- **Modals** carry their tone as an icon next to the title (20px, tone color); the body holds no
  icons or colored boxes — just the main sentence in 14 and explanations in dimmed 13. The tone
  matches the confirm button's color and how reversible the action is: `danger` (red) —
  irreversible or hits someone else's account; `warning` (`gold`) — reversible, but something gets
  reset, revealed or reloaded; `neutral` (dimmed gray) — an ordinary form; `success` (`teal`) — a
  result. The icon repeats the confirm button's icon when it names the meaning, otherwise the
  modal's subject; never an `X`, it reads as the close button. An inner step shows its back button
  in place of the icon. The current map of every modal is in `docs/11-ui-decisions.md` («Таблица
  приглашений и модалки») — add a new modal there too.
- **Empty state** is Mantine `EmptyState` (`title`, `description`, `icon`; buttons go into
  `EmptyState.Actions`), never a hand-made `Stack` of `ThemeIcon` + `Text`.
- **Tags** — `Badge` and `Pill` — use `variant="muted"` (registered in the theme: tint, border and
  text in one color), not `light`/`filled`.
- **User avatars** look the same everywhere as in the header: `color={PRIMARY_COLOR}`,
  `variant="outline"`, never `color="initials"`.
- **Pagination** of a list is the shared `ListPagination` (`shared/ui/ListPagination.tsx`): the
  «11–20 из 23» counter plus pages, and nothing at all when everything fits on one page.
- **Multi-choice filters** use the shared `CompactMultiSelect` — the first chosen item plus a
  `+N` pill, so the field never grows in height. Empty selection means "no restriction"; there is
  no fake «Все» option inside the list. Options look the same as in `Select` (theme
  `renderOption` + `selectable-option`).

## Forms

- Every form — modal ones included — is `useForm` from `@mantine/form` plus `<form onSubmit>`,
  with the confirm button `type="submit"`. No `useState` per field. Invalid input is reported by
  the form's `validate` under the field, not by a disabled submit button. The one exception is a
  type-to-confirm field (typing the username before deleting): there the button stays disabled
  until the text matches.
- Fields carry no `label`: the caption goes into `placeholder`, the field's meaning into its
  `leftSection` icon. Where the placeholder can't be seen (a `Select` that always has a value, a
  native date input), keep the caption in `aria-label`.
- Optionality is never shown with a placeholder like «Необязательно». Say it in the modal's text
  instead («Причину, если укажете, увидят…»).
- Explanatory text in a modal is `<Text c="dimmed" fz={13}>`; the main sentence above it (what
  will happen) is plain `fz="sm"` (14). See **Modals** under UI patterns.

## Types

- Always `type`, never `interface`.
- Component props are always declared as `type Props = { ... }` — exactly `Props`, no
  `SourceCardProps`-style prefixes.
- No loose string literals in types: no `z.enum([...])`, no `'ok' | 'degraded' | 'down'`, no arrays
  of strings with a manual cast. Declare the literals once in a const object and derive the type
  from it with `EnumLiteralsOf` (`packages/contracts/src/utils.ts`):

  ```ts
  export const SOURCE_STATUS = {
    OK: 'ok',
    DEGRADED: 'degraded',
    DOWN: 'down',
  } as const;
  export type SourceStatus = EnumLiteralsOf<typeof SOURCE_STATUS>;
  ```

  Keep one such const per concept — don't copy it into parsers, contracts and API separately; reuse
  the shared one from `@tanuki/contracts`.

- Never transform those enum values in API responses (no case changes, no renaming) — whatever is
  in the const is what the frontend receives, so it can work with the values directly.
- Types and anything else bulky enough to clutter a file go into a sibling `models.ts`.

## Constants

- Constant names are UPPERCASE — `THEME`, `PRIMARY_SHADE`, `COLOR_SCHEME_MANAGER`, never `theme` or
  `colorSchemeManager`. An enum-like const object always follows `{ SCREAM_CASE: camelCase }` —
  keys UPPERCASE, values camelCase (`LIGHT: 'light'`, `RATING_COUNT: 'ratingCount'`) — even when
  the concept itself reads uppercase (an HTTP-style error code stays `NOT_FOUND: 'notFound'`, not
  `NOT_FOUND: 'NOT_FOUND'`). The one exception is a value pinned by an external contract this
  codebase doesn't own — a field mirrored verbatim from a source site's own JSON API response, or a
  value typed against a third-party library (e.g. `COLOR_SCHEME` against Mantine's
  `MantineColorScheme`) — where the value must stay exactly what that external contract expects.
- No lookup tables mapping an enum to labels, icons, colors and the like
  (`Record<ColorScheme, string>`). Write an arrow function with an exhaustive `switch` instead — no
  `default` branch, so TypeScript points at the missing case when a value is added to the enum:

  ```ts
  export const getColorSchemeLabel = (colorScheme: ColorScheme, t: TFunction) => {
    switch (colorScheme) {
      case COLOR_SCHEME.LIGHT:
        return t('light');
      case COLOR_SCHEME.DARK:
        return t('dark');
      case COLOR_SCHEME.AUTO:
        return t('system');
    }
  };
  ```

  A helper like this can't call `useTranslation()` itself — it isn't a hook — so it takes the
  already-obtained `t` as a parameter; the calling component still calls the hook directly (see
  Localization below).

  When such a function has to produce a React icon, it returns the rendered element
  (`return <SunIcon size={size} />`), not the component itself — a component obtained from a call
  during render is recreated on every render, and `react-hooks/static-components` fails the lint.
  That makes it a `.tsx` helper, so it lives next to the component rather than in `models.ts`.

## Text

- Placeholder for a missing/empty value — no rating, no reason, no error — is never a raw `'—'`
  string literal. Use the shared `<Mdash />` component (`apps/web/src/shared/ui/Mdash.tsx`), which
  renders `&mdash;`.

## Placement

- Keep code next to its only consumer: constants of a component go into its sibling `models.ts` or
  straight into the component file when there are just a couple of them.
- `shared/` is for things with more than one consumer — and for generic UI building blocks that
  know nothing about the feature they're used in and are expected to be reused elsewhere, even if
  there's only one call site today (`BarChart`, `ProgressList`: they take plain data via props, no
  feature types, mocks or domain logic inside). A feature-specific component stays next to its
  consumer until a second one actually appears. Don't create a folder in `shared/` for a single
  import.
- No one-call wrappers around library hooks. Call the library hook in the component.

## Colors

- The accent color is declared once in `apps/web/src/app/components/Providers/models.ts`
  (`PRIMARY_COLOR`, `PRIMARY_COLOR_SHADES`, `PRIMARY_SHADE`) and reaches components through the
  Mantine theme — `color={PRIMARY_COLOR}`, `var(--mantine-primary-color-filled)`.
- Everything else takes colors from Mantine CSS variables (`var(--mantine-color-*)`) so both color
  schemes work. A hard-coded hex needs a reason in a comment — for example the always-black reader
  background.

## Typography

- Two font families, one role each — no brand-layer exception. Both are wired up once in
  `apps/web/src/app/Providers/models.ts` and reach components the same way colors do — through the
  Mantine theme, never re-imported per file.
- The question to ask is never "is this a number?" but **"is this speech or a readout?"** — a
  string that can be read aloud as a phrase is speech, a string the eye scans down a column and
  compares between rows is a readout. When in doubt: if neighbouring rows have to line up by their
  digits, it's monospace.
- **Golos Text** — the interface default (`theme.fontFamily`, `FONT_FAMILY_SANS`), so it needs no
  `ff` at all. Everything is set in it unless it's a readout or the logo: titles, headings,
  navigation, buttons, descriptions, reviews, field labels, tag names, breadcrumbs built out of
  names, worded dates ("12 фев 2026", `formatDate`), relative time ("2 дня назад",
  `formatRelative`), and any phrase that merely contains a number ("Глава 3 из 120", "Скачано
  12 гл.") — a number inside a sentence doesn't turn the sentence into data.
- **JetBrains Mono** — the readout layer (`theme.fontFamilyMonospace`, use via `ff="monospace"`).
  Numeric dates ("01.02.2026", `formatDateNumeric`), chapter and page numbers in a list, counters
  and `+N` tags, percentages, rating digits, badge tags (`18+`, `VPN`, `NEW`), locale and status
  codes, small uppercase service labels, and technical identifiers (domain, id, url, slug).
- A mixed row is fine: in a card's meta line the type stays Golos Text while the year and the
  chapter counter go monospace (`NumericMeta`) — the rule applies per value, not per row.
- **Unbounded** — the logo only, one call site (`var(--tanuki-font-brand)`, set in
  `CSS_VARIABLES_RESOLVER`, used in the header `Anchor`). Nowhere else — block headings, section
  names, and modal titles all use Golos Text now.
- **Font sizes come from a short scale** — Ant Design's type scale plus one in-between step:
  12 (`fz="xs"`), 13 (`fz={13}`, the explanatory text of a modal only), 14 (`fz="sm"`), 16
  (`fz="md"`), and for headings and large readouts 20, 24, 30, 38, 46. No sizes in between — no
  11, 15, 17, 18 — and no responsive pairs built from them (`{ base: 15, xs: 17 }`); a responsive
  size steps between neighbours on the scale (`{ base: 14, xs: 16 }`). Pick the nearest step
  instead of inventing a new one. The only exceptions are sizes tied to geometry rather than
  typography: a counter squeezed into a fixed dot on an icon (`8px` in a 13px circle), a glyph
  sized from its container (`SIZE / 2` inside an avatar), a fluid display number
  (`min(58cqi, 520px)`), and `fz` used only to size a `1em` icon.

## Hooks

- Hooks live in a `hooks` folder. If a hook belongs to one specific component, it goes into that
  component's own `hooks` folder.
- Hooks are written as a `function` declaration and exported via `export default` too (after the
  declaration, same as components).

## Functions

- Only components and hooks use `function` + `export default`. Every other function — helpers,
  formatters, guards, mappers, request builders — is an arrow function assigned to a const and
  exported as a **named** export (no `export default`).

  ```ts
  // component / hook
  function SourceCard() { ... }
  export default SourceCard;

  // helper
  export const formatChapterNumber = (value: number) => ...;
  ```

## Dates

- Always send dates and times in the standard server format: `YYYY-MM-DD`, or
  `YYYY-MM-DDTHH:MM:SSZ` when the time is needed.
- A worded date inside a sentence never breaks across lines: the spaces inside it are
  non-breaking (`12 октября 2026 г.` — the server's `formatParam` does it for error messages).
- A Russian date ends with «г.», so the text right after it never starts with a period — that
  would give «г..». Join with a comma instead («до 3 октября 2026 г., причина: …»).

## Localization

- All UI text goes through `react-i18next`. Call the library hook directly in the component —
  `const { t } = useTranslation();` — no wrapper hook. Dictionaries live in
  `apps/web/src/shared/locales/{ru,en}.json`.
- **Russian is the base language.** `ru.json` holds the source text, `en.json` is its translation,
  so a key is named after the Russian value.
- **A key name is the literal English translation of that value**, or the closest thing to it:
  «Нестабилен» → `unstable`, not `degraded`; «Это он» → `thisIsIt`, not `matchConfirm`; «Анонс» →
  `announcement`, not `upcoming`.
- **One value, one key.** Before adding a key, look for the same Russian text in `ru.json` and reuse
  that key — never a second name for a string that's already there (`bookmarks` _and_
  `byBookmarks`). Two keys colliding only in `en.json` while their Russian differs
  (`miscellaneous` «Прочее» / `other` «Другое», both "Other") are not duplicates.
- **The name never depends on where the string is used** — not the page or component
  (`catalog.filters.cancel`), not the UI role it fills at its first call site (no `xxxPlaceholder`,
  `xxxTitle`, `xxxTooltip`, `xxxMessage` suffix), and not the enum whose value it renders
  (`colorSchemeLight`, `cacheResetTitle`). The same key has to fit just as well the next time that
  text is needed as a label, a tooltip or a button.
- **The name makes the text itself obvious.** `main` for «Основная» — yes; `mainBranch` — no, that's
  already a guess about the call site rather than the content.
- **A long value gets a short name that keeps the point.** A whole sentence never turns into a key:
  «Откройте нужный тайтл на другом источнике и вставьте сюда ссылку из адресной строки.» →
  `pasteLinkFromOtherSource`. It's the name that gets shortened, not the text.
- **A word form is a suffix, and only when two keys collide.** While a word appears in one form, its
  key carries no form suffix. The moment the same text is needed in another form, the base form
  keeps the plain name and the new one spells the form out in full —
  `chapters` / `chaptersGenitive` / `chaptersDative`, `light` / `lightMasculine` — never a
  `chaptersGen`-style abbreviation.
- Keys are flat — no nesting by feature area, not even for generic, everywhere-reused action words
  (`cancel`, `apply`, `add`, `reset`, `retry`, `error` live at the top level, not under `common`).
- A pure helper (not a component/hook) that needs translated text — the `getXxxLabel` switch
  helpers from the Constants section above are the common case — takes `t: TFunction` (from
  `i18next`) as a parameter and calls `t('key')` in each branch; it does not call the hook itself.
- Numbers that decline by count use i18next plural keys (`_one`/`_few`/`_many`/`_other` for `ru`,
  `_one`/`_other` for `en`) with `t('key', { count })` — not a single hardcoded word form. Skip the
  plural suffixes only when the word genuinely doesn't decline (an abbreviation like `гл.`, an
  invariant participle like `выбрано`).
- **Never build a sentence out of several `t()` calls placed side by side**
  (`{t('downloaded')} {t('countChaptersAbbrev', { count })}`). Word order and grammar differ
  between languages, so a phrase assembled from independently-translated pieces breaks the moment
  it's translated. Give the whole phrase its own single key with interpolation instead
  (`downloadedChaptersAbbrev`: «Скачано {{count}} гл.»), even if part of that value duplicates
  another key's text.
- Abbreviations in `ru.json` follow Russian typography. A shortened **word** takes a period — `гл.`,
  `стр.`, `т.`, `дн.`, `мес.`; a **unit of measurement** doesn't — `ч`, `мин`, `с` (never `м` for
  minutes: that's a metre). A number and its abbreviation are always joined by a non-breaking space
  written as ` ` (`"{{count}} гл."`, `"Гл. {{number}}"`), never glued together
  (`5мин`) or split by a plain space. A compound unit uses a slash with no spaces and keeps the
  periods of its words — `гл./дн.`, `гл./мес.`

## Playground

- Mock-ups of UI variants live in `apps/web/src/pages/Playground/<Task>/`, one page per task, listed
  in `PLAYGROUND_TASKS` (`apps/web/src/pages/Playground/models.ts`). Their texts skip i18n: write
  plain literals (Russian) right in the JSX and never add playground strings to
  `shared/locales/{ru,en}.json` — those dictionaries only hold text of the real app. Likewise, a
  playground page never calls `t()`, and an i18n audit of `apps/web` skips `pages/Playground/`.
- Once a variant is chosen, the page is **kept** as a record of the decision, not deleted: fill in
  the task's `decision` and describe the chosen variant in `docs/11-ui-decisions.md`.
- A task is registered by its entry in `PLAYGROUND_TASKS` alone (`slug` + `Component`) — no
  per-task paths in `ROUTE_PATHS`, no per-task routes in `RouterProvider.tsx`. The routes are built
  from that list by `app/PlaygroundRouter`, which `RouterProvider.tsx` mounts at `/playground/*`
  lazily and only under `import.meta.env.DEV`, so neither the pages nor their paths reach the
  production build. Keep it that way.
